export type CategoryId =
  | "core"
  | "visual"
  | "interaction"
  | "product"
  | "content-ia"
  | "industry"
  | "specialized"
  | "technical";

export interface Category {
  id: CategoryId;
  label: string;
}

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export interface Skill {
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  level: SkillLevel;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: "core", label: "Core Design" },
  { id: "visual", label: "Visual Design" },
  { id: "interaction", label: "Interaction" },
  { id: "product", label: "Product" },
  { id: "content-ia", label: "Content & IA" },
  { id: "industry", label: "Industry" },
  { id: "specialized", label: "Specialized" },
  { id: "technical", label: "Technical Setup" },
];

const ICONS = ["✦", "⬡", "◈", "⊞", "⬚", "✎", "◎", "⇄", "⌖", "◐", "⌤", "⊙", "⋯", "⊛", "⊕", "⊗", "⬧", "◉", "⊜", "⌘", "⊘", "⊡", "◫", "⌂", "⊿", "◬", "⊚", "⊞", "◈"];

export const SKILLS: Skill[] = [
  // Master Command
  {
    slug: "design-brief",
    name: "Design Brief",
    description: "Use when a design request is broad or unclear and you do not know which specialist it needs.",
    category: "core",
    level: "beginner",
    icon: "⊛",
  },

  // Core Design
  {
    slug: "visual-hierarchy-specialist",
    name: "Visual Hierarchy Specialist",
    description: "Use when everything on a screen shouts equally.",
    category: "core",
    level: "beginner",
    icon: ICONS[0],
  },
  {
    slug: "interaction-designer",
    name: "Interaction Designer",
    description: "Use when deciding how something should behave rather than how it looks.",
    category: "core",
    level: "advanced",
    icon: ICONS[1],
  },
  {
    slug: "design-system-architect",
    name: "Design System Architect",
    description: "Use when a design system needs structure rather than more components.",
    category: "core",
    level: "advanced",
    icon: ICONS[2],
  },
  {
    slug: "accessibility-specialist",
    name: "Accessibility Specialist",
    description: "Use when a screen might fail WCAG.",
    category: "core",
    level: "intermediate",
    icon: ICONS[3],
  },
  {
    slug: "anti-slop-designer",
    name: "Anti-Slop Designer",
    description: "Use when a UI looks machine-made rather than decided.",
    category: "core",
    level: "intermediate",
    icon: "◆",
  },
  {
    slug: "design-critic",
    name: "Design Critic",
    description: "Use when you want an honest read on a design instead of encouragement.",
    category: "core",
    level: "intermediate",
    icon: "⊗",
  },
  {
    slug: "design-triage",
    name: "Design Triage",
    description: "Use when a dwic audit report is full of findings and there is no plan.",
    category: "core",
    level: "intermediate",
    icon: "≡",
  },
  {
    slug: "design-enforce",
    name: "Design Enforce",
    description: "Use when code has drifted off the design system.",
    category: "core",
    level: "intermediate",
    icon: "\u25c8",
  },
  {
    slug: "design-grill",
    name: "Design Grill",
    description: "Use when a design keeps getting reinvented every session.",
    category: "core",
    level: "intermediate",
    icon: "?",
  },

  // Visual Design
  {
    slug: "typography-specialist",
    name: "Typography Specialist",
    description: "Use when type is doing no work.",
    category: "visual",
    level: "beginner",
    icon: ICONS[4],
  },
  {
    slug: "color-specialist",
    name: "Color Specialist",
    description: "Use when colour is failing.",
    category: "visual",
    level: "beginner",
    icon: ICONS[5],
  },
  {
    slug: "spacing-layout-specialist",
    name: "Spacing & Layout Specialist",
    description: "Use when spacing looks arbitrary.",
    category: "visual",
    level: "intermediate",
    icon: ICONS[6],
  },

  // Interaction
  {
    slug: "motion-designer",
    name: "Motion Designer",
    description: "Use when animation feels wrong.",
    category: "interaction",
    level: "intermediate",
    icon: ICONS[7],
  },
  {
    slug: "form-designer",
    name: "Form Designer",
    description: "Use when a form is losing people.",
    category: "interaction",
    level: "intermediate",
    icon: ICONS[8],
  },
  {
    slug: "navigation-specialist",
    name: "Navigation Specialist",
    description: "Use when people get lost.",
    category: "interaction",
    level: "intermediate",
    icon: ICONS[9],
  },

  // Product
  {
    slug: "dashboard-designer",
    name: "Dashboard Designer",
    description: "Use when a dashboard is dense but not useful.",
    category: "product",
    level: "intermediate",
    icon: ICONS[10],
  },
  {
    slug: "mobile-specialist",
    name: "Mobile Specialist",
    description: "Use when a design will be used on phones.",
    category: "product",
    level: "intermediate",
    icon: ICONS[11],
  },
  {
    slug: "responsive-design-specialist",
    name: "Responsive Design Specialist",
    description: "Use when a layout breaks between sizes.",
    category: "product",
    level: "intermediate",
    icon: ICONS[12],
  },
  {
    slug: "landing-page-specialist",
    name: "Landing Page Specialist",
    description: "Use when a landing page is not converting.",
    category: "product",
    level: "intermediate",
    icon: ICONS[13],
  },

  // Content & IA
  {
    slug: "content-strategist",
    name: "Content Strategist",
    description: "Use when the words inside a product are doing damage.",
    category: "content-ia",
    level: "intermediate",
    icon: ICONS[14],
  },
  {
    slug: "ui-copywriter",
    name: "UI Copywriter",
    description: "Use when writing marketing or landing copy.",
    category: "content-ia",
    level: "intermediate",
    icon: "✍",
  },
  {
    slug: "information-architect",
    name: "Information Architect",
    description: "Use when users cannot find things.",
    category: "content-ia",
    level: "intermediate",
    icon: ICONS[15],
  },
  {
    slug: "conversational-ui-designer",
    name: "Conversational UI Designer",
    description: "Use when designing a chat or assistant interface.",
    category: "content-ia",
    level: "advanced",
    icon: ICONS[16],
  },

  // Industry
  {
    slug: "healthcare-ux-specialist",
    name: "Healthcare UX Specialist",
    description: "Use when designing clinical or patient-facing interfaces.",
    category: "industry",
    level: "advanced",
    icon: ICONS[17],
  },
  {
    slug: "b2b-saas-specialist",
    name: "B2B SaaS Specialist",
    description: "Use when building enterprise software.",
    category: "industry",
    level: "advanced",
    icon: ICONS[18],
  },
  {
    slug: "ecommerce-specialist",
    name: "E-commerce Specialist",
    description: "Use when shoppers cannot find or evaluate products.",
    category: "industry",
    level: "intermediate",
    icon: ICONS[19],
  },
  {
    slug: "checkout-specialist",
    name: "Checkout Specialist",
    description: "Use when a cart or checkout is losing people.",
    category: "industry",
    level: "intermediate",
    icon: ICONS[20],
  },

  // Specialized
  {
    slug: "dark-mode-specialist",
    name: "Dark Mode Specialist",
    description: "Use when dark mode looks wrong.",
    category: "specialized",
    level: "intermediate",
    icon: ICONS[21],
  },
  {
    slug: "error-handling-specialist",
    name: "Error Handling Specialist",
    description: "Use when things go wrong badly.",
    category: "specialized",
    level: "intermediate",
    icon: ICONS[22],
  },
  {
    slug: "onboarding-specialist",
    name: "Onboarding Specialist",
    description: "Use when new users leave before their first success.",
    category: "specialized",
    level: "intermediate",
    icon: ICONS[23],
  },
  {
    slug: "performance-specialist",
    name: "Performance Specialist",
    description: "Use when a product feels slow even when it is not.",
    category: "specialized",
    level: "advanced",
    icon: ICONS[24],
  },
  {
    slug: "data-visualization-specialist",
    name: "Data Visualization Specialist",
    description: "Use when a chart misleads or confuses.",
    category: "specialized",
    level: "advanced",
    icon: ICONS[25],
  },
  {
    slug: "table-designer",
    name: "Table Designer",
    description: "Use when a data table is hard to use.",
    category: "specialized",
    level: "intermediate",
    icon: ICONS[26],
  },
  {
    slug: "search-specialist",
    name: "Search Specialist",
    description: "Use when search is failing users.",
    category: "specialized",
    level: "intermediate",
    icon: ICONS[27],
  },
  {
    slug: "brand-designer",
    name: "Brand Designer",
    description: "Use when a product looks like a template with no personality.",
    category: "specialized",
    level: "intermediate",
    icon: ICONS[28],
  },
  {
    slug: "i18n-designer",
    name: "Internationalization Designer",
    description: "Use when a product has to work in more than one language.",
    category: "specialized",
    level: "advanced",
    icon: "🌐",
  },
  {
    slug: "auth-security-ux-specialist",
    name: "Auth & Security UX Specialist",
    description: "Use when a login or security flow feels either unsafe or full of friction.",
    category: "product",
    level: "advanced",
    icon: "🔐",
  },
  {
    slug: "drag-drop-specialist",
    name: "Drag & Drop Specialist",
    description: "Use when building drag and drop or direct manipulation.",
    category: "interaction",
    level: "advanced",
    icon: "⤭",
  },
  {
    slug: "print-export-designer",
    name: "Print & Export Designer",
    description: "Use when something has to leave the screen.",
    category: "specialized",
    level: "advanced",
    icon: "🖨",
  },

  // Technical Setup
  {
    slug: "setup-guide",
    name: "Setup Guide",
    description: "Use when someone is starting from nothing and the terminal is unfamiliar.",
    category: "technical",
    level: "beginner",
    icon: "⌨",
  },
  {
    slug: "code-explainer",
    name: "Code Explainer",
    description: "Use when a designer needs to understand code that already works.",
    category: "technical",
    level: "beginner",
    icon: "📖",
  },
  {
    slug: "database-setup",
    name: "Database Setup",
    description: "Use when a project needs to store data and has no database yet.",
    category: "technical",
    level: "intermediate",
    icon: "🗄",
  },
  {
    slug: "environment-setup",
    name: "Environment Setup",
    description: "Use when handling secrets and config.",
    category: "technical",
    level: "beginner",
    icon: "🔑",
  },
  {
    slug: "auth-implementation",
    name: "Auth Implementation",
    description: "Use when a project needs real working login and signup rather than advice.",
    category: "technical",
    level: "advanced",
    icon: "🔓",
  },
  {
    slug: "deploy-to-vercel",
    name: "Deploy to Vercel",
    description: "Use when a project runs locally but is not on the internet yet, or a Vercel deploy is failing.",
    category: "technical",
    level: "beginner",
    icon: "🚀",
  },
  {
    slug: "debug-helper",
    name: "Debug Helper",
    description: "Use when something is broken and you need it diagnosed.",
    category: "technical",
    level: "beginner",
    icon: "🔧",
  },
  {
    slug: "briefing-claude",
    name: "Briefing Claude for Design",
    description: "Use when Claude keeps building the wrong UI and you are re-rolling prompts.",
    category: "technical",
    level: "beginner",
    icon: "◔",
  },
];

export function getSkillsByCategory(categoryId: CategoryId): Skill[] {
  return SKILLS.filter((s) => s.category === categoryId);
}

export function getSkillsByLevel(level: SkillLevel): Skill[] {
  return SKILLS.filter((s) => s.level === level);
}

export function getCategoryLabel(categoryId: CategoryId): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export function getInstallCommand(slug: string): string {
  return `curl -sL https://raw.githubusercontent.com/imsaif/design-with-claude/main/commands/${slug}.md -o .claude/commands/${slug}.md`;
}

export function getGithubUrl(slug: string): string {
  return `https://github.com/imsaif/design-with-claude/blob/main/commands/${slug}.md`;
}
