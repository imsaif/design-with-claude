# Phase 2: Generators (Week 2)

## Overview
**Duration:** 5 days
**Goal:** Build core generation capabilities for tokens, components, layouts, and assets
**Team:** 1-2 developers
**Prerequisites:** Phase 1 completed with working CLI and AI orchestrator

## Milestones
- ✅ **M2.1**: Design token generator functional
- ✅ **M2.2**: Component generator creates basic components
- ✅ **M2.3**: Layout generator assembles components
- ✅ **M2.4**: Asset generator creates simple SVGs

## Daily Breakdown

### Day 1: Design Token Generator
**Estimated Time:** 8 hours

#### Tasks
- [ ] **Color palette generator** (3 hours)
  - Primary/secondary color generation
  - Semantic color system (success, warning, error, info)
  - Color variants and shades (50-900)
  - Color accessibility validation

- [ ] **Typography scale generator** (2 hours)
  - Font family selection
  - Type scale calculation (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)
  - Line height system
  - Font weight mapping

- [ ] **Spacing system generator** (2 hours)
  - Base unit system (4px, 8px, 16px, etc.)
  - Semantic spacing (xs, sm, md, lg, xl, 2xl)
  - Responsive spacing modifiers
  - Component-specific spacing

- [ ] **Shadow and elevation system** (1 hour)
  - Box shadow system
  - Elevation levels (0-5)
  - Color-aware shadows
  - Subtle elevation variants

#### Deliverables
- Working `design-create generate tokens` command
- Complete design token JSON structure
- Token validation system

#### Code Examples
```javascript
// src/generators/tokens/TokenGenerator.js
class TokenGenerator {
  generateColorPalette(baseColor, style = 'modern') {
    const palette = {
      primary: this.generateColorScale(baseColor),
      secondary: this.generateSecondaryColor(baseColor),
      neutral: this.generateNeutralScale(),
      semantic: {
        success: { 50: '#f0fdf4', 500: '#22c55e', 900: '#14532d' },
        warning: { 50: '#fffbeb', 500: '#f59e0b', 900: '#78350f' },
        error: { 50: '#fef2f2', 500: '#ef4444', 900: '#7f1d1d' },
        info: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a8a' }
      }
    };

    return this.validateAccessibility(palette);
  }

  generateTypographyScale() {
    return {
      fontFamily: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        mono: 'JetBrains Mono, monospace'
      },
      fontSize: {
        xs: { size: '0.75rem', lineHeight: '1rem' },
        sm: { size: '0.875rem', lineHeight: '1.25rem' },
        base: { size: '1rem', lineHeight: '1.5rem' },
        lg: { size: '1.125rem', lineHeight: '1.75rem' },
        xl: { size: '1.25rem', lineHeight: '1.75rem' },
        '2xl': { size: '1.5rem', lineHeight: '2rem' },
        '3xl': { size: '1.875rem', lineHeight: '2.25rem' },
        '4xl': { size: '2.25rem', lineHeight: '2.5rem' }
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    };
  }
}
```

#### Generated Token Structure
```json
{
  "colors": {
    "primary": {
      "50": "#eff6ff",
      "500": "#3b82f6",
      "900": "#1e3a8a"
    },
    "semantic": {
      "success": "#22c55e",
      "warning": "#f59e0b",
      "error": "#ef4444"
    }
  },
  "typography": {
    "fontFamily": {
      "heading": "Inter, sans-serif",
      "body": "Inter, sans-serif"
    },
    "fontSize": {
      "base": "1rem",
      "lg": "1.125rem"
    }
  },
  "spacing": {
    "xs": "0.25rem",
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "1.5rem",
    "xl": "3rem"
  }
}
```

---

### Day 2: Component Generator - Basic Components
**Estimated Time:** 8 hours

#### Tasks
- [ ] **Button generator** (3 hours)
  - Primary, secondary, ghost variants
  - Size variations (sm, md, lg)
  - States (default, hover, active, disabled, loading)
  - Icon button support

