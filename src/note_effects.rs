use crate::document;
use crate::evaluator;
use crate::parser;

use std::convert::TryInto;
use std::rc::Rc;

#[derive(Debug, Default)]
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

impl document::Documented for BasicNote {
    fn document(&self) -> document::Documentation {
        document::Documentation::from_rs(
            "note".into(),
            "(note [frequency] [duration])".into(),
            vec!["note".into(), "notes".into()],
            "Creates a note at a given frequency for a given duration".into(),
        )
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

#[derive(Debug, Default)]
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

impl document::Documented for Chord {
    fn document(&self) -> document::Documentation {
        document::Documentation::from_rs(
            "chord".into(),
            "(chord [notes...])".into(),
            vec!["note".into(), "notes".into()],
            "Creates a chord of given notes (plays them in tandem).".into(),
        )
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

#[derive(Debug, Default)]
pub struct NoteSeq {
    notes: Vec<Rc<dyn evaluator::Note>>,
}

impl evaluator::Note for NoteSeq {
    fn duration(&self) -> f32 {
        self.notes.iter().map(|n| n.duration()).sum()
    }

    fn frequency(&self, t: f32) -> Vec<f32> {
        let mut accumulated = 0.0;
        for note in self.notes.iter() {
            if accumulated + note.duration() > t {
                return note.frequency(t - accumulated);
            }
            accumulated += note.duration();
        }
        return vec![0.0];
    }

    fn amplitude(&self, t: f32) -> Vec<f32> {
        let mut accumulated = 0.0;
        for note in self.notes.iter() {
            if accumulated + note.duration() > t {
                return note.amplitude(t - accumulated);
            }
            accumulated += note.duration();
        }
        return vec![0.0];
    }
}

impl document::Documented for NoteSeq {
    fn document(&self) -> document::Documentation {
        document::Documentation::from_rs(
            "note-seq".into(),
            "(note-seq [notes...])".into(),
            vec!["note".into(), "notes".into()],
            "Creates a sequence of notes consecutively.".into(),
        )
    }
}

impl<'a> evaluator::SpecialForm<'a> for NoteSeq {
    fn evaluate(
        &self,
        evaluator: &evaluator::Evaluator<'a>,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<evaluator::MusicLangObject<'a>, evaluator::MusicLangError> {
        let bits = match expr {
            parser::SExpr::Literal(literal) => {
                return Err(evaluator::MusicLangError {
                    message: format!("Expected a call with arguments, not a literal: {}", literal),
                    context: vec!["While evaluating a call to note-seq.".into()],
                })
            }
            parser::SExpr::Expr(bits) => bits,
        };
        Ok(evaluator::MusicLangObject::Note(Rc::new(NoteSeq {
            notes: evaluator
                .eval_note_list(bits.iter().skip(1))
                .map_err(|e| e.in_context("Evaluating arguments to note-seq.".into()))?,
        })))
    }
}

#[derive(Debug)]
pub struct PitchAt;

impl document::Documented for PitchAt {
    fn document(&self) -> document::Documentation {
        document::Documentation::from_rs(
            "pitch-at".into(),
             "(pitch-at [tone] [octave])".into(),
            vec!["frequency".into()],
              "Gets the pitch for a given note. The tones are letters from A through G with # for sharps and b for flats (since key signatures are not used double flats, double sharps, or \"naturals\". An octave must be specified, with (pitch-at C 3) being middle C.".into(),
        )
    }
}

impl<'a> evaluator::SpecialForm<'a> for PitchAt {
    fn evaluate(
        &self,
        evaluator: &evaluator::Evaluator<'a>,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<evaluator::MusicLangObject<'a>, evaluator::MusicLangError> {
        let bits = match expr {
            parser::SExpr::Literal(literal) => {
                return Err(evaluator::MusicLangError {
                    message: format!("Expected a call with arguments, not a literal: {}", literal),
                    context: vec!["While evaluating a call to note-seq.".into()],
                })
            }
            parser::SExpr::Expr(bits) => bits,
        };
        if bits.len() != 3 {
            return Err(evaluator::MusicLangError {
                message: format!("Expected 3 arguments, not {}", bits.len()),
                context: vec!["Evaluating arguments to pitch-at.".into()],
            });
        }
        let inner_literal = match evaluator.evaluate(&bits[1]) {
            Result::Err(e) => {
                return Err(e.in_context("Evaluating the first argument to pitch-at".into()))
            }
            Result::Ok(evaluator::MusicLangObject::Unevaluated(parser::SExpr::Literal(l))) => l,
            Result::Ok(evaluator::MusicLangObject::Unevaluated(expr)) => {
                return Err(evaluator::MusicLangError {
                    message: format!("Expected a literal not the expression {}", expr),
                    context: vec!["Evaluating the first argument to pitch-at".into()],
                })
            }
            Result::Ok(_) => {
                return Err(evaluator::MusicLangError {
                    message: "Expected a literal".into(),
                    context: vec!["Evaluating the first argument to pitch-at".into()],
                })
            }
        };
        if inner_literal.len() < 1 || inner_literal.len() > 2 {
            return Err(evaluator::MusicLangError {
                message: format!("Invalid pitch literal: {}", inner_literal),
                context: vec!["Evaluating the first argument to pitch-at.".into()],
            });
        }
        let mut literal_chars = inner_literal.chars();
        let note: u8 = literal_chars
            .next()
            .unwrap() // We've checked non-emptiness
            .to_ascii_uppercase()
            .try_into()
            .map_err(|_e| evaluator::MusicLangError {
                message: format!("Invalid characters in {}", inner_literal),
                context: vec!["Evaluating the first argument to pitch-at.".into()],
            })?;
        if note < b'A' || note > b'G' {
            return Err(evaluator::MusicLangError {
                message: format!("Invalid note specifier in {}", inner_literal),
                context: vec!["Evaluating the first argument to pitch-at.".into()],
            });
        }
        let tone_number = ((note - b'A') * 2) as i8
            - if note > b'E' {
                2
            } else if note > b'B' {
                1
            } else {
                0
            }
            + match literal_chars.next() {
                None => 0,
                Some('b') => -1,
                Some('#') => 1,
                Some(_) => {
                    return Err(evaluator::MusicLangError {
                        message: format!("Invalid sharp or flat specifier in {}", inner_literal),
                        context: vec!["Evaluating the first argument to pitch-at.".into()],
                    })
                }
            };
        let octave = evaluator.eval_float(&bits[2]).map_err(|e| {
            e.in_context("Evaluating the second (octave) argument to pitch-at".into())
        })?;
        Ok(evaluator::MusicLangObject::Float(
            440.0_f32 * 2.0_f32.powf((tone_number as f32) / 12.0 + octave - 4.0),
        ))
    }
}
