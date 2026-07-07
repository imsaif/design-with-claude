"use client";

import { useEffect, useRef, useState } from "react";

const COMMAND = "npx dwic-audit";
const TYPE_INTERVAL_MS = 45;
const LINE_REVEAL_INTERVAL_MS = 280;
const POST_TYPE_PAUSE_MS = 450;
const LOOP_PAUSE_MS = 4200;

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

export default function HtdwcAnimatedTerminal() {
  const [typedChars, setTypedChars] = useState(0);
  const [linesShown, setLinesShown] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setTypedChars(COMMAND.length);
      setLinesShown(LINES.length);
      return;
    }

    const clearAll = () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };

    const schedule = (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay);
      timersRef.current.push(id);
    };

    const runCycle = () => {
      setTypedChars(0);
      setLinesShown(0);

      // Type the command character by character
      for (let i = 1; i <= COMMAND.length; i++) {
        schedule(() => setTypedChars(i), i * TYPE_INTERVAL_MS);
      }

      const typeDoneAt = COMMAND.length * TYPE_INTERVAL_MS + POST_TYPE_PAUSE_MS;

      // Reveal lines one by one
      for (let i = 1; i <= LINES.length; i++) {
        schedule(
          () => setLinesShown(i),
          typeDoneAt + i * LINE_REVEAL_INTERVAL_MS,
        );
      }

      const cycleDoneAt =
        typeDoneAt + LINES.length * LINE_REVEAL_INTERVAL_MS + LOOP_PAUSE_MS;

      schedule(runCycle, cycleDoneAt);
    };

    runCycle();
    return clearAll;
  }, [reducedMotion]);

  const commandTyped = COMMAND.slice(0, typedChars);
  const isTyping = !reducedMotion && typedChars < COMMAND.length;

  return (
    <div className="htdwc-terminal" role="img" aria-label="Animated example of the dwic audit command running">
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
  );
}
