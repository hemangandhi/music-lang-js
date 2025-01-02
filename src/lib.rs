// Core language.
mod evaluator;
mod parser;

// Docs base.
mod document;

// Implementation of bits
mod note_effects;
mod play;

// set_panic_hook
mod utils;

use std::collections::HashMap;
use std::rc::Rc;

use wasm_bindgen::prelude::*;

struct MusicLangModel<'a> {
    globals: Vec<Rc<dyn evaluator::SpecialForm<'a>>>,
}

impl<'a> MusicLangModel<'a> {
    fn make_default_model() -> Result<Self, Vec<String>> {
        Ok(Self {
            globals: vec![
                Rc::new(play::Play),
                Rc::new(note_effects::BasicNote::default()),
                Rc::new(note_effects::Chord::default()),
                Rc::new(note_effects::NoteSeq::default()),
                Rc::new(note_effects::PitchAt),
            ],
        })
    }

    fn get_global_scope(&self) -> HashMap<String, evaluator::MusicLangObject<'a>> {
        self.globals
            .iter()
            .map(|g| {
                (
                    g.document().get_name(),
                    evaluator::MusicLangObject::SpecialForm(g.clone()),
                )
            })
            .collect()
    }
}

#[wasm_bindgen]
pub fn get_docs_table() -> Result<Vec<document::Documentation>, Vec<String>> {
    let model = MusicLangModel::make_default_model()?;
    Ok(model.globals.iter().map(|g| g.document()).collect())
}

#[wasm_bindgen]
pub fn test_run_exec(code: &str) -> Result<(), Vec<String>> {
    let parsed = parser::SExpr::parse(code)?;
    let model = MusicLangModel::make_default_model()?;
    let evaluator = evaluator::Evaluator {
        parent_eval: None,
        current_scope: model.get_global_scope(),
    };
    evaluator.evaluate(&parsed).map_err(|e| {
        let mut v = vec![e.message];
        v.extend(e.context);
        v
    })?;
    Ok(())
}
