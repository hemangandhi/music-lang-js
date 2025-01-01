use crate::parser;
use crate::document;

use std::collections::HashMap;
use std::fmt;
use std::rc::Rc;

trait FlatMapResults<T, U, E> {
    fn flat_map_results(
        self,
        f: impl FnMut(T) -> Result<Vec<U>, E>,
    ) -> impl Iterator<Item = Result<U, E>>;
}

impl<I, T, U, E> FlatMapResults<T, U, E> for I
where
    I: Iterator<Item = T> + Sized,
{
    fn flat_map_results(
        self,
        f: impl FnMut(T) -> Result<Vec<U>, E>,
    ) -> impl Iterator<Item = Result<U, E>> {
        self.map(f).flat_map(|res| match res {
            Result::Ok(ts) => ts.into_iter().map(Result::Ok).collect(),
            Result::Err(issue) => vec![Err(issue)],
        })
    }
}

pub trait Note: std::fmt::Debug {
    fn duration(&self) -> f32;

    fn frequency(&self, t: f32) -> Vec<f32>;

    fn amplitude(&self, t: f32) -> Vec<f32>;
}

// NOTE: we insist on Documented here so that we can make a common global
// list of all the global special forms. This is either actually not a bad idea,
// or too-tight a coupling, and we should keep documentation and the special form
// separate.
// The issue with separating them now is the common global lists needs dyn Global
// for Global : Documented + SpecialForm, but then putting a Global in scope needs
// an upcast, which Rust doesn't have at the time of writing (2025-1-1).
pub trait SpecialForm<'a>: std::fmt::Debug + document::Documented {
    fn evaluate(
        // NOTE: this self param is useful for callables who'll have their params known at
        // run-time. Most other implementations don't use &self.
        &self,
        evaluator: &Evaluator<'a>,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<MusicLangObject<'a>, MusicLangError>;
}

#[derive(Clone, Debug)]
pub enum MusicLangObject<'a> {
    Unevaluated(&'a parser::SExpr<'a>),
    Float(f32),
    // This is sort of a thorn in making the Clone: but it's a hack for map, so it's ok?
    List(Vec<MusicLangObject<'a>>),
    SpecialForm(Rc<dyn SpecialForm<'a>>),
    Note(Rc<dyn Note>),
    Wave,
}

// Would be nice to impl try to add the context here.
#[derive(Debug)]
pub struct MusicLangError {
    pub message: String,
    pub context: Vec<String>,
}

impl MusicLangError {
    pub fn in_context(mut self, new_context: String) -> Self {
        self.context.push(new_context);
        MusicLangError {
            message: self.message,
            context: self.context,
        }
    }
}

impl<'a> MusicLangObject<'a> {
    fn get_note_list(&self) -> Result<Vec<Rc<dyn Note>>, MusicLangError> {
        match self {
            MusicLangObject::Note(n) => Ok(vec![n.clone()]),
            MusicLangObject::List(l) => l
                .iter()
                .flat_map_results(|o| o.get_note_list())
                .collect::<Result<Vec<Rc<dyn Note>>, MusicLangError>>(),
            _ => Err(MusicLangError {
                message: "Expected to find only notes".into(),
                context: vec![],
            }),
        }
    }
}

impl fmt::Display for MusicLangError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "Error! {}
    - {}",
            self.message,
            self.context.join("\n    -")
        )
    }
}

pub struct Evaluator<'a> {
    pub parent_eval: Option<&'a Evaluator<'a>>,
    pub current_scope: HashMap<String, MusicLangObject<'a>>,
}

