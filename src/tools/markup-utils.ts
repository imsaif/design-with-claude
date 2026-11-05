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
export function splitComponents(source: string): string[] {
  return source.split(/^(?=(?:export\s+(?:default\s+)?)?(?:async\s+)?(?:function|const|let|class)\s+[A-Z])/m);
}

// A children block with no markup inside, such as `{label}` or `{"text"}`.
const CHILD_VALUE_RE = /^\{\s*(?:[^{}<>'"`]*|`[^`<]*`|"[^"<]*"|'[^'<]*')\s*\}/;

// Markup in a comment isn't live. `/*` after a word or quote is a path or glob
// (`"src/*.png"`, `.dev/*`), not a comment.
function stripSourceComments(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(?<![\w"'`*/:.-])\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/[^\n]*$/gm, "");
}

// `<IMG>` in old HTML is an `<img>`. Only known native tags: `<NAVBAR>` isn't one,
// and `<A>` could be a component in JSX.
function lowercaseNativeTags(input: string): string {
  return input.replace(
    /<(\/?)(IMG|INPUT|TEXTAREA|SELECT|BUTTON|FORM|FIELDSET|LABEL|MAIN|NAV|HEADER|FOOTER|ASIDE|UL|OL|LI|H[1-6])(?=[\s/>])/g,
    (_, slash: string, tag: string) => `<${slash}${tag.toLowerCase()}`,
  );
}

const JSX_TAG_RE = /<[A-Za-z][\w.]*[\s/>]/;

export function neutralizeJsxExpressions(rawInput: string): string {
  const input = lowercaseNativeTags(stripSourceComments(rawInput));
  // JSX from attribute values and object literals (`icon={<img />}`). It can't stay
  // in place without breaking tag matching, so it's kept and checked after the
  // rest, inside a children block so it counts as rendered only sometimes.
  const recovered: string[] = [];
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

    // Only an attribute value (`attr={...}`) is collapsed, because that's what
    // breaks tag matching. A `{` after any other `>` might be a children block,
    // an arrow body (`=> {`) or a generic (`Component<P> {`), and all of them
    // can hold the JSX we're auditing, so they stay. Only a block with no markup
    // inside collapses: nothing can be lost from `{label}`.
    let lookback = i - 1;
    while (lookback >= 0 && /\s/.test(input[lookback]!)) lookback--;
    const prev = lookback >= 0 ? input[lookback] : null;
    if (prev === ">") {
      const value = input.slice(i).match(CHILD_VALUE_RE);
      if (value) {
        out += "{}";
        i += value[0].length;
        continue;
      }
    }
    if (prev !== "=") {
      out += ch;
      i++;
      continue;
    }

    // Found an attribute `{` — walk to the balanced `}` and replace the span.
    let depth = 1;
    let j = i + 1;

    while (j < len && depth > 0) {
      const c = input[j]!;

      // Skip string literals — they may contain `{`, `}`, or both. A JS string
      // can't span lines, so a quote with no partner on its line is an
      // apostrophe in JSX text ("Don't") and must not swallow what follows.
      if (c === '"' || c === "'") {
        const quote = c;
        let k = j + 1;
        while (k < len && input[k] !== quote && input[k] !== "\n") {
          if (input[k] === "\\" && k + 1 < len) k += 2;
          else k++;
        }
        j = input[k] === quote ? k + 1 : j + 1;
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

    const inner = input.slice(i + 1, j);
    if (JSX_TAG_RE.test(inner)) recovered.push(neutralizeJsxExpressions(inner));
    out += "{}";
    i = j + 1;
  }

  return out + recovered.map((r) => `\n<x>{${r}}</x>`).join("");
}

// Attributes whose value a user actually reads. `title` and `label` are included
// because both surface as visible or announced text.
const USER_FACING_ATTR_RE = /\b(?:placeholder|alt|aria-label|title|label)\s*=\s*"([^"]*)"/gi;

// A candidate text node containing any of these is code that slipped through,
// not copy. Parentheses and commas are deliberately absent — "Sign in (free)"
// and "Yes, continue" are ordinary UI strings.
const CODE_MARKER_RE = /[;{}=]/;

// What's left between two tags inside a children block: `) : cond ? (`, `&&`.
// Also TypeScript between generics: `, React.ComponentProps`, `Math.random()`.
const EXPRESSION_RESIDUE_RE = /^[)(:?&|,]|[(?&|]$|\s[?:]\s|[a-zA-Z]\.[a-zA-Z]{2,}/;

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
 * collapses `{value}` children to `{}` so interpolations are dropped here.
 */
export function extractUserFacingText(input: string): string {
  const withoutComments = input
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

  const fragments: string[] = [];

  for (const m of withoutComments.matchAll(/>([^<>]+)</g)) {
    const text = m[1]!.replace(/\s+/g, " ").trim();
    if (text && !CODE_MARKER_RE.test(text) && !EXPRESSION_RESIDUE_RE.test(text) && /\p{L}/u.test(text)) fragments.push(text);
  }

  for (const m of withoutComments.matchAll(USER_FACING_ATTR_RE)) {
    const text = m[1]!.replace(/\s+/g, " ").trim();
    if (text) fragments.push(text);
  }

  return fragments.map((f) => (/[.!?]$/.test(f) ? f : `${f}.`)).join(" ");
}
