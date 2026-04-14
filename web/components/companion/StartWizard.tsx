"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3 | 4 | 5;

interface Answers {
  product_type: string;
  product_description: string;
  tech_stack: string[];
  design_system: string;
  experience_level: "beginner" | "intermediate" | "advanced" | "";
  tone_preference: "concise" | "explanatory" | "encouraging" | "";
}

const PRODUCT_TYPES = ["SaaS", "Landing page", "Portfolio", "Mobile app", "Dashboard", "Marketing site"];
const STACK_OPTIONS = ["Next.js", "React + Vite", "SvelteKit", "Remix", "Astro", "Vanilla HTML/CSS", "Figma only"];
const DESIGN_SYSTEMS = [
  "Starting fresh",
  "Tailwind CSS",
  "shadcn/ui",
  "Material Design",
  "Existing custom tokens",
  "Figma library",
];
const EXPERIENCE_LEVELS: Array<{ key: Answers["experience_level"]; title: string; subtitle: string }> = [
  { key: "beginner", title: "Beginner", subtitle: "New to terminal + code; I mostly design in Figma" },
  { key: "intermediate", title: "Intermediate", subtitle: "I can follow tutorials and edit code when I need to" },
  { key: "advanced", title: "Advanced", subtitle: "I ship code regularly; I just want the shortcuts" },
];
const TONE_OPTIONS: Array<{ key: Answers["tone_preference"]; title: string; subtitle: string }> = [
  { key: "concise", title: "Concise", subtitle: "Short and direct. No preamble." },
  { key: "explanatory", title: "Explanatory", subtitle: "Walk me through the reasoning." },
  { key: "encouraging", title: "Encouraging", subtitle: "Warm and confidence-building." },
];

const CARD: React.CSSProperties = {
  background: "#0a0a0b",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: "2rem",
  marginBottom: "1.5rem",
};

const CHIP_BASE: React.CSSProperties = {
  padding: "0.55rem 1rem",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "transparent",
  color: "rgba(255,255,255,0.85)",
  fontSize: "0.9rem",
  cursor: "pointer",
  transition: "all 150ms ease",
  fontFamily: "inherit",
};

function chipStyle(selected: boolean): React.CSSProperties {
  return {
    ...CHIP_BASE,
    ...(selected
      ? { background: "#c8f07a", color: "#0F0F10", borderColor: "#c8f07a", fontWeight: 600 }
      : {}),
  };
}

