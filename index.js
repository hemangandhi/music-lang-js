function Error(msg) {
    this.apply = function (args) {
        return new Error("Calling uncallable 'error':" + this.message);
    }
    this.type = "Error";
    this.message = msg;
}

function Result() {
    this.apply = function (args) {
        return new Error("Calling uncallable 'result'");
    }
    this.type = "Result";
}

function Callable(delegate, docs, snippet, targets) {
    this.apply = delegate;
    this.type = "Callable";
    this.docs = docs;
    this.snippet = snippet;
    this.snippets_targets = targets;
}

function PureNote(freq_of_t, duration, ampl_of_t) {
    this.apply = function(args) {
        return new Error("Value of type PureNote is uncallable");
    }
    this.type = "PureNote";
    this.freq_of_t = freq_of_t;
    this.ampl_of_t = ampl_of_t || (function (t) {return 0.3; });
    this.duration = duration;
}

function tryNoteToWave(note, audio_ctx) {
    if (!Object.prototype.hasOwnProperty.call(note, 'freq_of_t')) {
        return false;
    }
    if (!Object.prototype.hasOwnProperty.call(note, 'duration')) {
        return false;
    }

    const buf_size = audio_ctx.sampleRate * note.duration;
    let pulses = new Array(buf_size);
    for (let i = 0; i < buf_size; i++) {
	let freqs = note.freq_of_t(i / audio_ctx.sampleRate);
	pulses[i] = 0;
	for(let j = 0; j < freqs.length; j++) {
            pulses[i] += Math.sin(i / audio_ctx.sampleRate * 2 * Math.PI * freqs[j]) / freqs.length;
	}
        if(Object.prototype.hasOwnProperty.call(note, 'ampl_of_t')) {
            pulses[i] *= note.ampl_of_t(i / audio_ctx.sampleRate);
	}
    }
    return {
        buffer: pulses,
	duration: note.duration,
	type: "Wave"
    };
}

function getNoteInSeq(notes, t) {
    let start = 0, i = 0;
    for(; i < notes.length && t > start + notes[i].duration;
	start += notes[i++].duration);
    return [i, start];
}

const global_variables = {
    "play": new Callable(function (args) {
	let total_buffer = [];
	let total_time = 0;
        const audio_ctx = new AudioContext();
	for(let i = 0; i < args.length; i++) {
	    let arg = args[i];
            let wave = tryNoteToWave(arg, audio_ctx);
	    if (!wave) return new Error("Arg " + i + " is not a note");
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
	});
	return new Result();
    }, "Plays a sequence of notes", "(play [notes...])"),
    "note": new Callable(function (args) {
	if (args.length != 2)
	    return new Error("note needs 2 arguments, not the " + args.length + " provided");
	let freq_val = parseFloat(args[0]);
	let dur_val = parseFloat(args[1]);
	if (freq_val === NaN || dur_val === NaN)
	    return new Error("Frequency and duration need be floats");
	if (dur_val <= 0) return new Error("Duration must be positive");
        let freq_fn = function(t) { return [freq_val]; };
	return new PureNote(freq_fn, dur_val);
    }, "Creates a note at a given frequency for a given duration", "(note [frequency] [duration])", ["note", "notes"]),
    "chord": new Callable(function (args) {
	let longest = 0;
        if(args.some(function(arg) {
	    if((typeof arg.duration) != 'number') {
		return true;
	    } else if((typeof arg.freq_of_t != 'function') || (typeof arg.ampl_of_t != 'function')) {
                return true;
	    }
	    longest = Math.max(longest, arg.duration);
	    return false;
	})) {
            return new Error("All arguments to chords must have a duration (being a note)");
	}
	return new PureNote(function(t) {
	    let acc = [];
            for(let i = 0; i < args.length; i++) {
                if (t > args[i].duration) continue;
		let curr = args[i].freq_of_t(t);
		if (Array.isArray(curr)) {
                    acc = acc.concat(curr);
		} else acc.push(curr);;
	    }
	    return acc;
	}, longest, function(t) {
            return args
		.map(function (arg) { return arg.ampl_of_t(t);})
		.reduce(function(acc, arg) { return acc + arg / args.length }, 0);
	});
    }, "Creates a chord of given notes (plays them in tandem)", "(chord notes...)", ["note", "notes"]),
    "note-seq": new Callable(function (args) {
	let duration = 0;
        if(args.some(function(arg) {
	    if((typeof arg.duration) != 'number') {
		return true;
	    } else if((typeof arg.freq_of_t != 'function') || (typeof arg.ampl_of_t != 'function')) {
                return true;
	    }
	    duration += arg.duration;
	    return false;
	})) {
            return new Error("All arguments to chords must have a duration (being a note)");
	}
	return new PureNote(function(t) {
	    let got_note = getNoteInSeq(args, t);
	    if (got_note[0] >= args.length) return 0;
            return args[got_note[0]].freq_of_t(t - got_note[1]);
	}, duration, function(t) {
	    let got_note = getNoteInSeq(args, t);
	    if (got_note[0] >= args.length) return 0;
            return args[got_note[0]].ampl_of_t(t - got_note[1]);
	});
    }, "Creates a sequence of notes but does not play them", "(note-seq notes...)", ["notes"]),
    "pitch-at": new Callable(function (args) {
	if (args.length != 2)
	    return new Error("pitch-at needs 2 arguments, not the " + args.length + " provided");
	if ((typeof args[0]) != "string" || (args[0].length != 1 && args[0].length != 2))
	    return new Error("Invalid tone " + args[0]);
	let tone = args[0];
	if (tone[0] < 'A' || tone[0] > 'G') return new Error("Tone out of range: " + args[0]);
	if (tone.length === 2 && tone[1] != 'b' && tone[1] != '#') return new Error("Tone out of range: " + args[0]);
	let octave = parseFloat(args[1]);
	if (octave == NaN) return new Error("Octave needs to be a number, not '" + args[1] + "'");
	let tone_num = (tone.charCodeAt(0) - 'A'.charCodeAt(0)) * 2;
	if (tone > 'B') tone_num--;
	if (tone > 'E') tone_num--;
	if (tone.length > 1) {
            if (tone[1] === 'b') tone_num--;
	    else tone_num++;
	}
	return 440 * Math.pow(2, tone_num / 12.0 + octave - 4);
    }, "Gets the pitch for a given note. The notes are letters from A through G with # for sharps and b for flats (since key signatures are not used double flats, double sharps, or \"naturals\". An octave must be specified, with  <code>(pitch-at C 3)</code> being middle C", "(pitch-at note octave)", ["frequency"]),
    "error": new Callable(function (args) {
        if (args.length != 1) return new Error("Error only takes one argument (did you put spaces in the message?)");
	return new Error(args[0]);
    })
};

