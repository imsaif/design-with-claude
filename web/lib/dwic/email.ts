// dwic-internal email delivery via Resend.
//
// Design constraints:
//  - No npm dep — direct fetch to api.resend.com.
//  - Graceful no-op if RESEND_API_KEY is missing (dev / pre-key state).
//    Code paths that depend on email delivery should treat a `false` return
//    as "we couldn't send, but the user has the install command on screen
//    anyway" — never block the request.
//  - PII minimisation: log the recipient + outcome but not the body.
//
// To enable sending in production:
//   1. Verify designwithclaude.com (or a subdomain) in Resend.
//   2. Set env vars on Vercel:
//        RESEND_API_KEY     = re_...
//        DWIC_FROM_EMAIL    = "dwic <hello@designwithclaude.com>"
//   3. Redeploy. No code change needed — the helpers detect the key on
//      every call.

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "dwic <hello@designwithclaude.com>";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface SendResult {
  ok: boolean;
  reason?: string;
  id?: string;
}

function getApiKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

function getFrom(): string {
  return process.env.DWIC_FROM_EMAIL?.trim() || DEFAULT_FROM;
}

export function isEmailConfigured(): boolean {
  return getApiKey() !== null;
}

async function send(args: SendArgs): Promise<SendResult> {
  const key = getApiKey();
  if (!key) {
    // Honest no-op. Dev / no-key / API-down all land here. Caller already
    // showed the install command on screen.
    return { ok: false, reason: "no_api_key" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: getFrom(),
        to: [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, reason: `resend_${res.status}`, id: detail.slice(0, 200) };
    }

    const json = (await res.json()) as { id?: string };
    return { ok: true, id: json?.id };
  } catch (err) {
    return { ok: false, reason: (err as Error).message ?? "fetch_failed" };
  } finally {
    clearTimeout(timeout);
  }
}

// ---------- Public templates ----------

interface InstallEmailArgs {
  to: string;
  token: string;
  project?: string;
  origin?: string; // e.g. https://designwithclaude.com — for absolute links
}

/**
 * Welcome + install command. Sent after a successful mint via
 * /api/get-started/mint. Single transactional email — no list, no
 * unsubscribe gymnastics; we don't put them on a recurring list yet.
 */
export async function sendInstallEmail(args: InstallEmailArgs): Promise<SendResult> {
  const project = args.project || "default";
  const command = `npx dwic-audit setup --token=${args.token} --project=${project}`;
  const origin = (args.origin || "https://designwithclaude.com").replace(/\/+$/, "");
  const link = `${origin}/get-started?token=${args.token}&project=${project}`;

  const subject = "Your dwic install command";

  const text = [
    "Welcome to dwic.",
    "",
    "Run this in the project where you want dwic to watch:",
    "",
    "  " + command,
    "",
    "Then open Claude Code in that project and ask dwic anything design-system-related. It auto-detects your stack and asks only what it can't see.",
    "",
    "Need this page again? " + link,
    "",
    "— dwic",
  ].join("\n");

  const html = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fafafa;padding:32px 0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#162036;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;max-width:560px;">
          <tr><td>
            <p style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;margin:0 0 12px;">Welcome to dwic</p>
            <h1 style="font-size:24px;font-weight:700;color:#162036;margin:0 0 16px;line-height:1.2;">Your install command</h1>
            <p style="font-size:16px;line-height:1.55;color:#20294C;margin:0 0 24px;">Run this in the project where you want dwic to watch your design system:</p>
            <div style="background:#f9f9f9;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:24px;font-family:ui-monospace,Menlo,Monaco,monospace;font-size:13px;color:#162036;word-break:break-all;">${escapeHtml(command)}</div>
            <p style="font-size:15px;line-height:1.55;color:#20294C;margin:0 0 24px;">Then open Claude Code in that project and ask dwic anything design-system-related. It auto-detects your stack and asks only what it can&apos;t see.</p>
            <p style="font-size:14px;color:#64748b;margin:0;">Need this page again? <a href="${link}" style="color:#162036;">${link}</a></p>
          </td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin:16px 0 0;">— dwic. Pre-launch alpha.</p>
      </td></tr>
    </table>
  `.trim();

  return send({ to: args.to, subject, html, text });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