export function StartWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [a, setA] = useState<Answers>({
    product_type: "",
    product_description: "",
    tech_stack: [],
    design_system: "",
    experience_level: "",
    tone_preference: "",
  });

  const canAdvance = useMemo(() => {
    switch (step) {
      case 1:
        // Chips are shortcuts — a description is all we actually need. If the
        // designer skips the chips, we fall back to "Custom" at submit time.
        return a.product_description.trim().length >= 10;
      case 2:
        return a.tech_stack.length > 0;
      case 3:
        return Boolean(a.design_system);
      case 4:
        return Boolean(a.experience_level);
      case 5:
        return Boolean(a.tone_preference);
    }
  }, [step, a]);

  function update<K extends keyof Answers>(key: K, value: Answers[K]) {
    setA((prev) => ({ ...prev, [key]: value }));
  }

  function toggleStack(option: string) {
    setA((prev) => ({
      ...prev,
      tech_stack: prev.tech_stack.includes(option)
        ? prev.tech_stack.filter((s) => s !== option)
        : [...prev.tech_stack, option],
    }));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...a,
        product_type: a.product_type || "Custom",
      };
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        throw new Error(body.reason || `http ${res.status}`);
      }
      router.push(`/profile?token=${body.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        aria-label={`Question ${step} of 5`}
        style={{
          height: 4,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(step / 5) * 100}%`,
            background: "#c8f07a",
            borderRadius: 999,
            transition: "width 280ms ease",
          }}
        />
      </div>
      <header style={{ marginBottom: "2rem" }}>
        <p
          style={{
            textTransform: "uppercase",
            fontSize: "0.72rem",
            letterSpacing: "0.12em",
            color: "#c8f07a",
            marginBottom: "0.75rem",
          }}
        >
          Question {step} of 5
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 600, lineHeight: 1.2, marginBottom: "0.5rem" }}>
          {step === 1 && "What are you building?"}
          {step === 2 && "What's your stack?"}
          {step === 3 && "Do you have a design system?"}
          {step === 4 && "How comfortable are you with code?"}
          {step === 5 && "How should Claude talk to you?"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem" }}>
          {step === 1 && "Tell me about your product. Pick a type to start, or skip the chips and describe your own."}
          {step === 2 && "Pick everything that applies."}
          {step === 3 && "One choice — we can refine later."}
          {step === 4 && "Shapes how much explanation you get."}
          {step === 5 && "Last one — then I&apos;ll generate your CLAUDE.md."}
        </p>
      </header>

      <section style={CARD}>
        {step === 1 && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {PRODUCT_TYPES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => update("product_type", p)}
                  style={chipStyle(a.product_type === p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "rgba(255,255,255,0.65)", marginBottom: "0.5rem" }}>
              Describe it (this is what matters most)
            </label>
            <textarea
              value={a.product_description}
              onChange={(e) => update("product_description", e.target.value)}
              placeholder="A calm Pomodoro timer for indie designers who work late at night."
              rows={3}
              style={{
                width: "100%",
                background: "#0F0F10",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "0.75rem",
                color: "#fff",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {STACK_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleStack(s)}
                style={chipStyle(a.tech_stack.includes(s))}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {DESIGN_SYSTEMS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => update("design_system", d)}
                style={chipStyle(a.design_system === d)}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {EXPERIENCE_LEVELS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => update("experience_level", opt.key)}
                style={{
                  textAlign: "left",
                  padding: "1rem 1.25rem",
                  borderRadius: 10,
                  border:
                    a.experience_level === opt.key
                      ? "1px solid #c8f07a"
                      : "1px solid rgba(255,255,255,0.12)",
                  background:
                    a.experience_level === opt.key ? "rgba(200,240,122,0.08)" : "transparent",
                  cursor: "pointer",
                  color: "#fff",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{opt.title}</div>
                <div style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.6)" }}>{opt.subtitle}</div>
              </button>
            ))}
          </div>
        )}

        {step === 5 && (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => update("tone_preference", opt.key)}
                style={{
                  textAlign: "left",
                  padding: "1rem 1.25rem",
                  borderRadius: 10,
                  border:
                    a.tone_preference === opt.key
                      ? "1px solid #c8f07a"
                      : "1px solid rgba(255,255,255,0.12)",
                  background:
                    a.tone_preference === opt.key ? "rgba(200,240,122,0.08)" : "transparent",
                  cursor: "pointer",
                  color: "#fff",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{opt.title}</div>
                <div style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.6)" }}>{opt.subtitle}</div>
              </button>
            ))}
          </div>
        )}
      </section>

      {error ? (
        <p style={{ color: "#ff8080", marginBottom: "1rem", fontSize: "0.9rem" }}>
          Something went wrong — {error}. Try again.
        </p>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
          disabled={step === 1}
          style={{
            background: "transparent",
            border: "none",
            color: step === 1 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.7)",
            cursor: step === 1 ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            fontFamily: "inherit",
          }}
        >
          ← Back
        </button>
        {step < 5 ? (
          <button
            type="button"
            onClick={() => canAdvance && setStep((s) => (s + 1) as Step)}
            disabled={!canAdvance}
            style={{
              background: canAdvance ? "#c8f07a" : "rgba(255,255,255,0.1)",
              color: canAdvance ? "#0F0F10" : "rgba(255,255,255,0.4)",
              border: "none",
              borderRadius: 8,
              padding: "0.7rem 1.25rem",
              fontWeight: 600,
              cursor: canAdvance ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              fontSize: "0.95rem",
            }}
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canAdvance || busy}
            style={{
              background: canAdvance && !busy ? "#c8f07a" : "rgba(255,255,255,0.1)",
              color: canAdvance && !busy ? "#0F0F10" : "rgba(255,255,255,0.4)",
              border: "none",
              borderRadius: 8,
              padding: "0.7rem 1.25rem",
              fontWeight: 600,
              cursor: canAdvance && !busy ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              fontSize: "0.95rem",
            }}
          >
            {busy ? "Generating…" : "Generate my CLAUDE.md →"}
          </button>
        )}
      </div>
    </div>
  );
}
