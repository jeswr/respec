/*
Language: RDF 1.2 Turtle, TriG, N-Triples and N-Quads
Description: N-Triples and N-Quads are subsets of Turtle and TriG, so one grammar covers all four.
Website: https://www.w3.org/TR/rdf12-turtle/
*/

/** @param {import("highlight.js").HLJSApi} hljs */
export default function turtle(hljs) {
  const { regex } = hljs;
  // Characters beyond the BMP are left out, as matching them would need the
  // unicode flag on every regex in the grammar.
  const PN_CHARS_BASE =
    "A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D" +
    "\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF" +
    "\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
  const PN_CHARS_U = `${PN_CHARS_BASE}_`;
  const PN_CHARS = `${PN_CHARS_U}\\-0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040`;
  const PLX = /%[0-9A-Fa-f]{2}|\\[_~.\-!$&'()*+,;=/?#@%]/;
  const PN_PREFIX = `[${PN_CHARS_BASE}](?:[${PN_CHARS}.]*[${PN_CHARS}])?`;
  const PN_LOCAL = regex.concat(
    regex.either(`[${PN_CHARS_U}:0-9]`, PLX),
    "(?:",
    regex.either(`[${PN_CHARS}.:]`, PLX),
    "*",
    regex.either(`[${PN_CHARS}:]`, PLX),
    ")?"
  );
  const UCHAR = /\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8}/;

  const ESCAPE = {
    scope: "char.escape",
    match: regex.either(/\\[tbnrf"'\\]/, UCHAR),
  };
  const STRINGS = [
    { begin: '"""', end: '"""' },
    { begin: "'''", end: "'''" },
    { begin: '"', end: '"', illegal: /\n/ },
    { begin: "'", end: "'", illegal: /\n/ },
  ].map(quotes => ({ scope: "string", contains: [ESCAPE], ...quotes }));

  return {
    name: "Turtle",
    aliases: ["ttl", "trig", "ntriples", "nt", "nquads", "nq"],
    contains: [
      hljs.HASH_COMMENT_MODE,
      ...STRINGS,
      {
        scope: "keyword",
        match: /@(?:prefix|base|version)\b/,
      },
      {
        scope: "meta",
        match: /@[a-zA-Z]+(?:-[a-zA-Z0-9]+)*(?:--[a-zA-Z]+)?/,
      },
      { scope: "operator", match: /\^\^/ },
      { scope: "punctuation", match: /<<\(?|\)?>>|\{\||\|\}|~/ },
      {
        scope: "symbol",
        match: regex.concat(
          "<",
          regex.either('[^<>"{}|^`\\\\\\x00-\\x20]', UCHAR),
          "*>"
        ),
      },
      {
        scope: "variable",
        match: `_:[${PN_CHARS_U}0-9](?:[${PN_CHARS}.]*[${PN_CHARS}])?`,
      },
      // Prefixed names come before the bare-word keywords, so a name such as
      // ex:a or graph:x is not split into a keyword. The prefix is scoped
      // apart from the local name so the two read as different colors.
      {
        match: [`(?:${PN_PREFIX})?:`, `(?:${PN_LOCAL})?`],
        scope: { 1: "type", 2: "symbol" },
      },
      // SPARQL-style directives are case-insensitive while everything else in
      // the grammar is not, so the case folding is spelled out here.
      {
        scope: "keyword",
        match:
          /\b(?:[Pp][Rr][Ee][Ff][Ii][Xx]|[Bb][Aa][Ss][Ee]|[Vv][Ee][Rr][Ss][Ii][Oo][Nn]|[Gg][Rr][Aa][Pp][Hh])\b/,
      },
      // "a" is only the rdf:type shorthand when used as a predicate, which is
      // always followed by whitespace or the start of an object.
      { scope: "keyword", match: /\ba(?=[\s<[(]|_:)/ },
      { scope: "literal", match: /\b(?:true|false)\b/ },
      {
        scope: "number",
        match: /[+-]?(?:(?:\d+\.\d*|\.\d+|\d+)[eE][+-]?\d+|\d*\.\d+|\d+)/,
        relevance: 0,
      },
    ],
  };
}
