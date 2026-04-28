"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CommandLineIcon,
  EyeIcon,
  ArrowPathIcon,
  PlayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import DwicIcon from "@/components/DwicIcon";
import { EmailGate } from "@/components/skills/EmailGate";
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
        <span className="gs-terminal-cmd">dwic audit --watch</span>
      </>
    ),
  },
  {
    delay: 700,
    content: (
      <span className="gs-terminal-muted">
        Watching 47 files in src/ · baseline loaded from .dwic/baseline.json
      </span>
    ),
  },
  {
    delay: 600,
    content: (
      <span className="gs-terminal-muted">
        14:02:11 ✓ src/styles/tokens.css no drift
      </span>
    ),
  },
  {
    delay: 900,
    content: (
      <>
        <span className="gs-terminal-time">14:02:38</span>{" "}
        <span className="gs-terminal-warn">⚠</span>{" "}
        <span className="gs-terminal-path">src/styles/tokens.css</span>{" "}
        Color ↑1 (1 err)
      </>
    ),
  },
  {
    delay: 350,
    content: (
      <span className="gs-terminal-error">
        error · primary-500 changed #1F3B90 → #2d56d2 — fails AA on
        background-50 (3.8:1, needs 4.5:1)
      </span>
    ),
  },
  {
    delay: 700,
    content: (
      <>
        <span className="gs-terminal-time">14:02:38</span>{" "}
        <span className="gs-terminal-warn">⚠</span>{" "}
        <span className="gs-terminal-path">src/components/Card.tsx</span>{" "}
        Typography ↑1
      </>
    ),
  },
  {
    delay: 350,
    content: (
      <span className="gs-terminal-error">
        error · body font-size 14px is below mandated 16px minimum
      </span>
    ),
  },
  {
    delay: 800,
    content: (
      <span className="gs-terminal-muted">
        Run{" "}
        <span className="gs-terminal-cmd-inline">
          dwic ask color-specialist
        </span>{" "}
        for guidance.
      </span>
    ),
  },
];

const INDENT_LINE_INDEXES = new Set([4, 6]);

export function GetStartedPreview() {
  const [demoActive, setDemoActive] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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
              <div className="gs-hero-form">
                <EmailGate />
              </div>
              <ul className="gs-hero-trust" aria-label="What you get">
                <li>Free during alpha</li>
                <li>No credit card</li>
                <li>
                  <Link href="/library" className="gs-hero-trust-link">
                    {SKILLS.length} specialists in the free library
                  </Link>
                </li>
              </ul>
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
                  Live: dwic catching design drift in a real project
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
                aria-label="Example dwic audit catching design drift"
              >
                <div className="gs-terminal-chrome" aria-hidden="true">
                  <span className="gs-terminal-dot gs-terminal-dot--red" />
                  <span className="gs-terminal-dot gs-terminal-dot--amber" />
                  <span className="gs-terminal-dot gs-terminal-dot--green" />
                  <span className="gs-terminal-label">~/aperture</span>
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

            <article className="gs-card">
              <ArrowPathIcon className="gs-card-icon" aria-hidden="true" />
              <h2 className="gs-card-title">Monitor continuously</h2>
              <p className="gs-card-body">
                Wire dwic into CI or pre-commit. Every push compares against
                the last baseline.
              </p>
            </article>
        </div>
      </section>
    </div>
  );
}
