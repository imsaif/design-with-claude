#!/usr/bin/env node
// Regressions from the 2026-11-04 test on real projects: the audit deleted
// arrow-function components before checking them, and treated custom components
// and comment examples as live markup. Each block pairs the false alarm with the
// real problem that must still fire.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "../dist");
const { aggregate } = await import(resolve(dist, "audit/aggregator.js"));
const { walkProject } = await import(resolve(dist, "audit/walker.js"));
const { neutralizeJsxExpressions } = await import(resolve(dist, "tools/markup-utils.js"));
const { parseTypeTokensFromCss, auditSizeTokens, auditLineHeightTokens } = await import(resolve(dist, "tools/typography.js"));
const { runMotionAudit } = await import(resolve(dist, "tools/motion.js"));
const { runContentAudit } = await import(resolve(dist, "tools/content.js"));

let failed = 0;
function check(ok, label, extra) {
  if (ok) process.stdout.write(`  ✔ ${label}\n`);
  else {
    failed++;
    process.stderr.write(`  ✘ ${label}\n`);
    if (extra !== undefined) process.stderr.write(`    ${JSON.stringify(extra)}\n`);
  }
}

function audit(source, css = "") {
  const sources = Array.isArray(source) ? source : [{ path: "P.tsx", content: source }];
  return aggregate({
    cssFiles: [],
    markupFiles: sources.map((s) => s.path),
    cssContent: css,
    markupContent: sources.map((s) => s.content).join("\n\n"),
    markupSources: sources,
    totals: { cssCount: 0, markupCount: sources.length, cappedAt: null },
  }).flatMap((r) => r.findings.map((f) => ({ cat: r.category, sev: f.severity, el: f.element, msg: f.message })));
}
const has = (findings, re) => findings.some((f) => re.test(f.msg));
const wrap = (body) => `export default function Page() {\n  return (\n    <main>\n      <h1>Title</h1>\n${body}\n    </main>\n  );\n}\n`;

// --- 1. Every way of writing a component survives the cleaner ----------------
{
  const shapes = {
    "arrow component": `const P = () => {\n  return <main><h1>T</h1><img src="a.png" /></main>;\n};\n`,
    "forwardRef": `const P = forwardRef((props, ref) => {\n  return <main><h1>T</h1><img src="a.png" /></main>;\n});\n`,
    "class component": `class P extends Component<Props> {\n  render() {\n    return <main><h1>T</h1><img src="a.png" /></main>;\n  }\n}\n`,
    "generic return type": `function P(): Foo<Bar> {\n  return <main><h1>T</h1><img src="a.png" /></main>;\n}\n`,
    "arrow with apostrophe in copy": `const P = () => {\n  return <main><h1>Don't</h1><img src="a.png" /></main>;\n};\n`,
  };
  for (const [name, src] of Object.entries(shapes)) {
    const f = audit(src);
    check(has(f, /no alt/), `${name}: a missing alt is found`, f);
    check(!has(f, /no <main>|no <h1>/), `${name}: its <main> and <h1> are seen`, f);
  }
  // A stray apostrophe inside an attribute's JSX can't swallow what follows.
  const overrun = `<main fallback={<p>Don't</p>}>\n  <h1>T</h1>\n  <img src="a.png" />\n</main>`;
  check(has(audit(overrun), /no alt/), "apostrophe inside an attribute doesn't delete the rest of the file");
}

// --- 2. JSX inside { } is checked ---------------------------------------------
{
  const cases = [
    ["conditional", `{show && <img src="a.png" />}`, /no alt/],
    ["ternary", `{show ? <img src="a.png" /> : null}`, /no alt/],
    ["list", `{items.map((i) => <img key={i} src={i} />)}`, /no alt/],
    ["block-bodied list", `{items.map((i) => {\n  return <img key={i} src={i} />;\n})}`, /no alt/],
    ["input in a list", `<form>{fields.map((f) => <input key={f} id={f} type="text" />)}</form>`, /no accessible label/],
    ["icon button", `{x && <button onClick={f}><svg /></button>}`, /no text content/],
    ["link in a list", `{xs.map((x) => <a key={x} onClick={f}>Go</a>)}`, /without href/],
  ];
  for (const [name, body, re] of cases) check(has(audit(wrap(body)), re), `${name}: problem inside { } is found`);

  const cta = audit(wrap(`{x && <button type="button">Click here</button>}`));
  check(has(cta, /CTA/), "copy inside { } is read", cta);
  const code = audit(wrap(`{a ? <p>Primeiro texto aqui</p> : b ? <p>Segundo texto aqui</p> : <p>Terceiro</p>}`));
  check(!code.some((f) => f.cat === "copy" && /\? |:/.test(f.msg)), "the code around that copy isn't read as copy", code);
}

