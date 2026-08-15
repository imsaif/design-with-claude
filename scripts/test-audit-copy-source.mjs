#!/usr/bin/env node
// Regression test: the Copy category must analyse USER-FACING text only.
//
// Bug this pins: buildCopyResult passed raw component source to the prose path,
// whose only removal step was HTML tag-stripping. In HTML everything outside a
// tag is copy; in .tsx everything outside a tag is mostly code. The auditor was
// therefore reading comments, imports and type annotations as prose and
// reporting phantom sentence-length / shouting / jargon findings.
//
// Both halves matter. Extracting nothing would silence the false positives and
// also silence every real finding, so each "must not flag" case is paired with
// a "must still flag" case.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

const { aggregate } = await import(resolve(repoRoot, "dist/audit/aggregator.js"));

let failed = 0;
function pass(m) { process.stdout.write(`  ✔ ${m}\n`); }
function fail(m, extra) { failed++; process.stderr.write(`  ✘ ${m}\n`); if (extra) process.stderr.write(`    ${extra}\n`); }

const copyOf = (markup) => {
  const results = aggregate({ cssContent: "", markupContent: markup });
  return results.find((r) => r.category === "copy");
};

// --- 1. A long comment sentence must not be read as prose ---
{
  const src = `// This component renders a status card and every one of these words exists
// purely inside a source comment that no user will ever read, which is well
// over the thirty word threshold the sentence length check enforces on copy.
export function StatusCard() {
  return <div />;
}`;
  const copy = copyOf(src);
  const hit = copy.findings.find((f) => /sentence length/i.test(f.element));
  if (hit) fail("comment sentence flagged as long copy", hit.message.slice(0, 120));
  else pass("long source comment is not flagged as a long sentence");
}

// --- 2. ALL-CAPS in a comment must not be read as shouting ---
{
  const src = `// DETACHED VALUE and OFF-SCALE and REINVENTED are annotations, not copy.
export function Card() {
  return <div />;
}`;
  const copy = copyOf(src);
  const hit = copy.findings.find((f) => /shouting/i.test(f.element));
  if (hit) fail("all-caps in a comment flagged as shouting", hit.message.slice(0, 120));
  else pass("all-caps inside a source comment is not flagged as shouting");
}

// --- 3. Code constructs must not be read as prose ---
{
  const src = `export function Button({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "ghost" }) {
  return <button className="btn">{children}</button>;
}`;
  const copy = copyOf(src);
  const noisy = copy.findings.filter((f) => /sentence length|jargon|passive/i.test(f.element));
  if (noisy.length > 0) fail("type annotations / signature read as prose", noisy.map((f) => f.element).join(", "));
  else pass("function signature and type annotations are not read as prose");
}

// --- 4. Real JSX text MUST still be flagged (long sentence) ---
{
  const src = `export function Hero() {
  return <p>Our platform delivers a comprehensive and fully integrated solution that empowers your organisation to unlock measurable value across every single department without any of the usual friction that slows teams down.</p>;
}`;
  const copy = copyOf(src);
  const hit = copy.findings.find((f) => /sentence length/i.test(f.element));
  if (!hit) fail("real long JSX copy was NOT flagged — extraction is too aggressive");
  else pass("long sentence in real JSX text is still flagged");
}

// --- 5. Real JSX text MUST still be flagged (shouting) ---
{
  const src = `export function Banner() {
  return <div>URGENT THIS OFFER EXPIRES SOON</div>;
}`;
  const copy = copyOf(src);
  const hit = copy.findings.find((f) => /shouting/i.test(f.element));
  if (!hit) fail("real all-caps JSX copy was NOT flagged");
  else pass("all-caps in real JSX text is still flagged");
}

// --- 6. Weak CTA detection (tag-anchored path) must be unaffected ---
{
  const src = `export function Cta() {
  return <button>Click here</button>;
}`;
  const copy = copyOf(src);
  const hit = copy.findings.find((f) => /cta/i.test(f.element) || /generic|Weak verbs/i.test(f.message));
  if (!hit) fail("weak CTA no longer detected — the tag-anchored path regressed");
  else pass("weak CTA in a real button is still flagged");
}

// --- 7. User-facing attributes count as copy ---
{
  const src = `export function Field() {
  return <input placeholder="We leverage cutting-edge synergies to empower your team" />;
}`;
  const copy = copyOf(src);
  const hit = copy.findings.find((f) => /jargon/i.test(f.element) || /Jargon/i.test(f.message));
  if (!hit) fail("jargon in a placeholder was not flagged — attributes are user-facing copy");
  else pass("jargon in a placeholder attribute is flagged");
}

// --- 8. The real fixture must come back clean on Copy ---
{
  const { readFileSync } = await import("node:fs");
  const button = readFileSync(resolve(repoRoot, "examples/detached-values/src/components/Button.tsx"), "utf8");
  const statusCard = readFileSync(resolve(repoRoot, "examples/detached-values/src/components/StatusCard.tsx"), "utf8");
  const copy = copyOf(`${button}\n${statusCard}`);
  const noisy = copy.findings.filter((f) => /sentence length|shouting/i.test(f.element));
  if (noisy.length > 0) fail("detached-values fixture still yields phantom copy findings", noisy.map((f) => `${f.element}: ${f.message.slice(0, 60)}`).join(" | "));
  else pass("detached-values fixture yields no phantom sentence/shouting findings");
}

if (failed > 0) {
  process.stderr.write(`\n${failed} copy-source assertion(s) failed\n`);
  process.exit(1);
}
process.stdout.write("\ncopy-source: all assertions passed\n");
