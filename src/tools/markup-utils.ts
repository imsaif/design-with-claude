// Markup pre-processors shared by the audit helpers (accessibility, form,
// navigation, content). The audits use regexes shaped like `<tag\b[^>]*>` to
// pull tag-text out of pasted markup. That works fine on real HTML but trips
// over JSX, where attribute values can be expressions:
//
//   <input onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
//
// Here `=>` and the inline arrow-function body contain `>` characters, which
// the `[^>]*` clause treats as a tag terminator. The regex captures only
// `<input onChange={(e) =`, then the audit walks the wrong substring and
// misses the real attributes that follow.
//
// Fix: before any regex match, neutralize JSX expression blocks (`{...}`) by
// replacing them with `{}`. The presence-checks (`hasAttr`) still see
// `attr={}`, attribute boundaries are preserved, and `=>` / `<` / `>` inside
// expressions disappear from the regex's POV.

/**
 * Replace every JSX expression block `{...}` with `{}` so tag-detection
 * regexes don't trip on `>`, `<`, or `=>` inside expressions.
 *
 * Handles:
 *  - Nested braces:        `{() => { return foo; }}` → `{}`
 *  - String literals:      `{"} not a closer"}`     → `{}`
 *  - Template literals:    `` {`a > b ${ x }`} ``   → `{}`
 *  - Escaped quotes inside strings.
 *
 * Out of scope (rare in JSX attribute values):
 *  - Comments inside expressions (`/* * /`, `//`).
 *  - Regex literals (`/ab>cd/`) — could carry `>` but uncommon in attrs.
 */
export function neutralizeJsxExpressions(input: string): string {
  let out = "";
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i]!;

    if (ch !== "{") {
      out += ch;
      i++;
      continue;
    }

    // Only treat `{` as a JSX expression block when it's preceded by `=` (JSX
    // attribute value) or `>` (JSX children). Otherwise it's a TS/JS construct
    // — function body, object literal, type definition, destructure — and we
    // must leave it alone or we'll strip code we need (e.g. a component's
    // entire return-body, including the JSX it produces).
    let lookback = i - 1;
    while (lookback >= 0 && /\s/.test(input[lookback]!)) lookback--;
    const prev = lookback >= 0 ? input[lookback] : null;
    if (prev !== "=" && prev !== ">") {
      out += ch;
      i++;
      continue;
    }

    // Found a JSX `{` — walk to the balanced `}` and replace the whole span.
    let depth = 1;
    let j = i + 1;

    while (j < len && depth > 0) {
      const c = input[j]!;

      // Skip string literals — they may contain `{`, `}`, or both.
      if (c === '"' || c === "'") {
        const quote = c;
        j++;
        while (j < len && input[j] !== quote) {
          if (input[j] === "\\" && j + 1 < len) j += 2;
          else j++;
        }
        j++; // past the closing quote (or end-of-input)
        continue;
      }

      // Skip template literals. We walk to the matching backtick and treat
      // the contents as opaque — `${...}` interpolations may contain braces,
      // but counting them correctly would require recursive parsing. For
      // audit purposes the contents are irrelevant; we just need to not
      // mistake them for outer-expression tokens.
      if (c === "`") {
        j++;
        while (j < len && input[j] !== "`") {
          if (input[j] === "\\" && j + 1 < len) j += 2;
          else j++;
        }
        j++; // past the closing backtick (or end-of-input)
        continue;
      }

      if (c === "{") depth++;
      else if (c === "}") depth--;

      if (depth > 0 || c !== "}") j++;
    }

    out += "{}";
    i = j + 1;
  }

  return out;
}
