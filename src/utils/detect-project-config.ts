// Project-config auto-detector. Runs once when the MCP server boots so the
// onboarding gate can surface pre-filled answers ("We detected Next.js 15 +
// Tailwind v4 from your package.json") instead of asking the designer all 6
// questions from scratch. Every filesystem read is wrapped in try/catch — any
// failure just reduces confidence rather than throwing.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseTokensFromCss } from "../tools/color.js";

export type Framework =
  | "nextjs"
  | "vite"
  | "remix"
  | "astro"
  | "expo"
  | "react-native"
  | "nuxt"
  | "sveltekit"
  | "unknown";

export interface DetectedProjectConfig {
  framework: Framework;
  frameworkVersion: string | null;
  techStack: string[];
  designSystemHints: string[];
  slug: string | null;
  confidence: "high" | "partial" | "none";
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,31}$/;
const TAILWIND_CONFIG_NAMES = [
  "tailwind.config.ts",
  "tailwind.config.js",
  "tailwind.config.mjs",
  "tailwind.config.cjs",
];
const TOKEN_CSS_CANDIDATES = [
  "themes.css",
  "theme.css",
  "tokens.css",
  "design-tokens.css",
  "globals.css",
  "app.css",
  "styles.css",
];
// Common locations within the project tree where the above files typically live.
const CSS_SEARCH_DIRS = ["", "src", "src/styles", "src/app", "app", "styles", "web"];

