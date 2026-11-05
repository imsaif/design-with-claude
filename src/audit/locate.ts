// Says which files a finding lives in. The audits judge the project as a whole, and
// that stays the source of truth: nothing here adds, removes or changes a finding.
// It re-runs an audit on each file alone and matches the results back.

import { stripCssComments } from "../tools/css-utils.js";

interface Source {
  path: string;
  content: string;
}

interface Locatable {
  element?: string;
  token?: string;
  message: string;
  files?: string[];
}

// About the project as a whole, so naming a file would mislead. Alone, every file
// "has no <main>".
const PROJECT_WIDE_RE =
  /^no <main>|^no <nav>|^no skip-to-content|^no <h1>|^Animations\/transitions declared|^Reduced-motion handling|outside any <form> element/;

// The same finding with its counts and quoted examples removed. A project-wide
// "9 inputs have no type" and one file's "2 inputs have no type" share this.
function kind(f: Locatable): string {
  const shape = f.message
    .replace(/\d+(\.\d+)?/g, "N")
    .replace(/"[^"]*"/g, '"x"')
    .replace(/`[^`]*`/g, "`x`")
    .slice(0, 48);
  return `${f.element ?? ""}|${shape}`;
}

export function locateMarkupFindings<T extends Locatable>(
  findings: T[],
  sources: Source[],
  auditOneFile: (content: string) => Locatable[],
): T[] {
  if (findings.length === 0 || sources.length === 0) return findings;
  const exact = new Map<string, string[]>();
  const byKind = new Map<string, Set<string>>();
  for (const { path, content } of sources) {
    for (const f of auditOneFile(content)) {
      const key = `${f.element ?? ""}|${f.message}`;
      exact.set(key, [...(exact.get(key) ?? []), path]);
      const k = kind(f);
      if (!byKind.has(k)) byKind.set(k, new Set());
      byKind.get(k)!.add(path);
    }
  }
  return findings.map((f) => {
    if (PROJECT_WIDE_RE.test(f.message)) return f;
    // Heading findings already name their file.
    if (f.element && /\(.+\)$/.test(f.element)) return f;
    // Identical findings are separate elements, so each takes the next file.
    const queue = exact.get(`${f.element ?? ""}|${f.message}`);
    if (queue?.length) return { ...f, files: [queue.shift()!] };
    const files = byKind.get(kind(f));
    return files?.size ? { ...f, files: [...files].sort() } : f;
  });
}

export function locateTokenFindings<T extends Locatable>(findings: T[], sources: Source[]): T[] {
  if (findings.length === 0 || sources.length === 0) return findings;
  const cleaned = sources.map(({ path, content }) => ({ path, css: stripCssComments(content) }));
  return findings.map((f) => {
    if (!f.token?.startsWith("--")) return f;
    const declared = new RegExp(`(?<![\\w-])${f.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`);
    const files = cleaned.filter((s) => declared.test(s.css)).map((s) => s.path);
    return files.length ? { ...f, files } : f;
  });
}

// Up to five files, for reading in a report.
export function formatFiles(files: string[] | undefined): string {
  if (!files?.length) return "";
  const shown = files.slice(0, 5).map((p) => `\`${p}\``).join(", ");
  return files.length > 5 ? `${shown} and ${files.length - 5} more` : shown;
}
