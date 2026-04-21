import type { ToolOutputPayload } from "@/lib/dwic/types";
import { PaletteRenderer } from "./PaletteRenderer";
import { TypeScaleRenderer } from "./TypeScaleRenderer";
import { SpacingRenderer } from "./SpacingRenderer";
import { ComponentSpecRenderer } from "./ComponentSpecRenderer";
import { CopyRenderer } from "./CopyRenderer";
import { MarkdownRenderer } from "./MarkdownRenderer";

export function RenderOutput({ output }: { output: ToolOutputPayload }) {
  switch (output.type) {
    case "palette":
      return <PaletteRenderer data={output.data} />;
    case "type-scale":
      return <TypeScaleRenderer data={output.data} />;
    case "spacing":
      return <SpacingRenderer data={output.data} />;
    case "component-spec":
      return <ComponentSpecRenderer data={output.data} />;
    case "copy":
      return <CopyRenderer data={output.data} />;
    case "markdown":
      return <MarkdownRenderer data={output.data} />;
    default: {
      const _exhaustive: never = output;
      return <div>Unknown output type: {JSON.stringify(_exhaustive)}</div>;
    }
  }
}
