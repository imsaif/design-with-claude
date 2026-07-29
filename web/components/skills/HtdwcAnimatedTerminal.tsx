"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

const COMMAND = "npx dwic-audit";
const TYPE_INTERVAL_MS = 45;
const LINE_REVEAL_INTERVAL_MS = 280;
const POST_TYPE_PAUSE_MS = 450;

type LineKind = "scan" | "divider" | "err" | "warn" | "ok" | "dim";
interface Line {
  kind: LineKind;
  text?: string;
}

const LINES: Line[] = [
  { kind: "scan", text: "Scanning my-app · 184 files · 8 categories" },
  { kind: "divider" },
  { kind: "err", text: "Accessibility · 3 errors · unlabeled inputs, no landmarks" },
  { kind: "err", text: "Color · 2 errors · contrast below WCAG AA" },
  { kind: "warn", text: "Typography · 1 warn" },
  { kind: "warn", text: "Spacing · 1 warn" },
  { kind: "ok", text: "Forms, Navigation, Motion, Copy: clean" },
  { kind: "divider" },
  { kind: "dim", text: "8 categories · 9 findings · 5 errors · 2 warns (exit 2)" },
  { kind: "dim", text: "→ Fix accessibility first — run accessibility-specialist via MCP" },
];

const SEVERITY_GLYPH: Partial<Record<LineKind, string>> = {
  err: "✗",
  warn: "⚠",
  ok: "·",
};

type Status = "idle" | "playing" | "done";

export default function HtdwcAnimatedTerminal() {
  // Idle shows the command already typed, so the block reads as a terminal
  // rather than an empty box before anyone presses play.
  const [typedChars, setTypedChars] = useState(COMMAND.length);
  const [linesShown, setLinesShown] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [reducedMotion, setReducedMotion] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = (matches: boolean) => {
      setReducedMotion(matches);
      if (matches) {
        // No animation to opt into: show the finished output outright.
        clearAll();
        setTypedChars(COMMAND.length);
        setLinesShown(LINES.length);
        setStatus("done");
      }
    };
    apply(mql.matches);
    const onChange = (e: MediaQueryListEvent) => apply(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [clearAll]);

  // Only ever clean up on unmount; nothing runs until the user asks.
  useEffect(() => clearAll, [clearAll]);

  const play = useCallback(() => {
    clearAll();
    setStatus("playing");
    setTypedChars(0);
    setLinesShown(0);

    const schedule = (fn: () => void, delay: number) => {
      timersRef.current.push(setTimeout(fn, delay));
    };

    for (let i = 1; i <= COMMAND.length; i++) {
      schedule(() => setTypedChars(i), i * TYPE_INTERVAL_MS);
    }

    const typeDoneAt = COMMAND.length * TYPE_INTERVAL_MS + POST_TYPE_PAUSE_MS;

    for (let i = 1; i <= LINES.length; i++) {
      schedule(() => setLinesShown(i), typeDoneAt + i * LINE_REVEAL_INTERVAL_MS);
    }

    schedule(
      () => setStatus("done"),
      typeDoneAt + LINES.length * LINE_REVEAL_INTERVAL_MS,
    );
  }, [clearAll]);

  const commandTyped = COMMAND.slice(0, typedChars);
  const isTyping = status === "playing" && typedChars < COMMAND.length;

  return (
    <div className="htdwc-demo">
      <div
        className="htdwc-terminal"
        role="img"
        aria-label={
          status === "idle"
            ? "Example dwic audit output, not yet run"
            : "Example dwic audit output: 9 findings across 8 categories, 5 errors, exit code 2"
        }
      >
        <div className="htdwc-terminal-line">
          <span className="htdwc-terminal-prompt">$</span>{" "}
          <span>{commandTyped}</span>
          {isTyping && <span className="htdwc-terminal-caret" aria-hidden="true" />}
        </div>
        {LINES.map((line, idx) => {
          const visible = linesShown > idx;
          if (line.kind === "divider") {
            return (
              <div
                key={idx}
                className={`htdwc-terminal-divider htdwc-terminal-reveal${visible ? " is-visible" : ""}`}
              />
            );
          }
          const glyph = SEVERITY_GLYPH[line.kind];
          const glyphClass =
            line.kind === "err"
              ? "htdwc-terminal-err"
              : line.kind === "warn"
                ? "htdwc-terminal-warn"
                : line.kind === "ok"
                  ? "htdwc-terminal-ok"
                  : "";
          return (
            <div
              key={idx}
              className={`htdwc-terminal-line htdwc-terminal-reveal${visible ? " is-visible" : ""}`}
            >
              {glyph ? (
                <>
                  <span className={glyphClass}>{glyph}</span> {line.text}
                </>
              ) : (
                <span className="htdwc-terminal-dim">{line.text}</span>
              )}
            </div>
          );
        })}
      </div>

      {status === "idle" && !reducedMotion ? (
        <div className="htdwc-demo-overlay">
          <button type="button" className="htdwc-demo-play" onClick={play}>
            <PlayIcon className="htdwc-demo-play-icon" aria-hidden="true" />
            Run the audit
          </button>
        </div>
      ) : null}

      {status === "done" && !reducedMotion ? (
        <button type="button" className="htdwc-demo-replay" onClick={play}>
          <ArrowPathIcon className="htdwc-demo-replay-icon" aria-hidden="true" />
          Replay
        </button>
      ) : null}
    </div>
  );
}
