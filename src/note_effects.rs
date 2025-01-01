use crate::evaluator;
use crate::parser;

use std::rc::Rc;

#[derive(Debug)]
pub struct BasicNote {
    frequency: f32,
    duration: f32,
}

impl evaluator::Note for BasicNote {
    fn duration(&self) -> f32 {
        self.duration
    }

    fn frequency(&self, _t: f32) -> Vec<f32> {
        vec![self.frequency]
    }

    fn amplitude(&self, _t: f32) -> Vec<f32> {
        vec![1.0]
    }
}

impl<'a> evaluator::SpecialForm<'a> for BasicNote {
    fn evaluate(
        &self,
        evaluator: &evaluator::Evaluator<'a>,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<evaluator::MusicLangObject<'a>, evaluator::MusicLangError> {
        let bits = match expr {
            parser::SExpr::Literal(literal) => {
                return Err(evaluator::MusicLangError {
                    message: format!("Expected a call with arguments, not a literal: {}", literal),
                    context: vec!["While evaluating a call to note.".into()],
                })
            }
            parser::SExpr::Expr(bits) => bits,
        };
        if bits.len() != 3 {
            return Err(evaluator::MusicLangError {
                message: format!("Expected 3 arguments, not {}", bits.len()),
                context: vec!["Evaluating arguments to note.".into()],
            });
        }
        let frequency = evaluator.eval_float(&bits[1]).map_err(|error| {
            error.in_context("While evaluating the frequency parameter of a note".into())
        })?;
        let duration = evaluator.eval_float(&bits[2]).map_err(|error| {
            error.in_context("While evaluating the duration parameter of a note".into())
        })?;
        Ok(evaluator::MusicLangObject::Note(Rc::new(BasicNote {
            frequency,
            duration,
        })))
    }
}

#[derive(Debug)]
pub struct Chord {
    notes: Vec<Rc<dyn evaluator::Note>>,
}

impl evaluator::Note for Chord {
    fn duration(&self) -> f32 {
        self.notes
            .iter()
            .map(|n| n.duration())
            .max_by(|d1, d2| d1.total_cmp(d2))
            .unwrap_or(0.0)
    }

    fn frequency(&self, t: f32) -> Vec<f32> {
        self.notes.iter().flat_map(|n| n.frequency(t)).collect()
    }

    fn amplitude(&self, t: f32) -> Vec<f32> {
        self.notes.iter().flat_map(|n| n.amplitude(t)).collect()
    }
}

impl<'a> evaluator::SpecialForm<'a> for Chord {
    fn evaluate(
        &self,
        evaluator: &evaluator::Evaluator<'a>,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<evaluator::MusicLangObject<'a>, evaluator::MusicLangError> {
        let bits = match expr {
            parser::SExpr::Literal(literal) => {
                return Err(evaluator::MusicLangError {
                    message: format!("Expected a call with arguments, not a literal: {}", literal),
                    context: vec!["While evaluating a call to chord.".into()],
                })
            }
            parser::SExpr::Expr(bits) => bits,
        };
        Ok(evaluator::MusicLangObject::Note(Rc::new(Chord {
            notes: evaluator
                .eval_note_list(bits.iter().skip(1))
                .map_err(|e| e.in_context("Evaluating arguments to chord.".into()))?,
        })))
    }
}
