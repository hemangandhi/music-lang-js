// A dependency graph that contains any wasm must all be imported
// asynchronously. This `bootstrap.js` file does the single async import, so
// that no one else needs to worry about it again.
import * as wasm from "music-lang-js";

let demos = {
    "Jingle Bells": `
(play
 (with-bpm 240
   (chord (note-seq (map (fn (add-adsr n) (with-adsr 1.2 0.05 0.075 1 0.9 n))
                    (chord (note (pitch-at C 2) 4)
                           (note (pitch-at G 2) 4))
                    (chord (note (pitch-at C 2) 4)
                           (note (pitch-at G 2) 4))
                    (chord (note (pitch-at C 2) 4)
                           (note (pitch-at G 2) 4))
                    (chord (note (pitch-at C 2) 4)
                           (note (pitch-at G 2) 4))
                    (chord (note (pitch-at F 2) 4)
                           (note (pitch-at A 3) 4))
                    (chord (note (pitch-at C 2) 4)
                           (note (pitch-at G 2) 4))
                    (chord (note (pitch-at F 2) 4)
                           (note (pitch-at G 2) 4))
                    (chord (note (pitch-at F 2) 4)
                           (note (pitch-at G 2) 4))))
          (note-seq (map (fn (add-adsr n) (with-adsr 1.2 0.2 0.3 1 0.9 n))
                    (note (pitch-at E 3) 1)
                    (note (pitch-at E 3) 1)
                    (note (pitch-at E 3) 2)
                    (note (pitch-at E 3) 1)
                    (note (pitch-at E 3) 1)
                    (note (pitch-at E 3) 2)
                    (note (pitch-at E 3) 1)
                    (note (pitch-at G 3) 1)
                    (note (pitch-at C 3) 1)
                    (note (pitch-at D 3) 1)
                    (note (pitch-at E 3) 4)
                    (note (pitch-at F 3) 1)
                    (note (pitch-at F 3) 1)
                    (note (pitch-at F 3) 1)
                    (note (pitch-at F 3) 1)
                    (note (pitch-at F 3) 1)
                    (note (pitch-at E 3) 1)
                    (note (pitch-at E 3) 1)
                    (note (pitch-at E 3) 1)
                    (note (pitch-at E 3) 1)
                    (note (pitch-at D 3) 1)
                    (note (pitch-at D 3) 1)
                    (note (pitch-at E 3) 1)
                    (note-seq (note (pitch-at D 3) 2)
                              (note (pitch-at G 3) 2)))))))
`,
    "Happy Birthday": `
(play (with-bpm 180 (with-known-timbre piano
  (note (pitch-at G 2) 0.5)
  (note (pitch-at G 2) 0.5)
  (note (pitch-at A 3) 1)
  (note (pitch-at G 2) 1)
  (note (pitch-at C 3) 1)
  (note (pitch-at B 3) 2)
  (note (pitch-at G 2) 0.5)
  (note (pitch-at G 2) 0.5)
  (note (pitch-at A 3) 1)
  (note (pitch-at G 2) 1)
  (note (pitch-at D 3) 1)
  (note (pitch-at C 3) 2)
  (note (pitch-at G 2) 0.5)
  (note (pitch-at G 2) 0.5)
  (note (pitch-at G 3) 1)
  (note (pitch-at E 3) 1)
  (note (pitch-at C 3) 0.5)
  (note (pitch-at C 3) 0.5)
  (note (pitch-at B 3) 1)
  (note (pitch-at A 3) 1)
  (note (pitch-at F 3) 0.5)
  (note (pitch-at F 3) 0.5)
  (note (pitch-at E 3) 1)
  (note (pitch-at C 3) 1)
  (note (pitch-at D 3) 1)
  (note (pitch-at C 3) 2))))
`,
    "Vibrato Glissando": `
(play (vibrato 5 10
  (glissando (pitch-at A 5)
             (pitch-at A 4) 5)))
`,
    "Ode to joy": `
(play (with-bpm 150 (with-known-timbre violin
  (map (fn (v n)
           (vibrato 0.01 2 n))
    (note (pitch-at B 4) 1)
    (note (pitch-at B 4) 1)
    (note (pitch-at C 4) 1)
    (note (pitch-at D 4) 1)
    (note (pitch-at D 4) 1)
    (note (pitch-at C 4) 1)
    (note (pitch-at B 4) 1)
    (note (pitch-at A 4) 1)
    (note (pitch-at G 3) 1)
    (note (pitch-at G 3) 1)
    (note (pitch-at A 4) 1)
    (note (pitch-at B 4) 1)
    (note (pitch-at B 4) 1.5)
    (note (pitch-at A 4) 1)
    (note (pitch-at A 4) 2)))))
`,
    "響け！ユーフォニアム": `
(play (with-bpm 80
  (with-known-overtones euphonium
    (map (fn (v n)
             (vibrato 0.01 2 n))
      (map (fn (adsr-bit n) (with-adsr 1.2 0.2 0.3 1 0.5 n))
          (note (pitch-at C 2) 1)
          (rest 0.25)
          (note (pitch-at G 1) 0.5)
          (note (pitch-at C 2) 0.5)
          (note (pitch-at E 2) 1)
          (rest 0.125))
      (chord (note-seq
               (with-adsr 1.2 0.2 0.3 1 0.5 (note (pitch-at G 1) 0.5))
               (rest 0.5))
             (note-seq
               (rest 0.45)
               (with-adsr 0.8 0.1 0.2 0.7 0.6 (note (pitch-at G 2) 0.55))))
      (map (fn (adsr-bit n) (with-adsr 1.2 0.2 0.3 1 0.5 n))
          (note (pitch-at F# 2) 0.5)
          (note (pitch-at E 2) 0.5)
          (note (pitch-at D 2) 0.5)
          (note (pitch-at C 2) 0.5)
          (note (pitch-at D 2) 1.5))))))
`
}

