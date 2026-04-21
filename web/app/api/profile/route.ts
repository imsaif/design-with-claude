import { NextRequest } from "next/server";
import { generateClaudeMd } from "@/lib/claude-md-generator";
import { setOnboarding, getProfile, getAccountState } from "@/lib/dwic/store";
import { isTokenShapeValid, mintToken } from "@/lib/dwic/tokens";
import { isValidSlug, normalizeSlug } from "@/lib/dwic/projects";
import type { OnboardingAnswers } from "@/lib/dwic/types";

export const runtime = "nodejs";

const VALID_EXPERIENCE = ["beginner", "intermediate", "advanced"] as const;
const VALID_TONE = ["concise", "explanatory", "encouraging"] as const;

function pickAnswers(input: Record<string, unknown>): OnboardingAnswers | null {
  const product_type =
    typeof input.product_type === "string" && input.product_type.trim()
      ? input.product_type.trim()
      : "Custom";
  const product_description =
    typeof input.product_description === "string" ? input.product_description.trim() : "";
  const design_system =
    typeof input.design_system === "string" ? input.design_system.trim() : "";
  const experience_level = input.experience_level as OnboardingAnswers["experience_level"];
  const tone_preference = input.tone_preference as OnboardingAnswers["tone_preference"];

  let tech_stack: string[] = [];
  if (Array.isArray(input.tech_stack)) {
    tech_stack = input.tech_stack.filter((s) => typeof s === "string").map((s) => s.trim());
  } else if (typeof input.tech_stack === "string") {
    tech_stack = input.tech_stack
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (
    !product_description ||
    !design_system ||
    !tech_stack.length ||
    !VALID_EXPERIENCE.includes(experience_level) ||
    !VALID_TONE.includes(tone_preference)
  ) {
    return null;
  }

  return {
    product_type,
    product_description,
    tech_stack,
    design_system,
    experience_level,
    tone_preference,
  };
}

/**
 * POST /api/profile
 *
 * Body shape:
 *   { token?, project?, product_type, product_description, tech_stack, design_system, experience_level, tone_preference }
 *
 * - If `token` is missing, mint a new one (first-ever onboarding).
 * - If `token` is present, reuse it (adding a new project to an existing designer).
 * - `project` slug is optional; defaults to "default" for backward compat with alpha.1.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const answers = pickAnswers(body);
  if (!answers) {
    return Response.json(
      { ok: false, reason: "missing_fields" },
      { status: 400 },
    );
  }

  // Token: reuse if provided (valid), mint otherwise.
  const rawToken = typeof body.token === "string" ? body.token.trim() : "";
  let token: string;
  if (rawToken) {
    if (!isTokenShapeValid(rawToken)) {
      return Response.json({ ok: false, reason: "invalid_token" }, { status: 400 });
    }
    token = rawToken;
  } else {
    token = mintToken();
  }

  // Project: optional; defaults to "default" via normalizeSlug.
  const rawProject = typeof body.project === "string" ? body.project.trim() : undefined;
  if (rawProject && !isValidSlug(rawProject)) {
    return Response.json({ ok: false, reason: "invalid_project_slug" }, { status: 400 });
  }
  const projectSlug = normalizeSlug(rawProject) ?? undefined;
  if (!projectSlug) {
    return Response.json({ ok: false, reason: "project_required" }, { status: 400 });
  }

  const claudeMd = generateClaudeMd({
    product_description: answers.product_description,
    design_system: answers.design_system,
    tech_stack: answers.tech_stack,
    experience_level: answers.experience_level,
    tone_preference: answers.tone_preference,
  });

  const profile = await setOnboarding(token, projectSlug, answers, claudeMd);

  return Response.json({
    ok: true,
    token,
    project: profile.project,
    claudeMd,
    profile: {
      product_type: answers.product_type,
      experience_level: answers.experience_level,
      tone_preference: answers.tone_preference,
    },
  });
}

/**
 * GET /api/profile?token=imr_xxx[&project=<slug>]
 *
 * Two modes:
 * - with `project`: returns scoped ProfileState (onboarding + claudeMd + counters).
 * - without `project`: returns AccountState (status + list of the designer's projects).
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!isTokenShapeValid(token)) {
    return Response.json({ ok: false, reason: "invalid_token" }, { status: 400 });
  }

  const rawProject = request.nextUrl.searchParams.get("project")?.trim();
  if (rawProject && !isValidSlug(rawProject)) {
    return Response.json({ ok: false, reason: "invalid_project_slug" }, { status: 400 });
  }

  if (!rawProject) {
    // Account-summary mode — used by /account dashboard.
    const account = await getAccountState(token);
    return Response.json({ ok: true, account });
  }

  const profile = await getProfile(token, rawProject);
  if (!profile) {
    return Response.json({ ok: false, reason: "not_found" }, { status: 404 });
  }
  return Response.json({
    ok: true,
    profile: {
      status: profile.status,
      commandCount: profile.commandCount,
      connected: profile.connected,
      onboarding: profile.onboarding,
      claudeMd: profile.claudeMd,
      createdAt: profile.createdAt,
      lastSeenAt: profile.lastSeenAt,
      project: profile.project,
      projectDisplayName: profile.projectDisplayName,
    },
  });
}
