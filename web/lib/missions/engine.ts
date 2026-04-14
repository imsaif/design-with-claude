import { getMission } from "./definitions";
import { getAgent, type AgentKnowledge } from "@/lib/agents/index";
import { buildSystemPrompt } from "@/lib/agents/system-prompt";

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
 * Build a system prompt for a mission step, using the mission's predefined agents.
 */
export function buildMissionPrompt(
  missionId: string,
  step: number,
  memory: DesignerMemory | null
): string | null {
  const mission = getMission(missionId);
  if (!mission || step >= mission.steps.length) return null;

  const missionStep = mission.steps[step];

  // Load the agents defined for this step
  const agents: AgentKnowledge[] = missionStep.agents
    .map((slug) => getAgent(slug))
    .filter(Boolean) as AgentKnowledge[];

  // Build the base system prompt with memory + agents
  const basePrompt = buildSystemPrompt(memory, agents);

  // Prepend mission context
  const missionContext = `## Current Mission: ${mission.title}
**Step ${step + 1} of ${mission.totalSteps}:** ${missionStep.title}

### Your task for this step
${missionStep.prompt}

### When this step is done
The step is complete when: ${missionStep.completionHint}
When you believe the step is complete, end your message with: "Ready for the next step? Just say **next** to continue."

---

`;

  return missionContext + basePrompt;
}
