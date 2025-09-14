# Agent-CLI Integration Guide

This document explains how Design with Claude's 28 AI agents integrate with the CLI tool to create intelligent, expert-guided code generation.

## Overview: The Intelligence Layer

The CLI tool isn't just a code generator—it's an AI orchestrator that leverages design expertise to create thoughtful implementations:

```
Traditional CLI Tool:      Design with Claude:
User Input → Code          User Input → Agent Analysis → Expert Guidance → Quality Code
     │                          │            │                   │              │
     └─ Generic Output          └─ Understanding → Knowledge → Implementation └─ Professional Result
```

## Agent Integration Architecture

### 1. Agent Knowledge Base Structure

Each of our 28 agents contributes specific expertise:

```
agents/
├── core-design/
│   ├── ui-designer.md           → Component patterns, visual hierarchy
│   ├── ux-design-expert.md      → User flows, accessibility guidelines
│   └── design-system-architect.md → Token systems, consistency rules
├── visual-design/
│   ├── visual-designer.md       → Color theory, typography scales
│   └── brand-strategist.md      → Brand guidelines, style direction
├── product-design/
│   ├── product-designer.md      → Feature prioritization, user needs
│   └── dashboard-designer.md    → Data visualization, layout patterns
└── [22 more specialized agents]
```

### 2. Agent Selection Matrix

The AI Orchestrator intelligently selects agents based on task context:

| Task Type | Primary Agent | Supporting Agents | Why This Combination |
|-----------|---------------|-------------------|---------------------|
| **Landing Page** | web-designer | ui-designer, marketing-designer, brand-strategist | Web structure + UI components + conversion optimization + brand consistency |
| **Dashboard** | dashboard-designer | ux-design-expert, visual-designer | Data layouts + user experience + visual clarity |
| **Mobile App** | mobile-designer | ui-designer, accessibility-specialist | Platform guidelines + components + inclusive design |
| **Component System** | design-system-architect | ui-designer, brand-strategist | System consistency + component patterns + brand alignment |
| **E-commerce** | product-designer | ui-designer, marketing-designer, ux-researcher | Product focus + interface + conversion + user research |

### 3. Multi-Agent Collaboration

For complex tasks, agents work together in phases:

#### Phase 1: Analysis & Strategy
```
Brief: "Modern SaaS dashboard with team collaboration features"

brand-strategist: "Analyze brand requirements and visual direction"
product-designer: "Define feature prioritization and user workflows"
ux-researcher: "Consider user needs and behavior patterns"
```

#### Phase 2: Design & Structure
```
dashboard-designer: "Create information architecture and layouts"
ui-designer: "Design component specifications and interactions"
accessibility-specialist: "Ensure inclusive design compliance"
```

#### Phase 3: Implementation & Export
```
design-system-architect: "Generate consistent tokens and variables"
All agents: "Review output for expertise alignment"
Figma API: "Export design files with proper structure"
```

## Technical Implementation

### Agent Knowledge Extraction

```javascript
class AgentKnowledgeBase {
  constructor() {
    this.agents = this.loadAllAgents();
    this.expertise = this.buildExpertiseMap();
  }

  loadAllAgents() {
    // Parse markdown files from /agents directory
    // Extract structured knowledge from each agent
    return {
      'ui-designer': {
        expertise: ['visual-hierarchy', 'component-design', 'responsive-layout'],
        patterns: {
          button: {
            variants: ['primary', 'secondary', 'ghost'],
            states: ['default', 'hover', 'active', 'disabled'],
            specs: { padding: '12px 24px', borderRadius: '6px' }
          }
        },
        bestPractices: [
          'Use consistent spacing system',
          'Implement clear visual hierarchy',
          'Design accessible color contrasts'
        ]
      },
      'web-designer': {
        expertise: ['layout-structure', 'responsive-design', 'performance'],
        patterns: {
          landing: {
            structure: ['hero', 'features', 'social-proof', 'cta'],
            responsive: 'mobile-first',
            performance: 'optimize-images'
          }
        }
      }
      // ... 26 more agents
    };
  }

  selectAgentsFor(task, context) {
    // AI-powered agent selection based on:
    // - Task type (component, layout, full page)
    // - Industry context (SaaS, e-commerce, healthcare)
    // - Style preferences (modern, classic, minimal)
    // - Technical requirements (React, Vue, accessibility)

    const primaryAgent = this.findPrimaryAgent(task);
    const supportingAgents = this.findSupportingAgents(task, context);

    return { primary: primaryAgent, supporting: supportingAgents };
  }
}
```

### Generation Pipeline with Agent Guidance

