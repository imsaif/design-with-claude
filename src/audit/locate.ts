// Says which files a finding lives in. The audits judge the project as a whole, and
// that stays the source of truth: nothing here adds, removes or changes a finding.
// It re-runs an audit on each file alone and matches the results back.

interface Source {
  path: string;
  content: string;
}

interface Locatable {
  element?: string;
  token?: string;
  message: string;
  files?: string[];
  line?: number;
  // The element's real opening tag, when `element` is only a label like "<button>".
  tag?: string;
  // Which match of that tag it is, when several share the same text.
  nth?: number;
}

// Comments blanked, with line breaks kept so line numbers stay true.
function blankComments(source: string): string {
  const blank = (m: string) => m.replace(/[^\n]/g, " ");
  return source
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/(?<![\w"'`*/:.-])\/\*[\s\S]*?\*\//g, blank)
    .replace(/^[ \t]*\/\/[^\n]*$/gm, blank);
}

const lineAt = (text: string, index: number) => text.slice(0, index).split("\n").length;

// Finds a tag as the audit printed it: whitespace collapsed, `{...}` values shown as
// `{}`, and long tags cut short with an ellipsis.
function findTagLine(source: string, tag: string, nth = 0): number | undefined {
  const pattern = tag
    .replace(/…$/, "")
    .trim()
    .split(/(\{\})/)
    .map((part) =>
      part === "{}"
        ? "\\{[\\s\\S]{0,4000}?\\}"
        : part
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            .replace(/\s+/g, "\\s+")
            // Uppercase tags in old HTML are lowercased before the audit reads them.
            .replace(/^<(\/?)([a-z0-9]+)/, (_, slash: string, name: string) => `<${slash}(?:${name}|${name.toUpperCase()})`),
    )
    .join("");
  let re: RegExp;
  try {
    re = new RegExp(pattern, "g");
  } catch {
    return undefined;
  }
  const clean = blankComments(source);
  let index = -1;
  for (let i = 0; i <= nth; i++) {
    const m = re.exec(clean);
    if (!m) return index >= 0 ? lineAt(clean, index) : undefined;
    index = m.index;
  }
  return lineAt(clean, index);
}

// Motion findings point at a declaration rather than a tag.
const DECLARATION_BY_ELEMENT: Record<string, RegExp> = {
  "transition: all": /transition[\w-]*\s*:[^;{}]*\ball\b/i,
  "animation-iteration-count: infinite": /animation[\w-]*\s*:[^;{}]*\binfinite\b/i,
};

function lineFor(f: Locatable, source: string): number | undefined {
  const tag = f.tag ?? f.element;
  if (!tag) return undefined;
  const declaration = DECLARATION_BY_ELEMENT[tag];
  if (declaration) {
    const clean = source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
    const m = declaration.exec(clean);
    return m ? lineAt(clean, m.index) : undefined;
  }
  // Labels such as "<nav>" with no attributes could be any of several elements.
  if (!f.tag && !/^<[A-Za-z][\w.]*\s/.test(tag)) return undefined;
  return findTagLine(source, tag, f.nth ?? 0);
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
  const exact = new Map<string, Array<{ path: string; line?: number }>>();
  const byKind = new Map<string, Set<string>>();
  for (const { path, content } of sources) {
    // Identical tags are all flagged alike, so each next finding is the next match.
    const seen = new Map<string, number>();
    for (const f of auditOneFile(content)) {
      const tag = f.tag ?? f.element ?? "";
      const nth = f.nth ?? seen.get(tag) ?? 0;
      seen.set(tag, nth + 1);
      const key = `${f.element ?? ""}|${f.message}`;
      exact.set(key, [...(exact.get(key) ?? []), { path, line: lineFor({ ...f, nth }, content) }]);
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
    if (queue?.length) {
      const { path, line } = queue.shift()!;
      return { ...f, files: [path], ...(line ? { line } : {}) };
    }
    const files = byKind.get(kind(f));
    return files?.size ? { ...f, files: [...files].sort() } : f;
  });
}

export function locateTokenFindings<T extends Locatable>(findings: T[], sources: Source[]): T[] {
  if (findings.length === 0 || sources.length === 0) return findings;
  const cleaned = sources.map(({ path, content }) => ({ path, css: blankComments(content) }));
  return findings.map((f) => {
    if (!f.token?.startsWith("--")) return f;
    const declared = new RegExp(`(?<![\\w-])${f.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`);
    const hits = cleaned.filter((s) => declared.test(s.css));
    if (hits.length === 0) return f;
    const m = hits.length === 1 ? declared.exec(hits[0]!.css) : null;
    return { ...f, files: hits.map((s) => s.path), ...(m ? { line: lineAt(hits[0]!.css, m.index) } : {}) };
  });
}

// `src/App.tsx:18`, for reading and clicking in a terminal.
export function formatPlace(f: { files?: string[]; line?: number }): string {
  if (!f.files?.length) return "";
  if (f.files.length === 1) return f.line ? `${f.files[0]}:${f.line}` : f.files[0]!;
  return f.files.length > 5 ? `${f.files.slice(0, 5).join(", ")} and ${f.files.length - 5} more` : f.files.join(", ");
}
