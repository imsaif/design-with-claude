import { getAllAgents, type AgentKnowledge } from "./index";

interface DesignerMemory {
  product_type: string | null;
  product_description: string | null;
  design_tools: string[] | null;
  design_system: string | null;
  tech_stack: string[] | null;
  experience_level: string | null;
}

// Keywords that map to specific agents
const KEYWORD_MAP: Record<string, string[]> = {
  color: ["color-specialist", "dark-mode-specialist"],
  colour: ["color-specialist", "dark-mode-specialist"],
  palette: ["color-specialist"],
  typography: ["typography-specialist"],
  font: ["typography-specialist"],
  type: ["typography-specialist"],
  spacing: ["spacing-layout-specialist"],
  layout: ["spacing-layout-specialist", "visual-hierarchy-specialist"],
  grid: ["spacing-layout-specialist", "responsive-design-specialist"],
  responsive: ["responsive-design-specialist", "mobile-specialist"],
  mobile: ["mobile-specialist", "responsive-design-specialist"],
  animation: ["motion-designer"],
  motion: ["motion-designer"],
  transition: ["motion-designer"],
  form: ["form-designer"],
  input: ["form-designer"],
  validation: ["form-designer", "error-handling-specialist"],
  nav: ["navigation-specialist"],
  navigation: ["navigation-specialist"],
  menu: ["navigation-specialist"],
  dashboard: ["dashboard-designer", "data-visualization-specialist"],
  chart: ["data-visualization-specialist"],
  graph: ["data-visualization-specialist"],
  table: ["table-designer"],
  search: ["search-specialist"],
  filter: ["search-specialist", "table-designer"],
  login: ["auth-security-ux-specialist", "auth-implementation", "form-designer"],
  auth: ["auth-security-ux-specialist", "auth-implementation"],
  signup: ["auth-security-ux-specialist", "auth-implementation", "onboarding-specialist"],
  landing: ["landing-page-specialist"],
  hero: ["landing-page-specialist"],
  cta: ["landing-page-specialist", "content-strategist"],
  error: ["error-handling-specialist", "debug-helper"],
  empty: ["empty-loading-states-specialist"],
  loading: ["empty-loading-states-specialist", "performance-specialist"],
  skeleton: ["empty-loading-states-specialist", "performance-specialist"],
  onboarding: ["onboarding-specialist"],
  dark: ["dark-mode-specialist"],
  theme: ["dark-mode-specialist", "design-system-architect"],
  token: ["design-system-architect", "color-specialist"],
  "design system": ["design-system-architect"],
  component: ["design-system-architect"],
  accessibility: ["accessibility-specialist"],
  a11y: ["accessibility-specialist"],
  aria: ["accessibility-specialist"],
  brand: ["brand-designer"],
  logo: ["brand-designer", "icon-illustration-specialist"],
  icon: ["icon-illustration-specialist"],
  illustration: ["icon-illustration-specialist"],
  copy: ["content-strategist"],
  microcopy: ["content-strategist"],
  content: ["content-strategist", "information-architect"],
  notification: ["notification-designer"],
  toast: ["notification-designer"],
  alert: ["notification-designer", "error-handling-specialist"],
  settings: ["settings-designer"],
  preferences: ["settings-designer"],
  i18n: ["i18n-designer"],
  internationalization: ["i18n-designer"],
  localization: ["i18n-designer"],
  drag: ["drag-drop-specialist"],
  drop: ["drag-drop-specialist"],
  print: ["print-export-designer"],
  export: ["print-export-designer"],
  pdf: ["print-export-designer"],
  chat: ["conversational-ui-designer"],
  checkout: ["checkout-specialist"],
  cart: ["checkout-specialist", "ecommerce-specialist"],
  payment: ["checkout-specialist"],
  ecommerce: ["ecommerce-specialist", "checkout-specialist"],
  shop: ["ecommerce-specialist"],
  healthcare: ["healthcare-ux-specialist"],
  medical: ["healthcare-ux-specialist"],
  saas: ["b2b-saas-specialist"],
  enterprise: ["b2b-saas-specialist"],
  deploy: ["deploy-to-vercel"],
  vercel: ["deploy-to-vercel"],
  ship: ["deploy-to-vercel", "performance-specialist"],
  database: ["database-setup"],
  supabase: ["database-setup"],
  setup: ["setup-guide", "environment-setup"],
  install: ["setup-guide"],
  env: ["environment-setup"],
  "api key": ["environment-setup"],
  debug: ["debug-helper"],
  bug: ["debug-helper"],
  crash: ["debug-helper"],
  explain: ["code-explainer"],
  performance: ["performance-specialist"],
  speed: ["performance-specialist"],
  slow: ["performance-specialist"],
};

