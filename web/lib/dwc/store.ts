// In-memory store for dwc Phase 1 alpha. Phase 3 replaces this with Supabase.
// State survives for the lifetime of the Next.js runtime process; dev restarts reset it.
import { hashToken } from "./tokens";
import type {
  EventPayload,
  OnboardingAnswers,
  ProfileState,
  StoredEvent,
  SubscriptionStatus,
} from "./types";

const FREE_TIER_LIMIT = 10;
const MAX_EVENTS_PER_TOKEN = 500;

type Store = {
  profiles: Map<string, ProfileState>;
  events: Map<string, StoredEvent[]>;
};

const globalKey = Symbol.for("dwc.alpha.store");
const g = globalThis as unknown as Record<symbol, Store | undefined>;

function getStore(): Store {
  if (!g[globalKey]) {
    g[globalKey] = { profiles: new Map(), events: new Map() };
  }
  return g[globalKey]!;
}

function now(): string {
  return new Date().toISOString();
}

function randomId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

export function getOrCreateProfile(token: string): ProfileState {
  const store = getStore();
  const hash = hashToken(token);
  const existing = store.profiles.get(hash);
  if (existing) {
    existing.lastSeenAt = now();
    return existing;
  }
  const profile: ProfileState = {
    tokenHash: hash,
    status: "free",
    commandCount: 0,
    createdAt: now(),
    lastSeenAt: now(),
    connected: false,
  };
  store.profiles.set(hash, profile);
  return profile;
}

export function getProfile(token: string): ProfileState | undefined {
  return getStore().profiles.get(hashToken(token));
}

export function incrementCommandCount(token: string): number {
  const profile = getOrCreateProfile(token);
  profile.commandCount += 1;
  profile.lastSeenAt = now();
  return profile.commandCount;
}

export function setSubscriptionStatus(token: string, status: SubscriptionStatus): void {
  const profile = getOrCreateProfile(token);
  profile.status = status;
  profile.lastSeenAt = now();
}

export function setOnboarding(
  token: string,
  answers: OnboardingAnswers,
  claudeMd: string,
): ProfileState {
  const profile = getOrCreateProfile(token);
  profile.onboarding = answers;
  profile.claudeMd = claudeMd;
  profile.lastSeenAt = now();
  return profile;
}

export function recordEvent(payload: EventPayload): StoredEvent {
  const store = getStore();
  const hash = hashToken(payload.token);
  const list = store.events.get(hash) ?? [];
  const stored: StoredEvent = { ...payload, id: randomId(), receivedAt: now() };
  list.push(stored);
  if (list.length > MAX_EVENTS_PER_TOKEN) {
    list.splice(0, list.length - MAX_EVENTS_PER_TOKEN);
  }
  store.events.set(hash, list);

  if (payload.toolName === "__mcp.connected__") {
    const profile = getOrCreateProfile(payload.token);
    profile.connected = true;
    profile.lastSeenAt = now();
  }
  return stored;
}

export function getRecentEvents(token: string, limit = 50): StoredEvent[] {
  const list = getStore().events.get(hashToken(token)) ?? [];
  const sliceFrom = Math.max(0, list.length - limit);
  return list.slice(sliceFrom);
}

export function freeTierRemaining(count: number): number {
  return Math.max(0, FREE_TIER_LIMIT - count);
}

export function isFreeTierExhausted(count: number): boolean {
  return count >= FREE_TIER_LIMIT;
}

export const LIMITS = {
  FREE_TIER_LIMIT,
  MAX_EVENTS_PER_TOKEN,
} as const;
