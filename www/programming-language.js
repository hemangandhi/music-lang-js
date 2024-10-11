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