// The set of pre-defined timbres for use in "with-known-timbre".
// Must provide harmonics and amplitudes. May provide an adsr envelope if the instrument must.
const known_timbres = {
    // Not sure where to add more character, but this is a start.
    'violin': {
        'harmonics': [ //centsToHertz(1),
              2 * centsToHertz(3),
              3 * centsToHertz(8),
              4 * centsToHertz(11),
              5 * centsToHertz(2),
              6 * centsToHertz(27),
              8 * centsToHertz(43)],
        'amplitudes': [0.02, 0.02, 0.02, 0.02, 0.02, 0.02],
        // Inspired by https://youtu.be/kCOpBRoE_c4?t=148
        'adsr': {'a_vol': 1.2, 'd_start': 0.25, 's_start': 0.3, 's_vol': 1, 'r_start': 0.9}
    },
    // http://www.afn.org/~afn49304/youngnew.htm for more -- comments below reference this.
    'piano': {
        // Based on Table I (assuming that all notes work like A4 because I'm deaf to the difference).
        // Because of exponentiation, the differences in cents in table I are products in the Hertz.
        'harmonics': [centsToHertz(1),
                  2 * centsToHertz(3),
                  3 * centsToHertz(8),
                  4 * centsToHertz(11),
                  5 * centsToHertz(2),
                  6 * centsToHertz(27),
                  7 * centsToHertz(2),
                  8 * centsToHertz(43)],
        // Hand-tuned.
        'amplitudes': [0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02],
        'adsr': {'a_vol': 1.2, 'd_start': 0.01, 's_start': 0.1, 's_vol': 0.6, 'r_start': 0.25}
    },
    // experimental, but decent around the 4th octave.
    'recorder': {
        'harmonics': [3, 4, 5],
        'amplitudes': [0.1, 0.1, 0.1]
    },
    // based on https://youtu.be/wGkdb6YlLgg?t=416
    'melodica': {
        'harmonics': [centsToHertz(8), 2, 3, 4, 5],
        'amplitudes': [0.1, 0.1, 0.1, 0.1, 0.1],
    },
    'euphonium': {
        'harmonics': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        'amplitudes': [0.1, 0.1, 0.1, 0.1, 0.01, 0.1, 0.01, 0.05, 0.01, 0.01, 0.01],
        'adsr': {'a_vol': 1.2, 'd_start': 0.2, 's_start': 0.3, 's_vol': 1, 'r_start': 0.5}
    },
};


