use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Documentation {
    name: String,
    snippet: String,
    snippet_targets: Vec<String>,
    details: String
}

#[wasm_bindgen]
impl Documentation {
    pub fn get_name(&self) -> String {
        self.name.clone()
    }

    pub fn get_snippet(&self) -> String {
        self.snippet.clone()
    }

    pub fn get_snippet_targets(&self) -> Vec<String> {
        self.snippet_targets.clone()
    }

    pub fn get_details(&self) -> String {
        self.details.clone()
    }
}

impl Documentation {
    pub fn from_rs(name: String, snippet: String, snippet_targets: Vec<String>, details: String) -> Self {
        Self {
            name, snippet, snippet_targets, details
        }
    }
}

pub trait Documented {
    fn document(&self) -> Documentation;
}
