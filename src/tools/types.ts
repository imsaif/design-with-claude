import { z } from "zod";

export type OutputKind =
  | "palette"
  | "type-scale"
  | "spacing"
  | "component-spec"
  | "copy"
  | "markdown";

export interface PaletteData {
  name: string;
  tokens: Array<{ name: string; hex: string; role: string }>;
}

export interface TypeScaleData {
  name: string;
  scale: Array<{
    role: string;
    clamp: string;
    lineHeight: string | number;
    weight: number | string;
  }>;
}

export interface SpacingData {
  name: string;
  steps: Array<{ name: string; px: number; rem: number }>;
}

export interface ComponentSpecData {
  name: string;
  anatomy: string;
  states: string[];
  accessibility: string;
  markup: string;
}

export interface CopyData {
  context: string;
  tone: string;
  blocks: Array<{ label: string; text: string }>;
}

export interface MarkdownData {
  title: string;
  content: string;
}

export type ToolOutputPayload =
  | { type: "palette"; data: PaletteData }
  | { type: "type-scale"; data: TypeScaleData }
  | { type: "spacing"; data: SpacingData }
  | { type: "component-spec"; data: ComponentSpecData }
  | { type: "copy"; data: CopyData }
  | { type: "markdown"; data: MarkdownData };

export interface ToolResult {
  text: string;
  output: ToolOutputPayload;
}

export interface ToolDefinition<TInput extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  inputSchema: TInput;
  outputKind: OutputKind;
  handler: (input: z.infer<z.ZodObject<TInput>>) => Promise<ToolResult> | ToolResult;
}

export function defineTool<TInput extends z.ZodRawShape>(
  tool: ToolDefinition<TInput>,
): ToolDefinition<TInput> {
  return tool;
}
