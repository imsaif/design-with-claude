# Usage Examples

## Overview
This document provides comprehensive examples of using the Design Implementation Tool for various real-world scenarios.

## Quick Start Example

### 1. Create a SaaS Landing Page
```bash
# Initialize project
design-create init saas-landing --framework react --styling css

# Generate from brief
design-create from-brief "Modern SaaS landing page with hero section, feature grid, pricing table, and call-to-action. Use blue color scheme and professional styling."

# Preview the result
design-create preview

# Export to different formats
design-create export html
design-create export react --typescript
design-create export figma --token $FIGMA_TOKEN
```

**Generated Output:**
- Complete design system with blue-themed tokens
- Hero component with gradient background
- Feature grid with 3 columns
- Pricing table with 3 tiers
- Responsive layouts for desktop, tablet, mobile
- Production-ready HTML/CSS and React components
- Figma file with organized design system

## Detailed Workflow Examples

### Example 1: E-commerce Product Page

#### Step 1: Project Setup
```bash
design-create init ecommerce-store --framework vue --styling scss --typescript
cd ecommerce-store
```

#### Step 2: Generate Design System
```bash
design-create from-brief "E-commerce product page with image gallery, product details, reviews section, and related products. Use green accent color, clean modern design."
```

**AI Analysis Output:**
```
🔍 Analyzing design brief...
   Project type: e-commerce
   Key components: gallery, product-details, reviews, recommendations
   Style: modern, clean
   Color preference: green

🎨 Generating design tokens...
   Primary colors: Green palette (#10b981)
   Secondary colors: Neutral grays
   Typography: Modern sans-serif stack
   Spacing: 8px base grid

🧩 Creating components...
   ✅ Image Gallery (with thumbnails, zoom)
   ✅ Product Info (title, price, description)
   ✅ Add to Cart Button
   ✅ Review Card
   ✅ Product Card (for recommendations)
   ✅ Rating Stars
   ✅ Quantity Selector
```

#### Step 3: Customize Components
```bash
# Generate additional components
design-create generate component badge --variants sale,new,featured
design-create generate component breadcrumb
design-create generate icons ecommerce  # cart, heart, star, etc.
```

#### Step 4: Preview and Test
```bash
design-create preview --port 4000
# Opens browser at http://localhost:4000 with interactive playground
```

#### Step 5: Export Results
```bash
# Export Vue components
design-create export vue --output ./src/components

# Export to Figma
design-create export figma --name "Ecommerce Design System"

# Build production assets
design-create build --minify
```

### Example 2: Dashboard Application

#### Project Brief
"Analytics dashboard for a SaaS application with sidebar navigation, top metrics cards, charts for revenue and user growth, data table for recent transactions, and user management section. Use dark theme with purple accents."

#### Implementation
```bash
# Initialize
design-create init analytics-dashboard --framework react --styling tailwind

# Generate from brief
design-create from-brief "Analytics dashboard for a SaaS application with sidebar navigation, top metrics cards, charts for revenue and user growth, data table for recent transactions, and user management section. Use dark theme with purple accents."
```

**Generated Components:**
```
🧩 Dashboard Components Generated:
   ✅ Sidebar Navigation
      - Logo area
      - Navigation menu
      - User profile section
      - Collapsible design

   ✅ Metric Cards
      - Revenue, Users, Conversion, Growth
      - Icons and trend indicators
      - Hover animations

   ✅ Chart Components
      - Line chart (revenue over time)
      - Bar chart (user growth)
      - Donut chart (traffic sources)
      - Responsive and interactive

   ✅ Data Table
      - Sortable columns
      - Pagination
      - Search and filter
      - Row actions

   ✅ User Management
      - User list with avatars
      - Role badges
      - Action buttons
      - Modal forms
```

#### Advanced Customization
```bash
# Generate specific chart variants
design-create generate component chart --variants line,bar,pie,area

# Create additional layouts
design-create generate layout dashboard --variants full-width,boxed

# Generate dark theme tokens
design-create tokens generate --theme dark --base-color purple
```

### Example 3: Documentation Site

#### Brief to Implementation
```bash
design-create init docs-site --framework html --styling css

design-create from-brief "Documentation website with sidebar navigation, main content area, table of contents, search functionality, and code syntax highlighting. Clean, readable design with good typography."
```

**Generated Structure:**
```
📄 Documentation Layout:
   ├── Header
   │   ├── Logo
   │   ├── Search bar
   │   └── Version selector
   ├── Sidebar Navigation
   │   ├── Menu sections
   │   ├── Collapsible categories
   │   └── Active state indicators
   ├── Main Content
   │   ├── Article content
   │   ├── Code blocks
   │   ├── Tables
   │   └── Callout boxes
   └── Table of Contents
       ├── Auto-generated
       ├── Sticky positioning
       └── Smooth scrolling
```

## Component-Specific Examples

### Button Component Variations
```bash
# Generate comprehensive button system
design-create generate component button --variants primary,secondary,ghost,danger,success --sizes xs,sm,md,lg,xl --states default,hover,active,disabled,loading

# Export specific formats
design-create export react --components button --typescript
```

**Generated Button Features:**
- 5 variants × 5 sizes = 25 combinations
- Interactive states with smooth transitions
- Icon support (left, right, icon-only)
- Loading state with spinner
- Accessibility attributes
- TypeScript definitions