function HandleRustErrors(fn, reportSuccess) {
    return function () {
        let errs = (reportSuccess)? ["Success!"] : [];
        try {
            fn();
        } catch (e) {
            if (!Array.isArray(e)) {
                throw e;
            }
            console.error(e);
            errs = e;
        }
        if (errs.length === 0) return;

        let err_out = document.getElementById('err-out-area');
        // Clear past error.
        while(err_out.firstChild) err_out.removeChild(err_out.firstChild);

        err_out.appendChild(document.createTextNode(errs[0]));
        if (errs.length === 1) return;
        let stacktrace = document.createElement("ol");
        errs.slice(1).forEach(function (lvl) {
            let lvl_node = document.createElement("li");
            lvl_node.appendChild(document.createTextNode(lvl));
            stacktrace.appendChild(lvl_node);
        });
        err_out.appendChild(stacktrace);
    };
}


function Error(msg, trigger) {
    this.apply = function (args) {
        return new Error("Calling uncallable 'error':" + this.message, this);
    };
    this.type = "Error";
    this.message = msg;
    if (trigger && trigger.type && trigger.type === "Error") {
        this.stacktrace = ["Caused by '" + trigger.message + "'"].concat(trigger.stacktrace);
    } else {
        this.stacktrace = ["At " + trigger];
    }
}

function Result() {
    this.apply = function (args) {
        return new Error("Calling uncallable 'result'", args);
    };
    this.type = "Result";
}

function Callable(delegate, docs, snippet, targets) {
    this.apply = delegate;
    this.type = "Callable";
    this.docs = docs;
    this.snippet = snippet;
    this.snippets_targets = targets;
}

function SpecialForm(delegate, docs, snippet, targets) {
    this.apply = delegate;
    this.type = "SpecialForm";
    this.docs = docs;
    this.snippet = snippet;
    this.snippets_targets = targets;
}

function PureNote(freq_of_t, duration, ampl_of_t) {
    this.apply = function(args) {
        return new Error("Value of type PureNote is uncallable");
    };
    this.type = "PureNote";
    this.freq_of_t = freq_of_t;
    this.ampl_of_t = ampl_of_t || (function (t) {return [0.3]; });
    this.duration = duration;
}

function List(values) {
    this.apply = function(args) {
        return new Error("Value of type List is uncallable");
    };
    this.values = values;
    this.type = "List";
}

function evalParsedMusic(parsed_music, variables) {
    if (!Array.isArray(parsed_music)) {
        return variables[parsed_music] || parsed_music;
    }
    if ((typeof parsed_music[0]) === "string") {
        // TODO: when allowing abstractions this is a special
        // case so that the environment can handle parameters
        if (!(parsed_music[0] in variables)) {
            return new Error("Undefined variable: " + parsed_music[0]);
        } else if (variables[parsed_music[0]].type === "SpecialForm") {
            return variables[parsed_music[0]].apply(parsed_music.slice(1));
        }
        return variables[parsed_music[0]].apply(
            parsed_music.slice(1)
                        .map(function(e) {
                            return evalParsedMusic(e, variables);
                        }));
    } else {
        var inner_eval = evalParsedMusic(parsed_music[0], variables);
        return inner_eval.apply(
            parsed_music.slice(1)
                        .map(function(e) {
                            return evalParsedMusic(e, variables);
                        }));
    }
}

function parseMusic(music_code) {
    let tokens = music_code.replaceAll('(', ' ( ').replaceAll(')', ' ) ').split(/\s+/);
    let parsed = [];
    let array_stack = [parsed];
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
    // there's an off by one in the initialization logic if the code starts with
    // a paren
    if (music_code[0] === "(") parsed = parsed[0];
    return [parsed, (array_stack.length == 1)? "": "mismatched parens -- extra ("];
}

function normalize(abnormal) {
    let total = abnormal.reduce((x, y) => x + y, 0);
    if (total === 0) return abnormal;
    return abnormal.map((a) => a / total);
}

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
            pulses[i] += ampl * Math.sin(i / audio_ctx.sampleRate * 2 * Math.PI * freqs[j]);
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

