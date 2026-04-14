# Supabase setup (dwc alpha)

5 steps to make the live alpha remember profiles and events across Vercel serverless instances.

---

## 1 — Create the Supabase project

1. Go to https://supabase.com/dashboard → **New project**
2. Name it `dwc-alpha` (or whatever you prefer)
3. Pick a region close to your Vercel deployment (Vercel shows `bom1` in response headers — for that use Mumbai / Singapore)
4. Save the database password (you won't need it for alpha, but don't lose it)

Project provisioning takes ~2 minutes.

## 2 — Run the schema

1. In the Supabase dashboard → **SQL Editor** → **New query**
2. Paste the entire contents of [`schema.sql`](./schema.sql)
3. Run. You should see "Success. No rows returned."
4. Under **Table Editor**, confirm `profiles` and `companion_events` exist.

## 3 — Grab the credentials

In Supabase → **Project Settings → API**:

- **Project URL** (example: `https://abcdefghijk.supabase.co`)
- **service_role** key (under "Project API keys")

⚠️ The `service_role` key bypasses Row-Level Security. Never expose it to the browser. It only lives in server-side env vars.

## 4 — Set Vercel environment variables

In the Vercel dashboard → **Project → Settings → Environment Variables**, add for Production (and Preview if you want):

| Name | Value |
|---|---|
| `DWC_SUPABASE_URL` | Project URL from step 3 |
| `DWC_SUPABASE_SERVICE_ROLE_KEY` | service_role key from step 3 |

Then **Redeploy** the latest production deployment (the env vars only take effect on new builds/instances).

## 5 — Verify it works

```bash
# Mint a profile
curl -s -X POST https://www.designwithclaude.com/api/profile \
  -H "Content-Type: application/json" \
  -d '{"product_type":"SaaS","product_description":"persistence smoke test","tech_stack":["Next.js"],"design_system":"Starting fresh","experience_level":"intermediate","tone_preference":"concise"}' | jq -r .token
# → imr_xxxxxxxxxxxx

# Fetch it back
curl -s "https://www.designwithclaude.com/api/profile?token=imr_xxxxxxxxxxxx" | jq .ok
# → true
```

If step 2 returns `true`, persistence is live — the alpha flow end-to-end works on Vercel.

---

## Local development

For local testing you can either:
- **Skip Supabase** — without env vars, the app falls back to an in-memory store (fine for solo dev, resets on restart).
- **Use a separate dev Supabase project** — set `DWC_SUPABASE_URL` + `DWC_SUPABASE_SERVICE_ROLE_KEY` in `web/.env.local`.

## What's NOT in this alpha schema (deferred to later Phase 3 work)

- `command_history` table — `profiles.command_count` is enough for gating
- `design_artifacts` table — artifacts can be reconstructed from `companion_events` for now
- Dodo subscription fields + webhook handler
- Supabase Realtime (the companion polls `/api/events/recent` every 2.5s — swap for Realtime once traffic justifies it)
- Row-Level Security policies — we're using `service_role` server-side only; RLS blocks the anon key entirely, which is the safe default
