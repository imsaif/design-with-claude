"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  CommandLineIcon,
  EyeIcon,
  ArrowPathIcon,
  BookOpenIcon,
  PlayIcon,
  XMarkIcon,
  ClipboardIcon,
  CheckIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";

const CLI_COMMAND = "npx @imrandwc/dwic audit";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COPY_TO_EMAIL_DELAY_MS = 1200;

import DwicIcon from "@/components/DwicIcon";
import { SKILLS } from "@/app/data/skills";

type TerminalLine = {
  content: ReactNode;
  delay: number;
};

const DEMO_LINES: TerminalLine[] = [
  {
    delay: 0,
    content: (
      <>
        <span className="gs-terminal-prompt">$</span>{" "}
        <span className="gs-terminal-cmd">npx @imrandwc/dwic audit</span>
      </>
    ),
  },
  {
    delay: 600,
    content: (
      <span className="gs-terminal-muted">
        Scanning 47 files · detected Next.js 15 + Tailwind v4
      </span>
    ),
  },
  {
    delay: 700,
    content: (
      <>
        <span className="gs-terminal-error">✗ Color</span>{" "}
        <span className="gs-terminal-muted">
          — AA contrast fail on 2 token pairs
        </span>
      </>
    ),
  },
  {
    delay: 250,
    content: (
      <span className="gs-terminal-error">
        primary-500 #2d56d2 fails AA on background-50 (3.8:1, needs 4.5:1)
      </span>
    ),
  },
  {
    delay: 450,
    content: (
      <>
        <span className="gs-terminal-warn">⚠ Typography</span>{" "}
        <span className="gs-terminal-muted">
          — body 14px below mandated 16px
        </span>
      </>
    ),
  },
  {
    delay: 380,
    content: (
      <>
        <span className="gs-terminal-warn">⚠ Spacing</span>{" "}
        <span className="gs-terminal-muted">
          — off-grid value 13px in Card.tsx
        </span>
      </>
    ),
  },
  {
    delay: 380,
    content: (
      <>
        <span className="gs-terminal-error">✗ Accessibility</span>{" "}
        <span className="gs-terminal-muted">
          — unlabeled input, missing alt on 1 image
        </span>
      </>
    ),
  },
  {
    delay: 380,
    content: (
      <>
        <span className="gs-terminal-warn">⚠ Form</span>{" "}
        <span className="gs-terminal-muted">
          — radio group not wrapped in &lt;fieldset&gt;
        </span>
      </>
    ),
  },
  {
    delay: 380,
    content: (
      <>
        <span className="gs-terminal-muted">· Navigation</span>{" "}
        <span className="gs-terminal-muted">
          — active link missing aria-current
        </span>
      </>
    ),
  },
  {
    delay: 380,
    content: (
      <>
        <span className="gs-terminal-muted">· Motion</span>{" "}
        <span className="gs-terminal-muted">
          — transition: all on .card hover
        </span>
      </>
    ),
  },
  {
    delay: 380,
    content: (
      <>
        <span className="gs-terminal-ok">✓ Content</span>{" "}
        <span className="gs-terminal-muted">— no findings</span>
      </>
    ),
  },
  {
    delay: 600,
    content: (
      <span className="gs-terminal-divider" aria-hidden="true" />
    ),
  },
  {
    delay: 250,
    content: (
      <span className="gs-terminal-summary">
        28 findings · 6 errors · 14 warns · 8 info{"  "}
        <span className="gs-terminal-muted">(exit 2)</span>
      </span>
    ),
  },
  {
    delay: 700,
    content: (
      <span className="gs-terminal-muted">
        → Run color-specialist via MCP to fix the contrast issue
      </span>
    ),
  },
];

const INDENT_LINE_INDEXES = new Set([3]);

type HeroPhase = "cli" | "email";

