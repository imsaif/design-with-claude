# Design with Claude - AI-Powered Design Tools & Agents

A dual-purpose design toolkit that includes:
1. **Design Implementation Tool (CLI)** - Generate actual code, components, and Figma files from design briefs
2. **Design Agents Collection** - 28 specialized Claude agents for comprehensive design guidance

Transform design ideas into working implementations or get expert AI guidance for any design challenge.

## 🧠 How It Works: Intelligent Agent-Powered Generation

Our toolkit combines the expertise of 28 design agents with an intelligent CLI that generates actual code:

```
┌──────────────────────────────────────────────────────────────┐
│                   DESIGN WITH CLAUDE                          │
├────────────────────────┬─────────────────────────────────────┤
│   GUIDANCE & ADVICE    │      ACTUAL GENERATION              │
│                        │                                      │
│   28 Design Agents     │    CLI Implementation Tool          │
│   ├── UI Designer      │    ├── design-create init          │
│   ├── UX Researcher    │    ├── design-create from-brief    │
│   ├── Brand Strategist │    ├── design-create component     │
│   └── 25 more agents   │    └── design-create export        │
│                        │                                      │
│   OUTPUT: Expertise    │    OUTPUT: Real Files & Code       │
└────────────────────────┴─────────────────────────────────────┘
```

### The Magic: Agent-Guided Generation

When you run a command, here's what happens behind the scenes:

```
USER: "design-create from-brief 'Modern SaaS landing page'"
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                    BRIEF PARSER                            │
│  Analyzes: "Modern SaaS landing page"                      │
│  Identifies: • Style: Modern • Type: Landing • Industry: SaaS │
└───────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                  AI ORCHESTRATOR                           │
│  Selects Agents: → web-designer (primary)                 │
│                  → ui-designer (components)                │
│                  → brand-strategist (style)                │
└───────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                  AGENT CONSULTATION                        │
│  web-designer: "Use hero-features-pricing structure"       │
│  ui-designer: "Implement card-based feature sections"      │
│  brand-strategist: "Apply modern, minimal color palette"   │
└───────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                     GENERATORS                             │
│  • Token Generator → Creates colors.css, typography.css    │
│  • Component Gen → Creates Button.jsx, Card.jsx, Hero.jsx  │
│  • Layout Gen → Creates landing-page.html                  │
└───────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                    FINAL OUTPUT                            │
│  ✅ tokens/colors.css       - Design tokens               │
│  ✅ components/Hero.jsx     - React components            │
│  ✅ layouts/landing.html    - Complete layout             │
│  ✅ exports/figma/          - Figma file (Phase 4)        │
└───────────────────────────────────────────────────────────┘
```

**Key Insight**: The CLI doesn't just generate code mechanically—it uses the collective knowledge of 28 design experts to create thoughtful, professional implementations.

### Agent Selection Matrix

Different commands automatically select the right experts:

| Command | Primary Agent | Supporting Agents | Output |
|---------|---------------|-------------------|--------|
| `from-brief "landing page"` | web-designer | ui-designer, brand-strategist | Complete landing page |
| `component button` | ui-designer | design-system-architect | Button with variants |
| `tokens --style modern` | design-system-architect | brand-strategist | Design token files |
| `export figma` | ui-designer | visual-designer | Figma design file |

### Visual Legend
```
SYMBOLS USED:
━━━━━━━━━━━━━
→  Data flow        ✅  Completed
▼  Process step     🔄  In Progress
│  Connection       ⏳  Planned
└  Branch/End       🧠  AI Decision
```

## 🚀 Design Implementation Tool (CLI)

**NEW**: The `design-create` CLI tool turns design briefs into actual implementations - code, components, and Figma files.

### Quick Start

```bash
# Install dependencies
npm install

# Initialize a new design project
node bin/design-create.js init my-project

# Navigate to your project
cd my-project

# Generate from brief (coming in Phase 2)
design-create from-brief "Modern SaaS landing page with pricing section"

# Generate specific components (coming in Phase 2)
design-create component button --variants primary,secondary

# Export to different formats (coming in Phase 3)
design-create export react
design-create export figma --figma-token YOUR_TOKEN
```

### Available Commands

- ✅ `design-create init [project-name]` - Initialize new design project
- 🔄 `design-create from-brief <brief>` - Generate from design brief *(Phase 2)*
- 🔄 `design-create component <name>` - Generate specific component *(Phase 2)*
- 🔄 `design-create tokens` - Generate design tokens *(Phase 2)*
- 🔄 `design-create export <format>` - Export to HTML/React/Vue/Figma *(Phase 3)*

### Implementation Status