- [ ] **Form component generators** (3 hours)
  - Input field (text, email, password, number)
  - Select dropdown
  - Checkbox and radio buttons
  - Textarea
  - Form validation states

- [ ] **Card component generator** (1.5 hours)
  - Basic content cards
  - Feature cards with icons
  - Pricing cards
  - Responsive card layouts

- [ ] **Component testing and validation** (0.5 hours)
  - Generated code validation
  - Token usage verification
  - Accessibility compliance

#### Deliverables
- Working `design-create generate component [type]` command
- Button, input, card component generators
- Component template system

#### Code Examples
```javascript
// src/generators/components/ButtonGenerator.js
class ButtonGenerator {
  generate(tokens, options = {}) {
    const { variant = 'primary', size = 'md', icon = false } = options;

    return {
      name: 'Button',
      variants: this.createVariants(tokens),
      sizes: this.createSizes(tokens),
      states: this.createStates(tokens),
      template: this.getTemplate(),
      styles: this.generateStyles(tokens, variant, size),
      props: ['variant', 'size', 'disabled', 'loading', 'icon']
    };
  }

  createVariants(tokens) {
    return {
      primary: {
        backgroundColor: tokens.colors.primary[500],
        color: tokens.colors.white,
        borderColor: 'transparent',
        '&:hover': {
          backgroundColor: tokens.colors.primary[600]
        }
      },
      secondary: {
        backgroundColor: 'transparent',
        color: tokens.colors.primary[500],
        borderColor: tokens.colors.primary[500],
        '&:hover': {
          backgroundColor: tokens.colors.primary[50]
        }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: tokens.colors.neutral[700],
        borderColor: 'transparent',
        '&:hover': {
          backgroundColor: tokens.colors.neutral[100]
        }
      }
    };
  }
}
```

#### Component Templates
```handlebars
{{!-- templates/components/button.hbs --}}
<button
  class="btn btn-{{variant}} btn-{{size}} {{#if disabled}}btn-disabled{{/if}} {{#if loading}}btn-loading{{/if}}"
  {{#if disabled}}disabled{{/if}}
  type="{{type}}"
>
  {{#if loading}}
    <span class="btn-spinner"></span>
  {{/if}}
  {{#if icon}}
    <span class="btn-icon">{{icon}}</span>
  {{/if}}
  {{#if content}}
    <span class="btn-content">{{content}}</span>
  {{/if}}
</button>
```

---

### Day 3: Component Generator - Complex Components
**Estimated Time:** 8 hours

#### Tasks
- [ ] **Navigation generators** (3 hours)
  - Header/navbar component
  - Sidebar navigation
  - Breadcrumb navigation
  - Mobile menu/hamburger

- [ ] **Layout components** (2 hours)
  - Container/wrapper
  - Grid system
  - Flexbox utilities
  - Responsive breakpoints

- [ ] **Interactive components** (2 hours)
  - Modal/dialog
  - Dropdown menu
  - Tooltip
  - Tab system

- [ ] **Component composition system** (1 hour)
  - Component dependency management
  - Nested component generation
  - Component relationship mapping

#### Deliverables
- Navigation component generators
- Layout component system
- Interactive component generators

#### Code Examples
```javascript
// src/generators/components/NavigationGenerator.js
class NavigationGenerator {
  generateHeader(tokens, options = {}) {
    const { logo = true, navigation = true, cta = true } = options;

    return {
      name: 'Header',
      structure: {
        container: 'header',
        children: [
          logo && { type: 'logo', position: 'left' },
          navigation && { type: 'nav', position: 'center' },
          cta && { type: 'cta', position: 'right' }
        ].filter(Boolean)
      },
      responsive: {
        mobile: { layout: 'hamburger', breakpoint: 'md' },
        desktop: { layout: 'horizontal' }
      },
      styles: this.generateHeaderStyles(tokens)
    };
  }
}
```

---

