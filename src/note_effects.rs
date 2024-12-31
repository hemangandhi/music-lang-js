use crate::evaluator;
use crate::parser;

use std::rc::Rc;

#[derive(Debug)]
pub struct BasicNote {
    frequency: f64,
    duration: f64,
}

impl evaluator::Note for BasicNote {
    fn duration(&self) -> f64 {
        self.duration
    }

    fn frequency(&self, _t: f64) -> Vec<f64> {
        vec![self.frequency]
    }

    fn amplitude(&self, _t: f64) -> Vec<f64> {
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
        let frequency = match evaluator.eval_float(&bits[1]) {
            Result::Err(error) => {
                return Err(
                    error.in_context("While evaluating the frequency parameter of a note".into())
                )
            }
            Result::Ok(f) => f,
        };
        let duration = match evaluator.eval_float(&bits[1]) {
            Result::Err(error) => {
                return Err(
                    error.in_context("While evaluating the duration parameter of a note".into())
                )
            }
            Result::Ok(f) => f,
        };
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
    fn duration(&self) -> f64 {
        self.notes
            .iter()
            .map(|n| n.duration())
            .max_by(|d1, d2| d1.total_cmp(d2))
            .unwrap_or(0.0)
    }

    fn frequency(&self, t: f64) -> Vec<f64> {
        self.notes.iter().flat_map(|n| n.frequency(t)).collect()
    }

    fn amplitude(&self, t: f64) -> Vec<f64> {
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
            notes: bits
                .iter()
                .skip(1) // bits[0] evaled to "chord"
                .map(|bit| match evaluator.evaluate(bit) {
                    Result::Err(e) => Err(e.in_context("Evaluating arguments to chord".into())),
                    Result::Ok(evaluator::MusicLangObject::Note(n)) => Ok(n),
                    Result::Ok(_) => Err(evaluator::MusicLangError {
                        message: format!("Expected {} to parse to a note", bit),
                        context: vec!["Evaluating arguments to chord.".into()],
                    }),
                })
                .collect::<Result<Vec<Rc<dyn evaluator::Note>>, evaluator::MusicLangError>>()?,
        })))
    }
}
