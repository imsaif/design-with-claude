#!/usr/bin/env node
// Regression tests for GitHub issue #28: false positives on a real Vite +
// Tailwind v4 project. Each block also proves the matching true positive still
// fires, so a fix can't pass by simply making the check quieter.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "../dist");
const { aggregate } = await import(resolve(dist, "audit/aggregator.js"));
const { walkProject } = await import(resolve(dist, "audit/walker.js"));
const { parseTokensFromCss } = await import(resolve(dist, "tools/color.js"));
const { parseTypeTokensFromCss } = await import(resolve(dist, "tools/typography.js"));
const { parseSpacingTokensFromCss } = await import(resolve(dist, "tools/spacing.js"));
const { runMotionAudit } = await import(resolve(dist, "tools/motion.js"));
const { auditLandmarks } = await import(resolve(dist, "tools/accessibility.js"));
const { auditShouting } = await import(resolve(dist, "tools/content.js"));

let failed = 0;
function check(ok, label, extra) {
  if (ok) {
    process.stdout.write(`  ✔ ${label}\n`);
  } else {
    failed++;
    process.stderr.write(`  ✘ ${label}\n`);
    if (extra !== undefined) process.stderr.write(`    ${JSON.stringify(extra)}\n`);
  }
}

function inputs(css = "", markup = "", markupSources) {
  return {
    cssFiles: [],
    markupFiles: [],
    cssContent: css,
    markupContent: markup,
    markupSources,
    totals: { cssCount: 0, markupCount: 0, cappedAt: null },
  };
}
const category = (results, name) => results.find((r) => r.category === name);
const tokensOf = (r) => r.findings.map((f) => f.token);

// --- 1a. Commented-out CSS is not live ---------------------------------------
{
  const css = `@theme { --color-acento: #2f3d8f; /* active */ }
/* --- alternate theme, never applied ---
@theme { --color-acento: #2dd4bf; --font-size-x: 3px; --space-x: 13px; }
*/`;
  const color = parseTokensFromCss(css);
  check(color.length === 1 && color[0].hex === "#2f3d8f", "color parser ignores commented tokens", color);
  check(!parseTypeTokensFromCss(css).some((t) => t.name === "--font-size-x"), "type parser ignores commented tokens");
  check(!parseSpacingTokensFromCss(css).some((t) => t.name === "--space-x"), "spacing parser ignores commented tokens");

  const live = parseTokensFromCss(`:root { --color-live: #123456; }`);
  check(live.length === 1 && live[0].hex === "#123456", "uncommented tokens still parse");

  const commented = runMotionAudit(`/* .a { transition: all 200ms; } */ .b { color: red; }`);
  check(!commented.some((f) => /transition/i.test(`${f.element} ${f.message}`) && /\ball\b/.test(f.message)), "motion audit ignores commented CSS", commented);
  const real = runMotionAudit(`.a { transition: all 200ms; }`);
  check(real.some((f) => /\ball\b/.test(f.message)), "motion audit still flags live `transition: all`", real);
}

