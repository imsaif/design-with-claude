// File watcher for `dwic audit --watch`. Uses native fs.watch with recursive
// mode (supported on macOS + Windows; Linux gracefully degrades to no-op).
// No external deps — chokidar would be nicer but adds 100KB+. Acceptable
// trade-off given the watcher's scope.

import { watch, type FSWatcher } from "node:fs";
import { sep } from "node:path";

const WATCHED_EXTS = new Set([".css", ".tsx", ".jsx", ".html", ".htm", ".ts"]);

const SKIP_DIR_SEGMENTS = new Set([
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

export interface WatcherOptions {
  /** Project root to watch. */
  cwd: string;
  /** Debounce window in ms — coalesces save bursts (typescript-tools-rewriter etc). */
  debounceMs?: number;
  /** Called when a relevant file changes. Receives the relative path. */
  onChange: (relativePath: string) => void | Promise<void>;
  /** Optional logger for warnings (e.g. Linux degradation). Defaults to stderr. */
  warn?: (msg: string) => void;
}

function isRelevantPath(relPath: string): boolean {
  // Skip if any path segment is in the ignore set.
  const parts = relPath.split(sep);
  for (const part of parts) {
    if (SKIP_DIR_SEGMENTS.has(part)) return false;
  }
  // Match by extension.
  const dot = relPath.lastIndexOf(".");
  if (dot === -1) return false;
  const ext = relPath.slice(dot).toLowerCase();
  return WATCHED_EXTS.has(ext);
}

/**
 * Start watching cwd. Returns a stop() function that closes the watcher.
 *
 * On Linux, fs.watch does not support `recursive: true`; we fall back to
 * watching the cwd shallowly (CSS files at the root will still trigger). The
 * warn() callback fires once on startup so the user knows.
 */
export function startWatcher(opts: WatcherOptions): { stop: () => void } {
  const debounceMs = opts.debounceMs ?? 300;
  const warn = opts.warn ?? ((m) => process.stderr.write(m + "\n"));

  let pending: Map<string, NodeJS.Timeout> = new Map();
  let watcher: FSWatcher | null = null;

  const fire = (relPath: string) => {
    const existing = pending.get(relPath);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      pending.delete(relPath);
      void opts.onChange(relPath);
    }, debounceMs);
    pending.set(relPath, t);
  };

  try {
    watcher = watch(opts.cwd, { recursive: true, persistent: true }, (_event, filename) => {
      if (!filename) return;
      const rel = filename.toString();
      if (!isRelevantPath(rel)) return;
      fire(rel);
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("recursive") || process.platform === "linux") {
      warn(
        "dwic watch: recursive fs.watch not supported on this platform; only shallow changes will trigger.",
      );
      try {
        watcher = watch(opts.cwd, { persistent: true }, (_event, filename) => {
          if (!filename) return;
          const rel = filename.toString();
          if (!isRelevantPath(rel)) return;
          fire(rel);
        });
      } catch {
        warn("dwic watch: could not start fs.watch — watcher disabled.");
      }
    } else {
      warn(`dwic watch: ${msg}`);
    }
  }

  return {
    stop: () => {
      for (const t of pending.values()) clearTimeout(t);
      pending.clear();
      watcher?.close();
      watcher = null;
    },
  };
}
