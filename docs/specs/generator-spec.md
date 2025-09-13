# Generator System Specification

## Overview
This document specifies the architecture and implementation requirements for the design generation system that converts design briefs into structured design data.

## Generator Architecture

### Core Generator Interface
All generators must implement the following interface:

```javascript
class BaseGenerator {
  constructor(context, options = {}) {
    this.context = context;
    this.options = options;
    this.aiOrchestrator = context.aiOrchestrator;
    this.tokens = context.tokens;
  }

  async generate(input) {
    // Must be implemented by subclasses
    throw new Error('Generate method must be implemented');
  }

  validate(output) {
    // Optional validation method
    return true;
  }

  async generateWithAI(prompt, agentType) {
    return await this.aiOrchestrator.execute(prompt, agentType);
  }
}
```

## Token Generator

### Purpose
Generate design system tokens from style preferences and AI analysis.

### Input Format
```javascript
{
  stylePreferences: {
    colorScheme: 'blue',
    style: 'modern',
    mood: 'professional'
  },
  brandGuidelines: {
    primaryColor: '#3b82f6',
    fontFamily: 'Inter'
  },
  projectType: 'saas-landing'
}
```

### Output Format
```javascript
{
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    secondary: { /* ... */ },
    neutral: { /* ... */ },
    semantic: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  typography: {
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
  },
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '3rem',       // 48px
    '2xl': '6rem'     // 96px
  },
  borderRadius: {
    none: '0px',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
  }
}
```

### Generation Algorithm
1. **Color Analysis**: Use AI to analyze color preferences and generate harmonious palette
2. **Typography Selection**: Choose fonts based on project type and brand guidelines
3. **Scale Generation**: Generate mathematical scales for typography and spacing
4. **Semantic Mapping**: Create semantic color mappings (success, error, etc.)
5. **Accessibility Validation**: Ensure all color combinations meet WCAG AA standards

### AI Prompt Template
```
You are a design system architect. Generate design tokens based on:

Style Preferences: {stylePreferences}
Project Type: {projectType}
Brand Guidelines: {brandGuidelines}

Create a comprehensive token system including:
1. Primary color palette with 9 shades (50-900)
2. Secondary and neutral color palettes
3. Semantic colors for success, warning, error, info
4. Typography scale with consistent ratios
5. Spacing system based on 4px grid
6. Border radius and shadow systems

Ensure all colors pass WCAG AA accessibility requirements.
Return the tokens in the specified JSON format.
```

## Component Generator

### Purpose
Generate reusable UI components with variants and states.

### Input Format
```javascript
{
  componentType: 'button',
  tokens: { /* design tokens */ },
  variants: ['primary', 'secondary', 'ghost'],
  sizes: ['sm', 'md', 'lg'],
  options: {
    includeIcons: true,
    includeLoading: true,
    framework: 'react'
  }
}
```

### Output Format
```javascript
{
  name: 'Button',
  type: 'component',
  structure: {
    element: 'button',
    children: [
      { type: 'icon', optional: true, position: 'left' },
      { type: 'text', content: 'slot' },
      { type: 'spinner', conditional: 'loading', position: 'left' }
    ]
  },
  variants: {
    primary: {
      backgroundColor: 'var(--color-primary-500)',
      color: 'white',
      borderColor: 'var(--color-primary-500)'
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary-500)',
      borderColor: 'var(--color-primary-500)'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-neutral-700)',
      borderColor: 'transparent'
    }
  },
  sizes: {
    sm: {
      padding: 'var(--space-xs) var(--space-sm)',
      fontSize: 'var(--text-sm)',
      height: '32px'
    },
    md: {
      padding: 'var(--space-sm) var(--space-md)',
      fontSize: 'var(--text-base)',
      height: '40px'
    },
    lg: {
      padding: 'var(--space-md) var(--space-lg)',
      fontSize: 'var(--text-lg)',
      height: '48px'
    }
  },
  states: {
    default: {},
    hover: {
      opacity: 0.9,
      transform: 'translateY(-1px)'
    },
    active: {
      transform: 'translateY(0px)'
    },
    disabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    loading: {
      cursor: 'wait'
    }
  },
  props: {
    variant: {
      type: 'string',
      options: ['primary', 'secondary', 'ghost'],
      default: 'primary'
    },
    size: {
      type: 'string',
      options: ['sm', 'md', 'lg'],
      default: 'md'
    },
    disabled: {
      type: 'boolean',
      default: false
    },
    loading: {
      type: 'boolean',
      default: false
    },
    icon: {
      type: 'string',
      optional: true
    }
  }
}
```

