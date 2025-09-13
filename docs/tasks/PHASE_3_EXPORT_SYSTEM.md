# Phase 3: Export System (Week 3)

## Overview
**Duration:** 5 days
**Goal:** Multi-format export functionality for HTML, React, Vue, and local preview
**Team:** 1-2 developers
**Prerequisites:** Phase 2 completed with working generators

## Milestones
- ✅ **M3.1**: HTML/CSS export working
- ✅ **M3.2**: React export generating components
- ✅ **M3.3**: Vue export functional
- ✅ **M3.4**: Local preview server operational

## Daily Breakdown

### Day 1: HTML/CSS Export System
**Estimated Time:** 8 hours

#### Tasks
- [ ] **HTML template system** (2.5 hours)
  - Page template engine
  - Component-to-HTML conversion
  - Semantic HTML generation
  - SEO meta tag support

- [ ] **CSS generation system** (2.5 hours)
  - Token-to-CSS conversion
  - Component styling compilation
  - Responsive CSS generation
  - CSS optimization and minification

- [ ] **Asset management** (1.5 hours)
  - Image processing and optimization
  - SVG embedding and external files
  - Font loading and optimization
  - Static asset copying

- [ ] **Build pipeline** (1.5 hours)
  - File structure generation
  - Asset bundling
  - Production optimization
  - Directory structure management

#### Deliverables
- Working `design-create export html` command
- Complete HTML/CSS build system
- Optimized static site generation

#### Code Examples
```javascript
// src/exporters/html/HTMLExporter.js
class HTMLExporter {
  constructor(designData, config) {
    this.designData = designData;
    this.config = config;
    this.outputPath = config.outputPath || './exports/html';
  }

  async export() {
    await this.setupOutputDirectory();
    await this.generateCSS();
    await this.generateHTML();
    await this.copyAssets();
    await this.generateIndex();

    return {
      success: true,
      outputPath: this.outputPath,
      files: this.getGeneratedFiles()
    };
  }

  async generateCSS() {
    const css = this.compileCSSFromTokens();
    const componentCSS = this.compileComponentStyles();
    const responsiveCSS = this.generateResponsiveStyles();

    const fullCSS = [css, componentCSS, responsiveCSS].join('\n\n');
    const minifiedCSS = this.minifyCSS(fullCSS);

    await fs.writeFile(
      path.join(this.outputPath, 'styles.css'),
      minifiedCSS
    );
  }

  compileCSSFromTokens() {
    const { colors, typography, spacing } = this.designData.tokens;

    return `
      :root {
        /* Colors */
        ${Object.entries(colors).map(([name, value]) =>
          `--color-${name}: ${value};`
        ).join('\n        ')}

        /* Typography */
        ${Object.entries(typography.fontSize).map(([name, value]) =>
          `--text-${name}: ${value.size};`
        ).join('\n        ')}

        /* Spacing */
        ${Object.entries(spacing).map(([name, value]) =>
          `--space-${name}: ${value};`
        ).join('\n        ')}
      }

      * {
        box-sizing: border-box;
      }

      body {
        font-family: ${typography.fontFamily.body};
        line-height: 1.5;
        margin: 0;
        padding: 0;
      }
    `;
  }
}
```

#### Generated File Structure
```
exports/html/
├── index.html              # Main page
├── styles.css              # Compiled styles
├── assets/
│   ├── icons/             # SVG icons
│   ├── images/            # Optimized images
│   └── fonts/             # Web fonts
├── components/
│   ├── button.html        # Component examples
│   └── card.html          # Component examples
└── preview/
    └── index.html         # Component preview page
```

