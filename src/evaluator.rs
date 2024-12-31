use crate::parser;

use std::collections::HashMap;
use std::fmt;
use std::rc::Rc;

pub trait Note: std::fmt::Debug {
    fn duration(&self) -> f64;

    fn frequency(&self, t: f64) -> Vec<f64>;

    fn amplitude(&self, t: f64) -> Vec<f64>;
}

pub trait SpecialForm<'a>: std::fmt::Debug {
    fn evaluate(
        &self,
        evaluator: &Evaluator<'a>,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<MusicLangObject<'a>, MusicLangError>;
}

#[derive(Clone, Debug)]
pub enum MusicLangObject<'a> {
    Unevaluated(&'a parser::SExpr<'a>),
    Float(f64),
    // This is sort of a thorn in making the Clone: but it's a hack for map, so it's ok?
    List(Vec<MusicLangObject<'a>>),
    SpecialForm(Rc<dyn SpecialForm<'a>>),
    Note(Rc<dyn Note>),
}

// Would be nice to impl try to add the context here.
#[derive(Debug)]
pub struct MusicLangError {
    message: String,
    context: Vec<String>,
}

impl MusicLangError {
    fn in_context(mut self, new_context: String) -> Self {
        self.context.push(new_context);
        MusicLangError {
            message: self.message,
            context: self.context,
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
    parent_eval: Option<&'a Evaluator<'a>>,
    current_scope: HashMap<&'a str, MusicLangObject<'a>>,
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
                        Result::Ok(music_lang_object) => {
                            if let MusicLangObject::SpecialForm(callable) = music_lang_object {
                                return callable.evaluate(self, expr);
                            } else {
                                return Err(MusicLangError {
                                    message: "First expression value is not callable!".into(),
                                    context: vec![
                                        format!("Evaluating {}", bits[0]),
                                        format!("In expression {}", expr),
                                    ],
                                });
                            }
                        }
                        Result::Err(error) => {
                            return Err(error.in_context(format!("In expression {}", expr)));
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
                if let Ok(f) = literal.parse::<f64>() {
                    return Ok(MusicLangObject::Float(f));
                }
                return Ok(MusicLangObject::Unevaluated(expr));
            }
        }
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    const FLOAT_EPSILON: f64 = 1E-7;

    #[test]
    fn test_basic_eval_empty_scope() {
        let parsed_literal = parser::SExpr::parse("1.72").expect("Couldn't parse 1.72");
        let empty_eval = Evaluator {
            parent_eval: None,
            current_scope: HashMap::new(),
        };
        let evaled = empty_eval.evaluate(&parsed_literal).unwrap();
        if let MusicLangObject::Float(f) = evaled {
            assert!(1.72 - FLOAT_EPSILON < f && f < 1.72 + FLOAT_EPSILON);
        } else {
            assert!(false, "Expected a float, got {:#?} instead.", evaled);
        }
    }

    #[test]
    fn test_basic_eval_and_scope() {
        let parsed_literal = parser::SExpr::parse("1.72").expect("Couldn't parse 1.72");
        let parsed_pi = parser::SExpr::parse("PI").expect("Couldn't parse PI");
        let empty_eval = Evaluator {
            parent_eval: None,
            current_scope: HashMap::from([("PI", MusicLangObject::Float(3.14))]),
        };
        let evaled = empty_eval.evaluate(&parsed_literal).unwrap();
        if let MusicLangObject::Float(f) = evaled {
            assert!(1.72 - FLOAT_EPSILON < f && f < 1.72 + FLOAT_EPSILON);
        } else {
            assert!(false, "Expected a float, got {:#?} instead.", evaled);
        }
        let evaled = empty_eval.evaluate(&parsed_pi).unwrap();
        if let MusicLangObject::Float(f) = evaled {
            assert!(3.14 - FLOAT_EPSILON < f && f < 3.14 + FLOAT_EPSILON);
        } else {
            assert!(false, "Expected a float, got {:#?} instead.", evaled);
        }
    }
}
