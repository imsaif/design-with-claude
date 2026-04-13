import { z } from "zod";
import { defineTool } from "./types.js";

export const helloWorldTool = defineTool({
  name: "hello-world",
  title: "Hello World",
  description:
    "Sanity check for the designwithclaude MCP server. Returns a greeting so you can confirm the server is installed and tool calls round-trip correctly.",
  inputSchema: {
    name: z
      .string()
      .optional()
      .describe("Optional name to greet. Defaults to 'designer'."),
  },
  outputKind: "markdown",
  handler: ({ name }) => {
    const who = name?.trim() || "designer";
    const text = `Hello, ${who} — designwithclaude MCP server is alive.`;
    return {
      text,
      output: {
        type: "markdown",
        data: {
          title: "dwc handshake",
          content: text,
        },
      },
    };
  },
});
