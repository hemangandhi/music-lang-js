mod utils;
mod parser;
mod evaluator;
mod note_effects;
mod play;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, music-lang-js!");
}