function applyKnownTimbre(known, include_adsr, args) {
    if (known === undefined) return new Error("Unknown timbre: " + args[0], args[0]);
    let harms = known['harmonics'];
    let ampls = known['amplitudes'];
    let adsr = known['adsr'];

    let notes = flattenMusicLangListsIn(args.slice(1));
    let duration = 0;
    let e = null;
    if (notes.length === 0) return new Error("with-known-timbre needs at least 1 note for the last argument", args);
    else if (notes.some(function (note) {
        if (isNote(note)) {
            duration += note.duration;
            return false;
        }
        e = note;
        return true;
    })) {
        return new Error("All arguments to with-known-timbre after the first should be notes", e);
    }
    ampls = normalize(ampls);
    if (adsr && include_adsr) {
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
            return new Error("Duration needs be floats", args[1]);
        if (dur_val <= 0) return new Error("Duration must be positive", args[1]);
        let freq_fn = function(t) { return [freq_val]; };
        return new PureNote(freq_fn, dur_val);
    }, "Creates a note at a given frequency for a given duration", "(note [frequency] [duration])", ["note", "notes"]),
    "chord": new Callable(function (args) {
        args = flattenMusicLangListsIn(args);
        let longest = 0;
        let e = null;
        if(args.some(function(arg) {
            if (!isNote(arg)) {
                e = arg;
                return true;
            }
            longest = Math.max(longest, arg.duration);
            return false;
        })) {
            return new Error("All arguments to chords must be notes.", e);
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
        let e = null;
        if(args.some(function(arg) {
            if(!isNote(arg)) {
                e = arg;
                return true;
            }
            duration += arg.duration;
            return false;
        })) {
            return new Error("All arguments to note-seq must be a note.", e);
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
        let e = null;
        if(notes.some(function(note) {
            if(!isNote(note)) {
                e = note;
                return true;
            }
            duration += note.duration;
            return false;
        })) {
            return new Error("All arguments (except the first) to with-bpm must be a note.", e);
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
                return new Error("Expected a pair of floats for harmonics and amplitude scalars followed by notes", fl);
            let fl2 = parseFloat(args[i + 1]);
            if (isNaN(fl2) && fl2 < 0 && fl2 > 1)
                return new Error("Expected a float between 0 and 1 for amplitude scalars, got: " + fl2, fl2);
            harms.push(fl);
            ampls.push(fl2);
        }

        let notes = args.slice(i);
        let duration = 0;
        let e = null;
        if (notes.length === 0) return new Error("with-overtones needs at least 1 note for the last argument", args);
        else if (notes.some(function (note) {
            if (isNote(note)) {
                duration += note.duration;
                return false;
            }
            e = note;
            return true;
        })) {
            return new Error("All arguments to with-overtones after the overtones themselves should be notes", e);
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
        return applyKnownTimbre(known, true, args);
    }, "Use a pre-defined timbre (" + Object.keys(known_timbres).join(", ") + ") for a set of notes. See the table below for more.", "(with-known-timbre [known-timbre] [notes...])", ["note", "notes"]),
    "with-known-overtones": new Callable(function (args) {
        if (args.length < 2) return new Error("with-known-timbre needs at least 2 arguments.", args);
        let known = known_timbres[args[0]];
        return applyKnownTimbre(known, false, args);
    }, "Use a pre-defined set of overtones (" + Object.keys(known_timbres).join(", ") + ") for a set of notes. See the table below for more.", "(with-known-overtones [known-timbre] [notes...])", ["note", "notes"]),
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
            return new Error("Frequency change needs to be a float", args[0]);
        if (isNaN(vpeaks))
            return new Error("Number of peaks needs to be a float", args[1]);
        if (vpeaks <= 0) return new Error("the number of times you reach the peak pitch must be positive", args[0]);
        if (!isNote(base_note)) return new Error("last arg must be a note", args[2]);
        let freq_fn = function(t) { return base_note.freq_of_t(t).map((f) => f + vampl * Math.cos(t * vpeaks * Math.PI * 2)); };
        return new PureNote(freq_fn, base_note.duration, base_note.ampl_of_t);
    }, "An oscillation of pitch that varies by the change, hitting the highest peak the provided number of times.", "(vibrato [pitch-change] [num-peaks] [note])", ["note", "notes"]),
    "rest": new Callable(function (args) {
        if (args.length != 1)
            return new Error("rest needs exactly one argument, not the " + args.length + " provided", args);
        let duration = parseFloat(args[0]);
        if (isNaN(duration) || duration < 0)
            return new Error("rest's duration needs to be a non-negative floating point number, not the " + args[0] + " provided", args);
        return new PureNote(function(t) { return [0];}, duration, function(t) { return [0];});
    }, "A silence for the provided beats.", "(rest [duration])", ["note", "notes"])
};

