"use client";

import { useRef, useState } from "react";
import e from "./empathy.module.css";

// The six build steps and where AI stands, as rated in Anthropic's AI Fluency for Builders course.
// Descriptions are our own wording. Track shading follows AI strength: darker = AI stronger.
const STEPS = [
  { name: "Empathy", ai: "weak", text: "Understanding who you’re building for. AI can summarise what people say; it can’t tell you what matters to them." },
  { name: "Design", ai: "moderate", text: "Turning needs into an experience. AI suggests patterns quickly; the taste and the context are yours." },
  { name: "Architecture", ai: "moderate", text: "Structuring something that holds up. AI knows the common patterns; your constraints are yours to set." },
  { name: "Implementation", ai: "strong", text: "Writing, fixing and changing the code. This is where AI is strongest." },
  { name: "Judgment", ai: "weak", text: "Deciding what’s good enough to ship. AI can list the options; the call is yours." },
  { name: "Shipping", ai: "moderate", text: "Getting it to people and learning from them. AI can automate the steps; the responsibility stays with you." },
] as const;

const LEVEL: Record<string, number> = { weak: 1, moderate: 2, strong: 3 };
const SHADE: Record<number, string> = { 1: e.segWeak, 2: e.segModerate, 3: e.segStrong };

export function StepSlider({ courseUrl }: { courseUrl: string }) {
  const [i, setI] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const go = (n: number, focus = true) => {
    const next = Math.max(0, Math.min(STEPS.length - 1, n));
    setI(next);
    if (focus) refs.current[next]?.focus();
  };
  const s = STEPS[i];

  return (
    <figure className={e.viz}>
      <span className={e.vlabel} id="steps-label">Six build steps, and where AI stands</span>
      <div className={e.slider}>
        <div className={e.track} aria-hidden="true">
          {STEPS.slice(0, -1).map((step, n) => {
            // Each segment takes the stronger of the two steps it joins, so the track darkens towards Implementation.
            const level = Math.max(LEVEL[step.ai], LEVEL[STEPS[n + 1].ai]);
            return <span key={step.name} className={`${e.seg} ${SHADE[level]}`} />;
          })}
        </div>
        <div className={e.stops} role="radiogroup" aria-labelledby="steps-label">
          {STEPS.map((step, n) => (
            <button
              key={step.name}
              ref={(el) => { refs.current[n] = el; }}
              type="button"
              role="radio"
              aria-checked={n === i}
              tabIndex={n === i ? 0 : -1}
              className={n === i ? `${e.stop} ${e.stopOn}` : e.stop}
              onClick={() => setI(n)}
              onKeyDown={(ev) => {
                if (ev.key === "ArrowRight" || ev.key === "ArrowDown") { ev.preventDefault(); go(n + 1); }
                if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") { ev.preventDefault(); go(n - 1); }
                if (ev.key === "Home") { ev.preventDefault(); go(0); }
                if (ev.key === "End") { ev.preventDefault(); go(STEPS.length - 1); }
              }}
            >
              {step.ai === "strong" && <span className={e.strongest} aria-hidden="true">▼ AI strongest</span>}
              <span className={e.dot} aria-hidden="true" />
              <span className={e.stopName}>{step.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={e.stepPanel} aria-live="polite">
        <div className={e.stepHead}>
          <p className={e.stepTitle}>
            <span className={e.stepCount}>{i + 1}/{STEPS.length}</span> {s.name}
          </p>
          <span className={`${e.rating} ${s.ai === "weak" ? e.ratingWeak : s.ai === "strong" ? e.ratingStrong : ""}`}>AI {s.ai}</span>
          <span className={e.stepNav}>
            <button type="button" className={e.navBtn} onClick={() => go(i - 1, false)} disabled={i === 0} aria-label="Previous step">←</button>
            <button type="button" className={e.navBtn} onClick={() => go(i + 1, false)} disabled={i === STEPS.length - 1} aria-label="Next step">→</button>
          </span>
        </div>
        <p className={e.stepText}>{s.text}</p>
      </div>

      <figcaption className={e.vcap}>
        Ratings from Anthropic&rsquo;s{" "}
        <a href={courseUrl} target="_blank" rel="noopener noreferrer">AI Fluency for Builders</a> course; descriptions are ours.
      </figcaption>
    </figure>
  );
}
