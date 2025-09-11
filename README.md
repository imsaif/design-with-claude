# Design with Claude - AI-Powered Design Agents Collection

A comprehensive collection of specialized design agents for Claude, empowering designers with AI-assisted tools for every aspect of the design process. From UI/UX to brand strategy, these agents provide expert guidance and support for design professionals.

## Overview

This repository contains 28 specialized design agents organized into 7 categories, each tailored to specific design disciplines and workflows. These agents can be used with Claude to enhance design capabilities, streamline workflows, and ensure best practices across all design activities.

## Installation

### User-wide Installation
Place agents in your home directory:
```bash
cp -r agents/* ~/.claude/agents/
```

### Project-specific Installation
Place agents in your project directory:
```bash
cp -r agents/* .claude/agents/
```

## Agent Categories

### 🎨 Core Design
Essential design agents for foundational design work.

- **design-system-architect** - Create comprehensive design systems with tokens, components, and governance
- **ux-design-expert** - Optimize user experience, accessibility, and interface design
- **ui-designer** - Design beautiful, functional user interfaces with visual hierarchy
- **accessibility-specialist** - Ensure WCAG compliance and inclusive design practices

### 🖼️ Visual Design
Agents focused on visual communication and aesthetics.

- **visual-designer** - Master typography, color theory, and composition
- **illustration-designer** - Create custom illustrations and visual narratives
- **icon-designer** - Design comprehensive icon systems and pictographs
- **motion-designer** - Develop animations, transitions, and micro-interactions

### 📱 Product Design
End-to-end product design across platforms.

- **product-designer** - Holistic product design from research to launch
- **mobile-designer** - iOS and Android app design with platform guidelines
- **web-designer** - Responsive web design with performance optimization
- **dashboard-designer** - Data visualization and analytics interfaces

### 🏢 Brand Identity
Brand development and marketing design.

- **brand-strategist** - Brand positioning, architecture, and strategy
- **logo-designer** - Logo design and visual identity systems
- **brand-guidelines-creator** - Comprehensive brand documentation
- **marketing-designer** - Campaign creative and conversion optimization

### ⚡ Interaction Design
Interactive experiences and prototyping.

- **interaction-designer** - Micro-interactions and user feedback systems
- **prototyping-expert** - Rapid prototyping from low to high fidelity
- **gesture-designer** - Touch, gesture, and spatial interactions
- **voice-ui-designer** - Conversational interfaces and voice experiences

### 🔬 Research & Strategy
User research and strategic design planning.

- **ux-researcher** - Qualitative and quantitative research methods
- **information-architect** - Content organization and navigation systems
- **service-designer** - End-to-end service blueprints and journeys
- **design-strategist** - Design vision and business alignment

### 🎮 Specialized
Domain-specific design expertise.

- **game-ui-designer** - Game interfaces, HUD systems, and menus
- **ar-vr-designer** - Augmented and virtual reality experiences
- **automotive-ux** - In-vehicle infotainment and digital clusters
- **healthcare-ux** - Medical interfaces with compliance and safety

## Usage Examples

### Using an Agent
Simply invoke the agent by name when working with Claude:

```
@ui-designer Help me design a landing page for a SaaS product
```

```
@ux-researcher Plan a user research study for our mobile app
```

```
@brand-strategist Develop a brand positioning for a sustainable fashion startup
```

### Combining Agents
Agents can work together for comprehensive solutions:

```
@design-strategist and @product-designer Help me plan a new feature rollout
```

## Agent Structure

Each agent follows a consistent structure:

```markdown
---
name: agent-name
description: Brief description of expertise
category: category-name
version: 1.0.0
tools: all
---

Role description and expertise details...

## Core Expertise
- Specific skills and knowledge areas

## When Invoked
1. Step-by-step approach to tasks

## Best Practices
- Key principles and guidelines
```

## Features

### Comprehensive Coverage
- 28 specialized agents covering all design disciplines
- From strategy to execution
- Platform-specific expertise
- Industry-specific knowledge

### Best Practices
- Industry standards and guidelines
- Accessibility and compliance
- Performance optimization
- User-centered methodologies

### Practical Application
- Step-by-step workflows
- Tool recommendations
- Documentation templates
- Testing methodologies

## Contributing

We welcome contributions! To add new agents or improve existing ones:

1. Fork the repository
2. Create your agent following the standard structure
3. Place it in the appropriate category folder
4. Update this README with your agent details
5. Submit a pull request

### Agent Guidelines
- Clear, specific expertise definition
- Practical, actionable guidance
- Industry best practices
- Comprehensive documentation

## Version History

- **v1.0.0** - Initial release with 28 design agents

## License

This project is licensed under the ISC License.

## Support

For questions, issues, or suggestions, please open an issue in the repository.

## Acknowledgments

This collection was inspired by the need for specialized design assistance in AI-powered workflows, helping designers leverage Claude's capabilities for enhanced creativity and productivity.

---

**Note**: These agents are designed to work with Claude and provide specialized design expertise. They follow industry best practices and are continuously updated to reflect current design standards and methodologies.