// --- 3. Headings: branches that can't both render aren't a pair ---------------
{
  const reported = `export default function App() {\n  return <main>{r === "a" && <h1>A</h1>}{r === "b" && <h1>B</h1>}</main>;\n}\n`;
  check(!has(audit(reported), /<h1> elements/), "two conditional <h1> in one component aren't flagged");
  const tern = `export default function App() {\n  return <main>{a ? <h1>A</h1> : <h1>B</h1>}</main>;\n}\n`;
  check(!has(audit(tern), /<h1> elements/), "ternary <h1> branches aren't flagged");
  const early = `export default function App() {\n  if (loading) return <main><h1>Loading</h1></main>;\n  return <main><h1>Ready</h1></main>;\n}\n`;
  check(!has(audit(early), /<h1> elements/), "early-return <h1> branches aren't flagged");
  check(has(audit(wrap(`{x && <h1>Again</h1>}`)), /<h1> elements/), "a conditional <h1> beside a fixed one is flagged");
  check(has(audit(wrap(`<h1>Again</h1>`)), /2 <h1> elements/), "two fixed <h1> are flagged");
  const condSkip = wrap(`{x && <h3>Maybe</h3>}`);
  check(!has(audit(condSkip), /heading level skipped/), "a conditional heading isn't called a skip");
  check(has(audit(wrap(`<h3>Sub</h3>`)), /heading level skipped/), "a fixed skip is flagged");
  check(!has(audit(`const A = () => {\n  return <main>{x && <h1>T</h1>}</main>;\n};\n`), /no <h1>/), "a conditional <h1> still counts as having one");
}

// --- 4. Comments aren't live, custom components aren't native elements --------
{
  const jsdoc = `/**\n * @example <textarea value={x} /> <img src="a.png" />\n */\nexport default function P() {\n  return <main><h1>T</h1></main>;\n}\n`;
  check(!has(audit(jsdoc), /no accessible label|no alt/), "markup in a doc comment is ignored");
  const jsx = wrap(`{/* <img src="old.png" /> */}`);
  check(!has(audit(jsx), /no alt/), "markup in a JSX comment is ignored");
  const line = wrap(`// <img src="old.png" />`);
  check(!has(audit(line), /no alt/), "markup in a line comment is ignored");
  check(has(audit(`<!-- x --><main><h1>T</h1><img src="a.png" /></main>`), /no alt/), "an HTML comment doesn't hide what follows");
  check(!has(audit(`<!-- <img src="a.png"> --><main><h1>T</h1></main>`), /no alt/), "markup in an HTML comment is ignored");
  check(has(audit(wrap(`<a href="https://x.dev/*.png">y</a><img src="a.png" />`)), /no alt/), "`/*` inside a URL isn't a comment");

  const custom = wrap(`<Input id="a" />\n<Textarea />\n<Select />\n<Image src="a.png" />\n<Button><svg /></Button>\n<A onClick={f}>x</A>`);
  const f = audit(custom);
  check(!has(f, /no accessible label|no alt|no text content|without href/), "custom components aren't judged as native elements", f);
}

// --- 5. Reusable pieces get their label and link from whoever uses them -------
{
  const primitive = `export function Input(props) {\n  return <input {...props} />;\n}\nexport function Link(props) {\n  return <a {...props} />;\n}\nexport function Pic(props) {\n  return <img {...props} />;\n}\nexport function B(props) {\n  return <button {...props} />;\n}\n`;
  const f = audit(primitive);
  check(!has(f, /no accessible label|without href|no alt|no text content/), "elements with spread props aren't flagged", f);
  check(has(audit(wrap(`<form><input id="a" type="text" /></form>`)), /no accessible label/), "a plain input still needs a label");
  check(!has(audit(wrap(`<button title="Close"><svg /></button>`)), /no text content/), "a button's title names it");
  check(!has(audit(wrap(`<button><svg aria-label="Close" /></button>`)), /no text content/), "a labelled icon names its button");
  check(has(audit(wrap(`<button className="x"><svg /></button>`)), /no text content/), "an unnamed icon button is still flagged");
}

