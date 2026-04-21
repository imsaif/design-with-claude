import { z } from "zod";
import { defineTool } from "./types.js";

export const helloWorldTool = defineTool({
  name: "hello-world",
  title: "Hello World",
  description:
    "Sanity check for the dwic MCP server. Returns a greeting so you can confirm the server is installed and tool calls round-trip correctly.",
  inputSchema: {
    name: z
      .string()
      .optional()
      .describe("Optional name to greet. Defaults to 'designer'."),
  },
  outputKind: "markdown",
  handler: ({ name }) => {
    const who = name?.trim() || "designer";
    const text = `Hello, ${who} — dwic MCP server is alive.`;
    return {
      text,
      output: {
        type: "markdown",
        data: {
          title: "dwic handshake",
          content: text,
        },
      },
    };
  },
});