function safeReadFile(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function safeReadJson(path: string): Record<string, unknown> | null {
  const raw = safeReadFile(path);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function safeExists(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

function sanitizeSlug(name: string): string | null {
  const cleaned = name
    .toLowerCase()
    .replace(/^@[^/]+\//, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return SLUG_PATTERN.test(cleaned) ? cleaned : null;
}

function detectFramework(
  deps: Record<string, string>,
): { framework: Framework; version: string | null } {
  const pick = (k: string): string | null => (typeof deps[k] === "string" ? deps[k] : null);
  if (pick("next")) return { framework: "nextjs", version: pick("next") };
  if (pick("@remix-run/react") || pick("@remix-run/node")) {
    return { framework: "remix", version: pick("@remix-run/react") ?? pick("@remix-run/node") };
  }
  if (pick("astro")) return { framework: "astro", version: pick("astro") };
  if (pick("nuxt")) return { framework: "nuxt", version: pick("nuxt") };
  if (pick("@sveltejs/kit")) return { framework: "sveltekit", version: pick("@sveltejs/kit") };
  if (pick("expo")) return { framework: "expo", version: pick("expo") };
  if (pick("react-native")) return { framework: "react-native", version: pick("react-native") };
  if (pick("vite")) return { framework: "vite", version: pick("vite") };
  return { framework: "unknown", version: null };
}

function frameworkLabel(framework: Framework, version: string | null): string | null {
  if (framework === "unknown") return null;
  const pretty: Record<Exclude<Framework, "unknown">, string> = {
    nextjs: "Next.js",
    vite: "Vite",
    remix: "Remix",
    astro: "Astro",
    expo: "Expo",
    "react-native": "React Native",
    nuxt: "Nuxt",
    sveltekit: "SvelteKit",
  };
  const major = version?.match(/\d+/)?.[0];
  return major ? `${pretty[framework]} ${major}` : pretty[framework];
}

function detectTailwind(deps: Record<string, string>, cwd: string): string | null {
  const tw = deps["tailwindcss"];
  if (tw) {
    const major = tw.match(/\d+/)?.[0];
    if (major) return `Tailwind v${major}`;
    return "Tailwind";
  }
  // A config file without a deps entry still strongly suggests Tailwind is in play.
  for (const name of TAILWIND_CONFIG_NAMES) {
    if (safeExists(join(cwd, name))) return "Tailwind";
  }
  return null;
}

function pickViewLib(deps: Record<string, string>): string | null {
  if (deps["react"]) return "React";
  if (deps["vue"]) return "Vue";
  if (deps["svelte"]) return "Svelte";
  if (deps["solid-js"]) return "SolidJS";
  return null;
}

function isTypeScriptProject(deps: Record<string, string>, cwd: string): boolean {
  if (deps["typescript"]) return true;
  if (safeExists(join(cwd, "tsconfig.json"))) return true;
  return false;
}

function findTokenCssFiles(cwd: string): string[] {
  const found: string[] = [];
  for (const dir of CSS_SEARCH_DIRS) {
    const base = dir ? join(cwd, dir) : cwd;
    let entries: string[] = [];
    try {
      entries = readdirSync(base);
    } catch {
      continue;
    }
    for (const name of TOKEN_CSS_CANDIDATES) {
      if (entries.includes(name)) {
        const full = join(base, name);
        if (!found.includes(full)) found.push(full);
      }
    }
  }
  return found;
}

function summarizeDesignTokens(cssFiles: string[]): string[] {
  const hints: string[] = [];
  if (cssFiles.length === 0) return hints;
  // Combine up to the first two matching files — more is usually noise.
  const combined = cssFiles
    .slice(0, 2)
    .map((p) => safeReadFile(p) ?? "")
    .join("\n");
  if (!combined.trim()) return hints;

  const tokens = parseTokensFromCss(combined);
  const colorTokens = tokens.filter((t) => /^--color-/i.test(t.name));
  if (colorTokens.length > 0) {
    hints.push(`${colorTokens.length} \`--color-*\` token(s) detected in existing CSS`);
    // Look for a mandated accent — typical naming is --color-primary-{500|600|DEFAULT}.
    const accent = colorTokens.find((t) =>
      /--color-(primary|accent|brand)(-500|-600|-default)?$/i.test(t.name),
    );
    if (accent) hints.push(`Mandated accent candidate: \`${accent.name}\` = ${accent.hex}`);
  }

  // Detect a base spacing unit by looking for a small --space-* token.
  const spaceDeclRe = /--(?:space|spacing)-[a-z0-9-]+\s*:\s*([^;]+);/gi;
  const spaceValues: number[] = [];
  for (const m of combined.matchAll(spaceDeclRe)) {
    const raw = m[1].trim().match(/^([\d.]+)\s*(px|rem)/);
    if (!raw) continue;
    const num = Number(raw[1]);
    if (Number.isFinite(num) && num > 0) {
      spaceValues.push(raw[2] === "rem" ? num * 16 : num);
    }
  }
  if (spaceValues.length > 0) {
    const smallest = Math.min(...spaceValues);
    hints.push(`${spaceValues.length} \`--space-*\` token(s); smallest step ≈ ${smallest}px`);
  }

  return hints;
}

export function detectProjectConfig(cwd: string = process.cwd()): DetectedProjectConfig {
  const base = resolve(cwd);
  const pkg = safeReadJson(join(base, "package.json"));

  if (!pkg) {
    return {
      framework: "unknown",
      frameworkVersion: null,
      techStack: [],
      designSystemHints: [],
      slug: null,
      confidence: "none",
    };
  }

  const deps: Record<string, string> = {
    ...(typeof pkg.dependencies === "object" && pkg.dependencies
      ? (pkg.dependencies as Record<string, string>)
      : {}),
    ...(typeof pkg.devDependencies === "object" && pkg.devDependencies
      ? (pkg.devDependencies as Record<string, string>)
      : {}),
  };

  const { framework, version } = detectFramework(deps);
  const techStack: string[] = [];
  const fwLabel = frameworkLabel(framework, version);
  if (fwLabel) techStack.push(fwLabel);
  const view = pickViewLib(deps);
  if (view && (!fwLabel || !fwLabel.toLowerCase().includes(view.toLowerCase()))) {
    techStack.push(view);
  }
  if (isTypeScriptProject(deps, base)) techStack.push("TypeScript");
  const tailwind = detectTailwind(deps, base);
  if (tailwind) techStack.push(tailwind);

  const designSystemHints = summarizeDesignTokens(findTokenCssFiles(base));

  const rawName = typeof pkg.name === "string" ? pkg.name : null;
  const slug = rawName ? sanitizeSlug(rawName) : null;

  // Confidence heuristic — "high" when we can name the framework + at least one
  // companion signal (view lib or Tailwind or TS); "partial" when we have *any*
  // signal; "none" when package.json yielded nothing useful.
  let confidence: DetectedProjectConfig["confidence"] = "none";
  if (framework !== "unknown" && techStack.length >= 2) confidence = "high";
  else if (techStack.length > 0 || designSystemHints.length > 0 || slug) confidence = "partial";

  return {
    framework,
    frameworkVersion: version,
    techStack,
    designSystemHints,
    slug,
    confidence,
  };
}

// Render the detection result as a short markdown block so the onboarding gate
// response can drop it straight in without any additional formatting.
export function renderDetectionHints(detected: DetectedProjectConfig): string | null {
  if (detected.confidence === "none") return null;
  const lines: string[] = [];
  lines.push("## We detected these defaults from the project (confirm or correct before asking)");
  lines.push("");
  if (detected.techStack.length > 0) {
    lines.push(`- **Tech stack** (from \`package.json\`): ${detected.techStack.map((t) => `\`${t}\``).join(", ")}`);
  }
  if (detected.slug) {
    lines.push(`- **Suggested project slug**: \`${detected.slug}\``);
  }
  if (detected.designSystemHints.length > 0) {
    lines.push(`- **Design system hints** (from project CSS):`);
    for (const h of detected.designSystemHints) lines.push(`  - ${h}`);
  }
  lines.push("");
  lines.push(
    "When you ask the 6 onboarding questions, lead with these detected values: confirm them in one line, then ask for the fields dwic couldn't detect (product description, brand manual, experience level, tone).",
  );
  return lines.join("\n");
}
