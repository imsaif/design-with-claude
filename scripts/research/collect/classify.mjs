// Frontend/non-frontend classification, mirroring the study #2 method doc
// (docs/research/agentic-terminal-workflow-study.md §4 "Frontend slice").
//
// Rule (reproducible — do not "improve" without updating the method doc):
//   1. package.json present -> frontend IFF it declares a known frontend dep;
//      otherwise non-frontend (package.json is authoritative, no language fallback).
//   2. no package.json -> frontend IFF the repo's primary language is a static-UI
//      language (HTML/CSS/Vue/Svelte/Astro).
//   3. else -> non-frontend.

import { execFileSync } from "node:child_process";

export const FRONTEND_DEPS = [
  "react", "react-dom", "next", "vue", "svelte", "@angular/core",
  "astro", "nuxt", "solid-js", "tailwindcss", "@radix-ui", "vite",
];

export const FRONTEND_LANGUAGES = ["HTML", "CSS", "Vue", "Svelte", "Astro"];

// Pure. { packageJson: object|null, primaryLanguage: string|null } -> boolean
export function classifyFrontend({ packageJson, primaryLanguage }) {
  if (packageJson && typeof packageJson === "object") {
    const deps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
      ...(packageJson.peerDependencies || {}),
    };
    return Object.keys(deps).some((name) => FRONTEND_DEPS.includes(name));
  }
  return Boolean(primaryLanguage && FRONTEND_LANGUAGES.includes(primaryLanguage));
}

// Network. Fetches the two inputs classifyFrontend needs for a repo.
// Fail-open: any missing/unreadable input reduces confidence, never throws.
export function fetchClassificationInputs(repo, gh) {
  let packageJson = null;
  let primaryLanguage = null;
  try {
    const content = gh([
      "api", "-X", "GET", `repos/${repo}/contents/package.json`, "--jq", ".content",
    ]).trim();
    if (content) {
      packageJson = JSON.parse(Buffer.from(content, "base64").toString("utf8"));
    }
  } catch {
    // no package.json (static site / non-JS repo) — fall through to language
  }
  try {
    primaryLanguage = gh(["api", "-X", "GET", `repos/${repo}`, "--jq", ".language"]).trim();
    if (primaryLanguage === "null" || primaryLanguage === "") primaryLanguage = null;
  } catch {
    // language unavailable — leave null
  }
  return { packageJson, primaryLanguage };
}

// Shared gh runner used by the network modules + CLI.
export function ghRunner(args) {
  return execFileSync("gh", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
}