### Day 4: Layout Generator
**Estimated Time:** 8 hours

#### Tasks
- [ ] **Landing page layouts** (3 hours)
  - Hero + features + CTA structure
  - Multi-section layout assembly
  - Responsive layout patterns
  - Content block management

- [ ] **Dashboard layouts** (2 hours)
  - Sidebar + main content
  - Top navigation + content grid
  - Widget/card grid systems
  - Responsive dashboard patterns

- [ ] **Documentation layouts** (1.5 hours)
  - Sidebar navigation + content
  - Table of contents integration
  - Search and filtering
  - Content hierarchy

- [ ] **Layout composition engine** (1.5 hours)
  - Section ordering and arrangement
  - Responsive behavior definitions
  - Content area management
  - Layout template system

#### Deliverables
- Landing page layout generator
- Dashboard layout generator
- Layout composition system

#### Code Examples
```javascript
// src/generators/layouts/LayoutGenerator.js
class LayoutGenerator {
  generateLandingPage(tokens, components, content = {}) {
    return {
      name: 'LandingPage',
      sections: [
        {
          type: 'hero',
          component: 'Hero',
          props: {
            title: content.heroTitle || 'Welcome to Our Product',
            subtitle: content.heroSubtitle || 'The best solution for your needs',
            cta: content.heroCTA || 'Get Started'
          },
          styles: this.getHeroStyles(tokens)
        },
        {
          type: 'features',
          component: 'FeatureGrid',
          props: {
            features: content.features || this.getDefaultFeatures(),
            columns: 3
          },
          styles: this.getFeatureStyles(tokens)
        },
        {
          type: 'cta',
          component: 'CallToAction',
          props: {
            title: content.ctaTitle || 'Ready to get started?',
            button: content.ctaButton || 'Sign Up Now'
          },
          styles: this.getCTAStyles(tokens)
        }
      ],
      responsive: this.getResponsiveRules(),
      meta: {
        title: content.pageTitle || 'Landing Page',
        description: content.pageDescription || 'Generated landing page'
      }
    };
  }
}
```

---

### Day 5: Asset Generator & Integration
**Estimated Time:** 8 hours

#### Tasks
- [ ] **SVG icon generator** (2.5 hours)
  - Basic icon shapes (chevron, plus, check, etc.)
  - Icon sizing system (16px, 20px, 24px)
  - Stroke and fill variants
  - Icon optimization

- [ ] **Pattern generator** (1.5 hours)
  - Background patterns
  - Texture generation
  - Geometric patterns
  - Pattern variations

- [ ] **Placeholder generators** (1.5 hours)
  - Image placeholders with proper dimensions
  - Avatar placeholders
  - Logo placeholders
  - Content placeholders

- [ ] **Integration and testing** (2 hours)
  - Generator pipeline integration
  - Cross-component dependency resolution
  - Full generation workflow testing
  - Performance optimization

- [ ] **Documentation and demo** (0.5 hours)
  - Generator usage documentation
  - Demo generation scenarios
  - Phase 2 completion validation

#### Deliverables
- SVG icon generator
- Asset generation system
- Integrated generation pipeline
- Complete Phase 2 functionality

#### Code Examples
```javascript
// src/generators/assets/IconGenerator.js
class IconGenerator {
  generateIcon(name, options = {}) {
    const { size = 24, strokeWidth = 2, style = 'outline' } = options;

    const iconDefinitions = {
      chevronRight: {
        path: 'M9 18l6-6-6-6',
        viewBox: '0 0 24 24'
      },
      check: {
        path: 'M20 6L9 17l-5-5',
        viewBox: '0 0 24 24'
      },
      plus: {
        path: 'M12 5v14M5 12h14',
        viewBox: '0 0 24 24'
      }
    };

    const iconDef = iconDefinitions[name];
    if (!iconDef) throw new Error(`Icon ${name} not found`);

    return {
      name: name,
      svg: this.generateSVG(iconDef, size, strokeWidth, style),
      css: this.generateIconCSS(name, size),
      variants: this.generateIconVariants(iconDef, size)
    };
  }

  generateSVG(iconDef, size, strokeWidth, style) {
    return `
      <svg
        width="${size}"
        height="${size}"
        viewBox="${iconDef.viewBox}"
        fill="none"
        stroke="currentColor"
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="${iconDef.path}"/>
      </svg>
    `;
  }
}
```

