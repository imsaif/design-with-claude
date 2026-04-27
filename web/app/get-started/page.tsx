import Link from "next/link";
import {
  CommandLineIcon,
  SparklesIcon,
  EyeIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

import { Nav } from "@/components/skills/Nav";
import { Footer } from "@/components/skills/Footer";
import { CopyCommand } from "@/components/skills/CopyCommand";
import { EmailGate } from "@/components/skills/EmailGate";
import { isTokenShapeValid } from "@/lib/dwic/tokens";
import { isValidSlug } from "@/lib/dwic/projects";

interface Props {
  searchParams: Promise<{ token?: string; project?: string }>;
}

export const metadata = {
  title: "Get started · dwic",
  description:
    "Install dwic in your terminal. Once installed, dwic auto-detects your stack and asks only what it can't see.",
};

export default async function GetStartedPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";
  const projectRaw = params.project?.trim();
  const project = projectRaw && isValidSlug(projectRaw) ? projectRaw : "default";

  const hasValidToken = isTokenShapeValid(token);
  const installCommand = hasValidToken
    ? `npx @imrandwc/dwic setup --token=${token} --project=${project}`
    : "";

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Nav />
      <main id="main-content" className="get-started">
        <section className="get-started-inner">
          <Link href="/" className="get-started-back">
            <ArrowLeftIcon aria-hidden="true" />
            Back to home
          </Link>

          {!hasValidToken ? (
            <EmailGate />
          ) : (
            <>
              <p className="get-started-eyebrow">Step 1 — install</p>
              <h1 className="get-started-title">
                Run this in the project you want dwic to watch
              </h1>
              <p className="get-started-sub">
                One command. dwic installs as an MCP server alongside Claude Code.
                Your token is already in the line below.
              </p>

              <CopyCommand command={installCommand} />

              <p className="get-started-meta">
                Tip — paste it into your terminal at the root of the project. dwic
                writes a small <code>.mcp.json</code> there so it only watches this
                project.
              </p>

              <h2 className="get-started-next-title">Then, in Claude Code</h2>
              <ol className="get-started-next-list">
                <li>
                  <span className="get-started-next-icon" aria-hidden="true">
                    <CommandLineIcon />
                  </span>
                  <div>
                    <strong>Open Claude Code in this project.</strong>
                    <p>dwic is already wired in — no separate launch.</p>
                  </div>
                </li>
                <li>
                  <span className="get-started-next-icon" aria-hidden="true">
                    <SparklesIcon />
                  </span>
                  <div>
                    <strong>Ask dwic anything design-system-related.</strong>
                    <p>
                      It auto-detects your framework, tokens, and design system,
                      then asks only what it can&apos;t see.
                    </p>
                  </div>
                </li>
                <li>
                  <span className="get-started-next-icon" aria-hidden="true">
                    <EyeIcon />
                  </span>
                  <div>
                    <strong>From now on, every run catches drift.</strong>
                    <p>
                      dwic remembers what your system looked like last time and
                      flags what changed.
                    </p>
                  </div>
                </li>
              </ol>

              <p className="get-started-token-note">
                Your token: <code>{token}</code> — keep it; it&apos;s how dwic
                recognises this project.
              </p>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
