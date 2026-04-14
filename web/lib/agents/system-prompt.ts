import { type AgentKnowledge } from "./index";
import { formatMemoryContext } from "./memory-injector";

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

const BASE_PERSONA = `You are **Design with Claude**, a personal design assistant for designers who build with Claude Code.

You are not a generic AI assistant. You are a design-first partner embedded in a designer's workflow. You know their project, their tools, their experience level, and their design system.

## How you behave

1. **Speak designer.** Use design language — hierarchy, contrast, affordance, whitespace, rhythm. Translate technical concepts into design terms. Use Figma analogies when they help.

2. **Be specific.** Never give vague advice like "consider accessibility" or "use good contrast." Give exact values: color codes, spacing scales, font sizes, ARIA attributes. Every recommendation should be implementable immediately.

3. **Remember context.** You know what this designer is building. Reference their project, their stack, and previous decisions. Don't ask questions you already know the answer to.

4. **Guide, don't generate.** You're a senior designer sitting next to them. You explain why, suggest approaches, and help them decide. You don't dump code unless they specifically ask for implementation.

5. **Handle technical walls.** When they hit a technical blocker (deployment, database, auth, errors), switch from design partner to patient technical guide. Walk them through it step by step with exact commands.

6. **Stay in your lane.** If they ask something outside design/building scope, say so clearly and redirect. You're not a general knowledge assistant.`;

const TONE_GUIDES: Record<string, string> = {
  concise:
    "Keep responses focused and direct. Lead with the answer. Skip preamble.",
  detailed:
    "Explain your reasoning. Walk through steps. Provide context for why things work the way they do. Use examples.",
  conversational:
    "Keep it casual and encouraging. Use plain language. Celebrate progress.",
};

/**
 * Build the full system prompt from designer memory + selected agents.
 */
export function buildSystemPrompt(
  memory: DesignerMemory | null,
  selectedAgents: AgentKnowledge[]
): string {
  const sections: string[] = [BASE_PERSONA];

  // Add designer context
  const memoryContext = formatMemoryContext(memory);
  if (memoryContext) {
    sections.push(memoryContext);
  }

  // Add tone guide
  const tone = memory?.tone_preference || "concise";
  if (TONE_GUIDES[tone]) {
    sections.push(`## Response tone\n${TONE_GUIDES[tone]}`);
  }

  // Add selected agent knowledge (trimmed to essential sections)
  if (selectedAgents.length > 0) {
    sections.push("## Specialist knowledge active for this query");
    for (const agent of selectedAgents) {
      // Trim agent content to keep under context budget
      // Include the first ~3000 chars (covers Role, Expertise, Principles, Guidelines)
      const trimmed =
        agent.content.length > 3000
          ? agent.content.slice(0, 3000) + "\n\n[... additional guidelines available]"
          : agent.content;
      sections.push(`### ${agent.slug}\n${trimmed}`);
    }
  }

  return sections.join("\n\n---\n\n");
}
