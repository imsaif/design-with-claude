# CLI Specification

## Overview
This document specifies the command-line interface for the Design Implementation Tool, including all commands, options, arguments, and expected behaviors.

## Global CLI Structure

### Installation
```bash
# Global installation
npm install -g design-create

# Local project installation
npm install design-create
npx design-create <command>
```

### Global Options
```bash
design-create [command] [options]

Global Options:
  -v, --version                 Show version number
  -h, --help                   Show help information
  --config <path>              Use custom config file
  --verbose                    Enable verbose logging
  --silent                     Suppress all output except errors
  --dry-run                    Show what would be done without executing
```

## Core Commands

### init - Initialize Project
Create a new design project with proper structure and configuration.

```bash
design-create init [project-name] [options]

Arguments:
  project-name                 Name of the project directory (optional)

Options:
  -f, --framework <type>       Framework preference (react|vue|html) [default: react]
  -s, --styling <type>         Styling approach (css|scss|tailwind) [default: css]
  -t, --typescript            Enable TypeScript support
  --no-git                     Skip git initialization
  --template <name>            Use predefined template

Examples:
  design-create init my-app
  design-create init --framework vue --styling scss
  design-create init landing-page --template saas
```

**Expected Output:**
```
✅ Creating project structure...
✅ Generating configuration files...
✅ Installing dependencies...
✅ Initializing git repository...

🎨 Project 'my-app' created successfully!

Next steps:
  cd my-app
  design-create from-brief "Your design description"
  design-create preview
```

### from-brief - Generate from Description
Generate complete design implementation from a text description.

```bash
design-create from-brief <description> [options]

Arguments:
  description                  Design brief or description (required)

Options:
  --style <theme>             Design style (modern|classic|minimal) [default: modern]
  --colors <palette>          Color preference (blue|green|purple|custom)
  --framework <type>          Override project framework
  --components <list>         Specific components to generate
  --no-tokens                 Skip token generation
  --no-layouts                Skip layout generation

Examples:
  design-create from-brief "SaaS landing page with hero and pricing"
  design-create from-brief "Dashboard with charts and tables" --style minimal
  design-create from-brief "E-commerce product page" --colors blue --components "button,card,input"
```

**Expected Output:**
```
🔍 Analyzing design brief...
🎨 Generating design tokens...
🧩 Creating components...
📄 Building layouts...
🎯 Assembling design system...

✅ Generated design system with:
   • 42 design tokens
   • 8 components (Button, Input, Card, Header, Hero, Features, CTA, Footer)
   • 3 layouts (Desktop, Tablet, Mobile)

Next steps:
  design-create preview        # Preview in browser
  design-create export html    # Export to HTML
  design-create export figma   # Export to Figma
```

## Generation Commands

### generate - Generate Specific Items
Generate specific design elements.

```bash
design-create generate <type> [name] [options]

Types:
  tokens                      Generate design tokens
  component <name>            Generate specific component
  layout <type>              Generate layout template
  icons <set>                Generate icon set
  patterns                   Generate background patterns

Options:
  --variants <list>          Component variants to include
  --sizes <list>             Component sizes to include
  --states <list>            Component states to include
  --style <theme>            Design style theme
  --colors <palette>         Color palette preference

Examples:
  design-create generate tokens --style modern
  design-create generate component button --variants primary,secondary,ghost
  design-create generate component input --types text,email,password
  design-create generate layout landing-page
  design-create generate layout dashboard --sidebar
  design-create generate icons basic
  design-create generate patterns --style geometric
```

### tokens - Token Management
Manage design tokens specifically.

```bash
design-create tokens <action> [options]

Actions:
  generate                   Generate new token system
  update                     Update existing tokens
  validate                   Validate token structure
  export                     Export tokens to file

Options:
  --format <type>            Export format (json|css|scss) [default: json]
  --output <path>            Output file path
  --base-color <color>       Primary color for generation
  --font-family <family>     Primary font family
  --spacing-base <size>      Base spacing unit [default: 4px]

Examples:
  design-create tokens generate --base-color #3b82f6
  design-create tokens export --format css --output tokens.css
  design-create tokens validate
```

## Export Commands

### export - Export to Various Formats
Export generated design system to different formats.

```bash
design-create export <format> [options]

Formats:
  html                       Export to HTML/CSS
  react                      Export React components
  vue                        Export Vue components
  figma                      Export to Figma
  tokens                     Export tokens only
  all                        Export to all formats

Options:
  --output <path>            Output directory [default: ./exports]
  --typescript               Generate TypeScript definitions
  --storybook               Include Storybook stories
  --optimize                Optimize output for production
  --components <list>       Export specific components only
  --include-assets          Include generated assets

Examples:
  design-create export html
  design-create export react --typescript --storybook
  design-create export vue --output ./vue-components
  design-create export figma --token $FIGMA_TOKEN
  design-create export all --optimize
```

### Figma Export Specific Options
```bash
design-create export figma [options]

Options:
  --token <token>            Figma personal access token
  --name <name>              Figma file name [default: Generated Design System]
  --team <id>                Figma team ID
  --update <file-key>        Update existing file instead of creating new
  --components-only          Export components only, skip layouts
  --variables-only           Export variables/tokens only
  --no-styles               Skip style creation
  --batch-size <number>      API request batch size [default: 10]

Environment Variables:
  FIGMA_TOKEN               Figma personal access token
  FIGMA_TEAM_ID            Default team ID

Examples:
  design-create export figma --token figd_xxx --name "My Design System"
  design-create export figma --update abc123 --components-only
  FIGMA_TOKEN=figd_xxx design-create export figma
```

## Development Commands

