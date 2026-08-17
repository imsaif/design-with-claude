# Testing designwithclaude — plain-language guide

Last updated: April 14, 2026

This is the "I stepped away for a week, now I want to try it again" guide. It uses no dev jargon. If a sentence confuses you, flag it — it should read easily.

---

## What this is, in one paragraph

dwc puts a product designer inside your terminal. Run `npx dwic-audit` and it measures your design system, printing a dashboard of gaps across 8 categories (color, typography, spacing, accessibility, forms, navigation, motion, copy) and writing a shareable report to `.dwic/`. From there, 48 design specialists fix what the audit found, and dwc remembers what changed across every session.

---

## What's live right now

| Thing | URL / name |
|---|---|
| Public site | https://www.designwithclaude.com |
| First screen for any designer | https://www.designwithclaude.com/start |
| Terminal install command | `npx designwithclaude@latest setup --token=imr_xxx --project=<slug>` |
| npm package | https://www.npmjs.com/package/designwithclaude (version `2.0.0-alpha.2`) |
| Data store | Your Supabase project (`dwc-alpha`) |
| Code | https://github.com/imsaif/design-with-claude (branch `main`) |

**Multi-project works end-to-end.** One designer can have many projects. Each project has its own design system. Each project's companion tab shows only its own work.

**Free tier:** 10 tool calls total per designer, across all their projects. Paid tier (unlimited) is not wired to a real checkout yet.

---

## Test the whole flow yourself (10 minutes)

Pretend you're a designer who's never seen this before.

1. **Open https://www.designwithclaude.com/start in a fresh browser tab (or incognito so nothing interferes).**
2. Fill in the 5 questions — what you're building, stack, design system, experience, tone. Chips are optional; the description box is what matters. Click Continue through each.
3. You'll land on a **preview of your CLAUDE.md file**. This is what Claude Code will read to know you. Click **Looks good — install →**.
4. Copy the install command. It looks like: `npx designwithclaude@latest setup --token=imr_xxx --project=<slug>`
5. Open a terminal **inside a project folder**. If you don't have one, run `mkdir ~/dwc-test && cd ~/dwc-test`. Paste the command and hit enter. It should finish in a few seconds, writing a `.mcp.json` file that tells Claude Code about dwc.
6. Open your **companion tab** in a browser — the URL on the /install page, or `/companion?token=imr_xxx&project=<slug>`. Leave it open.
7. Back in that terminal, start Claude Code: `claude`. It'll show a spinner and then a prompt.
8. Ask Claude Code: *Use the color-specialist tool from designwithclaude. Brief: a calm productivity app.*
9. Watch the companion tab — within 2-3 seconds, the **Color tile lights up** with an actual palette. Swatches, hex codes, the works.
10. Try more: `Use the typography-specialist tool. Brief: editorial minimal.` and `Use the spacing-specialist tool. Brief: compact dashboard.`
11. Each tile in the grid fills in. Click **"Open full view →"** on a filled tile to expand it inline.
12. After 10 tool calls across all your projects, the companion shows an **upgrade prompt**. That's the free tier doing its job.

---

## Add a second project (same account)