impl<'a> Evaluator<'a> {
    fn scope_lookup(&self, item: &str) -> Option<MusicLangObject<'a>> {
        if let Some(current_scope_value) = self.current_scope.get(item) {
            return Some(current_scope_value.clone());
        }
        self.parent_eval.and_then(|p| p.scope_lookup(item))
    }

    // NOTE: we seem to need 'a > '1 (the implicit lifetime of &self).
    // Perhaps this is ok -- since 'a is really about the life of the input that was parsed.
    pub fn evaluate(
        &self,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<MusicLangObject<'a>, MusicLangError> {
        match expr {
            parser::SExpr::Expr(bits) => {
                if bits.len() > 0 {
                    match self.evaluate(&bits[0]) {
                        Result::Err(error) => {
                            return Err(error.in_context(format!("In expression {}", expr)));
                        }
                        Result::Ok(MusicLangObject::SpecialForm(callable)) => {
                            return callable.evaluate(self, expr)
                        }
                        Result::Ok(_) => {
                            return Err(MusicLangError {
                                message: "First expression value is not callable!".into(),
                                context: vec![
                                    format!("Evaluating {}", bits[0]),
                                    format!("In expression {}", expr),
                                ],
                            });
                        }
                    }
                }
                return Err(MusicLangError {
                    message: "Reached meaningless empty expression!".into(),
                    context: vec![format!("Evaluating {}", expr)],
                });
            }
            parser::SExpr::Literal(literal) => {
                if let Some(scope_obj) = self.scope_lookup(literal) {
                    return Ok(scope_obj);
                }
                if let Ok(f) = literal.parse::<f32>() {
                    return Ok(MusicLangObject::Float(f));
                }
                return Ok(MusicLangObject::Unevaluated(expr));
            }
        }
    }

    pub fn eval_float(&self, expr: &'a parser::SExpr) -> Result<f32, MusicLangError> {
        match self.evaluate(expr) {
            Result::Err(error) => Err(error.in_context(format!("Expecting a float from {}", expr))),
            Result::Ok(MusicLangObject::Float(f)) => Ok(f),
            Result::Ok(_obj) => Err(MusicLangError {
                message: "Expected to get a float".into(),
                context: vec![format!("While evaluating {}", expr)],
            }),
        }
    }

    pub fn eval_note_list(
        &self,
        bits: impl Iterator<Item = &'a parser::SExpr<'a>>,
    ) -> Result<Vec<Rc<dyn Note>>, MusicLangError> {
        bits.map(|bit| self.evaluate(bit))
            .flat_map_results(|r| r.and_then(|obj| obj.get_note_list()))
            .collect::<Result<Vec<Rc<dyn Note>>, MusicLangError>>()
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn test_basic_eval_empty_scope() {
        let parsed_literal = parser::SExpr::parse("1.72").expect("Couldn't parse 1.72");
        let empty_eval = Evaluator {
            parent_eval: None,
            current_scope: HashMap::new(),
        };
        let evaled = empty_eval.evaluate(&parsed_literal).unwrap();
        if let MusicLangObject::Float(f) = evaled {
            assert!(
                1.72 - f32::EPSILON < f && f < 1.72 + f32::EPSILON,
                "{} is not close enough to 1.72",
                f
            );
        } else {
            assert!(false, "Expected a float, got {:#?} instead.", evaled);
        }
    }

    #[test]
    fn test_basic_eval_and_scope() {
        let parsed_literal = parser::SExpr::parse("1.72").expect("Couldn't parse 1.72");
        let parsed_pi = parser::SExpr::parse("PI").expect("Couldn't parse PI");
        let parsed_pi_getting_called = parser::SExpr::parse("(PI)").expect("Couldn't parse (PI)");
        let empty_eval = Evaluator {
            parent_eval: None,
            current_scope: HashMap::from([("PI", MusicLangObject::Float(3.14))]),
        };
        let evaled = empty_eval.evaluate(&parsed_literal).unwrap();
        if let MusicLangObject::Float(f) = evaled {
            assert!(
                1.72 - f32::EPSILON < f && f < 1.72 + f32::EPSILON,
                "{} is not close enough to 1.72",
                f
            );
        } else {
            assert!(false, "Expected a float, got {:#?} instead.", evaled);
        }
        let evaled = empty_eval.evaluate(&parsed_pi).unwrap();
        if let MusicLangObject::Float(f) = evaled {
            assert!(
                3.14 - f32::EPSILON < f && f < 3.14 + f32::EPSILON,
                "{} is not close enough to 3.14",
                f
            );
        } else {
            assert!(false, "Expected a float, got {:#?} instead.", evaled);
        }
        let evaled = empty_eval.evaluate(&parsed_pi_getting_called);
        assert!(evaled.is_err());
    }

    #[test]
    fn test_basic_eval_and_scope_via_eval_float() {
        let parsed_literal = parser::SExpr::parse("1.72").expect("Couldn't parse 1.72");
        let parsed_pi = parser::SExpr::parse("PI").expect("Couldn't parse PI");
        let parsed_pi_getting_called = parser::SExpr::parse("(PI)").expect("Couldn't parse (PI)");
        let empty_eval = Evaluator {
            parent_eval: None,
            current_scope: HashMap::from([("PI", MusicLangObject::Float(3.14))]),
        };
        let evaled = empty_eval.eval_float(&parsed_literal).unwrap();
        assert!(1.72 - f32::EPSILON < evaled && evaled < 1.72 + f32::EPSILON);
        let evaled = empty_eval.eval_float(&parsed_pi).unwrap();
        assert!(3.14 - f32::EPSILON < evaled && evaled < 3.14 + f32::EPSILON);
        let evaled = empty_eval.eval_float(&parsed_pi_getting_called);
        assert!(evaled.is_err());
    }
}
