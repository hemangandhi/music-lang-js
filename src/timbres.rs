use crate::document;
use crate::evaluator;
use crate::note_effects;
use crate::parser;

#[derive(Debug, Default)]
pub struct WithOvertones {
    frequencies: Vec<f32>,
    amplitudes: Vec<f32>,
    notes: note_effects::NoteSeq,
}

impl evaluator::Note for WithOvertones {
    fn duration(&self) -> f32 {
        self.notes.duration()
    }

    fn frequency(&self, t: f32) -> Vec<f32> {
        self.notes
            .frequency(t)
            .iter()
            .flat_map(|f| self.frequencies.iter().map(move |s| s * f))
            .collect()
    }

    fn amplitude(&self, t: f32) -> Vec<f32> {
        self.notes
            .amplitude(t)
            .iter()
            .flat_map(|f| self.amplitudes.iter().map(move |s| s * f))
            .collect()
    }
}