### Component Types

#### Button
- **Variants**: primary, secondary, ghost, link
- **Sizes**: xs, sm, md, lg, xl
- **States**: default, hover, active, disabled, loading
- **Features**: icons, loading spinner, full width

#### Input
- **Types**: text, email, password, number, tel, url
- **Sizes**: sm, md, lg
- **States**: default, focus, error, disabled
- **Features**: labels, placeholders, help text, validation

#### Card
- **Variants**: default, outlined, elevated
- **Layouts**: vertical, horizontal
- **Features**: headers, footers, actions, images

#### Navigation
- **Types**: horizontal, vertical, breadcrumb
- **Features**: dropdowns, active states, responsive collapse

### AI Prompt Template
```
You are a UI designer expert. Generate a {componentType} component with:

Design Tokens: {tokens}
Variants: {variants}
Sizes: {sizes}
Framework: {framework}

Create a comprehensive component definition including:
1. Component structure and hierarchy
2. All variant styles using design tokens
3. Size variations with consistent scaling
4. Interactive states (hover, active, disabled)
5. Props interface with types and defaults
6. Accessibility considerations

Follow modern UI patterns and ensure the component is:
- Accessible (ARIA attributes, keyboard navigation)
- Responsive (works on all screen sizes)
- Consistent (uses design tokens throughout)
- Flexible (supports customization via props)

Return the component definition in the specified JSON format.
```

## Layout Generator

### Purpose
Generate page layouts by assembling components into structured sections.

### Input Format
```javascript
{
  layoutType: 'landing-page',
  sections: ['hero', 'features', 'testimonials', 'cta'],
  content: {
    heroTitle: 'Welcome to Our Product',
    features: [
      { title: 'Fast', description: 'Lightning fast performance' },
      { title: 'Secure', description: 'Bank-level security' },
      { title: 'Reliable', description: '99.9% uptime guarantee' }
    ]
  },
  components: { /* available components */ },
  tokens: { /* design tokens */ }
}
```

### Output Format
```javascript
{
  name: 'Landing Page',
  type: 'layout',
  structure: {
    element: 'main',
    className: 'landing-page',
    children: [
      {
        type: 'section',
        name: 'hero',
        component: 'Hero',
        props: {
          title: 'Welcome to Our Product',
          subtitle: 'The best solution for your needs',
          cta: {
            text: 'Get Started',
            variant: 'primary',
            size: 'lg'
          }
        },
        styles: {
          padding: 'var(--space-2xl) 0',
          backgroundColor: 'var(--color-primary-50)'
        }
      },
      {
        type: 'section',
        name: 'features',
        component: 'FeatureGrid',
        props: {
          features: [/* feature array */],
          columns: 3,
          gap: 'var(--space-lg)'
        },
        styles: {
          padding: 'var(--space-xl) 0'
        }
      }
    ]
  },
  responsive: {
    mobile: {
      maxWidth: '768px',
      modifications: {
        hero: { padding: 'var(--space-lg) 0' },
        features: { columns: 1 }
      }
    },
    tablet: {
      minWidth: '769px',
      maxWidth: '1024px',
      modifications: {
        features: { columns: 2 }
      }
    },
    desktop: {
      minWidth: '1025px'
    }
  },
  meta: {
    title: 'Landing Page',
    description: 'Generated landing page layout',
    keywords: ['landing', 'hero', 'features']
  }
}
```

