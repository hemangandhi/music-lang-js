function flattenMusicLangListsIn(list_of_lists) {
    let rv = [];
    for (let i = 0; i < list_of_lists.length; i++) {
	let list = list_of_lists[i];
	if (list.type === "List") {
	    rv = rv.concat(list.values);
	} else {
	    rv.push(list);
	}
    }
    return rv;
}

function isNote(arg) {
    if((typeof arg.duration) != 'number') {
        return false;
    } else if((typeof arg.freq_of_t != 'function') || (typeof arg.ampl_of_t != 'function')) {
        return false;
    }
    return true;
}

function tryNoteToWave(note, audio_ctx) {
    if(!isNote(note)) return false;

    const buf_size = Math.floor(audio_ctx.sampleRate * note.duration) + 1;
    let pulses = new Array(buf_size);
    for (let i = 0; i < buf_size; i++) {
	let freqs = note.freq_of_t(i / audio_ctx.sampleRate);
	let ampls = []
        if(Object.prototype.hasOwnProperty.call(note, 'ampl_of_t')) {
            ampls = note.ampl_of_t(i / audio_ctx.sampleRate);
	}
	pulses[i] = 0;
	for(let j = 0; j < freqs.length; j++) {
	    let ampl = (j < ampls.length)  ? ampls[j]: 1;
            pulses[i] += ampl * Math.sin(i / audio_ctx.sampleRate * 2 * Math.PI * freqs[j]) / freqs.length;
	}
    }
    return {
        buffer: pulses,
	duration: note.duration,
	type: "Wave"
    };
}

function addADSR(note, a_vol, d_start, s_start, s_vol, r_start) {
    return new PureNote(note.freq_of_t, note.duration, function(t) {
	let ratio = t/note.duration;
	let scaling = 1;
	if (ratio < d_start) {
	    scaling = ratio * a_vol / d_start;
	} else if (ratio < s_start) {
	    let slope = (s_vol - a_vol) / (s_start - d_start);
	    scaling = slope * (ratio - d_start) + a_vol;
	} else if (ratio < r_start) {
	    scaling = s_vol;
	} else {
	    let slope = s_vol / (r_start - 1);
	    scaling = slope * (ratio - r_start) + s_vol;
	}
	return note.ampl_of_t(t).map(function(a) { return a * scaling; });
    });
}

function getNoteInSeq(notes, t) {
    let start = 0, i = 0;
    for(; i < notes.length && t > start + notes[i].duration;
	start += notes[i++].duration);
    return [i, start];
}

function expandWithScalings(base, scalings) {
    return base
	.map(function(b) { return scalings.map(function(s) {return b * s;}); })
	.reduce(function(a, s) { return a.concat(s) }, []);
}

function normalize(abnormal) {
    let total = abnormal.reduce((x, y) => x + y, 0);
    if (total === 0) return abnormal;
    return abnormal.map((a) => a / total);
}

