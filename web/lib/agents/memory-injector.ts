interface DesignerMemory {
  product_type: string | null;
  product_description: string | null;
  design_tools: string[] | null;
  design_system: string | null;
  tech_stack: string[] | null;
  experience_level: string | null;
  project_status: string | null;
  tone_preference: string | null;
  custom_context: string | null;
}

/**
 * Format a designer's memory into a context block for the system prompt.
 */
export function formatMemoryContext(memory: DesignerMemory | null): string {
  if (!memory) return "";

  const parts: string[] = [];

  parts.push("## About this designer");

  if (memory.product_description) {
    parts.push(`**Building:** ${memory.product_description}`);
  }
  if (memory.product_type) {
    parts.push(`**Product type:** ${memory.product_type}`);
  }
  if (memory.design_tools?.length) {
    parts.push(`**Design tools:** ${memory.design_tools.join(", ")}`);
  }
  if (memory.design_system) {
    parts.push(`**Design system:** ${memory.design_system}`);
  }
  if (memory.tech_stack?.length) {
    parts.push(`**Tech stack:** ${memory.tech_stack.join(", ")}`);
  }
  if (memory.experience_level) {
    parts.push(`**Experience:** ${memory.experience_level}`);
  }
  if (memory.project_status) {
    parts.push(`**Status:** ${memory.project_status}`);
  }

  if (memory.custom_context) {
    parts.push("");
    parts.push("## Session notes");
    parts.push(memory.custom_context);
  }

  return parts.join("\n");
}