### Layout Types

#### Landing Page
- **Sections**: hero, features, testimonials, pricing, cta, footer
- **Patterns**: F-layout, Z-layout, centered content
- **Features**: sticky navigation, smooth scrolling, responsive

#### Dashboard
- **Sections**: sidebar, header, main content, widgets
- **Patterns**: sidebar navigation, grid layouts, card-based
- **Features**: collapsible sidebar, responsive grid, dark mode

#### Documentation
- **Sections**: sidebar navigation, content area, table of contents
- **Patterns**: two-column layout, hierarchical navigation
- **Features**: search, breadcrumbs, syntax highlighting

#### E-commerce
- **Sections**: header, product grid, filters, pagination
- **Patterns**: product catalog, shopping cart, checkout flow
- **Features**: product search, filtering, sorting

## Asset Generator

### Purpose
Generate visual assets like icons, patterns, and illustrations.

### Icon Generator

#### Input Format
```javascript
{
  iconName: 'chevron-right',
  size: 24,
  strokeWidth: 2,
  style: 'outline',
  color: 'currentColor'
}
```

#### Output Format
```javascript
{
  name: 'chevron-right',
  type: 'icon',
  svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  variants: {
    16: '<svg width="16" height="16">...</svg>',
    20: '<svg width="20" height="20">...</svg>',
    24: '<svg width="24" height="24">...</svg>'
  },
  css: '.icon-chevron-right { width: 1em; height: 1em; display: inline-block; }',
  usage: {
    react: '<ChevronRightIcon className="w-5 h-5" />',
    html: '<i class="icon-chevron-right"></i>'
  }
}
```

#### Icon Library
- **Navigation**: chevron-left, chevron-right, chevron-up, chevron-down, arrow-left, arrow-right
- **Actions**: plus, minus, check, x, edit, delete, download, upload
- **Interface**: menu, search, filter, settings, user, bell, heart
- **Content**: image, file, folder, link, attachment, tag

### Pattern Generator

#### Input Format
```javascript
{
  patternType: 'dots',
  colors: ['#f3f4f6', '#e5e7eb'],
  size: 20,
  spacing: 40
}
```

#### Output Format
```javascript
{
  name: 'dots-pattern',
  type: 'pattern',
  svg: '<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="2" fill="#e5e7eb"/></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"/></svg>',
  css: '.pattern-dots { background-image: url("data:image/svg+xml,..."); }',
  dataUri: 'data:image/svg+xml;base64,...',
  usage: {
    css: 'background-image: url("data:image/svg+xml;base64,...")',
    scss: '@include pattern-dots($color-neutral-200)'
  }
}
```

## Generation Pipeline

### Workflow
1. **Input Analysis**: Parse and validate input data
2. **AI Orchestration**: Select appropriate agents for generation tasks
3. **Token Generation**: Create design system foundation
4. **Component Generation**: Build reusable components
5. **Layout Assembly**: Combine components into layouts
6. **Asset Creation**: Generate required visual assets
7. **Validation**: Ensure output quality and consistency
8. **Optimization**: Optimize for performance and size

### Dependencies
```
Tokens → Components → Layouts → Export
  ↓         ↓          ↓
Assets → Components → Layouts
```

### Error Handling
- **Validation Errors**: Clear messages with suggestions for fixes
- **Generation Failures**: Fallback to default templates
- **AI Failures**: Graceful degradation with template-based generation
- **Missing Dependencies**: Automatic dependency resolution

### Performance Optimization
- **Parallel Generation**: Generate independent components simultaneously
- **Caching**: Cache AI responses and computed values
- **Incremental Updates**: Only regenerate changed components
- **Memory Management**: Clean up resources after generation

This specification ensures consistent, high-quality generation across all design system components while maintaining flexibility and extensibility.