const global_variables = {
    "play": new Callable(function (args) {
	args = flattenMusicLangListsIn(args);
	let total_buffer = [];
	let total_time = 0;
        const audio_ctx = new AudioContext();
	for(let i = 0; i < args.length; i++) {
	    let arg = args[i];
            let wave = tryNoteToWave(arg, audio_ctx);
	    if (!wave) return new Error("Arg " + i + " is not a note", arg);
	    total_buffer = total_buffer.concat(wave.buffer);
	    total_time += wave.duration;
	}
	let buf_size = audio_ctx.sampleRate * total_time;
	let snd_buffer = audio_ctx.createBuffer(1, buf_size, audio_ctx.sampleRate);
	let b = snd_buffer.getChannelData(0);
	for (let i = 0; i < buf_size; i++) b[i] = total_buffer[i];
	audio_ctx.resume().then(function () {
	    console.log("should play? ctx is " + audio_ctx.state);
	    let source = audio_ctx.createBufferSource();
            source.buffer = snd_buffer;
            source.connect(audio_ctx.destination);
            source.start();
            source.stop(total_time);
	    console.log("done playing. Time: " + total_time);
	});
	return new Result();
    }, "Plays a sequence of notes", "(play [notes...])"),
    "note": new Callable(function (args) {
	if (args.length != 2)
	    return new Error("note needs 2 arguments, not the " + args.length + " provided", args);
	let freq_val = parseFloat(args[0]);
	let dur_val = parseFloat(args[1]);
	if (isNaN(freq_val))
	    return new Error("Frequency needs be floats", args[0]);
	if (isNaN(dur_val))
	    return new Error("Frequency needs be floats", args[1]);
	if (dur_val <= 0) return new Error("Duration must be positive", args[1]);
        let freq_fn = function(t) { return [freq_val]; };
	return new PureNote(freq_fn, dur_val);
    }, "Creates a note at a given frequency for a given duration", "(note [frequency] [duration])", ["note", "notes"]),
    "chord": new Callable(function (args) {
	args = flattenMusicLangListsIn(args);
	let longest = 0;
        if(args.some(function(arg) {
	    if (!isNote(arg)) return true;
	    longest = Math.max(longest, arg.duration);
	    return false;
	})) {
            return new Error("All arguments to chords must have a duration (being a note)", args);
	}
	return new PureNote(function(t) {
	    let acc = [];
            for(let i = 0; i < args.length; i++) {
                if (t > args[i].duration) continue;
		let curr = args[i].freq_of_t(t);
		if (Array.isArray(curr)) {
                    acc = acc.concat(curr);
		} else acc.push(curr);
	    }
	    return acc;
	}, longest, function(t) {
	    let acc = [];
            for(let i = 0; i < args.length; i++) {
                if (t > args[i].duration) continue;
		let curr = args[i].ampl_of_t(t);
		if (Array.isArray(curr)) {
                    acc = acc.concat(curr);
		} else acc.push(curr);
	    }
	    return acc;
	});
    }, "Creates a chord of given notes (plays them in tandem)", "(chord [notes...])", ["note", "notes"]),
    "note-seq": new Callable(function (args) {
	args = flattenMusicLangListsIn(args);
	let duration = 0;
        if(args.some(function(arg) {
	    if(!isNote(arg)) {
		return true;
	    }
	    duration += arg.duration;
	    return false;
	})) {
            return new Error("All arguments to note-seq must have a duration (being a note)", args);
	}
	return new PureNote(function(t) {
	    let got_note = getNoteInSeq(args, t);
	    if (got_note[0] >= args.length) return [0];
            return args[got_note[0]].freq_of_t(t - got_note[1]);
	}, duration, function(t) {
	    let got_note = getNoteInSeq(args, t);
	    if (got_note[0] >= args.length) return [0];
            return args[got_note[0]].ampl_of_t(t - got_note[1]);
	});
    }, "Creates a sequence of notes but does not play them", "(note-seq [notes...])", ["notes"]),
    "pitch-at": new Callable(function (args) {
	if (args.length != 2)
	    return new Error("pitch-at needs 2 arguments, not the " + args.length + " provided", args);
	if ((typeof args[0]) != "string" || (args[0].length != 1 && args[0].length != 2))
	    return new Error("Invalid tone " + args[0], args[0]);
	let tone = args[0];
	if (tone[0] < 'A' || tone[0] > 'G') return new Error("Tone out of range: " + args[0], tone);
	if (tone.length === 2 && tone[1] != 'b' && tone[1] != '#') return new Error("Tone out of range: " + args[0], tone);
	let octave = parseFloat(args[1]);
	if (octave == NaN) return new Error("Octave needs to be a number, not '" + args[1] + "'", args[1]);
	let tone_num = (tone.charCodeAt(0) - 'A'.charCodeAt(0)) * 2;
	if (tone > 'B') tone_num--;
	if (tone > 'E') tone_num--;
	if (tone.length > 1) {
            if (tone[1] === 'b') tone_num--;
	    else tone_num++;
	}
	return 440 * Math.pow(2, tone_num / 12.0 + octave - 4);
    }, "Gets the pitch for a given note. The tones are letters from A through G with # for sharps and b for flats (since key signatures are not used double flats, double sharps, or \"naturals\". An octave must be specified, with (pitch-at C 3) being middle C", "(pitch-at [tone] [octave])", ["frequency"]),
    "error": new Callable(function (args) {
        if (args.length != 2) return new Error("Error only takes one argument (did you put spaces in the message?)", args);
	return new Error(args[0], args[1]);
    }),
    "with-adsr": new Callable(function (args) {
	if (args.length != 6) {
	    return new Error("with-adsr takes 6 args, not the provided " + args.length, args);
	}
	let floats = args.slice(0, 5).map(parseFloat);
	if (floats.some(function(f) { return f === NaN || f < 0;})) {
	    return new Error("The first 5 arguments must be floats between 0 and 1, not the " + JSON.stringify(args.slice(0, 5)) + " provided.", floats);
	}
	let [a_vol, d_start, s_start, s_vol, r_start] = floats;
	if (d_start >= s_start || s_start >= r_start) {
	    return new Error("Start times must be increasing, " + [d_start, s_start, r_start] + " provided.", [d_start, s_start, r_start]);
	}
	if (!isNote(args[5])) return new Error("Last argument must be a note, not the provided " + JSON.stringify(args[5]), args[5]);

	let note = args[5];
	return addADSR(note, a_vol, d_start, s_start, s_vol, r_start);
    }, "Wraps a note in an ADSR envelope. The timings are represented relative to the duration of the note and volume scaling the volume of the note",
    "(with-adsr [a-volume-max] [d-start-time] [s-start-time] [s-volume] [r-start-time] [note])", ["note", "notes"]),
    "fn": new SpecialForm(function (args) {
	if (args.length != 2) return new Error("The fn special form requires 2 arguments, not the provided " + args.length, args);
	if (!Array.isArray(args[1])) return new Error("Fn special form requires a list of arguments", args[1]);
	let snip = "(" + args[1][0] + args[1].slice(1).map(function(a) { return "[" + a + "]";}).join(" ") + ")";
	let [params, body] = args;
	let fn_name = params[0];
	params = params.slice(1);
	return new Callable(function (fn_args) {
	    if (fn_args.length != params.length) {
		return new Error("User defined function " + fn_name + " requires" + params.length + ", not the provided " + fn_args.length, fn_args);
	    }
	    let new_globals = { ...global_variables };
	    for (let i = 0; i < fn_args.length; i++) {
		new_globals[params[i]] = fn_args[i];
	    }
	    return evalParsedMusic(body, new_globals);
	}, "User defined function", snip, [])
    }, "Defines a function.", "(fn ([name] [args...]) [body])", ["function"]),
    "map": new Callable(function(args) {
	let fn = args[0];
	if (fn.type !== "Callable") return new Error("First argument should be a callable, not the provided " + args[0], args[0]);
	return new List(flattenMusicLangListsIn(args.slice(1)).map(function(a) {
	    let r = fn.apply([a]);
	    return r;
	}));
    }, "Apply a function over each argument.", "(map [function] [stuff...])", []),
    "with-bpm": new Callable(function (args) {
	if (args.length < 2) return new Error("with-bpm needs at least 2 arguments, not the provided " + args.length, args);
	let bpm = parseFloat(args[0]);
	if (isNaN(bpm)) return new Error("expected floating point value for bpm, not " + args[0], args[0]);
	let duration = 0;
	let notes = flattenMusicLangListsIn(args.slice(1));
        if(notes.some(function(note) {
	    if(!isNote(note)) {
		return true;
	    }
	    duration += note.duration;
	    return false;
	})) {
            return new Error("All arguments (except the first) to with-bpm must have a duration (being a note)", notes);
	}
	return new PureNote(function(t) {
	    t = t * bpm / 60;
	    let got_note = getNoteInSeq(notes, t);
	    if (got_note[0] >= notes.length) return [0];
            return notes[got_note[0]].freq_of_t(t - got_note[1]);
	}, duration * 60 / bpm, function(t) {
	    t = t * bpm / 60;
	    let got_note = getNoteInSeq(notes, t);
	    if (got_note[0] >= notes.length) { return [0]; }
            return notes[got_note[0]].ampl_of_t(t - got_note[1]);
	});
    }, "Shifts the time to be measured at the given beats per minute (default is 60). The notes are played in sequence (so (with-bpm b (note-seq notes...))) is the same as (with-bpm b notes...)", "(with-bpm [bpm] [notes...])", ["note", "notes"]),
    "with-overtones": new Callable(function (args) {
	if (args.length < 3) return new Error("with-overtones needs at least 3 arguments.", args);
	let i = 0;
	let harms = [1];
	let ampls = [1];
	for(; i < args.length; i+= 2) {
	    let fl = parseFloat(args[i]);
	    // we're in notes territory
	    if (isNaN(fl)) break;

	    if (i + 1 >= args.length)
		return new Error("Expected a pair of floats for harmonics and amplitude scalars followed by notes", fl2);
	    let fl2 = parseFloat(args[i + 1]);
	    if (isNaN(fl2) && fl2 < 0 && fl2 > 1)
		return new Error("Expected a float between 0 and 1 for amplitude scalars, got: " + fl2, fl2);
	    harms.push(fl);
	    ampls.push(fl2);
	}

	let notes = args.slice(i);
	let duration = 0;
	if (notes.length === 0) return new Error("with-overtones needs at least 1 note for the last argument", args);
	else if (notes.some(function (note) {
	    if (isNote(note)) {
		duration += note.duration;
		return false;
	    }
	    return true;
	})) {
	    return new Error("All arguments to with-overtones after the overtones themselves should be notes", args);
	}
	ampls = normalize(ampls);

	return new PureNote(function(t) {
	    let got_note = getNoteInSeq(notes, t);
	    if (got_note[0] >= notes.length) return [0];
            return expandWithScalings(notes[got_note[0]].freq_of_t(t - got_note[1]), harms);
	}, duration, function(t) {
	    let got_note = getNoteInSeq(notes, t);
	    if (got_note[0] >= notes.length) return [0];
            return expandWithScalings(notes[got_note[0]].ampl_of_t(t - got_note[1]), ampls);
	});
    }, "Adds harmonics at the provided amplitude scalings for all the fundamental frequencies provided in each node. The harmonics and amplitudes are a sequence of floating points, so, for example, a violin would be (with-overtones 2 0.9 4 0.9 8 0.9 (note 440 1)). The fundamental tone is included with no amplitude scalar.", "(with-overtones [harmonics-and-amplitudes...] [notes...])", ["note", "notes"]),
    "with-known-timbre": new Callable(function (args) {
	if (args.length < 2) return new Error("with-known-timbre needs at least 2 arguments.", args);
	let known = known_timbres[args[0]];
	if (known === undefined) return new Error("Unknown timbre: " + args[0], args[0]);
	let harms = known['harmonics'];
	let ampls = known['amplitudes'];
	let adsr = known['adsr'];

	let notes = args.slice(1);
	let duration = 0;
	if (notes.length === 0) return new Error("with-known-timbre needs at least 1 note for the last argument", args);
	else if (notes.some(function (note) {
	    if (isNote(note)) {
		duration += note.duration;
		return false;
	    }
	    return true;
	})) {
	    return new Error("All arguments to with-known-timber after the first should be notes", args);
	}
	ampls = normalize(ampls);
	if (adsr) {
	    notes = notes.map((n) => addADSR(n, adsr['a_vol'], adsr['d_start'], adsr['s_start'], adsr['s_vol'], adsr['r_start']));
	}

	return new PureNote(function(t) {
	    let got_note = getNoteInSeq(notes, t);
	    if (got_note[0] >= notes.length) return [0];
            return expandWithScalings(notes[got_note[0]].freq_of_t(t - got_note[1]), harms);
	}, duration, function(t) {
	    let got_note = getNoteInSeq(notes, t);
	    if (got_note[0] >= notes.length) return [0];
            return expandWithScalings(notes[got_note[0]].ampl_of_t(t - got_note[1]), ampls);
	});
    }, "Use a pre-defined timbre (" + Object.keys(known_timbres).join(", ") + ") for a set of notes. See the table below for more.", "(with-known-timbre [known-timbre] [notes...])", ["note", "notes"]),
    "glissando": new Callable(function (args) {
	if (args.length != 3)
	    return new Error("note needs 3 arguments, not the " + args.length + " provided", args);
	let freq1_val = parseFloat(args[0]);
	let freq2_val = parseFloat(args[1]);
	let dur_val = parseFloat(args[2]);
	if (isNaN(freq1_val))
	    return new Error("Frequency need to be a float", args[0]);
	if (isNaN(freq2_val))
	    return new Error("Frequency needs to be a float", args[1]);
	if (isNaN(dur_val))
	    return new Error("Duration needs be a float", args[2]);
	if (dur_val <= 0) return new Error("Duration must be positive", args[2]);
        let freq_fn = function(t) {
	    return [freq1_val + t/dur_val * (freq2_val - freq1_val)];
	};
	return new PureNote(freq_fn, dur_val);
    }, "A linear frequency slide from the first pitch to the second", "(glissando [frequency] [frequency] [duration])", ["note", "notes"]),
    "vibrato": new Callable(function (args) {
	if (args.length != 3)
	    return new Error("note needs 3 arguments, not the " + args.length + " provided", args);
	let vampl = parseFloat(args[0]);
	let vpeaks = parseFloat(args[1]);
	let base_note = args[2];
	if (isNaN(vampl))
	    return new Error("Frequency needs be floats", args[0]);
	if (isNaN(vpeaks))
	    return new Error("Frequency needs be floats", args[1]);
	if (vpeaks <= 0) return new Error("the number of times you reach the peak pitch must be positive", args[0]);
	if (!isNote(base_note)) return new Error("last arg must be a note", args[2]);
        let freq_fn = function(t) { return base_note.freq_of_t(t).map((f) => f + vampl * Math.cos(t * vpeaks * Math.PI * 2)); };
	return new PureNote(freq_fn, base_note.duration, base_note.ampl_of_t);
    }, "An oscillation of pitch that varies by the change, hitting the highest peak the provided number of times.", "(vibrato [pitch-change] [num-peaks] [note])", ["note", "notes"])
};
