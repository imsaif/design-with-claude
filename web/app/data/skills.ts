export type CategoryId =
  | "core"
  | "visual"
  | "interaction"
  | "product"
  | "content-ia"
  | "industry"
  | "specialized";

export interface Category {
  id: CategoryId;
  label: string;
}

export interface Skill {
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
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
];

const ICONS = ["✦", "⬡", "◈", "⊞", "⬚", "✎", "◎", "⇄", "⌖", "◐", "⌤", "⊙", "⋯", "⊛", "⊕", "⊗", "⬧", "◉", "⊜", "⌘", "⊘", "⊡", "◫", "⌂", "⊿", "◬", "⊚", "⊞", "◈"];

export const SKILLS: Skill[] = [
  // Master Command
  {
    slug: "design-brief",
    name: "Design Brief",
    description: "Master command — takes a brief, identifies relevant design domains, routes to the right specialists",
    category: "core",
    icon: "⊛",
  },

  // Core Design
  {
    slug: "visual-hierarchy-specialist",
    name: "Visual Hierarchy Specialist",
    description: "Visual hierarchy, layout, spacing, focal points, content grouping",
    category: "core",
    icon: ICONS[0],
  },
  {
    slug: "interaction-designer",
    name: "Interaction Designer",
    description: "User flows, states, gestures, feedback, keyboard patterns",
    category: "core",
    icon: ICONS[1],
  },
  {
    slug: "design-system-architect",
    name: "Design System Architect",
    description: "Tokens, component APIs, variants, theming, governance",
    category: "core",
    icon: ICONS[2],
  },
  {
    slug: "accessibility-specialist",
    name: "Accessibility Specialist",
    description: "WCAG compliance, ARIA, keyboard nav, screen readers",
    category: "core",
    icon: ICONS[3],
  },

  // Visual Design
  {
    slug: "typography-specialist",
    name: "Typography Specialist",
    description: "Type scales, font pairing, line height, vertical rhythm, responsive typography",
    category: "visual",
    icon: ICONS[4],
  },
  {
    slug: "color-specialist",
    name: "Color Specialist",
    description: "Color palettes, contrast, dark mode mapping, semantic colors, accessibility",
    category: "visual",
    icon: ICONS[5],
  },
  {
    slug: "spacing-layout-specialist",
    name: "Spacing & Layout Specialist",
    description: "Grid systems, spacing scales, density modes, padding/margin conventions",
    category: "visual",
    icon: ICONS[6],
  },

  // Interaction
  {
    slug: "motion-designer",
    name: "Motion Designer",
    description: "Transitions, easing, timing, micro-interactions, reduced motion, animation performance",
    category: "interaction",
    icon: ICONS[7],
  },
  {
    slug: "form-designer",
    name: "Form Designer",
    description: "Form layout, validation timing, input types, multi-step forms, accessibility",
    category: "interaction",
    icon: ICONS[8],
  },
  {
    slug: "navigation-specialist",
    name: "Navigation Specialist",
    description: "Sidebar, top bar, bottom tabs, breadcrumbs, mega menus, command palettes",
    category: "interaction",
    icon: ICONS[9],
  },

  // Product
  {
    slug: "dashboard-designer",
    name: "Dashboard Designer",
    description: "KPI cards, data density, drill-down, filters, real-time updates, dashboard layout",
    category: "product",
    icon: ICONS[10],
  },
  {
    slug: "mobile-specialist",
    name: "Mobile Specialist",
    description: "Touch targets, thumb zones, bottom nav, gestures, offline states, safe areas",
    category: "product",
    icon: ICONS[11],
  },
  {
    slug: "responsive-design-specialist",
    name: "Responsive Design Specialist",
    description: "Breakpoints, fluid typography, container queries, responsive images, mobile-first CSS",
    category: "product",
    icon: ICONS[12],
  },
  {
    slug: "landing-page-specialist",
    name: "Landing Page Specialist",
    description: "Hero sections, CTAs, value propositions, social proof, pricing tables, conversion",
    category: "product",
    icon: ICONS[13],
  },

  // Content & IA
  {
    slug: "content-strategist",
    name: "Content Strategist",
    description: "Microcopy, error messages, empty states, tone of voice, content hierarchy",
    category: "content-ia",
    icon: ICONS[14],
  },
  {
    slug: "information-architect",
    name: "Information Architect",
    description: "Navigation structure, taxonomy, labeling, content organization, wayfinding",
    category: "content-ia",
    icon: ICONS[15],
  },
  {
    slug: "conversational-ui-designer",
    name: "Conversational UI Designer",
    description: "Chat interfaces, bot personality, message design, rich messages, voice UI",
    category: "content-ia",
    icon: ICONS[16],
  },

  // Industry
  {
    slug: "healthcare-ux-specialist",
    name: "Healthcare UX Specialist",
    description: "Clinical workflows, HIPAA UI considerations, patient data display, medical terminology",
    category: "industry",
    icon: ICONS[17],
  },
  {
    slug: "b2b-saas-specialist",
    name: "B2B SaaS Specialist",
    description: "Enterprise patterns, RBAC UI, multi-tenant, complex onboarding, admin dashboards",
    category: "industry",
    icon: ICONS[18],
  },
  {
    slug: "ecommerce-specialist",
    name: "E-commerce Specialist",
    description: "Product pages, filtering, image galleries, reviews, product comparison",
    category: "industry",
    icon: ICONS[19],
  },
  {
    slug: "checkout-specialist",
    name: "Checkout Specialist",
    description: "Cart UX, payment forms, guest checkout, trust signals, order confirmation",
    category: "industry",
    icon: ICONS[20],
  },

  // Specialized
  {
    slug: "dark-mode-specialist",
    name: "Dark Mode Specialist",
    description: "Dark surfaces, color remapping, elevation hierarchy, FOUC prevention, mode switching",
    category: "specialized",
    icon: ICONS[21],
  },
  {
    slug: "error-handling-specialist",
    name: "Error Handling Specialist",
    description: "Error messages, validation, recovery flows, HTTP error pages, retry patterns",
    category: "specialized",
    icon: ICONS[22],
  },
  {
    slug: "onboarding-specialist",
    name: "Onboarding Specialist",
    description: "First-run experience, tooltip tours, empty states, checklists, feature discovery",
    category: "specialized",
    icon: ICONS[23],
  },
  {
    slug: "performance-specialist",
    name: "Performance Specialist",
    description: "Skeleton screens, optimistic updates, loading states, lazy loading, perceived speed",
    category: "specialized",
    icon: ICONS[24],
  },
  {
    slug: "data-visualization-specialist",
    name: "Data Visualization Specialist",
    description: "Chart selection, axis design, color encoding, tooltips, responsive charts, accessibility",
    category: "specialized",
    icon: ICONS[25],
  },
  {
    slug: "table-designer",
    name: "Table Designer",
    description: "Data tables, sorting, pagination, row selection, inline editing, responsive tables",
    category: "specialized",
    icon: ICONS[26],
  },
  {
    slug: "search-specialist",
    name: "Search Specialist",
    description: "Search UX, autocomplete, faceted filtering, search results, zero-results states",
    category: "specialized",
    icon: ICONS[27],
  },
  {
    slug: "brand-designer",
    name: "Brand Designer",
    description: "Visual identity, logo usage, brand colors, typography as brand expression",
    category: "specialized",
    icon: ICONS[28],
  },
  {
    slug: "notification-designer",
    name: "Notification Designer",
    description: "Push notifications, in-app alerts, badges, toasts, notification center, priority levels",
    category: "interaction",
    icon: "🔔",
  },
  {
    slug: "empty-loading-states-specialist",
    name: "Empty & Loading States Specialist",
    description: "Skeleton screens, empty states, first-use experience, loading patterns, progressive content",
    category: "specialized",
    icon: "◌",
  },
  {
    slug: "settings-designer",
    name: "Settings & Preferences Designer",
    description: "Settings pages, preference architecture, toggle patterns, defaults strategy, account management",
    category: "product",
    icon: "⚙",
  },
  {
    slug: "icon-illustration-specialist",
    name: "Icon & Illustration Specialist",
    description: "Icon grids, sizing systems, icon meaning, illustration style, SVG accessibility",
    category: "visual",
    icon: "✿",
  },
  {
    slug: "i18n-designer",
    name: "Internationalization Designer",
    description: "RTL layouts, string expansion, locale-aware UI, date/number formats, cultural adaptation",
    category: "specialized",
    icon: "🌐",
  },
  {
    slug: "auth-security-ux-specialist",
    name: "Auth & Security UX Specialist",
    description: "Login flows, password UX, 2FA/passkey, session management, permission prompts, trust signals",
    category: "product",
    icon: "🔐",
  },
  {
    slug: "drag-drop-specialist",
    name: "Drag & Drop Specialist",
    description: "Drag affordances, drop zones, reordering, canvas interactions, multi-select, direct manipulation",
    category: "interaction",
    icon: "⤭",
  },
  {
    slug: "print-export-designer",
    name: "Print & Export Designer",
    description: "PDF generation, print stylesheets, export formatting, receipt design, download UX",
    category: "specialized",
    icon: "🖨",
  },
];

export function getSkillsByCategory(categoryId: CategoryId): Skill[] {
  return SKILLS.filter((s) => s.category === categoryId);
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