// --- 6. "Outside a form" only when the same component shows it ----------------
{
  const helper = `function Campo() {\n  return <input id="a" aria-label="x" type="text" />;\n}\n\nexport default function F() {\n  return <form><Campo /></form>;\n}\n`;
  check(!has(audit(helper), /outside any <form>/), "a helper component's input isn't called orphaned");
  const otherFile = [
    { path: "Campo.tsx", content: `export function Campo() {\n  return <input id="a" aria-label="x" type="text" />;\n}\n` },
    { path: "F.tsx", content: `export default function F() {\n  return <form><Campo /><button>Go</button></form>;\n}\n` },
  ];
  check(!has(audit(otherFile), /outside any <form>/), "an input in another file isn't called orphaned");
  const real = `export default function F() {\n  return <main><form><input id="a" aria-label="x" type="text" /></form><input id="b" aria-label="y" type="text" /></main>;\n}\n`;
  const r = audit(real).find((x) => /live outside any <form>/.test(x.msg));
  check(r && /P\.tsx/.test(r.el), "an input beside a form in one component is flagged, naming the file", r);
  check(has(audit(wrap(`<input id="a" aria-label="x" type="text" />`)), /outside any <form>/), "a project with no forms is still told");
  const dialog = wrap(`<form method="dialog"><button>A</button><button>B</button></form>`);
  check(!has(audit(dialog), /submit controls/), "a dialog form's buttons aren't server submits");
  const twoSubmits = audit(wrap(`<form><button>A</button><button>B</button></form>`)).find((x) => /submit controls/.test(x.msg));
  check(twoSubmits && /type="button"/.test(twoSubmits.msg), "the multiple-submit finding suggests type=button", twoSubmits);
}

// --- 7. Tailwind's companion tokens are read by what they are ------------------
{
  const css = `@theme {
    --text-base: 1rem; --text-base--letter-spacing: -0.01em; --text-base--line-height: 1.5;
    --text-xs: 0.75rem; --text-xs--line-height: 1.333;
    --text-sm: 0.875rem; --text-sm--line-height: 1.2;
    --text-3xl: 2rem; --text-3xl--line-height: 1.1;
    --text-5xl: 3rem; --text-5xl--line-height: 1;
    --text-6xl: 4rem; --text-6xl--line-height: 1.6;
    --text-tiny: 0.5rem;
  }`;
  const tokens = parseTypeTokensFromCss(css);
  check(!tokens.some((t) => /letter-spacing/.test(t.name)), "letter-spacing tokens aren't type sizes", tokens.map((t) => t.name));
  const sizes = auditSizeTokens(tokens.filter((t) => t.kind === "size"));
  check(sizes.some((f) => f.token === "--text-tiny"), "a real size below the floor still errors", sizes);
  check(!sizes.some((f) => /letter-spacing/.test(f.token)), "no size error comes from letter-spacing", sizes);
  const lh = auditLineHeightTokens(tokens.filter((t) => t.kind === "lineHeight"));
  const flagged = lh.map((f) => f.token);
  check(!flagged.includes("--text-3xl--line-height") && !flagged.includes("--text-5xl--line-height"), "tight heading line-heights pass", lh);
  check(!flagged.includes("--text-xs--line-height"), "captions aren't held to the body range", lh);
  check(flagged.includes("--text-sm--line-height"), "a tight body line-height is still flagged", lh);
  check(flagged.includes("--text-6xl--line-height"), "a loose heading line-height is still flagged", lh);
}

// --- 8. Motion: guards come in more than one form ------------------------------
{
  const reduced = (css, markup) => runMotionAudit(css, markup).some((f) => f.element === "@media (prefers-reduced-motion)");
  const a = `.a { transition: transform 200ms; }`;
  check(reduced(a, ""), "unguarded motion still errors");
  check(!reduced(`${a} @media (prefers-reduced-motion: no-preference) { .a { color: red; } }`, ""), "a no-preference guard counts");
  check(!reduced(a, `<div className="motion-reduce:transition-none" />`), "Tailwind motion-reduce counts");
  check(!reduced(a, `<div className="motion-safe:animate-spin" />`), "Tailwind motion-safe counts");
  check(reduced(a, `<div className="motion-x" />`), "unrelated classes don't count");
  const durs = (css) => runMotionAudit(css).filter((f) => f.element === "duration" && /longer/.test(f.message));
  check(durs(`.s { animation: spin 2s linear infinite; }`).length === 0, "a loop's period isn't a slow transition");
  check(durs(`.s { transition: opacity 2s; }`).length === 1, "a slow transition is still flagged");
  const kf = (body) => runMotionAudit(`@keyframes a {\n  from { ${body} }\n}`).filter((f) => f.element === "animated property");
  check(kf(`--inset-top: 1px; opacity: 0;`).length === 0, "a custom property ending in -top isn't a layout property");
  check(kf(`top: 1px;`).length === 1, "animating top is still flagged");
}