function centsToHertz(cents) {
    // A cent is a hundreth of a semi-tone, so the frequency ratio is 2^(1/1200) per cent.
    return Math.pow(2, cents / 1200);
}

// Older JS

// TODO: oxidize. But see if the error reporting can be done directly in Rust.
// Furthermore, see if the audio context actually pans out.
function runMusic(textarea_id, err_out_id) {
    let txt = document.getElementById(textarea_id).value;
    let parsed_and_error = parseMusic(txt);
    let err_out = document.getElementById(err_out_id);
    err_out.innerText = parsed_and_error[1];
    if (parsed_and_error[1]) {
        return;
    }
    let evaled = evalParsedMusic(parsed_and_error[0], global_variables);
    while(err_out.firstChild) err_out.removeChild(err_out.firstChild);

    if (evaled && evaled.type === "Error") {
        err_out.appendChild(document.createTextNode(evaled.message));
        let stacktrace = document.createElement("ol");
        evaled.stacktrace.forEach(function (lvl) {
            let lvl_node = document.createElement("li");
            lvl_node.appendChild(document.createTextNode(lvl));
            stacktrace.appendChild(lvl_node);
        });
        err_out.appendChild(stacktrace);
    }
}

// TODO: oxidize: this can simply be a method of the timbre struct.
function codeOfTimbre(timbre) {
    let overtone_args = timbre.harmonics.map((h, i) => h + " " + timbre.amplitudes[i]).join(" ");
    let preamble = "(with-overtones " + overtone_args;
    if (!timbre.adsr) {
        return preamble  + " [notes...])";
    }
    let fn_bit = "(fn (adsr-bit n) (with-adsr " + [timbre.adsr.a_vol, timbre.adsr.d_start, timbre.adsr.s_start, timbre.adsr.s_vol, timbre.adsr.r_start].join(" ") + " n))";
    return preamble + " (map " + fn_bit + " [notes...]))";
}

// TODO: oxidize? This might limit the opportunities from below.
function makeSnippetClicker(err_id, txt_box_id, snippets_targets, snippet) {
    return function(event) {
        document.getElementById(err_id).innerText = "";
        let text = document.getElementById(txt_box_id).value;
        if (!text && (!snippets_targets || snippets_targets.length === 0)) {
            document.getElementById(txt_box_id).value = snippet;
            return;
        } else if (!snippets_targets) {
            document.getElementById(err_id).innerText = "Can't add more than one top-level definition";
            return;
        }

        let found_snippet = snippets_targets.map(function(snippet) {
            return [snippet, text.indexOf("[" + snippet + "]")];
        }).filter(function(i) { return i[1] >= 0; });
        if (found_snippet.length > 0) {
            let fsnippet = found_snippet[0][0];
            document.getElementById(txt_box_id).value = text.replace("[" + fsnippet + "]", snippet);
            return;
        }
        found_snippet = snippets_targets.map(function(snippet) {
            return [snippet, text.indexOf("[" + snippet + "...]")];
        }).filter(function(i) { return i[1] >= 0; });
        if (found_snippet.length > 0) {
            let fsnippet = found_snippet[0][0];
            document.getElementById(txt_box_id).value = text.replace("[" + fsnippet + "...]", snippet + " [" + fsnippet + "...]");
        } else {
            document.getElementById(err_id).innerText = "Can't find a proper place to insert the snippet, hints such as [" + snippets_targets + "] required (add ellipsis for mulitple arguments with the same hint).";
        }
    }
}

