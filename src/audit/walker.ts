// Filesystem walker for `dwic audit`. Finds the CSS + HTML/JSX inputs the
// audit helpers need, cheaply. Single-pass, sync, skip-set aware. No globs,
// no external dependencies — keeps startup < 50ms on a typical repo.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const SKIP_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".dwic",
  ".cache",
  ".vercel",
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".nyc_output",
  ".pnpm-store",
]);

const CSS_EXTS = new Set([".css"]);
const MARKUP_EXTS = new Set([".html", ".htm", ".jsx", ".tsx"]);

// Files we know carry design tokens even before we read them — prioritise in
// the merge order so the head of the combined CSS blob is the designer's
// intentional token surface, not a third-party preflight.
const HIGH_SIGNAL_CSS = new Set([
  "themes.css",
  "theme.css",
  "tokens.css",
  "design-tokens.css",
  "tokens",
]);

export interface WalkedInputs {
  cssFiles: string[];
  markupFiles: string[];
  cssContent: string;
  markupContent: string;
  totals: {
    cssCount: number;
    markupCount: number;
    cappedAt: number | null;
  };
}

function safeReadFile(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function safeReaddir(path: string): string[] {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function walkSync(root: string, onFile: (abs: string) => void): void {
  const stack: string[] = [root];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    for (const name of safeReaddir(cur)) {
      if (name.startsWith(".") && SKIP_DIRS.has(name)) continue;
      if (SKIP_DIRS.has(name)) continue;
      const abs = join(cur, name);
      if (isDir(abs)) {
        stack.push(abs);
      } else {
        onFile(abs);
      }
    }
  }
}

// Quick pre-filter: only include JSX/TSX files that actually contain an
// opening element. Rules out hooks, reducers, utility modules full of pure TS.
// Cheap test — lives inside the reader so we only read files we'd include.
const JSX_MARKER_RE = /<[A-Za-z][A-Za-z0-9]*[\s/>]/;

export function walkProject(
  cwd: string,
  overrides?: { cssOverrides?: string[]; markupOverrides?: string[]; maxFiles?: number },
): WalkedInputs {
  const cssAll: Array<{ path: string; content: string; highSignal: boolean }> = [];
  const markupAll: Array<{ path: string; content: string }> = [];
  const maxFiles = overrides?.maxFiles ?? 200;

  const absorbCssFile = (abs: string) => {
    const content = safeReadFile(abs);
    if (content === null) return;
    const base = abs.split("/").pop() ?? "";
    const highSignal = HIGH_SIGNAL_CSS.has(base);
    cssAll.push({ path: abs, content, highSignal });
  };
  const absorbMarkupFile = (abs: string) => {
    const content = safeReadFile(abs);
    if (content === null) return;
    const ext = extname(abs).toLowerCase();
    // JSX/TSX: only include if we see an element; .html always in.
    if ((ext === ".jsx" || ext === ".tsx") && !JSX_MARKER_RE.test(content)) return;
    markupAll.push({ path: abs, content });
  };

  walkSync(cwd, (abs) => {
    const ext = extname(abs).toLowerCase();
    if (CSS_EXTS.has(ext)) absorbCssFile(abs);
    else if (MARKUP_EXTS.has(ext)) absorbMarkupFile(abs);
  });

  // Overrides are additive — absolute or cwd-relative paths.
  for (const rel of overrides?.cssOverrides ?? []) {
    const abs = rel.startsWith("/") ? rel : join(cwd, rel);
    absorbCssFile(abs);
  }
  for (const rel of overrides?.markupOverrides ?? []) {
    const abs = rel.startsWith("/") ? rel : join(cwd, rel);
    absorbMarkupFile(abs);
  }

  // High-signal CSS first so token parsers see the designer's canonical tokens
  // ahead of framework preflight / reset styles.
  cssAll.sort((a, b) => (a.highSignal === b.highSignal ? 0 : a.highSignal ? -1 : 1));

  // Cap markup files (common CSS repos are small, markup repos aren't).
  let cappedAt: number | null = null;
  let markupPicked = markupAll;
  if (markupAll.length > maxFiles) {
    cappedAt = markupAll.length;
    markupPicked = markupAll.slice(0, maxFiles);
  }

  return {
    cssFiles: cssAll.map((f) => relative(cwd, f.path) || f.path),
    markupFiles: markupPicked.map((f) => relative(cwd, f.path) || f.path),
    cssContent: cssAll.map((f) => `/* ${relative(cwd, f.path) || f.path} */\n${f.content}`).join("\n\n"),
    markupContent: markupPicked.map((f) => f.content).join("\n\n"),
    totals: {
      cssCount: cssAll.length,
      markupCount: markupAll.length,
      cappedAt,
    },
  };
}
