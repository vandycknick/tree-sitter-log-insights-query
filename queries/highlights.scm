; https://tree-sitter.github.io/tree-sitter/using-parsers#pattern-matching-with-queries

; Order matters
(func_call name: (_ (identifier) @function) @function)

(pipe) @punctuation.delimiter
(string) @string
(number) @number
(regex) @regexp
(regex_pattern) @string

(comment) @comment

[
  "fields"
  "sort"
  "limit"
  "filter"
  "display"
  "parse"
  "dedup"
  "stats"
  "diff"
] @keyword

[
  "previousDay"
  "previousWeek"
  "previousMonth"
  "as"
  "by"
  "desc"
  "asc"
] @operator

(binary_exp [
  "^"
  "*"
  "/"
  "%"
  "+"
  "-"
  "<"
  ">"
  "<="
  ">="
  "="
  "!="
  "in"
  "and"
  "or"
  "like"
  "not like"
] @operator)

[
  "("
  ")"
  "`"
  "/"
  "@"
  "["
  "]"
] @punctuation.bracket

[
  ","
] @punctuation.delimiter