// TODO: oxidize: the PL implementation should have the timbre table.
// See how much DOM manipulation can be oxidized.
function makeTimbreTable(err_id, txt_box_id, timbres_id) {
    let table = document.getElementById(timbres_id);

    // title
    let header = document.createElement("tr");
    let col1 = document.createElement("th");
    col1.appendChild(document.createTextNode("Timbre name"));
    header.appendChild(col1);
    let col2 = document.createElement("th");
    col2.appendChild(document.createTextNode("Timbre snippet (click to add to your code)"));
    header.appendChild(col2);
    table.appendChild(header);

    // each row
    Object.keys(known_timbres).forEach(function (timbre) {
        let row = document.createElement("tr");
        let fn_name = document.createElement("td");
        fn_name.addEventListener("click", makeSnippetClicker(err_id, txt_box_id, ['note', 'notes'], "(with-known-timbre " + timbre + " [notes...])"));
        fn_name.appendChild(document.createTextNode(timbre));
        fn_name.classList.add("func-name");
        let fn = document.createElement("td");
        let fn_snip = document.createElement("code");
        let sn = codeOfTimbre(known_timbres[timbre])
        fn_snip.appendChild(document.createTextNode(sn));
        fn.appendChild(fn_snip);
        fn.classList.add("func-name");
        fn.addEventListener("click", makeSnippetClicker(err_id, txt_box_id, ['note', 'notes'], sn));

        //add that row to the table
        row.appendChild(fn_name);
        row.appendChild(fn);
        table.appendChild(row);
    });
}

// TOOD: oxidize: the function objects should be in Rust.
// Should see how much DOM-writing could work here.
function makeDocsTable(table_id, txt_box_id, err_id, timbres_id) {
    makeTimbreTable(err_id, txt_box_id, timbres_id);

    let table = document.getElementById(table_id);

    // title
    let header = document.createElement("tr");
    let col1 = document.createElement("th");
    col1.appendChild(document.createTextNode("Function name"));
    header.appendChild(col1);
    let col2 = document.createElement("th");
    col2.appendChild(document.createTextNode("Function snippet (click to add to your code)"));
    header.appendChild(col2);
    let col3 = document.createElement("th");
    col3.appendChild(document.createTextNode("Function docs"));
    header.appendChild(col3);
    table.appendChild(header);

    for (let doc of wasm.get_docs_table()) {
        let row = document.createElement("tr");
        let fn_name = document.createElement("td");
        fn_name.appendChild(document.createTextNode(doc.get_name() + " (Rust version)"));
        let fn = document.createElement("td");
        let fn_snip = document.createElement("code");
        fn_snip.appendChild(document.createTextNode(doc.get_snippet()));
        fn.appendChild(fn_snip);
        fn.classList.add("func-name");
        fn.addEventListener("click", makeSnippetClicker(err_id, txt_box_id, doc.get_snippet_targets(), doc.get_snippet()));

        // add that row to the table
        let docs = document.createElement("td");
        docs.appendChild(document.createTextNode(doc.get_details()));
        row.appendChild(fn_name);
        row.appendChild(fn);
        row.appendChild(docs);
        table.appendChild(row);
        // Yeah, there's now memory management in my JS?
        doc.free();
    }

    // each row
    Object.keys(global_variables).forEach(function (global_var) {
        let global = global_variables[global_var];
        if (!global.docs) return;
        let row = document.createElement("tr");
        let fn_name = document.createElement("td");
        fn_name.appendChild(document.createTextNode(global_var));
        let fn = document.createElement("td");
        let fn_snip = document.createElement("code");
        fn_snip.appendChild(document.createTextNode(global.snippet));
        fn.appendChild(fn_snip);
        fn.classList.add("func-name");
        if (global.snippet) {
            fn.addEventListener("click", makeSnippetClicker(err_id, txt_box_id, global.snippets_targets, global.snippet));
        } // if

        // add that row to the table
        let docs = document.createElement("td");
        docs.appendChild(document.createTextNode(global.docs));
        row.appendChild(fn_name);
        row.appendChild(fn);
        row.appendChild(docs);
        table.appendChild(row);
    });
}

