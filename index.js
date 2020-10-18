const audio_ctx = new AudioContext();

function Error(msg) {
    this.apply = function (args) {
        return new Error("Calling uncallable 'error'");
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

function Callable(delegate) {
    this.apply = delegate;
    this.type = "Callable";
}

function PureNote(freq_of_t, duration) {
    this.apply = function(args) {
        return new Error("Value of type PureNote is uncallable");
    }
    this.type = "PureNote";
    this.freq_of_t = freq_of_t;
    this.duration = duration;
}

function tryNoteToWave(note) {
    if (!Object.prototype.hasOwnProperty.call(note, 'freq_of_t')) {
        return false;
    }
    if (!Object.prototype.hasOwnProperty.call(note, 'duration')) {
        return false;
    }

    const buf_size = audio_ctx.sampleRate * note.duration;
    let pulses = new Array(buf_size);
    for (let i = 0; i < buf_size; i++) {
        pulses[i] = Math.sin(i / audio_ctx.sampleRate * 2 * Math.PI * note.freq_of_t(i / audio_ctx.sampleRate));
    }
    return {
        buffer: pulses,
	duration: note.duration
    };
}

const global_variables = {
    "play": new Callable(function (args) {
	let total_buffer = [];
	let total_time = 0;
	for(let i = 0; i < args.length; i++) {
	    let arg = args[i];
            let wave = tryNoteToWave(arg);
	    if (!wave) return new Error("Arg " + i + " is not a note");
	    total_buffer = total_buffer.concat(wave.buffer);
	    total_time += wave.duration;
	}
	let buf_size = audio_ctx.sampleRate * total_time;
	let snd_buffer = audio_ctx.createBuffer(1, buf_size, audio_ctx.sampleRate);
	let b = snd_buffer.getChannelData(0);
	for (let i = 0; i < buf_size; i++) b[i] = total_buffer[i];
	let source = audio_ctx.createBufferSource();
        source.buffer = snd_buffer;
        source.connect(audio_ctx.destination);
        source.start();
        source.stop(total_time);
	return new Result();
    }),
    "note": new Callable(function (args) {
	if (args.length != 2) return new Error("note needs 2 arguments, not the " + args.length + " provided");
	let freq_val = parseFloat(args[0]);
	let dur_val = parseFloat(args[1]);
	if (freq_val === NaN || dur_val === NaN)
	    return new Error("Frequency and duration need be floats");
        let freq_fn = function(t) { return freq_val; };
	return new PureNote(freq_fn, dur_val);
    }),
    "pitch-at": new Callable(function (args) {
	if (args.length != 2) return new Error("pitch-at needs 2 arguments, not the " + args.length + " provided");
	if ((typeof args[0]) != "string" || (args[0].length != 1 && args[0].length != 2)) return new Error("Invalid tone " + args[0]);
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
    }),
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
