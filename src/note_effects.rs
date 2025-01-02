use crate::document;
use crate::evaluator;
use crate::parser;

use std::convert::TryInto;
use std::rc::Rc;

fn get_expr<'a>(
    expr: &'a parser::SExpr<'a>,
) -> Result<&'a Vec<parser::SExpr<'a>>, evaluator::MusicLangError> {
    match expr {
        parser::SExpr::Literal(literal) => Err(evaluator::MusicLangError {
            message: format!("Expected a call with arguments, not a literal: {}", literal),
            context: vec![],
        }),
        parser::SExpr::Expr(bits) => Ok(bits),
    }
}

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
        let bits = get_expr(expr).map_err(|e| e.in_context("Evaluating note.".into()))?;
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
        let bits = get_expr(expr).map_err(|e| e.in_context("Evaluating chord.".into()))?;
        Ok(evaluator::MusicLangObject::Note(Rc::new(Chord {
            notes: evaluator
                .eval_note_list(bits.iter().skip(1))
                .map_err(|e| e.in_context("Evaluating arguments to chord.".into()))?,
        })))
    }
}

fn get_note_in_sequence_at_t(
    notes: &Vec<Rc<dyn evaluator::Note>>,
    t: f32,
) -> Option<(&Rc<dyn evaluator::Note>, f32)> {
    let mut accumulated = 0.0;
    for note in notes.iter() {
        if accumulated + note.duration() > t {
            return Some((note, t - accumulated));
        }
        accumulated += note.duration();
    }
    None
}

#[derive(Debug, Default)]
pub struct NoteSeq {
    notes: Vec<Rc<dyn evaluator::Note>>,
}

impl<'a> NoteSeq {
    fn from_bits(
        bits: impl Iterator<Item = &'a parser::SExpr<'a>>,
        evaluator: &evaluator::Evaluator<'a>,
    ) -> Result<NoteSeq, evaluator::MusicLangError> {
        Ok(NoteSeq {
            notes: evaluator
                .eval_note_list(bits)
                .map_err(|e| e.in_context("Evaluating arguments to note-seq.".into()))?,
        })
    }
}

impl evaluator::Note for NoteSeq {
    fn duration(&self) -> f32 {
        self.notes.iter().map(|n| n.duration()).sum()
    }

    fn frequency(&self, t: f32) -> Vec<f32> {
        get_note_in_sequence_at_t(&self.notes, t)
            .map(|(n, tt)| n.frequency(tt))
            .unwrap_or(vec![0.0])
    }