// Implements "emacs style lisp indentation".
// See https://wiki.c2.com/?LispIndentation for more.
function formatCode(textarea_id, err_id, rm_hints_checkbox_id) {
    let rm_hints = document.getElementById(rm_hints_checkbox_id).checked;
    let found_hints_warnings = [];
    function checkHint(hint) {
        if (rm_hints && hint.startsWith('[') && hint.endsWith('...]')) {
            return "";
        }
        if (rm_hints && hint.startsWith('[') && hint.endsWith(']')) {
            found_hints_warnings.push(hint);
        }
        return hint;
    }

    function indentTreeLevel(level, indentation) {
        let res = "";
        for(let i = 0; i < indentation; i++) { res += " "; }
        if (!Array.isArray(level)) {
            let checked = checkHint(level);
            return (checked === "")? checked : res + checked;
        } else if (level.some(function(x) { return Array.isArray(x);})) {
            if (Array.isArray(level[0])) {
                res += "(" + indentTreeLevel(level[0], indentation) + ")\n";
            } else {
                res += "(" + level[0] + "\n";
            }
            res += level.slice(1).map(function(arg) {
                return indentTreeLevel(arg, indentation + 2);
            }).join("\n");
            return res + ")";
        } else {
            return res + "(" + level.map(checkHint)
                .filter(function(c) { return c !== ""; })
                .join(" ") + ")";
        }
    }

    let code = document.getElementById(textarea_id).value;
    // let's not care about what the user did
    let parsed_and_err = parseMusic(code);
    if (parsed_and_err[1]) {
        document.getElementById(err_id).innerText = parsed_and_err[1];
        return;
    }

    let parsed = parsed_and_err[0];
    let formatted = indentTreeLevel(parsed, 0);
    document.getElementById(textarea_id).value = formatted;
    if (rm_hints && found_hints_warnings.length > 0) {
        document.getElementById(err_id).innerText = "Found unresolved hints: " + found_hints_warnings.join(", ");
    }
}

function saveEditorTxt(editor_txtarea_id, saved_option) {
    let now = new Date();
    let exp = new Date();
    exp.setTime(now.getTime() + 7 * 24 * 24 * 60 * 1000);
    let cookie = "saved_music_lang=" + document.getElementById(editor_txtarea_id).value;
    cookie += "expires=" +  exp.toUTCString() + ";";
    document.cookie = cookie;
    document.getElementById(saved_option).innerText = "Saved at " + now.toUTCString();
}

function loadDemos(selector_id, editor_txtarea_id) {
    let selector = document.getElementById(selector_id);
    for(let demo in demos) {
        let option = document.createElement('option');
        option.innerText = demo;
        option.value = demo.replaceAll(' ', '-');
        selector.appendChild(option);
    }

    selector.addEventListener("change", function(evt) {
        if (selector.value !== "clear") {
            document.getElementById(editor_txtarea_id).value = demos[selector.value.replaceAll('-', ' ')];
            return;
        }
        let maybe_saved_code = document.cookie.split(';').filter((kv) => kv.startsWith('saved_music_lang='));
        console.log(maybe_saved_code);
        if (maybe_saved_code.length > 0) {
            document.getElementById(editor_txtarea_id).value = maybe_saved_code[0].split('=')[1];
        }
    });
}

function onPageLoad() {
    HandleRustErrors(() => makeDocsTable("docs-container", "src-txt-area", "snippets-errors", "timbres-container"), false)();
    loadDemos("demo-drop-down", "src-txt-area");
    document.getElementById("play-rs").addEventListener("click", HandleRustErrors(() => {
        wasm.test_run_exec(document.getElementById('src-txt-area').value);
    }, true));
    document.getElementById("play-js").addEventListener("click", () => runMusic('src-txt-area', 'err-out-area'));
    document.getElementById("save-button").addEventListener("click", () => saveEditorTxt('src-txt-area', 'clear-demo-option'));
    document.getElementById("format-button").addEventListener("click", () => formatCode('src-txt-area', 'snippets-errors', 'format-rm-hints'));
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(onPageLoad, 1);
} else {
    document.addEventListener("DOMContentLoaded", onPageLoad);
}