1. Click **My projects** in the top-right pill (or go to `/account?token=imr_xxx`).
2. You'll see your first project as a card. The last tile is a dashed `+` — click it.
3. Type a slug like `thriya` or `landing-page`. Hit **Create →**.
4. You're back in the wizard — but now it says "New project `thriya` — added to your existing account, nothing else gets overwritten."
5. Fill in the 5 questions for THIS product.
6. On the new /install page, copy the new command (it'll have `--project=thriya`).
7. Open a **different terminal in a different project folder**. Paste that command.
8. You now have two projects living side by side. Open both companion URLs in two tabs — each shows only its own design system. No cross-contamination.

---

## Share with a friend

For alpha:

1. Send them **https://www.designwithclaude.com/start**.
2. They follow the same steps. They get their own token (their own account) — your projects stay yours.
3. They'll need Claude Code installed. Tell them: `npm install -g @anthropic-ai/claude-code` (or see https://claude.com/claude-code for current install).

The site has no signup screen yet — the `/start` wizard IS the signup. The token they get in the URL is their login. Tell them to bookmark `/account?token=imr_xxx` so they can come back.

---

## When something breaks

**"Profile not found" after the wizard**
Vercel env vars are probably missing. Go to Vercel dashboard → dwc project → Settings → Environment Variables. `DWC_SUPABASE_URL` and `DWC_SUPABASE_SERVICE_ROLE_KEY` both need to be set for Production. Redeploy after adding.

**Companion tab stays blank after a tool call**
Give it 2-3 seconds — the tab polls every 2.5s. If still blank, reload the tab once. If still blank, the MCP server isn't emitting events — check the terminal where Claude Code is running for errors.

**Install command fails with "invalid token"**
The token must start with `imr_` and be at least 12 characters. Copy the whole thing from the `/install` page, don't retype.

**"My projects" pill is missing**
That pill only appears when the URL has a valid token. If you navigated away, paste your token back into the URL or go to `/account?token=imr_xxx`.

**Setup says "Missing --project"**
You need to pass `--project=<slug>` (e.g. `--project=thriya`) along with your token. The `/install` page shows the full command — copy it.

**Claude Code says it has "no tools" from designwithclaude**
The install wrote `.mcp.json` in your current directory, not globally. Start Claude Code FROM that directory (`cd` there first, then run `claude`).

---

## Where to change things later

Designer-facing copy:
- **Wizard questions** — `web/components/companion/StartWizard.tsx`
- **Upgrade page copy** — `web/app/upgrade/page.tsx`
- **Install page copy** — `web/app/install/page.tsx`
- **Account page (My projects)** — `web/app/account/page.tsx`

Product numbers:
- **Free-tier limit** (currently 10) — top of `web/lib/dwc/store.ts`, constant `FREE_TIER_LIMIT`
- **Polling interval** (currently 2.5 seconds) — `web/components/companion/CompanionView.tsx`, constant `POLL_MS`

Companion tiles:
- **Which tiles exist + what categories they're in** — `web/components/companion/canvasTiles.ts`

MCP server tools (the skills Claude Code learns):
- Each tool is one file in `src/tools/` — role prompt + optional seed generator
- Add a new tool by creating a file there and adding it to `src/tools/index.ts`

---

## What's NOT live yet

- **Payments** — the "Upgrade" button doesn't charge anyone yet. Dodo Payments integration is the next big piece.
- **V2 homepage** — `designwithclaude.com/` still shows the old skills directory. The V2 flow starts at `/start`. Eventually the homepage gets a rewrite.
- **Password / email login** — there isn't one. The token IS the login. Bookmark `/account?token=imr_xxx` or save your token somewhere safe.
- **Realtime** — the companion polls every 2.5s. Fast enough for alpha; we'd switch to realtime streams if it gets busy.

---

## Next-session starter prompts

If you come back and want Claude to pick up cleanly, try any of:

- *"Read PROGRESS.md and TESTING.md, then pick up Phase 5 — Dodo Payments for real upgrades."*
- *"Read PROGRESS.md. The sample card on /account is too long — tighten it and run through the flow again."*
- *"Add more MCP tools — start with visual-hierarchy-specialist and landing-page-specialist."*
- *"The homepage at / is still the old V1 skills page. Propose a V2 landing that lives at / without losing SEO on the existing copy."*

---

## Keep these safe

- Your Supabase project URL + service_role key (Vercel env vars).
- Your npm automation token (for publishing new versions). Current token is still active; revoke + regenerate before your next publish cycle.
- Your token `imr_xxx` — that's your designer identity. If you lose the browser cache and the URL, there's no recovery flow yet.
