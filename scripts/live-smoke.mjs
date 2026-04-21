import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const BASE = "https://www.designwithclaude.com";

// 1. Mint a fresh profile on production
const profileRes = await (await fetch(`${BASE}/api/profile`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    product_type: "SaaS",
    product_description: "End-to-end MCP-against-prod smoke test",
    tech_stack: ["Next.js", "Tailwind"],
    design_system: "Starting fresh",
    experience_level: "intermediate",
    tone_preference: "concise",
  }),
})).json();
const token = profileRes.token;
console.log(`→ minted token on prod: ${token}`);

// 2. Start local MCP server pointed at prod API
const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["/Users/imranmohammed/dwc/dist/server.js"],
  env: {
    ...process.env,
    DWIC_TOKEN: token,
    DWIC_API_URL: BASE,
    DWIC_GATING: "on",
    DWIC_EVENTS: "on",
  },
});
const client = new Client({ name: "prod-smoke", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);
console.log("→ MCP connected");

// 3. Call three different structured tools
for (const call of [
  { name: "color-specialist", arguments: { brief: "Calm productivity tool", accent: "#5B8DEF" } },
  { name: "typography-specialist", arguments: { brief: "Editorial minimal" } },
  { name: "spacing-specialist", arguments: { brief: "Compact dashboard" } },
]) {
  const r = await client.callTool(call);
  console.log(`  ✔ ${call.name} → ${r.isError ? "ERROR" : "ok"}`);
}
await client.close();

// 4. Wait ~1s for fire-and-forget event emits to land
await new Promise((r) => setTimeout(r, 1200));

// 5. Fetch events from prod
const recent = await (await fetch(`${BASE}/api/events/recent?token=${token}&limit=20`)).json();
const tool = recent.events.filter((e) => e.toolName !== "__mcp.connected__");
const types = [...new Set(tool.map((e) => e.output?.type))];
console.log(`→ events landed in Supabase: ${tool.length} tool events, types: ${types.join(", ")}`);
console.log(`  profile.commandCount = ${recent.profile?.commandCount}, connected = ${recent.profile?.connected}`);

if (tool.length >= 3 && types.includes("palette") && types.includes("type-scale") && types.includes("spacing")) {
  console.log("\n✅ LIVE ALPHA WORKS — onboarding → install → tool call → stored event round-trip confirmed.");
} else {
  console.log("\n✘ Something didn't land — inspect manually.");
  process.exitCode = 1;
}
