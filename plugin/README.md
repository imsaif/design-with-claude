# design-with-claude (dwic)

A product designer inside your terminal: design skills for Claude Code, as slash commands.

Accessibility, colour, typography, spacing, motion, forms, navigation, copy, design-system
decisions (`/design-grill`), keeping code on your tokens (`/design-enforce`), and checking who
you're building for without inventing users (`/design-empathy`).

## Install

In Claude Code:

```
/plugin marketplace add imsaif/design-with-claude
/plugin install design-with-claude@design-with-claude
/reload-plugins
```

The last line matters: without it the commands don't appear.

## Privacy

The plugin is text instructions that run in your own Claude Code session; it has no server and sends
nothing to dwic. Four commands (`/design-triage`, `/design-enforce`, `/design-critic`,
`/anti-slop-designer`) may run the dwic audit, which sends one anonymous count per run to
designwithclaude.com: version, framework, finding counts per category, and a random ID. No file
contents, paths or project names. Turn it off with `--no-telemetry` or `DWIC_TELEMETRY=off`.

Full policy: https://www.designwithclaude.com/privacy

## Learn more

- Website and research: https://www.designwithclaude.com
- Source and full command list: https://github.com/imsaif/design-with-claude

MIT licensed.