```javascript
class IntelligentGenerator {
  async generateFromBrief(brief, options = {}) {
    // 1. Parse and understand the brief
    const analysis = await this.briefParser.analyze(brief);

    // 2. Select appropriate agents
    const agentTeam = await this.agentSelector.selectAgentsFor(analysis, options);

    // 3. Gather agent expertise
    const guidance = await this.gatherAgentGuidance(agentTeam, analysis);

    // 4. Generate with expert knowledge
    const output = await this.generateWithGuidance(guidance);

    // 5. Agent quality review
    const review = await this.agentReview(output, agentTeam);

    // 6. Apply improvements
    return this.applyImprovements(output, review);
  }

  async gatherAgentGuidance(agentTeam, analysis) {
    const guidance = {};

    // Primary agent provides main direction
    guidance.primary = await this.consultAgent(agentTeam.primary, analysis, 'primary');

    // Supporting agents provide specialized input
    guidance.supporting = await Promise.all(
      agentTeam.supporting.map(agent =>
        this.consultAgent(agent, analysis, 'supporting')
      )
    );

    return this.combineGuidance(guidance);
  }
}
```

## Real-World Example: Button Component Generation

Let's trace how agents collaborate to create a professional button component:

### Input
```bash
design-create component button --variants primary,secondary,ghost --size sm,md,lg
```

### Agent Selection
```
Primary: ui-designer (component expertise)
Supporting:
  - design-system-architect (consistency)
  - accessibility-specialist (inclusive design)
  - brand-strategist (brand alignment)
```

### Agent Guidance
```javascript
{
  'ui-designer': {
    variants: {
      primary: { background: 'brand-primary', color: 'white' },
      secondary: { background: 'transparent', border: '1px solid brand-primary' },
      ghost: { background: 'transparent', color: 'brand-primary' }
    },
    sizes: {
      sm: { padding: '8px 16px', fontSize: '14px' },
      md: { padding: '12px 24px', fontSize: '16px' },
      lg: { padding: '16px 32px', fontSize: '18px' }
    },
    states: ['default', 'hover', 'active', 'disabled', 'loading']
  },
  'design-system-architect': {
    tokens: {
      'button-radius': '6px',
      'button-transition': '150ms ease',
      'button-shadow': '0 2px 4px rgba(0,0,0,0.1)'
    },
    naming: 'btn-{variant}-{size}',
    consistency: 'Use spacing-scale tokens for padding'
  },
  'accessibility-specialist': {
    requirements: [
      'Minimum 44px touch target',
      'WCAG AA color contrast',
      'Focus visible indicators',
      'Screen reader labels'
    ],
    implementation: {
      'aria-label': 'required for icon-only buttons',
      'aria-disabled': 'for disabled state',
      'role': 'button for non-button elements'
    }
  },
  'brand-strategist': {
    personality: 'Professional, trustworthy, modern',
    colors: 'Use brand primary for CTAs, neutral for secondary actions',
    typography: 'Medium font-weight for emphasis'
  }
}
```

### Generated Output
```jsx
// components/Button.jsx
import React from 'react';
import './Button.css';

export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  ...props
}) => {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${disabled ? 'btn--disabled' : ''} ${loading ? 'btn--loading' : ''}`}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span className={loading ? 'btn__text--hidden' : 'btn__text'}>
        {children}
      </span>
    </button>
  );
};
```

```css
/* components/Button.css - Generated with agent guidance */
.btn {
  /* ui-designer: consistent interaction patterns */
  display: inline-flex;
  align-items: center;
  justify-content: center;

  /* design-system-architect: token-based consistency */
  border-radius: var(--button-radius);
  transition: var(--button-transition);
  font-family: var(--font-family-primary);
  font-weight: 500; /* brand-strategist: medium weight */

  /* accessibility-specialist: minimum touch target */
  min-height: 44px;

  /* ui-designer: clear visual states */
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
}

/* Primary variant - brand-strategist guidance */
.btn--primary {
  background: var(--color-brand-primary);
  color: var(--color-white);
}

.btn--primary:hover {
  background: var(--color-brand-primary-dark);
}

/* accessibility-specialist: focus indicators */
.btn:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}

/* Size variants - ui-designer specifications */
.btn--sm { padding: 8px 16px; font-size: 14px; }
.btn--md { padding: 12px 24px; font-size: 16px; }
.btn--lg { padding: 16px 32px; font-size: 18px; }
```

## Benefits of Agent Integration

### 1. **Professional Quality**
- Every component follows industry best practices
- Consistent design patterns across all generated code
- Expert-level decisions for complex design challenges

### 2. **Intelligent Adaptation**
- Different approaches for different contexts (mobile vs desktop, B2B vs B2C)
- Style adaptation based on brand and industry
- Accessibility considerations built-in by default

### 3. **Comprehensive Coverage**
- 28 specialized agents cover every design discipline
- Multi-agent collaboration for complex tasks
- Continuous improvement through agent knowledge updates

### 4. **Quality Assurance**
- Agents review generated output for consistency
- Best practice validation before export
- Error prevention through expert guidance

## Future Enhancements

### Phase 2: Enhanced Agent Integration
- Real-time agent consultation during generation
- Dynamic agent selection based on project context
- Agent feedback loops for continuous improvement

### Phase 3: Collaborative Intelligence
- Multi-agent debates for complex decisions
- Context-aware agent personalities
- Learning from user preferences and feedback

### Phase 4: Advanced Orchestration
- Figma-integrated agent guidance
- Cross-platform design consistency
- Enterprise team collaboration features

---

This integration ensures that every line of generated code benefits from the collective wisdom of 28 design experts, creating professional, accessible, and thoughtfully crafted implementations.