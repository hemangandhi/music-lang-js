mod evaluator;
mod note_effects;
mod parser;
mod play;
mod utils;

use std::collections::HashMap;
use std::rc::Rc;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use web_sys::AudioBufferSourceNode;
use web_sys::AudioContext;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, music-lang-js!");
}

// TODO: implement. Decide what the actual abstraction for making the PL is?
// Should the structure of the language be output to JS or just write to the DOM?
#[wasm_bindgen]
pub fn run_music_lang_code(
    code: &str,
    audio_ctx: AudioContext,
) -> Result<AudioBufferSourceNode, JsValue> {
    let parsed = parser::SExpr::parse(code);
    let evaluator = evaluator::Evaluator {
        parent_eval: None,
        current_scope: HashMap::from([]),
    };
    todo!("Implement the rest of this!")
}

#[wasm_bindgen]
pub fn test_run_exec(code: &str) {
    let parsed = parser::SExpr::parse(code).expect("Why it no parse?");
    let evaluator = evaluator::Evaluator {
        parent_eval: None,
        current_scope: HashMap::from([
            (
                "play",
                evaluator::MusicLangObject::SpecialForm(Rc::new(play::Play(
                    web_sys::AudioContext::new().expect("Couldn't make audio ctx"),
                ))),
            ),
            (
                "note",
                evaluator::MusicLangObject::SpecialForm(
                    Rc::new(note_effects::BasicNote::default()),
                ),
            ),
        ]),
    };
    evaluator.evaluate(&parsed).expect("Why it not eval?");
}
