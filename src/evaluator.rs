use crate::parser;

use std::collections::HashMap;
use std::fmt;
use std::rc::Rc;

pub trait Note {
    fn duration(&self) -> f64;

    fn frequency(&self, t: f64) -> Vec<f64>;

    fn amplitude(&self, t: f64) -> Vec<f64>;
}

pub trait SpecialForm<'a> {
    fn evaluate(
        &self,
        evaluator: &'a Evaluator<'a>,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<MusicLangObject<'a>, MusicLangError>;
}

#[derive(Clone)]
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

    pub fn evaluate(
        &'a self,
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