function evalParsedMusic(parsed_music, variables) {
    if (!Array.isArray(parsed_music)) {
        return variables[parsed_music] || parsed_music;
    }
    if ((typeof parsed_music[0]) === "string") {
        // TODO: when allowing abstractions this is a special
	// case so that the environment can handle parameters
	if (!(parsed_music[0] in variables)) {
            return new Error("Undefined variable: " + parsed_music[0]);
	}
	return variables[parsed_music[0]].apply(
	    parsed_music.slice(1)
	      .map(function(e) { return evalParsedMusic(e, variables); }));
    } else {
        var inner_eval = evalParsedMusic(parsed_music[0], variables);
	return inner_eval.apply(
	    parsed_music.slice(1)
	      .map(function(e) { return evalParsedMusic(e, variables); }));
    }
}

function parseMusic(music_code) {
    let tokens = music_code.replaceAll('(', ' ( ').replaceAll(')', ' ) ').split(/\s+/);
    let parsed = [];
    let array_stack = [parsed];
    let pc = 0;
    for(let i = 0; i < tokens.length; i++) {
        if (tokens[i] === '(') {
	    let tos = array_stack[array_stack.length - 1];
            tos.push([]);
	    array_stack.push(tos[tos.length - 1]);
	} else if (tokens[i] === ')') {
	    // NOTE: the stack must always have a highest level for the parsed
            if (array_stack.length < 2) {
		return [parsed, "mismatched parens -- extra )"];
	    }
	    array_stack.pop();
	} else if (tokens[i]) {
            array_stack[array_stack.length - 1].push(tokens[i]);
	}
    }
    return [parsed, (array_stack.length == 1)? "": "mismatched parens -- extra ("];
}

function runMusic(textarea_id, err_out_id) {
    let txt = document.getElementById(textarea_id).value;
    let parsed_and_error = parseMusic(txt);
    document.getElementById(err_out_id).innerText = parsed_and_error[1];
    if (parsed_and_error[1]) {
	return;
    }
    let evaled = evalParsedMusic(parsed_and_error[0], global_variables);
    if (evaled && evaled.type === "Error") {
        document.getElementById(err_out_id).innerText = evaled.message;
    }
}

function makeDocsTable(table_id, txt_box_id) {
    let table = document.getElementById(table_id);

    let header = document.createElement("tr");
    let col1 = document.createElement("th");
    col1.appendChild(document.createTextNode("Function name (click to add to your code)"));
    header.appendChild(col1);
    let col2 = document.createElement("th");
    col2.appendChild(document.createTextNode("Function docs"));
    header.appendChild(col2);
    table.appendChild(header);

    Object.keys(global_variables).forEach(function (global_var) {
	let global = global_variables[global_var];
        if (!global.docs) return;
	let row = document.createElement("tr");
	let fn = document.createElement("td");
	fn.appendChild(document.createTextNode(global_var));
	if (global.snippet) {
	    fn.addEventListener("click", function(event) {
		let text = document.getElementById(txt_box_id).value;
		if (!text) {
		    document.getElementById(txt_box_id).value = global.snippet;
		    return;
		} else if (!global.snippets_targets) return;
		let found_snippet = global.snippets_targets.map(function(snippet) {
		    return [snippet, text.indexOf("[" + snippet + "]")];
		}).filter(function(i) { return i[1] >= 0; });
		console.log(found_snippet);
		if (!found_snippet) {
		    let snippet = found_snippet[0][0];
		    document.getElementById(txt_box_id).value = text.replace("[" + snippet + "]", global.snippet);
		    return;
		}
		found_snippet = global.snippets_targets.map(function(snippet) {
		    return [snippet, text.indexOf("[" + snippet + "...]")];
		}).filter(function(i) { return i[1] >= 0; });
		if (found_snippet) {
		    let snippet = found_snippet[0][0];
		    document.getElementById(txt_box_id).value = text.replace("[" + snippet + "...]", global.snippet + " [" + snippet + "...]");
		}
	    });
	} // if

	let docs = document.createElement("td");
	docs.appendChild(document.createTextNode(global.docs));
	row.appendChild(fn);
	row.appendChild(docs);
	table.appendChild(row);
    });
}
