import { NextRequest } from "next/server";
import { ensureAccount } from "@/lib/dwc/store";
import { resolveProject, isValidSlug } from "@/lib/dwc/projects";
import { isTokenShapeValid } from "@/lib/dwc/tokens";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { token?: string; project?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ valid: false, reason: "invalid_json" }, { status: 400 });
  }

  const token = body?.token?.trim();
  if (!isTokenShapeValid(token)) {
    return Response.json(
      { valid: false, reason: "invalid_token_format" },
      { status: 400 },
    );
  }

  const account = await ensureAccount(token!);

  // If a project slug is supplied, report whether it exists on this account.
  // setup.ts uses this to distinguish "new project on known token" from
  // "wrong token" before writing the .mcp.json.
  let projectKnown: boolean | undefined;
  const projectSlug = body?.project?.trim();
  if (projectSlug) {
    if (!isValidSlug(projectSlug)) {
      return Response.json(
        { valid: false, reason: "invalid_project_slug" },
        { status: 400 },
      );
    }
    const resolved = await resolveProject({ token: token!, slug: projectSlug, autoCreate: false });
    projectKnown = Boolean(resolved.projectId);
  }

  return Response.json({
    valid: true,
    status: account.status,
    commandCount: account.commandCount,
    ...(projectKnown !== undefined ? { projectKnown } : {}),
  });
}