- ✅ **Phase 1 Day 1 Complete**: CLI framework, project initialization
- 🔄 **Phase 2**: Component & token generation *(Week 2)*
- 🔄 **Phase 3**: Multi-format export system *(Week 3)*
- 🔄 **Phase 4**: Figma integration *(Week 4)*

### Generated Project Structure

When you run `design-create init`, you get:

```
my-project/
├── .design-project/          # Configuration and state
│   ├── config.json          # Project configuration
│   ├── state.json           # Generation state tracking
│   └── templates/           # Custom templates
├── src/                     # Generated source files
│   ├── components/          # Generated components
│   ├── layouts/             # Generated layouts
│   └── assets/              # Generated assets
├── tokens/                  # Design tokens (colors, typography, spacing)
├── exports/                 # Export outputs
│   ├── html/               # HTML/CSS exports
│   ├── react/              # React components
│   ├── vue/                # Vue components
│   └── figma/              # Figma export data
├── README.md               # Project documentation
└── .gitignore             # Git ignore rules
```

---

## 🎨 Design Agents Collection

A comprehensive collection of 28 specialized design agents for Claude, providing expert guidance for every aspect of the design process. From UI/UX to brand strategy, these agents offer professional insights and best practices.

## Prerequisites

### For Design Implementation Tool
- **Node.js**: v16.0.0 or higher
- **npm**: Package manager

### For Design Agents Collection
- **Claude Access**: Claude CLI (`claude-code`) or Claude AI web interface
- **Git**: For cloning the repository (optional)

## Installation

### Design Implementation Tool Setup
```bash
# Clone the repository
git clone https://github.com/imsaif/design-with-claude.git
cd design-with-claude

# Install dependencies
npm install

# Test CLI (should show help)
node bin/design-create.js --help

# Create your first project
node bin/design-create.js init my-first-project
```

### Design Agents Collection Setup

#### Option 1: Clone and Use Directly
Clone the repository and reference agents from the location:
```bash
git clone https://github.com/imsaif/design-with-claude.git
cd design-with-claude
```

#### Option 2: Install to Claude's Agent Directory

#### User-wide Installation
Make agents available for all your projects:
```bash
# Clone the repository
git clone https://github.com/imsaif/design-with-claude.git
cd design-with-claude

# Copy agents to your home Claude directory
cp -r agents/* ~/.claude/agents/
```

#### Project-specific Installation
Install agents for a specific project only:
```bash
# Navigate to your project
cd your-project

# Copy agents to project's Claude directory
cp -r path/to/design-with-claude/agents/* .claude/agents/
```

### Option 3: Use with Claude Web Interface
Simply copy the content of any agent file and paste it at the beginning of your Claude conversation to give Claude that agent's expertise.

## Quick Start

After installation, you can immediately start using agents:

### With Claude CLI
```bash
# Start a new Claude session with a specific agent
claude --agent ui-designer "Help me design a landing page"

# Or within an existing Claude session
> @ui-designer Create a responsive navigation menu
```

### With Claude Web Interface
1. Open any agent file (e.g., `agents/core-design/ui-designer.md`)
2. Copy the entire content
3. Paste it at the start of your Claude conversation
4. Ask your design question

### Verify Installation (Claude CLI)
```bash
# List available agents
ls ~/.claude/agents/

# Or for project-specific
ls .claude/agents/
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

### Using Agents with Claude CLI

Invoke agents using the @ symbol followed by the agent name:

```bash
# UI/UX Design
@ui-designer Help me design a landing page for a SaaS product

# User Research
@ux-researcher Plan a user research study for our mobile app

# Brand Strategy
@brand-strategist Develop a brand positioning for a sustainable fashion startup

# Accessibility Review
@accessibility-specialist Review my design for WCAG compliance
```

### Using Agents with Claude Web Interface

When using the web interface, paste the agent content at the start of your conversation, then ask your questions normally:

```
[Paste agent content from agents/core-design/ui-designer.md]

User: Help me design a landing page for a SaaS product
Claude: [Responds with UI designer expertise]
```

### Combining Multiple Agents

Agents can work together for comprehensive solutions:

```bash
# For holistic design solutions
@design-strategist and @product-designer Help me plan a new feature rollout

# For visual and motion design
@visual-designer and @motion-designer Create an animated hero section

# For research and architecture
@ux-researcher and @information-architect Optimize our navigation structure
```

### Real-World Scenarios

```bash
# Design System Creation
@design-system-architect Create a token system for our startup

# Mobile App Design
@mobile-designer Design an iOS app following Apple's HIG

# Dashboard Creation  
@dashboard-designer Create a analytics dashboard with key metrics

# Brand Identity
@logo-designer Create logo concepts for a tech startup
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