// Product type affinity — bias toward certain agents based on what they're building
const PRODUCT_AFFINITY: Record<string, string[]> = {
  saas: ["b2b-saas-specialist", "dashboard-designer", "settings-designer"],
  ecommerce: ["ecommerce-specialist", "checkout-specialist", "search-specialist"],
  portfolio: ["landing-page-specialist", "brand-designer", "typography-specialist"],
  "mobile-app": ["mobile-specialist", "responsive-design-specialist", "motion-designer"],
  dashboard: ["dashboard-designer", "data-visualization-specialist", "table-designer"],
  "web-app": ["navigation-specialist", "form-designer", "responsive-design-specialist"],
};

/**
 * Select 2-3 most relevant agents for a user message, given their context.
 */
export function routeToAgents(
  userMessage: string,
  memory: DesignerMemory | null,
  maxAgents: number = 3
): AgentKnowledge[] {
  const allAgents = getAllAgents();
  const scores = new Map<string, number>();

  const messageLower = userMessage.toLowerCase();

  // 1. Keyword matching (strongest signal)
  for (const [keyword, slugs] of Object.entries(KEYWORD_MAP)) {
    if (messageLower.includes(keyword)) {
      for (const slug of slugs) {
        scores.set(slug, (scores.get(slug) || 0) + 3);
      }
    }
  }

  // 2. Explicit agent name mentions
  for (const agent of allAgents) {
    const nameVariants = [
      agent.slug,
      agent.slug.replace(/-/g, " "),
      agent.slug.replace("-specialist", "").replace("-designer", ""),
    ];
    for (const variant of nameVariants) {
      if (messageLower.includes(variant)) {
        scores.set(agent.slug, (scores.get(agent.slug) || 0) + 5);
      }
    }
  }

  // 3. Product type affinity (mild bias)
  if (memory?.product_type) {
    const affinityAgents = PRODUCT_AFFINITY[memory.product_type] || [];
    for (const slug of affinityAgents) {
      scores.set(slug, (scores.get(slug) || 0) + 1);
    }
  }

  // 4. Description matching (fuzzy, lower weight)
  const messageWords = messageLower.split(/\s+/).filter((w) => w.length > 3);
  for (const agent of allAgents) {
    if (agent.category === "master") continue; // Skip design-brief
    const descLower = agent.description.toLowerCase();
    let matchCount = 0;
    for (const word of messageWords) {
      if (descLower.includes(word)) matchCount++;
    }
    if (matchCount > 0) {
      scores.set(agent.slug, (scores.get(agent.slug) || 0) + matchCount);
    }
  }

  // Sort by score, filter out zero/master, take top N
  const ranked = Array.from(scores.entries())
    .filter(([slug, score]) => score > 0 && slug !== "design-brief")
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxAgents)
    .map(([slug]) => slug);

  // If no matches, return design-system-architect as a sensible default
  if (ranked.length === 0) {
    const fallback = allAgents.find((a) => a.slug === "design-system-architect");
    return fallback ? [fallback] : [];
  }

  return ranked
    .map((slug) => allAgents.find((a) => a.slug === slug))
    .filter(Boolean) as AgentKnowledge[];
}
