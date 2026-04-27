#!/usr/bin/env node
// Unit test for src/tools/markup-utils.ts. The neutralizeJsxExpressions helper
// is the load-bearing fix for the regex-stops-at-> bug discovered when
// auditing real JSX inputs. Each case here is a pattern that broke a real
// audit before this fix landed.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { neutralizeJsxExpressions } = await import(resolve(repoRoot, "dist/tools/markup-utils.js"));

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

function eq(actual, expected, label) {
  if (actual === expected) pass(label);
  else fail(label, `expected: ${JSON.stringify(expected)}\n     got: ${JSON.stringify(actual)}`);
}

// 1. Plain HTML untouched
eq(
  neutralizeJsxExpressions(`<input type="email" aria-label="Email" />`),
  `<input type="email" aria-label="Email" />`,
  "plain HTML passes through unchanged",
);

// 1b. Function bodies, interface bodies, TS generics — left intact.
// Critical: the helper used to eat function bodies, destroying component
// returns and making the audit blind to JSX inside React components.
eq(
  neutralizeJsxExpressions(`function Foo() { return <main>hi</main>; }`),
  `function Foo() { return <main>hi</main>; }`,
  "function body left intact (JSX inside survives)",
);
eq(
  neutralizeJsxExpressions(`interface P { searchParams: Promise<{ token?: string }> }`),
  `interface P { searchParams: Promise<{ token?: string }> }`,
  "TS interface body + nested generic both left intact",
);
eq(
  neutralizeJsxExpressions(`async function Page({ searchParams }: Props) { return <div /> }`),
  `async function Page({ searchParams }: Props) { return <div /> }`,
  "destructured params + function body left intact",
);
// Object literals after `=` ARE collapsed — that's by design (they don't
// contain JSX, neutralizing is harmless and keeps the lookback rule simple).
eq(
  neutralizeJsxExpressions(`const x = { a: 1, b: 2 };`),
  `const x = {};`,
  "object literal after `=` collapsed (acceptable side-effect, no JSX inside)",
);

// 2. JSX onChange with arrow-function — the original bug
eq(
  neutralizeJsxExpressions(`<input onChange={(e) => set(e.target.value)} aria-label="x" />`),
  `<input onChange={} aria-label="x" />`,
  "arrow-function expression collapsed to {}",
);

// 3. Nested braces inside the expression
eq(
  neutralizeJsxExpressions(`<div style={{ color: "red", fontSize: 16 }}>x</div>`),
  `<div style={}>x</div>`,
  "nested braces collapsed",
);

// 4. String containing braces
eq(
  neutralizeJsxExpressions(`<input value={"hello {world}"} />`),
  `<input value={} />`,
  "braces inside quoted strings don't leak depth",
);

// 5. Single-quoted string containing braces
eq(
  neutralizeJsxExpressions(`<input value={'a {b} c'} />`),
  `<input value={} />`,
  "single-quoted string handled",
);

// 6. Template literal with interpolation
eq(
  neutralizeJsxExpressions("<span>{`hello ${name} world`}</span>"),
  `<span>{}</span>`,
  "template literal with interpolation collapsed",
);

// 7. Multiple expressions in one tag
eq(
  neutralizeJsxExpressions(`<input value={a} onChange={b} disabled={c} />`),
  `<input value={} onChange={} disabled={} />`,
  "multiple expressions all collapsed",
);

// 8. Expression containing > and <
eq(
  neutralizeJsxExpressions(`<input checked={a > b && c < d} />`),
  `<input checked={} />`,
  "comparison operators inside expressions don't terminate the tag",
);

// 9. Escaped quote inside a string inside an expression
eq(
  neutralizeJsxExpressions(`<p title={"she said \\"hi\\""}>x</p>`),
  `<p title={}>x</p>`,
  "escaped quotes don't break string scan",
);

// 10. Unclosed expression at end of input — graceful (no infinite loop, eats rest)
{
  const out = neutralizeJsxExpressions(`<x prop={broken`);
  if (out === `<x prop={}`) pass("unclosed expression handled gracefully");
  else fail("unclosed expression handling", `got: ${JSON.stringify(out)}`);
}

// 11. Real-world: the NewsletterSignup honeypot pattern
{
  const real = `
    <input
      type="text"
      name="website_url"
      value=""
      onChange={() => {}}
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      aria-label="Leave this field blank"
    />`;
  const cleaned = neutralizeJsxExpressions(real);
  if (cleaned.includes("aria-label=") && cleaned.includes("autoComplete=") && !cleaned.includes("=>")) {
    pass("real-world honeypot input — a11y attrs survive past arrow function");
  } else {
    fail("real-world honeypot input cleanup", `cleaned: ${cleaned}`);
  }
}

// 12. Real-world: JSX email input with state setter
{
  const real = `<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" required />`;
  const cleaned = neutralizeJsxExpressions(real);
  // The audit's INPUT_RE is `<input\b[^>]*\/?>` — verify it now matches the
  // entire tag including aria-label.
  const m = cleaned.match(/<input\b[^>]*\/?>/i);
  if (m && m[0].includes("aria-label=") && m[0].includes("required")) {
    pass("real-world email input — INPUT_RE now captures full tag including a11y attrs");
  } else {
    fail("real-world email input — INPUT_RE capture", `cleaned: ${cleaned}\n  match: ${m?.[0]}`);
  }
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — markup-utils wired.\n");
