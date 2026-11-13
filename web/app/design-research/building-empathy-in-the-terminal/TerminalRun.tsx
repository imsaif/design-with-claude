"use client";

import { useEffect, useRef, useState } from "react";
import e from "./empathy.module.css";

// An example /design-empathy session that plays when scrolled into view.
// "type" lines are typed character by character (the designer); "out" lines appear after a short
// thinking pause (dwic). Every line is rendered from the start and hidden until reached, so the box
// never changes height. Reduced motion shows the whole session at once.
type Line = { kind: "type" | "out" | "dim"; text: string };

const LINES: Line[] = [
  { kind: "type", text: "> /design-with-claude:design-empathy the signup flow" },
  { kind: "dim", text: "Reading app/onboarding/page.tsx, app/signup/form.tsx" },
  {
    kind: "out",
    text: `What this flow assumes about people:
  1. Everyone finishes all five setup steps before their first invoice.  page.tsx:5
  2. Everyone has a phone number and will give it up front.              form.tsx:12
  3. A failed phone number is the user’s mistake.                        form.tsx:31`,
  },
  { kind: "out", text: "Starting with 1. Who did you have in mind, and when did you last see someone go through it?" },
  { kind: "dim", text: "Why I’m asking: what someone did last time predicts better than what they say they’d do." },
  { kind: "type", text: "› A freelance photographer I demoed to on 3 November quit at the bank step." },
  { kind: "out", text: "Did she say why?" },
  { kind: "type", text: "› No." },
  {
    kind: "out",
    text: `Proposed for EMPATHY.md:
  1. recalled  A freelance photographer quit at the bank step (demo, 3 Nov).
               why: unknown → ask her: “When you stopped at the bank step,
               what was going through your mind?”
Keep it?`,
  },
  { kind: "type", text: "› Yes." },
  { kind: "dim", text: "Wrote 1 point to .dwic/EMPATHY.md. Nothing else was saved." },
];

const TYPE_MS = 28;
const THINK_MS = 700;
const AFTER_TYPE_MS = 350;

export function TerminalRun() {
  const box = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState(-1); // index of the line in progress; -1 = not started
  const [chars, setChars] = useState(0); // characters shown of a "type" line
  const [thinking, setThinking] = useState(false);
  const [run, setRun] = useState(0); // bump to replay

  // Start on scroll into view (or at once with reduced motion).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLine(LINES.length);
      return;
    }
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLine(0);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [run]);

  // Advance one step at a time.
  useEffect(() => {
    if (line < 0 || line >= LINES.length) return;
    const l = LINES[line];
    let t: ReturnType<typeof setTimeout>;
    if (l.kind === "type") {
      if (chars < l.text.length) t = setTimeout(() => setChars((c) => c + 1), TYPE_MS);
      else t = setTimeout(() => { setChars(0); setLine((n) => n + 1); }, AFTER_TYPE_MS);
    } else if (l.kind === "out" && !thinking && chars === 0) {
      setThinking(true);
      t = setTimeout(() => { setThinking(false); setChars(1); }, THINK_MS);
    } else if (l.kind === "out" && chars === 1) {
      t = setTimeout(() => { setChars(0); setLine((n) => n + 1); }, 250);
    } else if (l.kind === "dim") {
      t = setTimeout(() => setLine((n) => n + 1), 450);
    }
    return () => clearTimeout(t);
  }, [line, chars, thinking]);

  const done = line >= LINES.length;
  const replay = () => {
    setLine(-1);
    setChars(0);
    setThinking(false);
    setRun((r) => r + 1);
  };

  const plain = LINES.map((l) => l.text).join("\n");

  return (
    <figure className={e.termFig}>
      <div className={e.termWin} ref={box}>
        <div className={e.termBar} aria-hidden="true">
          <span className={e.termDots}><i /><i /><i /></span>
          <span className={e.termTitle}>signup-flow — claude</span>
        </div>
        <div className={e.term} role="img" aria-label={`Example run of /design-empathy. ${plain}`}>
          <div aria-hidden="true">
            {LINES.map((l, n) => {
              const cls = l.kind === "type" ? e.termYou : l.kind === "dim" ? e.termDim : undefined;
              const shown = n < line || done;
              const current = n === line && !done;
              if (l.kind === "type" && current) {
                return (
                  <p key={n} className={cls}>
                    {l.text.slice(0, chars)}
                    <span className={e.caret} />
                    <span className={e.termGhost}>{l.text.slice(chars)}</span>
                  </p>
                );
              }
              if (l.kind === "out" && current && thinking) {
                return (
                  <p key={n} className={e.termRow}>
                    <span className={e.termThinking}>● thinking</span>
                    <span className={e.termGhost}>{l.text}</span>
                  </p>
                );
              }
              const visible = shown || (current && l.kind === "out" && chars === 1);
              return (
                <p key={n} className={`${cls ?? ""} ${visible ? e.termIn : e.termGhost}`}>
                  {l.text}
                </p>
              );
            })}
            {done && <p><span className={e.caret} /></p>}
          </div>
        </div>
      </div>
      <figcaption className={e.vcap}>
        Shortened from a run against the test project dwic was built against.
        {done && (
          <>
            {" "}
            <button type="button" className={e.replay} onClick={replay}>Replay</button>
          </>
        )}
      </figcaption>
    </figure>
  );
}
