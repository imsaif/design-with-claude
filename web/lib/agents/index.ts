import fs from "fs";
import path from "path";

export interface AgentKnowledge {
  slug: string;
  description: string;
  category: string;
  content: string;
}

// Category mapping for all agents
const AGENT_CATEGORIES: Record<string, string> = {
  "design-brief": "master",
  "visual-hierarchy-specialist": "core-design",
  "interaction-designer": "core-design",
  "design-system-architect": "core-design",
  "accessibility-specialist": "core-design",
  "typography-specialist": "visual-design",
  "color-specialist": "visual-design",
  "spacing-layout-specialist": "visual-design",
  "motion-designer": "interaction",
  "form-designer": "interaction",
  "navigation-specialist": "interaction",
  "dashboard-designer": "product",
  "mobile-specialist": "product",
  "responsive-design-specialist": "product",
  "landing-page-specialist": "product",
  "dark-mode-specialist": "specialized",
  "error-handling-specialist": "specialized",
  "onboarding-specialist": "specialized",
  "performance-specialist": "specialized",
  "data-visualization-specialist": "specialized",
  "table-designer": "specialized",
  "search-specialist": "specialized",
  "healthcare-ux-specialist": "industry",
  "b2b-saas-specialist": "industry",
  "ecommerce-specialist": "industry",
  "checkout-specialist": "industry",
  "brand-designer": "content-brand",
  "content-strategist": "content-brand",
  "information-architect": "content-brand",
  "conversational-ui-designer": "content-brand",
  "notification-designer": "specialized",
  "empty-loading-states-specialist": "specialized",
  "settings-designer": "specialized",
  "icon-illustration-specialist": "visual-design",
  "i18n-designer": "specialized",
  "auth-security-ux-specialist": "specialized",
  "drag-drop-specialist": "interaction",
  "print-export-designer": "specialized",
  // Technical
  "setup-guide": "technical",
  "code-explainer": "technical",
  "database-setup": "technical",
  "environment-setup": "technical",
  "auth-implementation": "technical",
  "deploy-to-vercel": "technical",
  "debug-helper": "technical",
};

let agentMap: Map<string, AgentKnowledge> | null = null;

function loadAgents(): Map<string, AgentKnowledge> {
  if (agentMap) return agentMap;

  agentMap = new Map();

  // Commands are copied to this directory at build time via prebuild script
  // In development, fall back to reading from the repo root
  const commandsDir = path.join(process.cwd(), "lib", "agents", "commands");
  const fallbackDir = path.join(process.cwd(), "..", "commands");

  const dir = fs.existsSync(commandsDir) ? commandsDir : fallbackDir;

  if (!fs.existsSync(dir)) {
    console.warn(`Commands directory not found at ${dir}`);
    return agentMap;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const slug = file.replace(".md", "");
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");

    // Parse YAML frontmatter
    let description = "";
    let content = raw;

    const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      content = frontmatterMatch[2].trim();
      const descMatch = frontmatter.match(/description:\s*(.+)/);
      if (descMatch) description = descMatch[1].trim();
    }

    agentMap.set(slug, {
      slug,
      description,
      category: AGENT_CATEGORIES[slug] || "specialized",
      content,
    });
  }

  return agentMap;
}

export function getAgent(slug: string): AgentKnowledge | undefined {
  return loadAgents().get(slug);
}

export function getAllAgents(): AgentKnowledge[] {
  return Array.from(loadAgents().values());
}

export function getAgentsByCategory(category: string): AgentKnowledge[] {
  return getAllAgents().filter((a) => a.category === category);
}

export function getAgentSlugs(): string[] {
  return Array.from(loadAgents().keys());
}
