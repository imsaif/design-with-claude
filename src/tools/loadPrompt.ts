import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "../config.js";
import { renderDesignerContext } from "../designer.js";

const cache = new Map<string, string>();

export const EXPLICIT_ASK_DIRECTIVE = `## Before you respond — explicit asks come first

Reread the Designer's brief above and extract every EXPLICIT ASK you can find. Explicit asks include:

- Direct questions ("does X pass contrast?", "what weight should headings be?")
- Imperatives ("flag any a11y issues", "avoid 700/800 weights", "especially check turquoise on white")
- Numeric constraints ("base 15px", "ratio 1.2", "max weight 600", "68ch measure")
- Named constraints that rule things in or out ("Arial only", "Tailwind v4 compatible", "no dark mode")
- References to existing state ("audit the 60+ CSS vars in themes.css", "we already ship X")

Open your response with a section titled \`## Explicit asks from the brief\`. Answer each one by name — give the concrete answer (the hex, the ratio, the weight, the verdict) and show your working where it's a measurable claim (e.g. compute and print contrast ratios rather than asserting "passes AA"). Do not defer with "see below". If the brief contains no explicit asks, say "No explicit asks in the brief" on one line under that heading.

Only AFTER that section do you proceed with the default output described below. A seed palette that ignores a brief's a11y question is worse than no seed at all.`;

function stripFrontmatter(md: string): string {
  if (!md.startsWith("---")) return md;
  const end = md.indexOf("\n---", 3);
  if (end === -1) return md;
  return md.slice(end + 4).replace(/^\s+/, "");
}

export function loadPromptMarkdown(commandFile: string): string {
  if (cache.has(commandFile)) return cache.get(commandFile)!;
  const cfg = loadConfig();
  const path = join(cfg.commandsDir, commandFile);
  const raw = readFileSync(path, "utf8");
  const body = stripFrontmatter(raw);
  cache.set(commandFile, body);
  return body;
}

export function composeRolePrompt(args: {
  roleName: string;
  commandFile: string;
  sections: Array<{ heading: string; body: string }>;
  closingInstruction: string;
}): string {
  const role = loadPromptMarkdown(args.commandFile);
  const designerContext = renderDesignerContext();
  const parts: string[] = [
    `# Role: ${args.roleName}`,
    "",
    role,
    "",
    "---",
    "",
  ];
  if (designerContext) {
    parts.push(designerContext, "", "---", "");
  }
  for (const s of args.sections) {
    parts.push(`## ${s.heading}`, "", s.body.trim(), "");
  }
  parts.push(
    "---",
    "",
    EXPLICIT_ASK_DIRECTIVE,
    "",
    "---",
    "",
    args.closingInstruction.trim(),
    "",
    "End your response with a `## What to do next` section: 2–3 specific next moves a senior designer would suggest based on what you just generated and what's still missing from this designer's system. Frame them as momentum, not a checklist.",
  );
  return parts.join("\n");
}
