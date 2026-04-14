export interface MissionStep {
  title: string;
  prompt: string;
  agents: string[];
  completionHint: string;
}

export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  totalSteps: number;
  steps: MissionStep[];
}

export const MISSIONS: MissionDefinition[] = [
  {
    id: "start-project",
    title: "Start your project",
    description:
      "Set up Claude Code, generate your CLAUDE.md, and establish design tokens for your project.",
    icon: "rocket",
    totalSteps: 6,
    steps: [
      {
        title: "Check your environment",
        prompt:
          "Help the designer verify they have Node.js and Claude Code installed. If not, walk them through installation step by step. Be patient and use plain language.",
        agents: ["setup-guide"],
        completionHint: "Node and Claude Code confirmed installed",
      },
      {
        title: "Create your project",
        prompt:
          "Help the designer create a new Next.js project (or verify their existing one). Walk through the terminal commands. Explain what each step does in design terms.",
        agents: ["setup-guide", "environment-setup"],
        completionHint: "Project directory created with package.json",
      },
      {
        title: "Set up environment variables",
        prompt:
          "Help the designer create a .env.local file and understand what environment variables are. Explain it like explaining layers in Figma — different environments need different settings.",
        agents: ["environment-setup"],
        completionHint: "Env file created",
      },
      {
        title: "Generate your CLAUDE.md",
        prompt:
          "Based on what you know about this designer's project, generate a comprehensive CLAUDE.md file that will configure Claude Code to work perfectly for their design workflow.",
        agents: ["design-system-architect"],
        completionHint: "CLAUDE.md file generated",
      },
      {
        title: "Define your color palette",
        prompt:
          "Help the designer define their color palette. Ask about their brand colors, then generate a complete token system: primitives, semantic colors, and dark mode mapping.",
        agents: ["color-specialist", "dark-mode-specialist"],
        completionHint: "Color tokens defined",
      },
      {
        title: "Set up typography and spacing",
        prompt:
          "Help the designer define their typography scale and spacing system. Generate clamp() values for responsive type sizes and a spacing scale that works with their design.",
        agents: ["typography-specialist", "spacing-layout-specialist"],
        completionHint: "Typography and spacing tokens defined",
      },
    ],
  },
  {
    id: "first-page",
    title: "Build your first page",
    description:
      "Create a landing page or dashboard with proper layout, hierarchy, and responsive design.",
    icon: "layout",
    totalSteps: 5,
    steps: [
      {
        title: "Define page structure",
        prompt:
          "Help the designer plan their page structure. What sections do they need? What's the content hierarchy? Create a wireframe-level plan using design language (hero, features, social proof, CTA).",
        agents: ["visual-hierarchy-specialist", "information-architect"],
        completionHint: "Page structure defined",
      },
      {
        title: "Build the hero section",
        prompt:
          "Guide the designer through building their hero section. Focus on visual hierarchy, headline structure, and CTA placement. Provide specific values for spacing, typography, and layout.",
        agents: ["landing-page-specialist", "typography-specialist"],
        completionHint: "Hero section built",
      },
      {
        title: "Add content sections",
        prompt:
          "Help the designer build out the remaining sections: features grid, testimonials, or data display. Focus on consistent spacing rhythm and component patterns.",
        agents: ["visual-hierarchy-specialist", "spacing-layout-specialist"],
        completionHint: "Content sections added",
      },
      {
        title: "Set up navigation",
        prompt:
          "Help the designer add a navigation bar and footer. Cover sticky behavior, mobile menu patterns, and active states.",
        agents: ["navigation-specialist", "responsive-design-specialist"],
        completionHint: "Navigation added",
      },
      {
        title: "Make it responsive",
        prompt:
          "Review the page for responsive behavior. Define breakpoints, adjust layout for mobile, and ensure touch targets are properly sized.",
        agents: ["responsive-design-specialist", "mobile-specialist"],
        completionHint: "Page is responsive",
      },
    ],
  },
  {
    id: "add-login",
    title: "Add login",
    description:
      "Design the authentication flow and implement working login with proper UX and security.",
    icon: "lock",
    totalSteps: 5,
    steps: [
      {
        title: "Design the auth flow",
        prompt:
          "Help the designer plan their authentication flow. What screens do they need? Login, signup, forgot password, email verification? Map out the user journey.",
        agents: ["auth-security-ux-specialist"],
        completionHint: "Auth flow mapped out",
      },
      {
        title: "Design the login form",
        prompt:
          "Help the designer build a login form with proper UX: input styling, labels, validation states, password visibility toggle, error messages, and loading states.",
        agents: ["form-designer", "error-handling-specialist"],
        completionHint: "Login form designed",
      },
      {
        title: "Design the signup flow",
        prompt:
          "Help the designer build the signup form. Cover: password strength indicators, terms acceptance, progressive disclosure, and success states.",
        agents: ["form-designer", "onboarding-specialist"],
        completionHint: "Signup flow designed",
      },
      {
        title: "Implement auth",
        prompt:
          "Walk the designer through implementing authentication with Clerk or Supabase Auth. Provide exact steps and explain each one in plain language.",
        agents: ["auth-implementation"],
        completionHint: "Auth code working",
      },
      {
        title: "Handle auth states",
        prompt:
          "Help the designer handle all auth edge cases: loading states, error messages, session expiry, and protected routes. Make sure the UX feels polished.",
        agents: ["error-handling-specialist", "empty-loading-states-specialist"],
        completionHint: "Auth states handled",
      },
    ],
  },
  {
    id: "animations",
    title: "Make it feel alive",
    description:
      "Add animations, micro-interactions, and loading states that make the product feel polished.",
    icon: "sparkles",
    totalSteps: 5,
    steps: [
      {
        title: "Plan your motion system",
        prompt:
          "Help the designer establish a motion system: timing curves, duration scale, and principles. Not every element needs to animate — identify the high-impact moments.",
        agents: ["motion-designer"],
        completionHint: "Motion principles established",
      },
      {
        title: "Add page transitions",
        prompt:
          "Help the designer add enter/exit animations for page content. Cover: fade-in on scroll, staggered lists, and route transitions.",
        agents: ["motion-designer", "interaction-designer"],
        completionHint: "Page transitions added",
      },
      {
        title: "Add micro-interactions",
        prompt:
          "Help the designer add micro-interactions to buttons, cards, and form elements. Cover: hover states, press feedback, and focus indicators.",
        agents: ["interaction-designer", "motion-designer"],
        completionHint: "Micro-interactions added",
      },
      {
        title: "Design loading states",
        prompt:
          "Help the designer create skeleton screens, spinners, and progress indicators. Cover: perceived performance and optimistic UI patterns.",
        agents: ["empty-loading-states-specialist", "performance-specialist"],
        completionHint: "Loading states implemented",
      },
      {
        title: "Polish empty states",
        prompt:
          "Help the designer create empty states and error states that feel designed, not broken. Cover: illustrations, helpful copy, and calls to action.",
        agents: ["empty-loading-states-specialist", "content-strategist"],
        completionHint: "Empty and error states polished",
      },
    ],
  },
  {
    id: "ship",
    title: "Prepare to ship",
    description:
      "Run through performance, accessibility, copy review, and deploy to production.",
    icon: "check-circle",
    totalSteps: 5,
    steps: [
      {
        title: "Performance audit",
        prompt:
          "Help the designer audit their site for performance: image optimization, bundle size, lazy loading, and Core Web Vitals. Provide specific recommendations with exact code changes.",
        agents: ["performance-specialist"],
        completionHint: "Performance issues identified and fixed",
      },
      {
        title: "Accessibility check",
        prompt:
          "Walk through an accessibility audit: keyboard navigation, screen reader testing, color contrast, ARIA labels. Use their actual pages as examples.",
        agents: ["accessibility-specialist"],
        completionHint: "Accessibility issues fixed",
      },
      {
        title: "Copy review",
        prompt:
          "Review all user-facing copy: headlines, buttons, error messages, empty states, and microcopy. Ensure consistency in tone and clarity.",
        agents: ["content-strategist"],
        completionHint: "Copy reviewed and improved",
      },
      {
        title: "Pre-deploy checklist",
        prompt:
          "Run through the pre-deploy checklist: meta tags, OG images, favicon, 404 page, environment variables, and build verification.",
        agents: ["deploy-to-vercel", "performance-specialist"],
        completionHint: "Checklist complete",
      },
      {
        title: "Deploy",
        prompt:
          "Walk the designer through deploying to Vercel. Cover: connecting Git, environment variables, domain setup, and verifying the live site.",
        agents: ["deploy-to-vercel"],
        completionHint: "Site is live",
      },
    ],
  },
];

export function getMission(id: string): MissionDefinition | undefined {
  return MISSIONS.find((m) => m.id === id);
}
