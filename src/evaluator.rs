use crate::parser;

use std::collections::HashMap;

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

pub enum MusicLangObject<'a> {
    Unevaluated(&'a parser::SExpr<'a>),
    Float(f64),
    List(Vec<MusicLangObject<'a>>),
    SpecialForm(Box<dyn SpecialForm<'a>>),
    Note(Box<dyn Note>),
}

pub struct MusicLangError {
    message: String,
    context: Vec<String>,
}

pub struct Evaluator<'a> {
    parent_eval: Option<&'a Evaluator<'a>>,
    current_scope: HashMap<&'a str, MusicLangObject<'a>>,
}

impl<'a> Evaluator<'a> {
    pub fn evaluate(
        &'a self,
        expr: &'a parser::SExpr<'a>,
    ) -> Result<MusicLangObject<'a>, MusicLangError> {
        // TODO: impl
        if let parser::SExpr::Expr(bits) = expr {
            if bits.len() > 0 {
                if let MusicLangObject::SpecialForm(callable )= self.evaluate(&bits[0])? {
                    return callable.evaluate(self, expr);
                }
            }
        }
        Ok(MusicLangObject::Unevaluated(expr))
    }
}