## Success Criteria Validation

### Token Generator
- [ ] Generates complete design system with colors, typography, spacing
- [ ] Colors pass WCAG accessibility requirements
- [ ] Typography scale is mathematically consistent
- [ ] Spacing system uses consistent ratios
- [ ] Tokens are properly structured and named

### Component Generator
- [ ] Generates working HTML/CSS for all component types
- [ ] Components use design tokens consistently
- [ ] All variants and states are properly implemented
- [ ] Generated code is clean and semantic
- [ ] Components are responsive and accessible

### Layout Generator
- [ ] Assembles components into working layouts
- [ ] Responsive behavior is properly defined
- [ ] Layout structure is semantic and accessible
- [ ] Content areas are properly managed
- [ ] Multiple layout types work correctly

### Asset Generator
- [ ] Generates optimized SVG icons
- [ ] Icons are properly sized and scalable
- [ ] Patterns and textures are high quality
- [ ] Placeholders have correct dimensions
- [ ] Assets integrate well with components

## Integration Commands

### New CLI Commands Available
```bash
# Token generation
design-create generate tokens --style modern
design-create generate tokens --colors blue,green

# Component generation
design-create generate component button --variants primary,secondary
design-create generate component input --types text,email,password
design-create generate component card --style feature

# Layout generation
design-create generate layout landing-page
design-create generate layout dashboard --sidebar
design-create generate layout docs --toc

# Asset generation
design-create generate icons --set basic
design-create generate patterns --style geometric
design-create generate placeholders --sizes sm,md,lg
```

## Dependencies

### New Dependencies
```json
{
  "chroma-js": "^2.4.2",           // Color manipulation
  "svg-path-parser": "^1.1.0",    // SVG path processing
  "handlebars": "^4.7.8",         // Template engine
  "postcss": "^8.4.31",           // CSS processing
  "autoprefixer": "^10.4.16"      // CSS vendor prefixes
}
```

## Risk Management

### Technical Risks
1. **Token Quality**: Generated tokens may not be visually appealing
   - **Mitigation**: Curated color palettes and proven type scales

2. **Component Complexity**: Generated components may be too simple/complex
   - **Mitigation**: Iterative refinement based on common use cases

3. **Layout Responsiveness**: Generated layouts may not work on all devices
   - **Mitigation**: Mobile-first approach with thorough testing

### Performance Risks
1. **Generation Speed**: Complex generation may be slow
   - **Mitigation**: Parallel processing and caching

2. **Memory Usage**: Large generations may consume excessive memory
   - **Mitigation**: Streaming generation and cleanup

## Quality Gates

### Daily Quality Checks
- [ ] All generators produce valid output
- [ ] Generated code passes linting
- [ ] Performance benchmarks met
- [ ] All tests pass

### End-of-Phase Quality Gate
- [ ] Complete generation pipeline working
- [ ] All component types generate successfully
- [ ] Layouts assemble components correctly
- [ ] Assets integrate with components
- [ ] Generated code is production-ready
- [ ] Performance meets requirements
- [ ] Documentation complete

## Next Phase Preparation

### Phase 3 Handoff Items
1. Working generation system
2. Complete component library
3. Layout assembly pipeline
4. Asset generation capabilities
5. Generated project structure

### Phase 3 Prerequisites
- Generators produce structured data for export
- Component system supports multiple output formats
- Layout system can be serialized
- Asset system provides export-ready files

This comprehensive Phase 2 plan ensures we build robust, flexible generators that produce high-quality design implementations ready for multi-format export in Phase 3.