    fn amplitude(&self, t: f32) -> Vec<f32> {
        get_note_in_sequence_at_t(&self.notes, t)
            .map(|(n, tt)| n.amplitude(tt))
            .unwrap_or(vec![0.0])
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
        let bits = get_expr(expr).map_err(|e| e.in_context("Evaluating note-seq".into()))?;
        Ok(evaluator::MusicLangObject::Note(Rc::new(
            NoteSeq::from_bits(bits.iter().skip(1), evaluator)?,
        )))
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
        let bits = get_expr(expr).map_err(|e| e.in_context("Evaluating pitch-at.".into()))?;
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

#[derive(Debug, Default)]
pub struct WithADSR {
    max_attack: f32,
    decay_start: f32,
    sustain_start: f32,
    sustain_volume: f32,
    release_start: f32,
    notes: NoteSeq,
}

impl evaluator::Note for WithADSR {
    fn duration(&self) -> f32 {
        self.notes.duration()
    }

    fn frequency(&self, t: f32) -> Vec<f32> {
        self.notes.frequency(t)
    }

    fn amplitude(&self, t: f32) -> Vec<f32> {
        let ratio = t / self.duration();
        let scaling = if ratio < self.decay_start {
            ratio * self.max_attack / self.decay_start
        } else if ratio < self.sustain_start {
            let slope =
                (self.sustain_volume - self.max_attack) / (self.sustain_start - self.decay_start);
            slope * (ratio - self.decay_start) + self.max_attack
        } else if ratio < self.release_start {
            self.sustain_volume
        } else {
            let slope = self.sustain_volume / (self.release_start - 1.0);
            slope * (ratio - self.release_start) + self.sustain_volume
        };
        self.notes
            .amplitude(t)
            .iter()
            .map(|amp| amp * scaling)
            .collect()
    }
}

impl document::Documented for WithADSR {
    fn document(&self) -> document::Documentation {
        document::Documentation::from_rs(
            "with-adsr".into(),
             "(with-adsr [a-volume-max] [d-start-time] [s-start-time] [s-volume] [r-start-time] [note])".into(),
            vec!["note".into(), "notes".into()],
              "Wraps a note in an ADSR envelope. The timings are represented relative to the duration of the note and volume scaling the volume of the note.".into(),
        )
    }
}

impl<'a> evaluator::SpecialForm<'a> for WithADSR {
    fn evaluate(
        &self,
        evaluator: &evaluator::Evaluator<'a>,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<evaluator::MusicLangObject<'a>, evaluator::MusicLangError> {
        let bits = get_expr(expr).map_err(|e| e.in_context("Evaluating with-adsr".into()))?;
        if bits.len() < 6 {
            return Err(evaluator::MusicLangError {
                message: format!("Expected 6 or more arguments instead of {}", bits.len()),
                context: vec!["Evaluating with-adsr".into()],
            });
        }
        let max_attack = evaluator
            .eval_float(&bits[1])
            .map_err(|e| e.in_context("Evaluating the first argument to with-adsr".into()))?;
        let decay_start = evaluator
            .eval_float(&bits[2])
            .map_err(|e| e.in_context("Evaluating the second argument to with-adsr".into()))?;
        let sustain_start = evaluator
            .eval_float(&bits[3])
            .map_err(|e| e.in_context("Evaluating the third argument to with-adsr".into()))?;
        let sustain_volume = evaluator
            .eval_float(&bits[4])
            .map_err(|e| e.in_context("Evaluating the fourth argument to with-adsr".into()))?;
        let release_start = evaluator
            .eval_float(&bits[5])
            .map_err(|e| e.in_context("Evaluating the fifth argument to with-adsr".into()))?;
        let notes = NoteSeq::from_bits(bits.iter().skip(6), evaluator)
            .map_err(|e| e.in_context("Evaluating the trailing arguments to with-adsr".into()))?;
        Ok(evaluator::MusicLangObject::SpecialForm(Rc::new(Self {
            max_attack,
            decay_start,
            sustain_start,
            sustain_volume,
            release_start,
            notes,
        })))
    }
}

#[derive(Debug, Default)]
pub struct WithBPM {
    bpm: f32,
    notes: NoteSeq,
}

impl evaluator::Note for WithBPM {
    fn duration(&self) -> f32 {
        self.notes.duration() * 60.0 / self.bpm
    }

    fn frequency(&self, t: f32) -> Vec<f32> {
        self.notes.frequency(t * 60.0 / self.bpm)
    }

    fn amplitude(&self, t: f32) -> Vec<f32> {
        self.notes.amplitude(t * 60.0 / self.bpm)
    }
}

impl document::Documented for WithBPM {
    fn document(&self) -> document::Documentation {
        document::Documentation::from_rs(
            "with-bpm".into(),
             "(with-bpm [bpm] [notes...])".into(),
            vec!["note".into(), "notes".into()],
              "Shifts the time to be measured at the given beats per minute (default is 60). The notes are played in sequence (so (with-bpm b (note-seq notes...))) is the same as (with-bpm b notes...).".into(),
        )
    }
}

impl<'a> evaluator::SpecialForm<'a> for WithBPM {
    fn evaluate(
        &self,
        evaluator: &evaluator::Evaluator<'a>,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<evaluator::MusicLangObject<'a>, evaluator::MusicLangError> {
        let bits = get_expr(expr).map_err(|e| e.in_context("Evaluating with-bpm".into()))?;
        if bits.len() < 2 {
            return Err(evaluator::MusicLangError {
                message: format!("Expected 2 or more arguments instead of {}", bits.len()),
                context: vec!["Evaluating with-bpm".into()],
            });
        }
        let bpm = evaluator
            .eval_float(&bits[1])
            .map_err(|e| e.in_context("Evaluating the first argument to with-bpm".into()))?;
        let notes = NoteSeq::from_bits(bits.iter().skip(2), evaluator)
            .map_err(|e| e.in_context("Evaluating the trailing arguments to with-bpm".into()))?;
        Ok(evaluator::MusicLangObject::SpecialForm(Rc::new(Self {
            bpm,
            notes,
        })))
    }
}

#[derive(Debug, Default)]
pub struct Vibrato {
    pitch_change: f32,
    num_peaks: f32,
    notes: NoteSeq,
}

impl evaluator::Note for Vibrato {
    fn duration(&self) -> f32 {
        self.notes.duration()
    }

    fn frequency(&self, t: f32) -> Vec<f32> {
        self.notes
            .frequency(t)
            .iter()
            .map(|f| {
                f + (t * self.num_peaks * 2.0 * std::f32::consts::PI).cos() * self.pitch_change
            })
            .collect()
    }

    fn amplitude(&self, t: f32) -> Vec<f32> {
        self.notes.amplitude(t)
    }
}

impl document::Documented for Vibrato {
    fn document(&self) -> document::Documentation {
        document::Documentation::from_rs(
            "vibrato".into(),
             "(vibrato [pitch-change] [num-peaks] [note])".into(),
            vec!["note".into(), "notes".into()],
              "An oscillation of pitch that varies by the change, hitting the highest peak the provided number of times.".into(),
        )
    }
}

impl<'a> evaluator::SpecialForm<'a> for Vibrato {
    fn evaluate(
        &self,
        evaluator: &evaluator::Evaluator<'a>,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<evaluator::MusicLangObject<'a>, evaluator::MusicLangError> {
        let bits = get_expr(expr).map_err(|e| e.in_context("Evaluating vibrato".into()))?;
        if bits.len() < 3 {
            return Err(evaluator::MusicLangError {
                message: format!("Expected 3 or more arguments instead of {}", bits.len()),
                context: vec!["Evaluating vibrato".into()],
            });
        }
        let pitch_change = evaluator
            .eval_float(&bits[1])
            .map_err(|e| e.in_context("Evaluating the first argument to vibrato".into()))?;
        let num_peaks = evaluator
            .eval_float(&bits[1])
            .map_err(|e| e.in_context("Evaluating the second argument to vibrato".into()))?;
        let notes = NoteSeq::from_bits(bits.iter().skip(3), evaluator)
            .map_err(|e| e.in_context("Evaluating the trailing arguments to vibrato".into()))?;
        Ok(evaluator::MusicLangObject::SpecialForm(Rc::new(Self {
            pitch_change,
            num_peaks,
            notes,
        })))
    }
}
