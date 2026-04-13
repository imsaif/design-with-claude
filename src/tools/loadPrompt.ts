import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "../config.js";

const cache = new Map<string, string>();

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
  const parts: string[] = [
    `# Role: ${args.roleName}`,
    "",
    role,
    "",
    "---",
    "",
  ];
  for (const s of args.sections) {
    parts.push(`## ${s.heading}`, "", s.body.trim(), "");
  }
  parts.push("---", "", args.closingInstruction.trim());
  return parts.join("\n");
}
