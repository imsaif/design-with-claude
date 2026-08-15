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

// Attributes whose value a user actually reads. `title` and `label` are included
// because both surface as visible or announced text.
const USER_FACING_ATTR_RE = /\b(?:placeholder|alt|aria-label|title|label)\s*=\s*"([^"]*)"/gi;

// A candidate text node containing any of these is code that slipped through,
// not copy. Parentheses and commas are deliberately absent — "Sign in (free)"
// and "Yes, continue" are ordinary UI strings.
const CODE_MARKER_RE = /[;{}=]/;

/**
 * Pull the user-facing text out of component **source**.
 *
 * The prose checks (jargon, passive voice, sentence length, shouting) were
 * written for markup, where stripping `<...>` leaves user copy behind. Applied
 * to `.tsx` that assumption inverts: what's left is comments, imports, type
 * annotations and function bodies, so the auditor reported phantom findings —
 * a 43-word "sentence" stitched from a one-line comment and an `export function`
 * line, and `DETACHED`/`VALUE` counted as shouting.
 *
 * This keeps only what a user can read: JSX text nodes, plus the user-facing
 * attributes above. Each fragment is terminated so the sentence splitter treats
 * separate UI strings as separate sentences instead of stitching them into one
 * long false positive across element and file boundaries.
 *
 * Expects input already passed through `neutralizeJsxExpressions`, which
 * collapses `{children}` to `{}` so interpolations are dropped here.
 */
export function extractUserFacingText(input: string): string {
  const withoutComments = input
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

  const fragments: string[] = [];

  for (const m of withoutComments.matchAll(/>([^<>]+)</g)) {
    const text = m[1]!.replace(/\s+/g, " ").trim();
    if (text && !CODE_MARKER_RE.test(text)) fragments.push(text);
  }

  for (const m of withoutComments.matchAll(USER_FACING_ATTR_RE)) {
    const text = m[1]!.replace(/\s+/g, " ").trim();
    if (text) fragments.push(text);
  }

  return fragments.map((f) => (/[.!?]$/.test(f) ? f : `${f}.`)).join(" ");
}
