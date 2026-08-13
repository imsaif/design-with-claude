# UI/UX Design Review Agent

**Reviewing my AI-generated projects so they don't look like... well, AI-generated projects.**

I've been building a bunch of web apps using AI tools (Claude, Cursor, etc.), and honestly? The UIs were functional but kinda meh. Then Google's new Gemini models came out with seriously impressive design capabilities—like, actually understanding UX flows and visual hierarchy—so I thought: why not use AI to review what AI built?

This tool turned into my design accountability partner. Point it at any project, and it tells you exactly what's wrong (and right) about your UI, suggests color palettes that don't make people's eyes hurt, and even rewrites components with better accessibility.

It's personal—I built it because I needed it. But maybe you'll find it useful too.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)

---

## The Problem

You know that feeling when you finish building something with AI, and the functionality works great, but the UI looks like a 2010 Bootstrap template? Yeah. That was me with every project.

I'd spend hours on backend logic, get Claude to generate a frontend, and then stare at it thinking "this works, but it's ugly and I have no idea how to make it better."

Design is hard. And when you're coding solo, there's no designer to tell you:
- "These colors clash"
- "Your buttons have no visual hierarchy"
- "This layout is confusing"
- "Nobody's going to see that CTA"

So I made this. It's basically a design critique, but automated and powered by Gemini's surprisingly good aesthetic judgment.

---

## What It Actually Does

Point this at your project folder and it:

