// Form-structure audit helpers for form-designer. Focused on patterns
// a11y + forms get wrong together but that form-designer owns: required
// markers, error-hint wiring, fieldset grouping, default input type,
// password UX, multi-submit discrimination, orphaned inputs.

export interface FormFinding {
  severity: "error" | "warn" | "info";
  element: string;
  message: string;
}

const INPUT_RE = /<(input|textarea|select)\b([^>]*)\/?>/gi;
const BUTTON_RE = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
const FORM_RE = /<form\b[^>]*>[\s\S]*?<\/form>/gi;
const FIELDSET_RE = /<fieldset\b[^>]*>[\s\S]*?<\/fieldset>/gi;

function hasAttr(tag: string, name: string): boolean {
  const re = new RegExp(`\\b${name}\\s*=|\\b${name}\\b(?=\\s|/|>)`, "i");
  return re.test(tag);
}

function attrValue(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^}]+)\\})`, "i");
  const m = tag.match(re);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? null;
}

function truncate(s: string, max = 80): string {
  const c = s.replace(/\s+/g, " ");
  return c.length <= max ? c : `${c.slice(0, max - 1)}…`;
}

// Inputs must live inside a <form> to submit natively. Controlled React
// forms don't care, but flagging surfaces designer intent.
export function auditFormWrapper(markup: string): FormFinding[] {
  const findings: FormFinding[] = [];
  const allInputs = markup.match(INPUT_RE) ?? [];
  if (allInputs.length === 0) return findings;
  const forms = markup.match(FORM_RE) ?? [];
  if (forms.length === 0) {
    findings.push({
      severity: "warn",
      element: "<form>",
      message: `${allInputs.length} input(s) detected outside any <form> element. Native submit + Enter-to-submit + reset semantics require a <form> wrapper.`,
    });
    return findings;
  }
  // Count inputs inside forms; if fewer than total, some are orphaned
  let inForm = 0;
  for (const f of forms) inForm += (f.match(INPUT_RE) ?? []).length;
  if (inForm < allInputs.length) {
    findings.push({
      severity: "warn",
      element: "<input> outside <form>",
      message: `${allInputs.length - inForm} input(s) live outside any <form>. Confirm those are genuinely standalone and not a missed wrap.`,
    });
  }
  return findings;
}

// Inputs without an explicit type default to text. Usually fine, but forms
// with no type anywhere often signal a copy-pasted snippet.
export function auditInputTypes(markup: string): FormFinding[] {
  const findings: FormFinding[] = [];
  const re = new RegExp(INPUT_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(markup)) !== null) {
    const element = m[1].toLowerCase();
    if (element !== "input") continue;
    const full = m[0];
    if (!hasAttr(full, "type")) {
      findings.push({
        severity: "info",
        element: truncate(full),
        message: "no explicit type — defaults to `text`. Use `email` / `tel` / `url` / `number` to unlock mobile keyboards + validation.",
      });
    }
  }
  return findings;
}

// Required markers: <input required> is the real thing. A `*` in label text
// without `required` is a visual tax without semantic payoff.
export function auditRequiredMarkers(markup: string): FormFinding[] {
  const findings: FormFinding[] = [];
  // Find labels that contain a literal asterisk
  const labelWithAsterisk = markup.matchAll(/<label\b[^>]*>([^<]*\*[^<]*)<\/label>/gi);
  const starLabels = Array.from(labelWithAsterisk);
  // Find inputs with required attribute
  const requiredInputs = (markup.match(INPUT_RE) ?? []).filter((t) => hasAttr(t, "required"));
  if (starLabels.length > 0 && requiredInputs.length === 0) {
    findings.push({
      severity: "warn",
      element: "required markers",
      message: `${starLabels.length} label(s) contain a "*" asterisk, but no input has a \`required\` attribute. Screen-reader users don't hear the asterisk — add \`required\` (or \`aria-required\`) on the input.`,
    });
  }
  return findings;
}

