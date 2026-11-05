// Filesystem walker for `dwic audit`. Finds the CSS + HTML/JSX inputs the
// audit helpers need, cheaply. Single-pass, sync, skip-set aware. No globs,
// no external dependencies — keeps startup < 50ms on a typical repo.

import { readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const SKIP_DIRS = new Set([
  ".git",
  // Agent worktrees hold whole copies of the project; scanning them doubles
  // every finding.
  ".claude",
  ".worktrees",
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
  // Test code renders markup too, but no user ever sees it.
  "__tests__",
  "__mocks__",
  "__fixtures__",
  "tests",
  "test",
  "e2e",
  "cypress",
]);

const NON_UI_FILE_RE = /\.(test|spec|stories|story)\.[a-z]+$/i;

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
  // The same markup, file by file. Checks whose meaning depends on what shares
  // a page (heading order, <h1> count) use this instead of the concatenation.
  markupSources?: Array<{ path: string; content: string }>;
  cssSources?: Array<{ path: string; content: string }>;
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

function realPath(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
}

function walkSync(root: string, onFile: (abs: string) => void): void {
  const stack: string[] = [root];
  // Each real folder once: a symlink back up the tree would otherwise scan the
  // same files over and over and multiply every finding.
  const visited = new Set<string>();
  while (stack.length > 0) {
    const cur = stack.pop()!;
    const real = realPath(cur);
    if (visited.has(real)) continue;
    visited.add(real);
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
  // An override naming a file the walk already found must not scan it twice.
  const seenPaths = new Set<string>();
  const firstSighting = (abs: string): boolean => {
    const key = realPath(abs);
    if (seenPaths.has(key)) return false;
    seenPaths.add(key);
    return true;
  };

  const absorbCssFile = (abs: string) => {
    if (!firstSighting(abs)) return;
    const content = safeReadFile(abs);
    if (content === null) return;
    const base = abs.split("/").pop() ?? "";
    const highSignal = HIGH_SIGNAL_CSS.has(base);
    cssAll.push({ path: abs, content, highSignal });
  };
  const absorbMarkupFile = (abs: string) => {
    if (!firstSighting(abs)) return;
    const content = safeReadFile(abs);
    if (content === null) return;
    const ext = extname(abs).toLowerCase();
    // JSX/TSX: only include if we see an element; .html always in.
    if ((ext === ".jsx" || ext === ".tsx") && !JSX_MARKER_RE.test(content)) return;
    markupAll.push({ path: abs, content });
  };

  walkSync(cwd, (abs) => {
    if (NON_UI_FILE_RE.test(abs)) return;
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
    markupSources: markupPicked.map((f) => ({ path: relative(cwd, f.path) || f.path, content: f.content })),
    cssSources: cssAll.map((f) => ({ path: relative(cwd, f.path) || f.path, content: f.content })),
    totals: {
      cssCount: cssAll.length,
      markupCount: markupAll.length,
      cappedAt,
    },
  };
}
