// Design-system architecture audit helpers. Different shape from color /
// typography / spacing audits — this one inspects the STRUCTURE of a token
// system (primitive vs semantic, theming, naming consistency) rather than
// individual values.

export interface SystemToken {
  name: string;
  value: string;
  scope?: string;
}

export function parseAllCssCustomProperties(css: string): SystemToken[] {
  const out: SystemToken[] = [];
  const blockRe = /([^{}]+)\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(css)) !== null) {
    const selector = m[1].trim();
    const body = m[2];
    const declRe = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
    let d: RegExpExecArray | null;
    while ((d = declRe.exec(body)) !== null) {
      out.push({
        name: d[1],
        value: d[2].trim(),
        scope: selector === ":root" ? undefined : selector,
      });
    }
  }
  return out;
}

// Tokens whose value references another var() are semantic (they point at a
// primitive). Tokens whose value is a literal hex / rem / px are primitives.
export function partitionSemanticAndPrimitive(tokens: SystemToken[]): {
  semantic: SystemToken[];
  primitive: SystemToken[];
} {
  const semantic: SystemToken[] = [];
  const primitive: SystemToken[] = [];
  for (const t of tokens) {
    if (/var\(\s*--/.test(t.value)) semantic.push(t);
    else primitive.push(t);
  }
  return { semantic, primitive };
}

export interface ThemingStrategy {
  hasDarkScope: boolean;
  darkSelectors: string[];
  tokensOverriddenInDark: number;
  overriddenSampleNames: string[];
}

export function detectThemingStrategy(tokens: SystemToken[]): ThemingStrategy {
  const darkSelectors = Array.from(
    new Set(
      tokens
        .map((t) => t.scope)
        .filter((s): s is string => !!s && /dark|theme/i.test(s)),
    ),
  );
  const rootNames = new Set(tokens.filter((t) => !t.scope).map((t) => t.name));
  const overriddenInDark = tokens.filter(
    (t) => t.scope && darkSelectors.includes(t.scope) && rootNames.has(t.name),
  );
  return {
    hasDarkScope: darkSelectors.length > 0,
    darkSelectors,
    tokensOverriddenInDark: overriddenInDark.length,
    overriddenSampleNames: overriddenInDark.slice(0, 5).map((t) => t.name),
  };
}

export interface NamingConsistency {
  totalTokens: number;
  withCategoryPrefix: number;
  categories: string[];
  inconsistencies: string[];
}

const CATEGORY_RE = /^--([a-z]+)-/i;

export function auditNamingConsistency(tokens: SystemToken[]): NamingConsistency {
  const categories = new Set<string>();
  let withPrefix = 0;
  const weirdNames: string[] = [];
  for (const t of tokens) {
    const m = t.name.match(CATEGORY_RE);
    if (m) {
      withPrefix++;
      categories.add(m[1].toLowerCase());
    } else {
      weirdNames.push(t.name);
    }
  }
  const inconsistencies: string[] = [];
  if (tokens.length > 0 && withPrefix / tokens.length < 0.8) {
    inconsistencies.push(
      `Only ${withPrefix}/${tokens.length} tokens use a clear category prefix (--<category>-...). Mixed naming makes the system hard to search.`,
    );
  }
  // Collapse look-alike categories that probably should be merged
  const cats = Array.from(categories);
  if (cats.includes("color") && cats.includes("colour")) {
    inconsistencies.push("Both `--color-*` and `--colour-*` exist — pick one spelling.");
  }
  if (cats.includes("space") && cats.includes("spacing")) {
    inconsistencies.push("Both `--space-*` and `--spacing-*` exist — pick one prefix.");
  }
  if (cats.includes("font-size") && cats.includes("text")) {
    // Not necessarily wrong, just flag
    inconsistencies.push(
      "Both `--font-size-*` and `--text-*` exist — fine if intentional, but readers may expect one.",
    );
  }
  if (weirdNames.length > 0 && weirdNames.length <= 5) {
    inconsistencies.push(
      `Tokens without a category prefix: ${weirdNames.map((n) => `\`${n}\``).join(", ")}.`,
    );
  } else if (weirdNames.length > 5) {
    inconsistencies.push(
      `${weirdNames.length} tokens without a category prefix — review naming.`,
    );
  }
  return {
    totalTokens: tokens.length,
    withCategoryPrefix: withPrefix,
    categories: cats.sort(),
    inconsistencies,
  };
}

export interface MappingCoverage {
  semanticCount: number;
  resolvableRefs: number;
  brokenRefs: Array<{ token: string; ref: string }>;
}

export function auditSemanticMapping(tokens: SystemToken[]): MappingCoverage {
  const names = new Set(tokens.map((t) => t.name));
  const { semantic } = partitionSemanticAndPrimitive(tokens);
  let resolvable = 0;
  const broken: Array<{ token: string; ref: string }> = [];
  for (const t of semantic) {
    const refs = [...t.value.matchAll(/var\(\s*(--[a-zA-Z0-9-_]+)/g)].map((m) => m[1]);
    for (const ref of refs) {
      if (names.has(ref)) resolvable++;
      else broken.push({ token: t.name, ref });
    }
  }
  return { semanticCount: semantic.length, resolvableRefs: resolvable, brokenRefs: broken };
}

export interface ArchitectureAudit {
  totalTokens: number;
  layering: { semantic: number; primitive: number; verdict: string };
  theming: ThemingStrategy;
  naming: NamingConsistency;
  mapping: MappingCoverage;
  summary: string[];
}

export function buildArchitectureAudit(css: string): ArchitectureAudit {
  const tokens = parseAllCssCustomProperties(css);
  const { semantic, primitive } = partitionSemanticAndPrimitive(tokens);
  const theming = detectThemingStrategy(tokens);
  const naming = auditNamingConsistency(tokens);
  const mapping = auditSemanticMapping(tokens);

  const summary: string[] = [];
  // Layering verdict
  let verdict: string;
  if (tokens.length === 0) {
    verdict = "No CSS custom properties parsed — nothing to audit.";
    summary.push(verdict);
  } else if (semantic.length === 0) {
    verdict =
      "Primitive-only system — no tokens reference other tokens via var(). Fine for small surfaces; adding a semantic layer (--color-text, --color-surface) makes theming + intent-based use easier.";
    summary.push(
      "Consider promoting a semantic layer. Pattern: keep --color-blue-500 (primitive) + add --color-text: var(--color-neutral-900) (semantic).",
    );
  } else if (primitive.length === 0) {
    verdict =
      "Semantic-only — every token references another var(). But no primitive layer was found, which means you can't swap themes by changing primitives.";
    summary.push(
      "Add a primitive layer (hex/rem/px literals) underneath. Semantic tokens should point at primitives, not at other semantics alone.",
    );
  } else {
    verdict = `Two-layer system detected: ${primitive.length} primitives + ${semantic.length} semantic references. Good shape.`;
  }

  // Theming
  if (theming.hasDarkScope) {
    summary.push(
      `Dark-mode scope found (${theming.darkSelectors.join(", ")}) with ${theming.tokensOverriddenInDark} token override(s). ${
        theming.tokensOverriddenInDark < 3
          ? "Very few tokens overridden — dark mode may be incomplete."
          : "Override count looks reasonable; verify each semantic token has a dark counterpart."
      }`,
    );
  } else {
    summary.push(
      "No dark-mode / theme-scoped selectors detected. If the product needs theming, add a selector (e.g. `html[data-theme=\"dark\"]`) and override semantic tokens there.",
    );
  }

  // Naming
  if (naming.inconsistencies.length > 0) {
    summary.push(`Naming inconsistencies: ${naming.inconsistencies.length} finding(s).`);
  }

  // Mapping
  if (mapping.brokenRefs.length > 0) {
    summary.push(
      `${mapping.brokenRefs.length} broken var() reference(s) — a semantic token points at a primitive that doesn't exist.`,
    );
  }

  return {
    totalTokens: tokens.length,
    layering: { semantic: semantic.length, primitive: primitive.length, verdict },
    theming,
    naming,
    mapping,
    summary,
  };
}