### preview - Preview Server
Start local development server for previewing generated designs.

```bash
design-create preview [options]

Options:
  --port <number>            Server port [default: 3000]
  --host <hostname>          Server hostname [default: localhost]
  --open                     Open browser automatically [default: true]
  --no-open                  Don't open browser
  --components               Show components playground
  --tokens                   Show tokens inspector
  --layouts                  Show layout previews

Examples:
  design-create preview
  design-create preview --port 4000 --no-open
  design-create preview --components --tokens
```

### build - Build for Production
Build optimized version of generated design system.

```bash
design-create build [format] [options]

Formats:
  html                       Build HTML/CSS version
  react                      Build React library
  vue                        Build Vue library
  all                        Build all formats [default]

Options:
  --output <path>            Build output directory [default: ./dist]
  --minify                   Minify output files
  --sourcemap               Generate source maps
  --analyze                  Analyze bundle size
  --target <target>          Build target (es5|es2015|es2017) [default: es2015]

Examples:
  design-create build
  design-create build react --minify --sourcemap
  design-create build --output ./production --analyze
```

## Configuration Commands

### config - Configuration Management
Manage project and global configuration.

```bash
design-create config <action> [key] [value] [options]

Actions:
  get <key>                  Get configuration value
  set <key> <value>          Set configuration value
  list                       List all configuration
  reset                      Reset to defaults
  init                       Initialize configuration

Options:
  --global                   Use global configuration
  --local                    Use local project configuration [default]
  --file <path>              Use specific config file

Examples:
  design-create config get framework
  design-create config set styling scss
  design-create config list
  design-create config reset --global
```

### validate - Validation
Validate project structure, generated code, and configurations.

```bash
design-create validate [target] [options]

Targets:
  project                    Validate project structure [default]
  tokens                     Validate design tokens
  components                 Validate components
  config                     Validate configuration
  all                        Validate everything

Options:
  --strict                   Enable strict validation
  --fix                      Auto-fix validation issues
  --format <type>            Output format (text|json) [default: text]
  --output <path>            Write validation report to file

Examples:
  design-create validate
  design-create validate tokens --strict
  design-create validate all --fix --format json
```

## Utility Commands

### clean - Clean Generated Files
Clean generated files and caches.

```bash
design-create clean [target] [options]

Targets:
  exports                    Clean export directories [default]
  cache                      Clean generation cache
  all                        Clean everything

Options:
  --force                    Force clean without confirmation
  --dry-run                  Show what would be cleaned

Examples:
  design-create clean
  design-create clean cache --force
  design-create clean all --dry-run
```

### info - Project Information
Display project information and status.

```bash
design-create info [options]

Options:
  --components               Show component information
  --tokens                   Show token information
  --exports                  Show export status
  --config                   Show configuration
  --verbose                  Show detailed information

Examples:
  design-create info
  design-create info --components --tokens
  design-create info --verbose
```

## Exit Codes

- **0**: Success
- **1**: General error
- **2**: Invalid command or arguments
- **3**: Configuration error
- **4**: Generation failure
- **5**: Export failure
- **6**: Network/API error
- **7**: Validation failure

## Configuration File Format

### Project Configuration (`.design-project/config.json`)
```json
{
  "name": "my-design-project",
  "version": "1.0.0",
  "framework": "react",
  "styling": "css",
  "typescript": true,
  "tokens": {
    "colorMode": "hsl",
    "spacingBase": "4px",
    "fontFamily": "Inter, sans-serif"
  },
  "generation": {
    "aiProvider": "anthropic",
    "cacheEnabled": true,
    "parallelGeneration": true
  },
  "exports": {
    "html": {
      "enabled": true,
      "outputPath": "./exports/html"
    },
    "react": {
      "enabled": true,
      "typescript": true,
      "storybook": true,
      "outputPath": "./exports/react"
    },
    "figma": {
      "enabled": false,
      "token": null,
      "teamId": null
    }
  }
}
```

### Global Configuration (`~/.design-create/config.json`)
```json
{
  "defaults": {
    "framework": "react",
    "styling": "css",
    "typescript": false
  },
  "ai": {
    "provider": "anthropic",
    "apiKey": null
  },
  "figma": {
    "token": null,
    "teamId": null
  },
  "preferences": {
    "autoOpen": true,
    "verboseOutput": false,
    "analyticsEnabled": true
  }
}
```

## Environment Variables

```bash
# AI Provider Configuration
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here

# Figma Configuration
FIGMA_TOKEN=figd_your_token_here
FIGMA_TEAM_ID=your_team_id

# Development Configuration
NODE_ENV=development|production
DEBUG=design-create*
LOG_LEVEL=info|debug|error

# Proxy Configuration (if needed)
HTTP_PROXY=http://proxy:8080
HTTPS_PROXY=https://proxy:8080
```

## Error Handling

### Common Error Messages
```bash
# Invalid command
Error: Unknown command 'generate-component'. Did you mean 'generate component'?

# Missing required argument
Error: Missing required argument 'description' for command 'from-brief'

# Configuration error
Error: Invalid framework 'angular'. Supported frameworks: react, vue, html

# Generation error
Error: Failed to generate tokens. Please check your AI provider configuration.

# Export error
Error: Figma export failed. Invalid token or insufficient permissions.

# Network error
Error: Unable to connect to AI service. Check your internet connection.
```

### Help System
```bash
# Global help
design-create --help

# Command-specific help
design-create init --help
design-create export --help
design-create export figma --help

# Example usage in help
design-create generate component --help
```

This CLI specification provides a comprehensive, user-friendly interface that supports all aspects of the design implementation tool while maintaining consistency and predictability in command structure and behavior.