export function GetStartedPreview() {
  const router = useRouter();
  const [demoActive, setDemoActive] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [cliCopied, setCliCopied] = useState(false);
  const [phase, setPhase] = useState<HeroPhase>("cli");
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [emailError, setEmailError] = useState("");
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase === "email") {
      // Defer focus until the input has rendered.
      const t = setTimeout(() => emailInputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [phase]);

  async function copyCliCommand() {
    try {
      await navigator.clipboard.writeText(CLI_COMMAND);
      setCliCopied(true);
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = setTimeout(() => {
        setPhase("email");
        setCliCopied(false);
      }, COPY_TO_EMAIL_DELAY_MS);
    } catch {
      // Older browsers — the command is on screen.
    }
  }

  function backToCli() {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    setPhase("cli");
    setEmailStatus("idle");
    setEmailError("");
  }

  async function submitEmail(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailStatus("error");
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailStatus("loading");
    setEmailError("");
    try {
      const res = await fetch("/api/get-started/mint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed, website_url: "" }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        token?: string;
        reason?: string;
      };
      if (!res.ok || !data.ok || !data.token) {
        setEmailStatus("error");
        setEmailError(
          data.reason === "invalid_email"
            ? "That email doesn’t look right."
            : "Something went wrong. Try again?",
        );
        return;
      }
      router.push(`/get-started?token=${data.token}&project=default`);
    } catch {
      setEmailStatus("error");
      setEmailError("Network error. Try again?");
    }
  }

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (!demoActive) {
      setRevealed(0);
      return;
    }

    let cumulative = 0;
    DEMO_LINES.forEach((line, index) => {
      cumulative += line.delay;
      const t = setTimeout(() => {
        setRevealed(index + 1);
      }, cumulative);
      timersRef.current.push(t);
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [demoActive]);

  const allRevealed = revealed >= DEMO_LINES.length;

  return (
    <div className="gs">
      <section className={`gs-hero ${demoActive ? "gs-hero--demo" : ""}`}>
        <div className="gs-hero-stack">
          {!demoActive && (
            <>
              <h1 className="gs-hero-title">
                dwic is a senior designer inside your terminal
                <span className="skills-hero-cursor" aria-hidden="true" />
              </h1>
              <p className="gs-hero-sub">
                It knows your design system, your design choices, and your
                code. It catches changes before they get shipped.
              </p>
              <div
                className="gs-hero-cli"
                aria-label={
                  phase === "cli"
                    ? "Run dwic in your terminal"
                    : "Get a token to install the AI specialists"
                }
              >
                {phase === "cli" ? (
                  <div className="gs-hero-cli-row">
                    <code className="gs-hero-cli-cmd">
                      <span className="gs-hero-cli-prompt">$</span>{" "}
                      {CLI_COMMAND}
                    </code>
                    <button
                      type="button"
                      onClick={copyCliCommand}
                      className="gs-hero-cli-copy"
                      aria-live="polite"
                      aria-label={
                        cliCopied
                          ? "Command copied"
                          : "Copy command to clipboard"
                      }
                    >
                      {cliCopied ? (
                        <CheckIcon
                          className="gs-hero-cli-copy-icon"
                          aria-hidden="true"
                        />
                      ) : (
                        <ClipboardIcon
                          className="gs-hero-cli-copy-icon"
                          aria-hidden="true"
                        />
                      )}
                      {cliCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="gs-hero-cli-pitch" role="status">
                      Command copied. Want Claude to fix what dwic finds?
                    </p>
                    <form
                      onSubmit={submitEmail}
                      className="gs-hero-cli-row gs-hero-cli-row--email"
                    >
                      <input
                        ref={emailInputRef}
                        type="email"
                        aria-label="Email address"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(ev) => {
                          setEmail(ev.target.value);
                          if (emailStatus === "error") setEmailStatus("idle");
                        }}
                        placeholder="you@somewhere.com"
                        disabled={emailStatus === "loading"}
                        className="gs-hero-cli-email-input"
                      />
                      <button
                        type="submit"
                        className="gs-hero-cli-copy"
                        disabled={emailStatus === "loading"}
                      >
                        {emailStatus === "loading"
                          ? "Setting up…"
                          : "Get token"}
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={backToCli}
                      className="gs-hero-cli-back"
                    >
                      <ArrowUturnLeftIcon
                        className="gs-hero-cli-back-icon"
                        aria-hidden="true"
                      />
                      Back to command
                    </button>
                    {emailStatus === "error" && emailError ? (
                      <p className="gs-hero-cli-error" role="alert">
                        {emailError}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
              <button
                type="button"
                className="gs-demo-cta"
                onClick={() => setDemoActive(true)}
              >
                <PlayIcon className="gs-demo-cta-icon" aria-hidden="true" />
                See demo
              </button>
            </>
          )}

          {demoActive && (
            <div className="gs-demo">
              <div className="gs-demo-header">
                <p className="gs-demo-caption">
                  Live: dwic auditing a real project
                </p>
                <button
                  type="button"
                  className="gs-demo-close"
                  onClick={() => setDemoActive(false)}
                  aria-label="Close demo"
                >
                  <XMarkIcon
                    className="gs-demo-close-icon"
                    aria-hidden="true"
                  />
                  Close demo
                </button>
              </div>

              <figure
                className="gs-terminal gs-terminal--live"
                aria-label="Example dwic audit output"
              >
                <div className="gs-terminal-chrome">
                  <button
                    type="button"
                    onClick={() => setDemoActive(false)}
                    className="gs-terminal-dots"
                    aria-label="Close demo"
                  >
                    <span
                      className="gs-terminal-dot gs-terminal-dot--red"
                      aria-hidden="true"
                    />
                    <span
                      className="gs-terminal-dot gs-terminal-dot--amber"
                      aria-hidden="true"
                    />
                    <span
                      className="gs-terminal-dot gs-terminal-dot--green"
                      aria-hidden="true"
                    />
                  </button>
                  <span className="gs-terminal-label" aria-hidden="true">
                    ~/aperture
                  </span>
                </div>
                <pre className="gs-terminal-body">
                  <code>
                    {DEMO_LINES.slice(0, revealed).map((line, i) => (
                      <span
                        key={i}
                        className={`gs-terminal-line ${
                          INDENT_LINE_INDEXES.has(i)
                            ? "gs-terminal-indent"
                            : ""
                        }`}
                      >
                        {line.content}
                      </span>
                    ))}
                    {allRevealed && (
                      <span className="gs-terminal-line">
                        <span className="gs-terminal-prompt">$</span>{" "}
                        <span
                          className="skills-hero-cursor"
                          aria-hidden="true"
                        />
                      </span>
                    )}
                  </code>
                </pre>
              </figure>

              <button
                type="button"
                className={`gs-demo-replay ${
                  allRevealed ? "" : "gs-demo-replay--hidden"
                }`}
                onClick={() => {
                  setRevealed(0);
                  setDemoActive(false);
                  setTimeout(() => setDemoActive(true), 50);
                }}
                aria-hidden={!allRevealed}
                tabIndex={allRevealed ? 0 : -1}
              >
                <ArrowPathIcon
                  className="gs-demo-replay-icon"
                  aria-hidden="true"
                />
                Replay
              </button>
            </div>
          )}
        </div>

        <div className="gs-cards" aria-label="How dwic works">
            <article className="gs-card">
              <CommandLineIcon className="gs-card-icon" aria-hidden="true" />
              <h2 className="gs-card-title">Install in Claude Code</h2>
              <p className="gs-card-body">
                One paste-able command. dwic runs as an MCP server alongside.
              </p>
            </article>

            <article className="gs-card">
              <DwicIcon className="gs-card-icon" aria-hidden="true" />
              <h2 className="gs-card-title">dwic learns your project</h2>
              <p className="gs-card-body">
                Auto-detects your stack and tokens. Asks only what it
                can&apos;t see.
              </p>
            </article>

            <article className="gs-card">
              <EyeIcon className="gs-card-icon" aria-hidden="true" />
              <h2 className="gs-card-title">Catch drift on every run</h2>
              <p className="gs-card-body">
                Audits your design system and remembers what changed.
              </p>
            </article>

            <Link href="/library" className="gs-card gs-card--link">
              <BookOpenIcon className="gs-card-icon" aria-hidden="true" />
              <h2 className="gs-card-title">
                {SKILLS.length} specialists, free
              </h2>
              <p className="gs-card-body">
                Browse the open library of design specialists you can drop into
                Claude Code today.
              </p>
              <span className="gs-card-cta" aria-hidden="true">
                Open library →
              </span>
            </Link>
        </div>
      </section>
    </div>
  );
}