// --- 1b. Unknown-name tokens take their role from how they're used -----------
{
  const css = `@theme {
    --color-papel: #ffffff;
    --color-borda: #e2e2dc;
    --color-fraco: #eeeeee;
    --color-claro: #dddddd;
    --color-misto: #f0f0f0;
    --color-css-fundo: #fafafa;
    --color-css-tinta: #fbfbfb;
    --color-sem-uso: #f1f1f1;
  }
  .card { background: var(--color-css-fundo); }
  .nota { color: var(--color-css-tinta); }`;
  const markup = `<main className="bg-papel border-borda">
    <p className="text-fraco">a</p>
    <p className="hover:text-claro">b</p>
    <p className="bg-misto text-misto">c</p>
  </main>`;
  const color = category(aggregate(inputs(css, markup)), "color");
  const errors = color.findings.filter((f) => f.severity === "error").map((f) => f.token);
  check(!errors.includes("--color-papel"), "token used as bg-* is not tested as text", errors);
  check(!errors.includes("--color-borda"), "token used as border-* is not tested as text", errors);
  check(!errors.includes("--color-css-fundo"), "token used as CSS background is not tested as text", errors);
  check(errors.includes("--color-fraco"), "token used as text-* still fails contrast", errors);
  check(errors.includes("--color-claro"), "token used as hover:text-* still fails contrast", errors);
  check(errors.includes("--color-misto"), "token used as both text and bg still fails contrast", errors);
  check(errors.includes("--color-css-tinta"), "token used as CSS color still fails contrast", errors);
  const unused = color.findings.find((f) => f.token === "--color-sem-uso");
  check(unused?.severity === "info", "token with no usage found is info, not a build-blocking error", unused);

  // English role names keep working with no usage evidence at all.
  const named = category(aggregate(inputs(`:root { --color-primary: #00B7BD; --text-secondary: #eeeeee; }`)), "color");
  check(tokensOf(named).includes("--color-primary") && named.findings.every((f) => f.severity === "error"), "accent named tokens still error without usage evidence", named.findings);
}

// --- 1c. A Tailwind-namespaced surface token is the page surface -------------
{
  const css = `@theme { --color-bg: #111111; --color-primary: #eeeeee; }`;
  const color = category(aggregate(inputs(css)), "color");
  check(!tokensOf(color).includes("--color-primary"), "--color-bg is recognised as the surface", color.findings);
}