### Form Components Suite
```bash
# Generate complete form system
design-create generate component input --types text,email,password,number,tel,url,search
design-create generate component textarea --variants default,resizable
design-create generate component select --variants single,multi,searchable
design-create generate component checkbox --variants default,switch
design-create generate component radio --variants default,button-group
```

### Navigation Components
```bash
# Generate navigation components
design-create generate component navbar --variants horizontal,centered,with-dropdown
design-create generate component sidebar --variants fixed,collapsible,mobile-drawer
design-create generate component breadcrumb --variants default,with-icons,separated
design-create generate component tabs --variants default,pills,underline
```

## Advanced Usage Patterns

### Design System Workflow
```bash
# Step 1: Create design system foundation
design-create init design-system --framework react
design-create tokens generate --style modern --colors blue

# Step 2: Build component library
design-create generate component button --variants primary,secondary,ghost
design-create generate component input --types text,email,password
design-create generate component card --variants default,outlined,elevated

# Step 3: Create documentation
design-create export storybook --output ./storybook
design-create export tokens --format css --output ./tokens.css

# Step 4: Publish to Figma
design-create export figma --name "Company Design System" --team $FIGMA_TEAM_ID
```

### Multi-Project Setup
```bash
# Main design system
design-create init company-design-system --framework react
design-create tokens generate --base-color #0066cc --font-family "Inter"

# Marketing site using design system
design-create init marketing-site --framework react
design-create import-tokens ../company-design-system/tokens
design-create from-brief "Marketing website with hero, features, testimonials"

# Product application
design-create init product-app --framework react
design-create import-tokens ../company-design-system/tokens
design-create from-brief "SaaS dashboard application"
```

### Custom Template Creation
```bash
# Create reusable template
design-create init startup-landing --framework react
design-create from-brief "Startup landing page template"
design-create template save startup-landing --name "Startup Landing"

# Use template in new projects
design-create init new-startup --template "Startup Landing"
```

## Integration Examples

### With Existing Projects

#### React Project Integration
```bash
# In existing React project
npm install design-create

# Generate components into existing structure
design-create generate component button --output ./src/components/ui
design-create export react --output ./src/design-system --typescript

# Import and use
import { Button } from './design-system/Button';
```

#### Vue Project Integration
```bash
# In existing Vue project
design-create generate tokens --format css --output ./src/assets/tokens.css
design-create generate component button --framework vue --output ./src/components

# Import in main.js
import './assets/tokens.css';
```

### CI/CD Integration
```bash
# .github/workflows/design-system.yml
name: Design System Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Generate design system
        run: design-create build --format all
      - name: Export to Figma
        run: design-create export figma --token ${{ secrets.FIGMA_TOKEN }}
      - name: Deploy Storybook
        run: npm run deploy-storybook
```

## Troubleshooting Examples

### Common Issues and Solutions

#### Issue: AI Generation Fails
```bash
# Check AI provider configuration
design-create config get ai.provider
design-create config set ai.provider anthropic

# Test with simpler brief
design-create from-brief "Simple button component"

# Use fallback templates
design-create generate component button --no-ai
```

#### Issue: Figma Export Errors
```bash
# Validate token
design-create validate config --strict

# Test with smaller export
design-create export figma --components-only

# Check rate limits
design-create export figma --batch-size 5
```

#### Issue: Large Project Performance
```bash
# Enable parallel generation
design-create config set generation.parallel true

# Use incremental generation
design-create generate component button --cache

# Clean and rebuild
design-create clean cache
design-create build --optimize
```

## Best Practices Examples

### Naming Conventions
```bash
# Project names
design-create init company-design-system
design-create init marketing-website-2024
design-create init admin-dashboard-v2

# Component generation
design-create generate component primary-button
design-create generate component user-profile-card
design-create generate layout landing-page-hero
```

### Team Workflow
```bash
# Lead designer creates system
design-create init team-design-system
design-create tokens generate --style modern
design-create export figma --name "Team Design System"

# Developers use system
git clone team-design-system
design-create export react --output ../frontend/src/design-system
design-create export vue --output ../admin/src/components

# Continuous updates
design-create tokens update --base-color #new-brand-color
design-create export all --optimize
```

### Performance Optimization
```bash
# Optimize for production
design-create build --minify --sourcemap --analyze

# Tree shake unused components
design-create export react --components button,input,card --optimize

# Compress assets
design-create export html --compress-images --minify-css
```

## Output Examples

### Generated File Structure
```
my-project/
├── .design-project/
│   ├── config.json
│   ├── state.json
│   └── cache/
├── tokens/
│   ├── colors.json
│   ├── typography.json
│   └── spacing.json
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.css
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   └── Input/
├── layouts/
│   └── LandingPage/
├── assets/
│   └── icons/
└── exports/
    ├── html/
    ├── react/
    ├── vue/
    └── figma/
```

### Sample Generated Component
```typescript
// components/Button/Button.tsx
import React from 'react';
import './Button.css';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <span className="btn-spinner" />}
      {children}
    </button>
  );
};
```

These examples demonstrate the full range of capabilities and real-world usage patterns for the Design Implementation Tool, from simple component generation to complex multi-project workflows.