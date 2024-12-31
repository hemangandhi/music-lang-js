use crate::evaluator;
use crate::parser;

use std::ops::Deref;
use std::rc::Rc;
use wasm_bindgen::JsValue;
use web_sys::AudioContext;

fn compute_wave_for_note(note: &dyn evaluator::Note, sample_rate: f32) -> Vec<f32> {
    let duration = note.duration();
    (0..(duration * sample_rate + 1.0) as i64)
        .map(|i| {
            let t = (i as f32) / duration;
            let ampls = note.amplitude(t);
            let freqs = note.frequency(t);
            freqs
                .iter()
                .zip(ampls)
                .map(|(f, a)| (f * std::f32::consts::PI * 2.0 * t).sin() * a)
                .sum()
        })
        .collect()
}

fn compute_wave_for_notes(notes: &Vec<Rc<dyn evaluator::Note>>, sample_rate: f32) -> Vec<f32> {
    notes
        .iter()
        .flat_map(|n| compute_wave_for_note(&**n, sample_rate))
        .collect()
}

fn js_value_to_error(e: JsValue) -> evaluator::MusicLangError {
    evaluator::MusicLangError {
        message: format!("Unexpected js value: {:?}", e),
        context: vec!["While evaluating play.".into()],
    }
}

#[derive(Debug)]
pub struct Play(AudioContext);

impl<'a> evaluator::SpecialForm<'a> for Play {
    fn evaluate(
        &self,
        evaluator: &evaluator::Evaluator<'a>,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<evaluator::MusicLangObject<'a>, evaluator::MusicLangError> {
        let notes = match expr {
            parser::SExpr::Literal(l) => {
                return Err(evaluator::MusicLangError {
                    message: format!("Unexpected literal {}", l),
                    context: vec!["Evaluating play".into()],
                })
            }
            parser::SExpr::Expr(e) => evaluator
                .eval_note_list(e.iter().skip(1))
                .map_err(|e| e.in_context("Evaluating play".into()))?,
        };
        let wave = compute_wave_for_notes(&notes, self.0.sample_rate());
        let buffer = self
            .0
            .create_buffer(1, wave.len() as u32, self.0.sample_rate())
            .map_err(js_value_to_error)?;
        buffer
            .copy_to_channel(wave.as_slice(), 0)
            .map_err(js_value_to_error)?;
        let source = self
            .0
            .create_buffer_source()
            .and_then(|source| {
                source.set_buffer(Some(&buffer));
                source.connect_with_audio_node(self.0.destination().deref())?;
                Ok(source)
            })
            .map_err(js_value_to_error)?;
        Ok(evaluator::MusicLangObject::Wave(
            source,
            self.0.sample_rate() * (wave.len() as f32),
        ))
    }
}