// --- 8b. Button text is only judged when it's written out ----------------------
{
  const cta = (body) => audit(wrap(body)).filter((f) => /CTA/.test(f.msg));
  check(cta(`<button type="button">{status === "loading" ? "Setting up, one moment" : "Get token"}</button>`).length === 0, "conditional button text isn't read as code");
  check(cta(`<button type="button">{t('login.device.scope_full_title', 'Public and Private')}</button>`).length === 0, "translated button text isn't read as code");
  check(cta(`<a {...props} />\n<p>A long stretch of ordinary text with many words here</p>\n<a href="/x">y</a>`).length === 0, "a self-closed link doesn't swallow what follows");
  check(cta(`<button type="button">Click here</button>`).length === 1, "a generic written-out CTA is still flagged");
  check(cta(`<button type="button">Please click this very long button label to continue onward now</button>`).length > 0, "a long written-out CTA is still flagged");
}

// --- 9. Tests and stories aren't UI ---------------------------------------------
{
  const root = mkdtempSync(join(tmpdir(), "dwic-coverage-"));
  try {
    const paths = ["src/App.tsx", "src/App.test.tsx", "src/App.spec.jsx", "src/App.stories.tsx", "src/__tests__/a.tsx", "src/__mocks__/b.tsx", "tests/c.tsx", "e2e/d.tsx", "src/latest/Page.tsx", "src/contest.tsx"];
    for (const p of paths) {
      mkdirSync(dirname(join(root, p)), { recursive: true });
      writeFileSync(join(root, p), `<h1>x</h1>`);
    }
    const seen = walkProject(root).markupFiles.sort();
    check(JSON.stringify(seen) === JSON.stringify(["src/App.tsx", "src/contest.tsx", "src/latest/Page.tsx"]), "test and story files are skipped, similar names aren't", seen);
    const explicit = walkProject(root, { markupOverrides: ["src/App.test.tsx"] }).markupFiles;
    check(explicit.includes("src/App.test.tsx"), "a file named on the command line is still scanned", explicit);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// --- 10. Hidden controls aren't announced, so they need no label ---------------
{
  check(!has(audit(wrap(`<input type="file" className="hidden" />`)), /no accessible label/), "class hidden needs no label");
  check(!has(audit(wrap(`<input type="file" hidden />`)), /no accessible label/), "hidden attribute needs no label");
  check(has(audit(wrap(`<input type="text" className="md:hidden" />`)), /no accessible label/), "hidden at one breakpoint still needs a label");
  check(has(audit(wrap(`<input type="text" className="overflow-hidden" />`)), /no accessible label/), "overflow-hidden still needs a label");
  check(has(audit(wrap(`<input type="text" className="sr-only" />`)), /no accessible label/), "sr-only is still announced and needs a label");
}

// --- 11. "Outside a form" is a question, so it's a note ------------------------
{
  const none = audit(wrap(`<input id="a" aria-label="x" type="text" />`)).find((f) => /outside any <form>/.test(f.msg));
  check(none?.sev === "info", "no forms in the project is a note", none);
  const beside = audit(`export default function F() {\n  return <main><form><input aria-label="x" type="text" /></form><input aria-label="y" type="text" /></main>;\n}\n`).find((f) => /outside any <form>/.test(f.msg));
  check(beside?.sev === "info", "an input beside a form is a note", beside);
}

// --- 12. Hint wiring: only elements that are hints -----------------------------
{
  const wired = (body) => has(audit(wrap(body)), /error\/hint element/);
  check(!wired(`<input id="email" aria-label="x" type="email" />\n{errors.email && <span>{errors.email}</span>}`), "an input's id before the word errors isn't a hint");
  check(!wired(`<FilterSection id="filter-reasons">help text</FilterSection>`), "a custom component isn't a hint");
  check(!wired(`<p id="intro">Get help with your account</p>`), "a paragraph mentioning help isn't a hint");
  check(!wired(`<input aria-describedby="email-error" aria-label="x" type="email" /><p id="email-error">Required</p>`), "a referenced hint is fine");
  check(wired(`<input aria-label="x" type="email" /><p id="email-error">Required</p>`), "an unreferenced hint is still flagged");
  check(wired(`<input aria-label="x" type="email" /><p id="email-hint">We won't share it</p>`), "an unreferenced hint id is still flagged");
}

// --- 13. Code isn't copy ---------------------------------------------------------
{
  const words = Array(32).fill("word").join(" ");
  const src = `const P = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Root>>((p, r) => {\n  return <main><p>No timezone found</p></main>;\n});\nconst t = (Math.random() * 8000 + 2000) as ReturnType<typeof setTimeout>;\n`;
  const code = runContentAudit(`${src}${src}${src}${src}`, { source: true });
  check(!code.some((f) => /ComponentProps|Math\.random/.test(f.message)), "type annotations and code aren't stitched into sentences", code);
  const real = runContentAudit(`<p>${words}</p>`, { source: true });
  check(real.some((f) => /sentence/.test(f.element)), "a really long sentence is still flagged", real);
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — real-project regressions covered.\n");
