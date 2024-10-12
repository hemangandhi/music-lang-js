use std::fmt;

// NOTE: really, everything will be views into the same string.
enum SExpr<'a> {
    Literal(&'a str),
    Expr(Vec<SExpr<'a>>),
}

fn consume_chars(input: &str, predicate: impl Fn(&char) -> bool) -> usize {
    input
        .chars()
        .enumerate()
        .skip_while(|(_index, value)| predicate(value))
        .next()
        .map(|p| p.0)
        .unwrap_or(
            // If anything matched and we skipped everything, everything matched.
            if input.chars().next().map(|c| predicate(&c)).unwrap_or(false) {
                input.len()
            } else {
                0
            },
        )
}

fn is_music_lang_literal(c: &char) -> bool {
    !c.is_whitespace() && *c != '(' && *c != ')'
}

impl<'a> SExpr<'a> {
    fn parse_expr(input: &'a str) -> Result<(Vec<Self>, usize), Vec<String>> {
        let mut idx = 0;
        let mut inner_vec = vec![];
        while idx < input.len() {
            if &input[idx..idx + 1] == "(" {
                let (sub, increment) = Self::parse_expr(&input[idx + 1..])?;
                inner_vec.push(SExpr::Expr(sub));
                idx += increment;
                if &input[idx..idx + 1] != ")" {
                    return Err(vec!["mismatchd parens".into()]);
                }
                continue;
            }
            let literal_len = consume_chars(&input[idx..], is_music_lang_literal);
            if literal_len > 0 {
                inner_vec.push(SExpr::Literal(&input[idx..idx + literal_len]));
                idx += literal_len;
                continue;
            }
            idx += consume_chars(&input[idx..], |&c| c.is_whitespace());
        }
        Ok((inner_vec, idx))
    }

    fn parse(input: &'a str) -> Result<Self, Vec<String>> {
        if input.len() < 1 || &input[0..1] != "(" {
            let non_space_start = consume_chars(&input, |&c| c.is_whitespace());
            let token_len = consume_chars(&input[non_space_start..], is_music_lang_literal);
            let space_after_tok = consume_chars(&input[non_space_start + token_len..], |&c| {
                c.is_whitespace()
            });
            if non_space_start + token_len + space_after_tok != input.len() {
                return Err(vec!["Invalid token!".into()]);
            }
            return Ok(SExpr::Literal(
                &input[non_space_start..non_space_start + token_len],
            ));
        }
        let (inner_expr, end) = Self::parse_expr(&input[1..])?;
        if end + 1 == input.len() || &input[end + 1..end + 2] != ")" {
            return Err(vec!["Missing ')'".into()]);
        }
        Ok(SExpr::Expr(inner_expr))
    }
}

impl<'a> fmt::Display for SExpr<'a> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match &self {
            SExpr::Literal(l) => write!(f, "{}", l),
            SExpr::Expr(e) => {
                write!(f, "(")?;
                e.iter().enumerate().map(|(i, is)| {
                    if i > 0 {
                        write!(f, " ")?;
                    }
                    is.fmt(f)
                }).collect::<fmt::Result>()?;
                write!(f, ")")
            },
        }
    }
}

struct Note {
    freq_of_t: Box<dyn Fn(f64) -> Vec<f64>>,
    ampl_of_t: Box<dyn Fn(f64) -> Vec<f64>>,
    duration: f64,
}

#[cfg(test)]
mod tests {

    use super::*;
}
