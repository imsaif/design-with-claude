#!/usr/bin/env node
// Single source of truth for what each skill says it is for.
//
// The description lived in two places: the `description:` frontmatter of
// `commands/<slug>.md` (which Claude reads to decide whether to fire a skill)
// and a hand-maintained copy in `web/app/data/skills.ts` (which renders the
// library card a person reads to decide whether to install). Rewriting the 48
// command descriptions on 2026-08-21 desynced them immediately, which is the
// same failure `sync-counts.mjs` was written to stop for the skill count.
//
// The two surfaces need different lengths, so this does NOT copy the text
// wholesale. Every command description is written as two sentences:
//
//   Use when a cart or checkout is losing people.   <- the symptom: the card
//   Abandoned carts, long payment forms, ...        <- situations: Claude only
//
// The card gets sentence one (~56 chars, in line with what the cards already
// carried). Claude gets both. One edit in the command file updates both.
//
//   node scripts/sync-skill-descriptions.mjs          rewrite the site data
//   node scripts/sync-skill-descriptions.mjs --check  exit 1 if stale (for CI)

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COMMANDS = join(ROOT, "commands");
const SITE_DATA = join(ROOT, "web", "app", "data", "skills.ts");

// A card line longer than this wraps past the space the card reserves. The
// existing hand-written cards topped out at 121, so that is the ceiling.
const MAX_CARD_CHARS = 121;

const check = process.argv.includes("--check");

/** First sentence of a command description, which is the symptom line. */
function cardLine(description) {
  const cut = description.indexOf(". ");
  const first = cut === -1 ? description : description.slice(0, cut + 1);
  return first.trim();
}

function readCommandDescriptions() {
  const out = new Map();
  for (const file of readdirSync(COMMANDS).filter((f) => f.endsWith(".md")).sort()) {
    const slug = file.slice(0, -3);
    const text = readFileSync(join(COMMANDS, file), "utf8");
    const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
    if (!fm) throw new Error(`${file}: no frontmatter`);
    const dm = fm[1].match(/^description:\s*(.+)$/m);
    if (!dm) throw new Error(`${file}: no description`);
    // Strip surrounding quotes if the value is a quoted YAML scalar.
    const desc = dm[1].trim().replace(/^"(.*)"$/s, "$1");
    out.set(slug, cardLine(desc));
  }
  return out;
}

const cards = readCommandDescriptions();

const tooLong = [...cards].filter(([, line]) => line.length > MAX_CARD_CHARS);
if (tooLong.length) {
  console.error(`Card line over ${MAX_CARD_CHARS} chars. Shorten the FIRST sentence of the command description:`);
  for (const [slug, line] of tooLong) console.error(`  ${slug} (${line.length}) ${line}`);
  process.exit(1);
}

let source = readFileSync(SITE_DATA, "utf8");
const before = source;
const seen = new Set();
const missing = [];

// Rewrite the `description` of each SKILLS entry, keyed by its slug. The entry
// shape is stable: slug, name, description, in that order.
source = source.replace(
  /(\n\s*slug:\s*"([^"]+)",\n\s*name:\s*"[^"]*",\n\s*description:\s*)"[^"]*"/g,
  (whole, head, slug) => {
    const line = cards.get(slug);
    if (!line) {
      missing.push(slug);
      return whole;
    }
    seen.add(slug);
    return `${head}${JSON.stringify(line)}`;
  }
);

if (missing.length) {
  console.error(`Site lists skills with no command file: ${missing.join(", ")}`);
  process.exit(1);
}

const unlisted = [...cards.keys()].filter((s) => !seen.has(s));
if (unlisted.length) {
  console.error(`Commands with no card on the site: ${unlisted.join(", ")}`);
  console.error("Add them to web/app/data/skills.ts (slug, name, category, level, icon), then re-run.");
  process.exit(1);
}

if (check) {
  if (source !== before) {
    console.error("web/app/data/skills.ts is stale. Run: node scripts/sync-skill-descriptions.mjs");
    process.exit(1);
  }
  console.log(`✓ ${seen.size} card descriptions match their command files`);
  process.exit(0);
}

if (source === before) {
  console.log(`✓ already in sync (${seen.size} skills)`);
} else {
  writeFileSync(SITE_DATA, source);
  console.log(`✓ synced ${seen.size} card descriptions from commands/ into web/app/data/skills.ts`);
}