1. **Reads your UI code** (React, Vue, whatever—it's framework-agnostic)
2. **Analyzes the design** like a senior designer would:
   - Color scheme and palette cohesion
   - Layout structure and visual hierarchy
   - Component patterns and consistency
   - Accessibility (WCAG compliance)
   - UX flows and user interactions
3. **Generates detailed feedback** including:
   - What's working and what's not
   - 3 complete color palettes (with CSS variables ready to copy)
   - Component redesigns with actual code
   - Animation suggestions that don't feel cheesy
   - Alternative layout ideas
   - Prioritized action items

It's not perfect, but it's like having a design-savvy friend review your work at 2am when you're too tired to see that your primary color is literally unreadable on your background.

---

## Real Example: My Swim Stroke Analyzer

I built a swim stroke analysis tool using MediaPipe and Flask. Worked great. Looked terrible.

**Before this agent:**
- Random blue (#333 headers, inline styles everywhere)
- No design system
- Buttons that looked clickable... sometimes
- Zero animation
- Spacing? What's that?

**After running the agent and applying suggestions:**
- Professional color palette (Aether Grid: #1976D2 primary)
- Consistent design tokens (shadows, spacing, transitions)
- Subtle animations that feel polished
- WCAG AA accessible
- Actually looks like a real product

Time spent: 30 minutes reviewing recommendations, 2 hours implementing changes.
Time saved vs. doing it myself: probably 8+ hours of trial and error.

---

## How to Use It

### Get Started (5 minutes)

```bash
# Clone it
git clone https://github.com/veluthoor/ui-ux-design-review-agent.git
cd ui-ux-design-review-agent

# Install one dependency
pip install google-generativeai

# Get a free API key from Google
# Visit: https://makersuite.google.com/app/apikey
export GEMINI_API_KEY='your-key-here'

# Run it on your project
python ui_design_assistant.py -p /path/to/your/messy/ui
```

Wait 2-3 minutes. Get 6-8 markdown files with detailed feedback.

That's it.

---

## What You'll Get

The agent generates comprehensive analysis files:

### Comprehensive UI Analysis (`ui_analysis_*.md`)
- Brutally honest assessment of your current UI
- What's actually good (yes, it finds positives)
- Specific problems with explanations
- Framework-specific suggestions
- Accessibility issues with severity ratings
- **Prioritized todo list** (because you won't fix everything at once)

### Color Palettes (`color_palettes_*.md`)
Three complete, professional color schemes:
- Modern, on-trend palettes
- Full hex codes + CSS custom properties
- Usage guidelines (what color for what purpose)
- Contrast ratios and WCAG compliance
- Psychology/mood explanation

Example:
```css
/* One of three palettes it might suggest */
:root {
  --color-primary: #1976D2;     /* Professional blue */
  --color-secondary: #00C4A7;   /* Teal accent */
  --color-success: #36B37E;
  --color-error: #D32F2F;
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  /* ...plus 20+ more tokens */
}
```

### Component Redesigns (`[ComponentName]_redesign_*.md`)
For each major component:
- Current code analysis
- Improved version with better patterns
- Accessibility enhancements
- Modern best practices
- Actual working code you can copy

Before:
```jsx
<button onClick={handleClick}>Submit</button>
```

After:
```jsx
<button
  onClick={handleClick}
  className="btn-primary"
  aria-label="Submit form"
  disabled={isLoading}
>
  {isLoading ? <Spinner size="sm" /> : 'Submit'}
</button>
```

### Animation Suggestions (`animations_*.md`)
- Tasteful micro-interactions
- Loading states that don't annoy users
- Page transitions
- Complete CSS/JS code
- Performance considerations

### Layout Alternatives (`layout_alternatives_*.md`)
- 2-3 different layout approaches
- Pros/cons of each
- When to use which
- Responsive breakpoints
- Implementation code

---

## It Works With Everything

I've tested it on:
- React projects (Create React App, Next.js, Vite)
- Vue apps
- Plain HTML/CSS/JS sites
- Angular (yes, really)
- Svelte

It auto-detects your framework and gives framework-specific advice.

---

## Configuration (Optional)

Want to customize it? Create a `config.json`:

```json
{
  "output_dir": "design_review",
  "framework": "auto",
  "include_patterns": ["src/**/*.jsx", "src/**/*.css"],
  "exclude_patterns": ["**/node_modules/**", "**/*.test.js"],
  "max_file_size_kb": 100,
  "analysis_types": ["comprehensive", "colors", "components"],
  "app_context": "fitness tracking app for swimmers"
}
```

The `app_context` field is surprisingly useful—it helps Gemini understand what kind of UX makes sense for your specific use case.

---

## Why Gemini?

Google's latest Gemini models (especially Gemini 2.0) have gotten weirdly good at design critique. They understand:
- Visual hierarchy and balance
- Modern design trends (without being trendy-for-trend's-sake)
- Accessibility requirements
- UX psychology and user flows
- Framework-specific patterns

And unlike GPT-4 or Claude (which I love for code), Gemini seems to "get" visual design in a way that produces actionable, modern suggestions.

Plus, it's free. 15 requests/minute on the free tier is plenty for analyzing projects.

---

## Cost

**Free.**

Gemini API free tier gives you 15 requests per minute. This tool uses about 6-8 requests per full analysis. Unless you're running it on 50 projects in a row, you won't hit limits.

No credit card needed to get started.

---

## Does This Replace Real Designers?

Lol, no.

This is for:
- Solo developers who can't afford a designer
- Quick feedback during late-night coding sessions
- Learning what good design looks like
- Catching obvious mistakes before showing your work
- Iterating on AI-generated UIs

It's a second opinion, not a replacement for human judgment. If you're building something serious, hire a designer. But for MVPs, side projects, or learning? This helps a lot.

---

## Contributing

I built this for myself, but if you find it useful and want to improve it:

1. Fork it
2. Make it better
3. Send a PR

Ideas I'd love help with:
- Screenshot analysis (visual, not just code)
- A/B testing suggestions
- Design system generation
- VS Code extension
- Support for Tailwind/Material-UI/Ant Design pattern detection

---

## License

MIT. Use it however you want.

---

## Real Talk

I'm not a designer. I'm a developer who got tired of shipping functional-but-ugly interfaces.

This tool won't magically make you a design expert, but it will:
- Point out stuff you missed
- Give you concrete starting points
- Teach you patterns through examples
- Save you hours of "does this look okay?" overthinking

If it helps you, awesome. If you find bugs or have ideas, open an issue.

Now go make your AI-generated projects look less AI-generated.

---

**Questions? Issues? Want to roast my code?**
Open an issue or discussion. I actually read them.

https://github.com/veluthoor/ui-ux-design-review-agent