// --- 2. Copies of the project aren't scanned, and overrides aren't re-read ---
{
  const root = mkdtempSync(join(tmpdir(), "dwic-issue28-"));
  try {
    const app = `.a { color: red; }`;
    const page = `<h1>Oi</h1>`;
    for (const dir of ["src", ".claude/worktrees/copy/src", ".worktrees/copy/src"]) {
      mkdirSync(join(root, dir), { recursive: true });
      writeFileSync(join(root, dir, "app.css"), app);
      writeFileSync(join(root, dir, "Page.tsx"), page);
    }
    const walked = walkProject(root);
    check(walked.totals.cssCount === 1 && walked.totals.markupCount === 1, "worktree copies are not scanned", walked.totals);

    const overridden = walkProject(root, { cssOverrides: ["src/app.css"], markupOverrides: ["./src/Page.tsx"] });
    check(overridden.totals.cssCount === 1 && overridden.totals.markupCount === 1, "an override already walked isn't scanned twice", overridden.totals);

    mkdirSync(join(root, "extra"));
    writeFileSync(join(root, "extra", "other.css"), `.b { color: blue; }`);
    check(walkProject(root).totals.cssCount === 2, "ordinary folders are still scanned");

    check(Array.isArray(walked.markupSources) && walked.markupSources[0].path === "src/Page.tsx", "walker reports markup per file", walked.markupSources);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// --- 3. Headings are judged per page, not across the whole project -----------
{
  const pageA = `function Ajuda() {\n  return <h3>Ajuda</h3>;\n}\n\nexport default function PageA() {\n  return <section><h1>A</h1><h2>Mais</h2><Ajuda /></section>;\n}`;
  const pageB = `export default function PageB() {\n  return <section><h1>B</h1></section>;\n}`;
  const sources = [{ path: "src/PageA.tsx", content: pageA }, { path: "src/PageB.tsx", content: pageB }];
  const clean = category(aggregate(inputs("", `${pageA}\n\n${pageB}`, sources)), "accessibility");
  const headingFindings = (r) => r.findings.filter((f) => /<h1>|heading level/.test(f.message));
  check(headingFindings(clean).length === 0, "one <h1> per file and a helper's <h3> are not flagged", headingFindings(clean));

  const twoInOne = `export default function P() {\n  return <section><h1>A</h1><h1>B</h1></section>;\n}`;
  const dup = category(aggregate(inputs("", twoInOne, [{ path: "src/P.tsx", content: twoInOne }])), "accessibility");
  check(dup.findings.some((f) => /2 <h1>/.test(f.message) && /src\/P\.tsx/.test(f.element)), "two <h1> in one component still flagged, naming the file", dup.findings);

  const skip = `export default function P() {\n  return <section><h1>A</h1><h3>B</h3></section>;\n}`;
  const skipped = category(aggregate(inputs("", skip, [{ path: "src/P.tsx", content: skip }])), "accessibility");
  check(skipped.findings.some((f) => /heading level skipped/.test(f.message) && /src\/P\.tsx/.test(f.element)), "a real skip inside one component is still flagged", skipped.findings);

  const html = `<h1>A</h1><h1>B</h1>`;
  const page = category(aggregate(inputs("", html, [{ path: "index.html", content: html }])), "accessibility");
  check(page.findings.some((f) => /2 <h1>/.test(f.message)), "two <h1> in one HTML page still flagged", page.findings);

  const noH1 = [{ path: "a.tsx", content: `const A = () => <h2>A</h2>;` }, { path: "b.tsx", content: `const B = () => <h2>B</h2>;` }];
  const none = category(aggregate(inputs("", noH1.map((s) => s.content).join("\n\n"), noH1)), "accessibility");
  const noneFindings = none.findings.filter((f) => /no <h1>/.test(f.message));
  check(noneFindings.length === 1, "a project with no <h1> gets one finding, not one per file", noneFindings);

  const one = [{ path: "a.tsx", content: `const A = () => <h1>A</h1>;` }, { path: "b.tsx", content: `const B = () => <h2>B</h2>;` }];
  const oneResult = category(aggregate(inputs("", one.map((s) => s.content).join("\n\n"), one)), "accessibility");
  check(!oneResult.findings.some((f) => /no <h1>/.test(f.message)), "a file without <h1> is fine if the project has one", oneResult.findings);

  // Callers with no per-file breakdown (pasted snippets) keep the old behaviour.
  const pasted = category(aggregate(inputs("", `<h1>A</h1><h1>B</h1><h4>C</h4>`)), "accessibility");
  check(pasted.findings.some((f) => /2 <h1>/.test(f.message)) && pasted.findings.some((f) => /heading level/.test(f.message)), "snippets without file info still get heading checks", pasted.findings);
}

// --- 4. Skip links are recognised by what they do, in any language -----------
{
  const flagged = (m) => auditLandmarks(m).some((f) => f.element === "skip link");
  check(!flagged(`<a href="#conteudo" className="pular">Pular</a><main id="conteudo"></main>`), "link to <main>'s id counts, in any language");
  check(!flagged(`<a href="#x">Saltar</a><div role="main" id="x"></div>`), "link to role=main's id counts");
  check(!flagged(`<main id='x'></main><a href='#x'>Saltar</a>`), "single quotes and either order count");
  check(!flagged(`<a href="#main">Skip</a>`), "English convention still counts");
  check(flagged(`<a href="#outro">Ver</a><main id="conteudo"></main>`), "a link elsewhere is not a skip link");
  check(flagged(`<a href="/sobre">Sobre</a><main></main>`), "no in-page link still flagged");
}

// --- 5. All-caps: acronyms aren't shouting, repeats aren't many --------------
{
  check(auditShouting("CNPJ da empresa e novamente o CNPJ").length === 0, "one word repeated is not flagged");
  check(auditShouting("CNPJ e RTFM").length === 0, "words with no vowels read as acronyms");
  check(auditShouting("COMPRE AGORA hoje").length === 1, "real shouting still flagged");
  const mixed = auditShouting("CNPJ COMPRE AGORA");
  check(mixed.length === 1 && !/CNPJ/.test(mixed[0].message), "acronyms aren't listed in a real finding", mixed);
}

if (failed > 0) {
  process.stderr.write(`\n${failed} check(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nALL GOOD — issue #28 regressions covered.\n");