#### HTML Template Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{pageTitle}}</title>
  <meta name="description" content="{{pageDescription}}">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  {{#each sections}}
    <section class="section section-{{type}}">
      {{{content}}}
    </section>
  {{/each}}
</body>
</html>
```

---

### Day 2: React Component Export
**Estimated Time:** 8 hours

#### Tasks
- [ ] **React component generator** (3 hours)
  - Component template system
  - Props interface generation
  - State management integration
  - Event handler generation

- [ ] **TypeScript support** (2 hours)
  - Type definitions generation
  - Interface creation
  - Generic component types
  - Export type declarations

- [ ] **Styling integration** (1.5 hours)
  - CSS modules support
  - Styled-components integration
  - Tailwind CSS classes
  - CSS-in-JS solutions

- [ ] **Component package structure** (1.5 hours)
  - Package.json generation
  - Component index files
  - Story files for Storybook
  - README documentation

#### Deliverables
- Working `design-create export react` command
- Complete React component library
- TypeScript definitions
- Storybook integration

#### Code Examples
```javascript
// src/exporters/react/ReactExporter.js
class ReactExporter {
  constructor(designData, options = {}) {
    this.designData = designData;
    this.options = {
      typescript: true,
      storybook: true,
      cssModules: false,
      styledComponents: false,
      ...options
    };
    this.outputPath = options.outputPath || './exports/react';
  }

  async export() {
    await this.setupOutputDirectory();
    await this.generateComponents();
    await this.generateTypes();
    await this.generateStyles();
    await this.generateStories();
    await this.generatePackageJson();
    await this.generateIndex();

    return {
      success: true,
      outputPath: this.outputPath,
      components: this.getComponentList()
    };
  }

  generateButtonComponent(buttonData) {
    const { name, variants, props, styles } = buttonData;

    const componentCode = this.options.typescript ? `
import React from 'react';
import './Button.css';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
  ...props
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(event);
    }
  };

  return (
    <button
      className={\`btn btn-\${variant} btn-\${size} \${loading ? 'btn-loading' : ''}\`}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {children}
    </button>
  );
};

export default Button;
    ` : `
import React from 'react';
import './Button.css';

export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
  ...props
}) => {
  const handleClick = (event) => {
    if (!disabled && !loading && onClick) {
      onClick(event);
    }
  };

  return (
    <button
      className={\`btn btn-\${variant} btn-\${size} \${loading ? 'btn-loading' : ''}\`}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {children}
    </button>
  );
};

export default Button;
    `;

    return componentCode;
  }
}
```

#### Generated React Structure
```
exports/react/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.css
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   └── Input/
│   │       ├── Input.tsx
│   │       ├── Input.css
│   │       ├── Input.stories.tsx
│   │       └── index.ts
│   ├── tokens/
│   │   └── index.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── .storybook/
│   ├── main.js
│   └── preview.js
└── README.md
```

---

### Day 3: Vue Component Export
**Estimated Time:** 8 hours

#### Tasks
- [ ] **Vue component generator** (3 hours)
  - Single File Component (SFC) generation
  - Composition API implementation
  - Props and emits definition
  - Scoped styling support

- [ ] **TypeScript integration** (2 hours)
  - Component type definitions
  - Props interface generation
  - Composition API typing
  - Export declarations

- [ ] **Styling solutions** (1.5 hours)
  - Scoped CSS support
  - CSS modules integration
  - Tailwind CSS classes
  - Styled components for Vue

- [ ] **Vue ecosystem integration** (1.5 hours)
  - Package structure for Vue
  - Plugin registration
  - Component documentation
  - Build configuration

#### Deliverables
- Working `design-create export vue` command
- Complete Vue component library
- TypeScript support
- Vue ecosystem integration

#### Code Examples
```javascript
// src/exporters/vue/VueExporter.js
class VueExporter {
  constructor(designData, options = {}) {
    this.designData = designData;
    this.options = {
      typescript: true,
      compositionApi: true,
      scopedCss: true,
      ...options
    };
    this.outputPath = options.outputPath || './exports/vue';
  }

  generateButtonComponent(buttonData) {
    const { name, variants, props, styles } = buttonData;

    return this.options.typescript ? `
<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="btn-spinner" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClasses = computed(() => [
  'btn',
  \`btn-\${props.variant}\`,
  \`btn-\${props.size}\`,
  { 'btn-loading': props.loading }
]);

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
${this.generateButtonCSS(styles)}
</style>
    ` : `
<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="btn-spinner" />
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'ghost'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const buttonClasses = computed(() => [
  'btn',
  \`btn-\${props.variant}\`,
  \`btn-\${props.size}\`,
  { 'btn-loading': props.loading }
]);

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
${this.generateButtonCSS(styles)}
</style>
    `;
  }
}
```

#### Generated Vue Structure
```
exports/vue/
├── src/
│   ├── components/
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   └── Card.vue
│   ├── composables/
│   │   └── useTokens.ts
│   ├── tokens/
│   │   └── index.ts
│   └── index.ts
├── types/
│   └── components.d.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

### Day 4: Local Preview Server & Development Tools
**Estimated Time:** 8 hours

#### Tasks
- [ ] **Vite-based preview server** (3 hours)
  - Development server setup
  - Hot module replacement
  - Component playground
  - Live reload functionality

- [ ] **Component playground** (2 hours)
  - Interactive component testing
  - Props manipulation UI
  - Real-time preview updates
  - Component variation showcase

- [ ] **Build and development scripts** (1.5 hours)
  - Build optimization
  - Development vs production modes
  - Asset optimization
  - Bundle analysis

- [ ] **Documentation generation** (1.5 hours)
  - Automatic component documentation
  - Props and usage examples
  - Style guide generation
  - Integration guides

#### Deliverables
- Working `design-create preview` command
- Interactive component playground
- Development tools and scripts
- Auto-generated documentation

#### Code Examples
```javascript
// src/preview/PreviewServer.js
class PreviewServer {
  constructor(designData, options = {}) {
    this.designData = designData;
    this.options = {
      port: 3000,
      open: true,
      ...options
    };
  }

  async start() {
    const vite = await import('vite');

    const server = await vite.createServer({
      root: this.setupPlaygroundDirectory(),
      server: {
        port: this.options.port,
        open: this.options.open
      },
      plugins: [
        this.createComponentPlaygroundPlugin(),
        this.createTokenInspectorPlugin()
      ]
    });

    await server.listen();
    console.log(`Preview server running at http://localhost:${this.options.port}`);

    return server;
  }

  setupPlaygroundDirectory() {
    const playgroundPath = path.join(process.cwd(), '.design-preview');

    // Generate playground HTML
    this.generatePlaygroundHTML(playgroundPath);
    this.generatePlaygroundJS(playgroundPath);
    this.generatePlaygroundCSS(playgroundPath);

    return playgroundPath;
  }

  generatePlaygroundHTML(outputPath) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design System Preview</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <div id="app">
    <div class="playground-header">
      <h1>Design System Preview</h1>
      <div class="playground-controls">
        <button id="toggle-theme">Toggle Theme</button>
        <select id="component-select">
          ${this.generateComponentOptions()}
        </select>
      </div>
    </div>

    <div class="playground-content">
      <div class="playground-sidebar">
        <div class="token-inspector">
          <h3>Design Tokens</h3>
          <div id="token-display"></div>
        </div>
      </div>

      <div class="playground-main">
        <div id="component-preview"></div>
        <div class="component-controls">
          <h4>Component Props</h4>
          <div id="props-controls"></div>
        </div>
      </div>
    </div>
  </div>

  <script type="module" src="./playground.js"></script>
</body>
</html>
    `;

    fs.writeFileSync(path.join(outputPath, 'index.html'), html);
  }
}
```

#### Preview Features
- **Component Playground**: Interactive testing of all generated components
- **Token Inspector**: Visual display of all design tokens
- **Responsive Testing**: Preview components at different breakpoints
- **Theme Switching**: Toggle between light/dark modes
- **Code Export**: Copy component code snippets
- **Accessibility Testing**: Built-in accessibility checks

---

### Day 5: Export Integration & Optimization
**Estimated Time:** 8 hours

#### Tasks
- [ ] **Export orchestration** (2 hours)
  - Unified export command interface
  - Parallel export processing
  - Export format selection
  - Progress tracking and reporting

- [ ] **Performance optimization** (2 hours)
  - Bundle size optimization
  - Image compression
  - CSS minification
  - Tree shaking implementation

- [ ] **Quality assurance** (2 hours)
  - Generated code validation
  - Accessibility compliance checking
  - Performance benchmarking
  - Cross-browser compatibility

- [ ] **Documentation and testing** (2 hours)
  - Complete export documentation
  - Integration test suite
  - Performance test suite
  - User acceptance testing

#### Deliverables
- Unified export system
- Performance optimizations
- Quality assurance suite
- Complete Phase 3 functionality

#### Code Examples
```javascript
// src/exporters/ExportOrchestrator.js
class ExportOrchestrator {
  constructor(designData, config) {
    this.designData = designData;
    this.config = config;
    this.exporters = {
      html: new HTMLExporter(designData, config.html),
      react: new ReactExporter(designData, config.react),
      vue: new VueExporter(designData, config.vue)
    };
  }

  async exportAll(formats = ['html', 'react', 'vue']) {
    const results = await Promise.allSettled(
      formats.map(format => this.exportFormat(format))
    );

    return {
      success: results.every(result => result.status === 'fulfilled'),
      results: results.map((result, index) => ({
        format: formats[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }))
    };
  }

  async exportFormat(format) {
    const exporter = this.exporters[format];
    if (!exporter) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    console.log(`Exporting to ${format}...`);
    const result = await exporter.export();
    console.log(`✅ ${format} export completed`);

    return result;
  }
}
```

## Success Criteria Validation

### HTML Export
- [ ] Generates semantic, accessible HTML
- [ ] CSS uses design tokens consistently
- [ ] Responsive layouts work correctly
- [ ] Assets are optimized and load properly
- [ ] Static site is production-ready

### React Export
- [ ] Generates working React components
- [ ] TypeScript definitions are accurate
- [ ] Components accept proper props
- [ ] Styling is properly integrated
- [ ] Storybook stories work correctly

### Vue Export
- [ ] Generates working Vue components
- [ ] Composition API is implemented correctly
- [ ] Scoped styling works properly
- [ ] TypeScript integration is functional
- [ ] Components are properly typed

### Preview Server
- [ ] Server starts and loads components
- [ ] Hot reload works during development
- [ ] Component playground is interactive
- [ ] Token inspector displays correctly
- [ ] Responsive preview works

## New CLI Commands

```bash
# Export commands
design-create export html                    # Export to HTML/CSS
design-create export react --typescript     # Export React with TS
design-create export vue --composition-api  # Export Vue with Composition API
design-create export all                    # Export to all formats

# Preview commands
design-create preview                        # Start preview server
design-create preview --port 4000          # Custom port
design-create preview --no-open            # Don't auto-open browser

# Build commands
design-create build                         # Build all exports
design-create build --optimize             # Optimized production build
design-create build --format react         # Build specific format
```

## Dependencies

### New Dependencies
```json
{
  "vite": "^5.0.0",                    // Preview server
  "@vitejs/plugin-react": "^4.1.1",   // React support
  "@vitejs/plugin-vue": "^4.4.1",     // Vue support
  "postcss": "^8.4.31",               // CSS processing
  "autoprefixer": "^10.4.16",         // CSS prefixes
  "cssnano": "^6.0.1",                // CSS minification
  "imagemin": "^8.0.1",               // Image optimization
  "typescript": "^5.2.2",             // TypeScript support
  "@storybook/react": "^7.5.1",       // Storybook integration
  "rollup": "^4.1.4"                  // Bundle optimization
}
```

## Quality Gates

### Daily Quality Checks
- [ ] All export formats generate successfully
- [ ] Generated code passes validation
- [ ] Performance benchmarks are met
- [ ] Preview server functions correctly

### End-of-Phase Quality Gate
- [ ] All export formats work end-to-end
- [ ] Generated code is production-ready
- [ ] Preview server provides good UX
- [ ] Documentation is comprehensive
- [ ] Performance meets requirements
- [ ] Accessibility standards met

## Next Phase Preparation

### Phase 4 Handoff Items
1. Working multi-format export system
2. Generated design data structure
3. Component serialization format
4. Asset management system
5. Preview and testing infrastructure

### Phase 4 Prerequisites
- Export system can serialize design data
- Components can be converted to structured format
- Asset system provides export-ready files
- Token system can be mapped to external formats

This comprehensive Phase 3 plan ensures we build a robust, multi-format export system that produces production-ready code in HTML, React, and Vue formats, setting the foundation for Figma integration in Phase 4.