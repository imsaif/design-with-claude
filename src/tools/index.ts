import type { ToolDefinition } from "./types.js";
import { helloWorldTool } from "./hello-world.js";
import { designBriefTool } from "./design-brief.js";
import { designSystemArchitectTool } from "./design-system-architect.js";
import { colorSpecialistTool } from "./color-specialist.js";
import { typographySpecialistTool } from "./typography-specialist.js";
import { spacingSpecialistTool } from "./spacing-specialist.js";
import { setupGuideTool } from "./setup-guide.js";
import { debugHelperTool } from "./debug-helper.js";
import { accessibilitySpecialistTool } from "./accessibility-specialist.js";
import { formDesignerTool } from "./form-designer.js";
import { navigationSpecialistTool } from "./navigation-specialist.js";

export const tools: ToolDefinition[] = [
  helloWorldTool,
  designBriefTool,
  designSystemArchitectTool,
  colorSpecialistTool,
  typographySpecialistTool,
  spacingSpecialistTool,
  accessibilitySpecialistTool,
  formDesignerTool,
  navigationSpecialistTool,
  setupGuideTool,
  debugHelperTool,
] as unknown as ToolDefinition[];

export function getToolNames(): string[] {
  return tools.map((t) => t.name);
}
