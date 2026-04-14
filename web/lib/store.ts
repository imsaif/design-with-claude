/**
 * Client-side localStorage store — replaces Supabase for zero-dependency mode.
 * All state lives in the browser. No accounts, no server-side persistence.
 */

export interface DesignerMemory {
  product_type: string;
  product_description: string;
  design_tools: string[];
  design_system: string;
  tech_stack: string[];
  experience_level: string;
  project_status: string;
  tone_preference: string;
  custom_context: string;
  claude_md_content: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  mission_id?: string;
  mission_step?: number;
  messages: ChatMessage[];
  updated_at: string;
}

export interface MissionProgressData {
  mission_id: string;
  status: "not_started" | "in_progress" | "completed";
  current_step: number;
  total_steps: number;
  completed_steps: number[];
  conversation_id: string | null;
}

const KEYS = {
  memory: "dwc_memory",
  conversations: "dwc_conversations",
  activeConversation: "dwc_active_conversation",
  missions: "dwc_missions",
  messageCount: "dwc_message_count",
  messageResetAt: "dwc_message_reset_at",
  upgradeInterest: "dwc_upgrade_interest",
} as const;

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- Memory ----

export function getMemory(): DesignerMemory | null {
  return get<DesignerMemory | null>(KEYS.memory, null);
}

export function saveMemory(memory: DesignerMemory) {
  set(KEYS.memory, memory);
}

export function hasCompletedOnboarding(): boolean {
  return getMemory() !== null;
}

// ---- Conversations ----

export function getConversations(): Conversation[] {
  return get<Conversation[]>(KEYS.conversations, []);
}

function saveConversations(convs: Conversation[]) {
  set(KEYS.conversations, convs);
}

export function getConversation(id: string): Conversation | undefined {
  return getConversations().find((c) => c.id === id);
}

export function createConversation(title = "New conversation", missionId?: string): Conversation {
  const conv: Conversation = {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    mission_id: missionId,
    mission_step: missionId ? 0 : undefined,
    messages: [],
    updated_at: new Date().toISOString(),
  };
  const convs = getConversations();
  convs.unshift(conv);
  saveConversations(convs);
  return conv;
}

export function getOrCreateActiveConversation(): Conversation {
  const activeId = get<string | null>(KEYS.activeConversation, null);
  if (activeId) {
    const conv = getConversation(activeId);
    if (conv) return conv;
  }
  const convs = getConversations();
  if (convs.length > 0) {
    setActiveConversation(convs[0].id);
    return convs[0];
  }
  const newConv = createConversation("Getting started");
  setActiveConversation(newConv.id);
  return newConv;
}

export function setActiveConversation(id: string) {
  set(KEYS.activeConversation, id);
}

export function getActiveConversationId(): string | null {
  return get<string | null>(KEYS.activeConversation, null);
}

export function addMessage(conversationId: string, message: ChatMessage) {
  const convs = getConversations();
  const conv = convs.find((c) => c.id === conversationId);
  if (!conv) return;
  conv.messages.push(message);
  conv.updated_at = new Date().toISOString();
  // Move to top of list
  const idx = convs.indexOf(conv);
  convs.splice(idx, 1);
  convs.unshift(conv);
  saveConversations(convs);
}

export function updateConversationTitle(conversationId: string, title: string) {
  const convs = getConversations();
  const conv = convs.find((c) => c.id === conversationId);
  if (conv) {
    conv.title = title;
    saveConversations(convs);
  }
}

// ---- Missions ----

export function getMissionProgress(): MissionProgressData[] {
  return get<MissionProgressData[]>(KEYS.missions, []);
}

export function getMissionProgressById(missionId: string): MissionProgressData | undefined {
  return getMissionProgress().find((m) => m.mission_id === missionId);
}

export function saveMissionProgress(progress: MissionProgressData) {
  const all = getMissionProgress();
  const idx = all.findIndex((m) => m.mission_id === progress.mission_id);
  if (idx >= 0) {
    all[idx] = progress;
  } else {
    all.push(progress);
  }
  set(KEYS.missions, all);
}

export function advanceMissionStep(missionId: string): boolean {
  const progress = getMissionProgressById(missionId);
  if (!progress) return false;

  const completedSteps = [...progress.completed_steps, progress.current_step];
  const nextStep = progress.current_step + 1;

  if (nextStep >= progress.total_steps) {
    saveMissionProgress({ ...progress, status: "completed", current_step: nextStep, completed_steps: completedSteps });
  } else {
    saveMissionProgress({ ...progress, current_step: nextStep, completed_steps: completedSteps });
  }

  // Also update the conversation's mission_step
  const convs = getConversations();
  if (progress.conversation_id) {
    const conv = convs.find((c) => c.id === progress.conversation_id);
    if (conv) {
      conv.mission_step = nextStep;
      saveConversations(convs);
    }
  }

  return true;
}

// ---- Rate limiting ----

export function getMessageCount(): { used: number; limit: number; allowed: boolean } {
  const limit = 3;
  let used = get<number>(KEYS.messageCount, 0);
  const resetAt = get<string | null>(KEYS.messageResetAt, null);

  // Reset monthly
  if (resetAt) {
    const daysSinceReset = (Date.now() - new Date(resetAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReset >= 30) {
      used = 0;
      set(KEYS.messageCount, 0);
      set(KEYS.messageResetAt, new Date().toISOString());
    }
  } else {
    set(KEYS.messageResetAt, new Date().toISOString());
  }

  return { used, limit, allowed: used < limit };
}

export function incrementMessageCount() {
  const { used } = getMessageCount();
  set(KEYS.messageCount, used + 1);
}

// ---- Upgrade interest ----

export function hasExpressedUpgradeInterest(): boolean {
  return get<boolean>(KEYS.upgradeInterest, false);
}

export function expressUpgradeInterest() {
  set(KEYS.upgradeInterest, true);
}
