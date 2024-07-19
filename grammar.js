module.exports = grammar({
  name: "log_insights_query",

  extras: ($) => [/\s/, $.comment],

  precedences: ($) => [
    [
      $.alias,
      $.by,
      $.grouping,
      $.func_call,
      "binary_exponent",
      "binary_times",
      "binary_plus",
      "binary_relation",
      "binary_match",
      "binary_and",
      "binary_or",
      $.regex,
      $.field_name,
      $.identifier,
    ],
    [$.func_call, $._exp],
  ],

  word: ($) => $.identifier,

  rules: {
    query: ($) =>
      choice($._command, seq($._command, repeat1(seq($.pipe, $._command)))),

    comment: (_) => seq("#", /.*/),

    _command: ($) =>
      choice(
        $.display_command,
        $.fields_command,
        $.filter_command,
        $.pattern_command,
        $.diff_command,
        $.parse_command,
        $.sort_command,
        $.stats_command,
        $.limit_command,
        $.dedup_command,
      ),

    fields_command: ($) =>
      seq(
        "fields",
        choice(
          $._field_expression,
          seq($._field_expression, repeat1(seq(",", $._field_expression))),
        ),
      ),

    _field_expression: ($) => choice($._exp, $.alias),

    alias: ($) => seq($._exp, "as", $.identifier),

    sort_command: ($) =>
      seq(
        "sort",
        seq(
          $._sort_expression,
          optional(repeat1(seq(",", $._sort_expression))),
        ),
      ),
    _sort_expression: ($) => seq($.field_name, optional(choice("asc", "desc"))),

    filter_command: ($) => seq("filter", $._exp),

    limit_command: ($) => seq(choice("limit", "head", "tail"), $.number), // Note: head, tail operators are deprecated. Are still here to complete the grammar.

    display_command: ($) => seq("display", $.field_name),

    dedup_command: ($) =>
      seq(
        "dedup",
        seq($.field_name, optional(repeat1(seq(",", $.field_name)))),
      ),

    pattern_command: ($) =>
      seq("pattern", seq($.field_name, repeat1(seq(",", $.field_name)))),

    parse_command: ($) =>
      seq(
        "parse",
        choice(
          $._parse_expression,
          seq($._parse_expression, repeat1(seq(",", $._parse_expression))),
        ),
      ),

    _parse_expression: ($) =>
      choice($._parse_exp, alias($._parse_alias, $.alias)),
    _parse_exp: ($) => seq($.field_name, optional(choice($.string, $.regex))),
    _parse_alias: ($) => seq($._parse_exp, "as", $.identifier),

    stats_command: ($) =>
      seq(
        "stats",
        choice(
          $._stats_expression,
          seq($._stats_expression, repeat1(seq(",", $._stats_expression))),
        ),
      ),
    _stats_expression: ($) => choice($._exp, choice($.alias, $.by)),

    by: ($) =>
      seq(choice($._exp, $.alias), "by", choice($.field_name, $.func_call)),

    diff_command: (_) =>
      seq(
        "diff",
        optional(choice("previousDay", "previousWeek", "previousMonth")),
      ),

    field_name: ($) =>
      choice(
        seq(
          optional("@"),
          alias($.identifier, ""),
          optional($._field_name_chain),
        ),
        seq(
          "`",
          alias($.identifier, ""),
          "-",
          alias($.identifier, ""),
          optional($._field_name_chain),
          "`",
        ),
      ),
    _field_name_chain: (_) => repeat1(seq(".", /[a-zA-Z0-9_]*/)),

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    pipe: (_) => /[|]/,

    _exp: ($) =>
      choice(
        $.binary_exp,
        $.func_call,
        $.string,
        $.number,
        $.timespan,
        $.regex,
        $.array,
        $.grouping,
        $.field_name,
      ),

    grouping: ($) => seq("(", $._exp, ")"),

    binary_exp: ($) =>
      choice(
        ...[
          ["^", "binary_exponent"],
          ["*", "binary_times"],
          ["/", "binary_times"],
          ["%", "binary_times"],
          ["+", "binary_plus"],
          ["-", "binary_plus"],
          ["<", "binary_relation"],
          [">", "binary_relation"],
          ["<=", "binary_relation"],
          [">=", "binary_relation"],
          ["=", "binary_relation"],
          ["!=", "binary_relation"],
          ["not like", "binary_relation"], // This isn't technically correct. `not` can be used as a unary operator. But has some very weird behaviour.
          ["like", "binary_relation"],
          ["and", "binary_and"],
          ["or", "binary_or"],
        ].map(([op, precedence]) =>
          prec.left(
            precedence,
            seq(
              field("left", $._exp),
              field("operator", op),
              field("right", $._exp),
            ),
          ),
        ),
        $._binary_in,
      ),

    _binary_in: ($) =>
      prec.left(
        seq(
          field("left", $._exp),
          field("operator", "in"),
          field("right", $._exp),
        ),
      ),

    func_call: ($) =>
      seq(
        field("name", $.identifier),
        token.immediate("("),
        optional($.args),
        ")",
      ),

    args: ($) => choice($.wildcard, seq($._exp, repeat(seq(",", $._exp)))),

    string: ($) => choice($._double_quote_string, $._single_quote_string),
    _double_quote_string: (_) => /"[^"]*"/,
    _single_quote_string: (_) => /'[^']*'/,

    number: (_) => /\d+(\.\d+)?/,

    timespan: ($) =>
      seq(
        $.number,
        choice(
          "y",
          "yr",
          "q",
          "qtr",
          "mo",
          "mon",
          "w",
          "d",
          "h",
          "hr",
          "m",
          "min",
          "s",
          "sec",
          "ms",
          "msec",
        ),
      ),

    regex: ($) =>
      seq(
        "/",
        field("pattern", $.regex_pattern),
        token.immediate(prec(1, "/")),
      ),

    regex_pattern: (_) =>
      token.immediate(
        prec(
          -1,
          repeat1(
            choice(
              seq(
                "[",
                repeat(
                  choice(
                    seq("\\", /./), // escaped character
                    /[^\]\n\\]/, // any character besides ']' or '\n'
                  ),
                ),
                "]",
              ), // square-bracket-delimited character class
              seq("\\", /./), // escaped character
              /[^/\\\[\n]/, // any character besides '[', '\', '/', '\n'
            ),
          ),
        ),
      ),

    _primitive_list: ($) =>
      seq(
        choice($.string, $.number),
        optional(repeat1(seq(",", choice($.string, $.number)))),
      ),

    array: ($) => seq("[", field("index", $._primitive_list), "]"),

    wildcard: (_) => "*",
  },
});