// Password inputs should have a show/hide toggle OR be paired with an
// explicit reveal control; otherwise typos compound. We can't detect the
// toggle reliably, so we emit an info-level reminder.
export function auditPasswordFields(markup: string): FormFinding[] {
  const findings: FormFinding[] = [];
  const passwords = (markup.match(INPUT_RE) ?? []).filter((t) => {
    const type = attrValue(t, "type");
    return type && type.toLowerCase() === "password";
  });
  if (passwords.length === 0) return findings;
  // Heuristic: look for text like "show", "reveal", "visibility", type="button" near it
  const hasReveal = /show[- ]?password|reveal|visibility|aria-label\s*=\s*["']show/i.test(markup);
  if (!hasReveal) {
    findings.push({
      severity: "info",
      element: "<input type=\"password\">",
      message: `${passwords.length} password field(s) detected with no visible reveal toggle. Typo-rich input + hidden chars frustrates users; consider a show/hide button with \`aria-pressed\`.`,
    });
  }
  return findings;
}

// Inputs with error hints should use aria-describedby to wire the message.
// We can't know if text IS an error; we flag inputs adjacent to elements
// with id containing "error"/"hint" that aren't referenced.
export function auditErrorWiring(markup: string): FormFinding[] {
  const findings: FormFinding[] = [];
  const errorHintIds = Array.from(
    markup.matchAll(/<[^>]+\bid\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>(?:[^<]*(?:error|hint|help|invalid))/gi),
  )
    .map((m) => (m[1] ?? m[2] ?? "").trim())
    .filter(Boolean);
  if (errorHintIds.length === 0) return findings;
  const referencedIds = new Set<string>();
  const describedByMatches = markup.matchAll(/aria-describedby\s*=\s*(?:"([^"]+)"|'([^']+)')/gi);
  for (const m of describedByMatches) {
    const val = (m[1] ?? m[2] ?? "").trim();
    for (const id of val.split(/\s+/)) referencedIds.add(id);
  }
  const orphaned = errorHintIds.filter((id) => !referencedIds.has(id));
  if (orphaned.length > 0) {
    findings.push({
      severity: "error",
      element: "aria-describedby",
      message: `${orphaned.length} error/hint element(s) exist (ids: ${orphaned
        .slice(0, 5)
        .map((i) => `\`${i}\``)
        .join(", ")}) but no input references them via \`aria-describedby\`. Screen readers won't announce the hint with the field.`,
    });
  }
  return findings;
}

// Groups of radios / checkboxes with a shared name should be wrapped in
// <fieldset><legend>. Without it, screen readers don't announce the group label.
export function auditFieldsetGrouping(markup: string): FormFinding[] {
  const findings: FormFinding[] = [];
  const radioCheckGroups = new Map<string, number>();
  const re = new RegExp(INPUT_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(markup)) !== null) {
    if (m[1].toLowerCase() !== "input") continue;
    const type = attrValue(m[0], "type");
    if (!type || !["radio", "checkbox"].includes(type.toLowerCase())) continue;
    const name = attrValue(m[0], "name");
    if (!name) continue;
    radioCheckGroups.set(name, (radioCheckGroups.get(name) ?? 0) + 1);
  }
  const groupNames = Array.from(radioCheckGroups.entries())
    .filter(([, count]) => count >= 2)
    .map(([name]) => name);
  if (groupNames.length === 0) return findings;

  const fieldsets = markup.match(FIELDSET_RE) ?? [];
  const namesInFieldset = new Set<string>();
  for (const fs of fieldsets) {
    const inputs = fs.match(INPUT_RE) ?? [];
    for (const inp of inputs) {
      const n = attrValue(inp, "name");
      if (n) namesInFieldset.add(n);
    }
  }
  const unwrapped = groupNames.filter((n) => !namesInFieldset.has(n));
  if (unwrapped.length > 0) {
    findings.push({
      severity: "warn",
      element: "<fieldset>",
      message: `radio/checkbox group(s) \`${unwrapped
        .map((n) => n)
        .join(", ")}\` not wrapped in a <fieldset><legend>. Screen readers won't announce the group label with each option.`,
    });
  }
  return findings;
}

// Submit buttons inside a form — more than one needs `name`/`value` so the
// server can tell which was clicked.
export function auditMultipleSubmits(markup: string): FormFinding[] {
  const findings: FormFinding[] = [];
  const forms = markup.match(FORM_RE) ?? [];
  for (const form of forms) {
    const submits: string[] = [];
    // type-omitted <button> inside a <form> defaults to submit
    let bm: RegExpExecArray | null;
    const bre = new RegExp(BUTTON_RE.source, "gi");
    while ((bm = bre.exec(form)) !== null) {
      const type = attrValue(`<button${bm[1]}>`, "type");
      if (!type || type.toLowerCase() === "submit") submits.push(`<button${bm[1]}>`);
    }
    // <input type="submit">
    const ire = new RegExp(INPUT_RE.source, "gi");
    let im: RegExpExecArray | null;
    while ((im = ire.exec(form)) !== null) {
      const type = attrValue(im[0], "type");
      if (type && type.toLowerCase() === "submit") submits.push(im[0]);
    }
    if (submits.length <= 1) continue;
    const withoutName = submits.filter((s) => !hasAttr(s, "name"));
    if (withoutName.length > 0) {
      findings.push({
        severity: "warn",
        element: "multiple submits",
        message: `${submits.length} submit controls in one <form>, ${withoutName.length} without a \`name\` attribute. Server can't tell which was pressed.`,
      });
    }
  }
  return findings;
}

export function runFormAudit(markup: string): FormFinding[] {
  return [
    ...auditFormWrapper(markup),
    ...auditInputTypes(markup),
    ...auditRequiredMarkers(markup),
    ...auditPasswordFields(markup),
    ...auditErrorWiring(markup),
    ...auditFieldsetGrouping(markup),
    ...auditMultipleSubmits(markup),
  ];
}
