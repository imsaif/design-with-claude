#!/usr/bin/env node
// MCP handshake sanity test — spawns the built server over stdio, lists tools,
// invokes hello-world, and prints the round-trip. Run with `npm run test:mcp`.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(__dirname, "..", "dist", "server.js");

// The onboarding gate (alpha.3) intercepts every tool call when a token is
// present and the project has no profile yet, so the specialists return the
// onboarding instruction sheet instead of a seed table. That's correct prod
// behavior, but this smoke test wants to assert the seeded tool outputs, so
// disable the gate explicitly.
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverPath],
  env: { ...process.env, DWIC_DEBUG: "1", DWIC_ONBOARDING_GATE: "off" },
});

const client = new Client(
  { name: "dwc-handshake-test", version: "1.0.0" },
  { capabilities: {} },
);

function fail(msg, err) {
  console.error(`FAIL: ${msg}`);
  if (err) console.error(err);
  process.exitCode = 1;
}

try {
  await client.connect(transport);
  console.log("✔ connected to dwc MCP server over stdio");

  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name);
  console.log(`✔ listTools returned ${tools.tools.length} tools: ${names.join(", ")}`);

  if (!names.includes("hello-world")) {
    fail("expected hello-world tool in tools list");
  } else {
    const result = await client.callTool({
      name: "hello-world",
      arguments: { name: "imran" },
    });
    const firstText =
      result.content?.find?.((c) => c.type === "text")?.text ??
      JSON.stringify(result);
    console.log(`✔ callTool(hello-world) → ${firstText}`);
    if (!firstText.toLowerCase().includes("imran")) {
      fail("expected hello-world output to contain the argument");
    }
  }

  const colorRes = await client.callTool({
    name: "color-specialist",
    arguments: { brief: "Calm productivity tool", accent: "#5B8DEF" },
  });
  const colorText =
    colorRes.content?.find?.((c) => c.type === "text")?.text ?? "";
  if (!/--color-primary-500/.test(colorText)) {
    fail("color-specialist should include --color-primary-500 in seed table");
  } else {
    console.log(
      `✔ callTool(color-specialist) returned ${colorText.length} chars with seed palette`,
    );
  }

  const typeRes = await client.callTool({
    name: "typography-specialist",
    arguments: { brief: "Dashboard UI", baseSizePx: 16 },
  });
  const typeText = typeRes.content?.find?.((c) => c.type === "text")?.text ?? "";
  if (!/clamp\(/.test(typeText)) {
    fail("typography-specialist should emit clamp() values");
  } else {
    console.log("✔ callTool(typography-specialist) emits clamp() scale");
  }

  const spacingRes = await client.callTool({
    name: "spacing-specialist",
    arguments: { brief: "Marketing site", baseUnitPx: 4 },
  });
  const spacingText =
    spacingRes.content?.find?.((c) => c.type === "text")?.text ?? "";
  if (!/--space-/.test(spacingText)) {
    fail("spacing-specialist should emit --space-* tokens");
  } else {
    console.log("✔ callTool(spacing-specialist) emits --space-* tokens");
  }
} catch (err) {
  fail("handshake threw", err);
} finally {
  await client.close().catch(() => {});
}

if (!process.exitCode) {
  console.log("\nALL GOOD — MCP server handshake works.");
}
