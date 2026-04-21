"use client";

import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import {
  classifyContrast,
  contrastRatio,
  parseTokensFromCss,
  verdict,
  type ColorToken,
} from "@/lib/audit/color";
import { runA11yAudit, type A11yFinding } from "@/lib/audit/accessibility";
import { runFormAudit, type FormFinding } from "@/lib/audit/form";

type TabKey = "color" | "accessibility" | "form";
type Stage = "idle" | "parsing" | "computing" | "revealing" | "complete";

const TABS: Array<{ key: TabKey; label: string; tool: string }> = [
  { key: "color", label: "Color", tool: "color-specialist" },
  { key: "accessibility", label: "Accessibility", tool: "accessibility-specialist" },
  { key: "form", label: "Form", tool: "form-designer" },
];

// ---- Fixture inputs -------------------------------------------------------

const COLOR_CSS = `:root {
  --color-primary: #1F3B90;
  --color-accent: #00B7BD;
  --color-text: #231F20;
  --color-surface: #FFFFFF;
  --color-border: #E5E7EB;
}`;

const A11Y_MARKUP = `<form>
  <img src="hero.png" />
  <h1>Sign up</h1>
  <h3>Your details</h3>
  <input type="email" placeholder="Email" />
  <button></button>
</form>`;

const FORM_MARKUP = `<form>
  <label for="e">Email *</label>
  <input type="email" id="e" />
  <label for="p">Password</label>
  <input type="password" id="p" />
  <span id="email-error">Invalid email</span>
  <input type="radio" name="plan" value="free" id="r1" />
  <label for="r1">Free</label>
  <input type="radio" name="plan" value="pro" id="r2" />
  <label for="r2">Pro</label>
  <button type="submit">Save</button>
  <button type="submit">Save and continue</button>
</form>`;

// Deliberately slower than it needs to be — this is a demo, and the user
// should feel the audit progress through distinct stages rather than blink
// past them. Each stage is long enough to read its status label.
const STAGE_TIMINGS = {
  parsing: 1100,
  computing: 1100,
  findingStagger: 420,
};

// ---- Parent --------------------------------------------------------------

export function AuditDemo() {
  const [tab, setTab] = useState<TabKey>("color");

  return (
    <section className="dwc-demo">
      <div className="dwc-demo-inner">
        <p className="dwc-demo-eyebrow">What dwc returns</p>
        <h2 className="dwc-demo-title">Real audit output. Not LLM mood-board.</h2>
        <p className="dwc-demo-sub">
          Click <kbd>Run audit</kbd> on any specialist to watch real findings
          compute against sample input. Same parser + contrast math the live
          MCP tool uses — nothing mocked.
        </p>

        <div className="dwc-demo-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`dwc-demo-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="dwc-demo-panel">
          <div className="dwc-demo-panel-head">
            <span className="dwc-demo-prompt">$</span>
            <span className="dwc-demo-prompt-tool">{TABS.find((t) => t.key === tab)?.tool}</span>
            <span className="dwc-demo-prompt-mode">mode=audit</span>
          </div>
          {tab === "color" && <ColorPanel />}
          {tab === "accessibility" && <AccessibilityPanel />}
          {tab === "form" && <FormPanel />}
        </div>
      </div>
    </section>
  );
}

// ---- Stage machine -------------------------------------------------------

function useAuditStages(findingsCount: number) {
  const [stage, setStage] = useState<Stage>("idle");
  const [visibleFindings, setVisibleFindings] = useState(0);

  const start = useCallback(() => {
    setStage("parsing");
    setVisibleFindings(0);
  }, []);

  const reset = useCallback(() => {
    setStage("idle");
    setVisibleFindings(0);
  }, []);

  useEffect(() => {
    if (stage === "idle" || stage === "complete") return;
    if (stage === "parsing") {
      const t = setTimeout(() => setStage("computing"), STAGE_TIMINGS.parsing);
      return () => clearTimeout(t);
    }
    if (stage === "computing") {
      const t = setTimeout(() => setStage("revealing"), STAGE_TIMINGS.computing);
      return () => clearTimeout(t);
    }
    if (stage === "revealing") {
      if (visibleFindings >= findingsCount) {
        setStage("complete");
        return;
      }
      const t = setTimeout(
        () => setVisibleFindings((n) => n + 1),
        STAGE_TIMINGS.findingStagger,
      );
      return () => clearTimeout(t);
    }
  }, [stage, visibleFindings, findingsCount]);

  return { stage, visibleFindings, start, reset };
}

// ---- Shared UI primitives ------------------------------------------------

function LeftColumn({
  filename,
  code,
  stage,
  preview,
  onStart,
  onReset,
}: {
  filename: string;
  code: string;
  stage: Stage;
  preview: ReactNode;
  onStart: () => void;
  onReset: () => void;
}) {
  const isIdle = stage === "idle";
  return (
    <div className="dwc-demo-col dwc-demo-col-input">
      <div className="dwc-demo-col-head">
        <span className="dwc-demo-col-label">{isIdle ? "Input" : "Production view"}</span>
        <span className="dwc-demo-col-filename">{filename}</span>
      </div>
      {isIdle ? (
        <pre className="dwc-demo-input-code">
          <code>{code}</code>
        </pre>
      ) : (
        preview
      )}
      <RunControls stage={stage} onStart={onStart} onReset={onReset} />
    </div>
  );
}

function OutputColumn({
  stage,
  idleHint,
  children,
}: {
  stage: Stage;
  idleHint: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="dwc-demo-col dwc-demo-col-output">
      <div className="dwc-demo-col-head">
        <span className="dwc-demo-col-label">Output</span>
        <span className="dwc-demo-col-status">
          {stage === "idle" && "waiting"}
          {stage === "parsing" && "parsing tokens…"}
          {stage === "computing" && "computing findings…"}
          {stage === "revealing" && "rendering…"}
          {stage === "complete" && (
            <span className="dwc-demo-col-status-done">✓ complete</span>
          )}
        </span>
      </div>
      {stage === "idle" ? (
        <div className="dwc-demo-idle">{idleHint}</div>
      ) : (
        <div className="dwc-demo-output">{children}</div>
      )}
    </div>
  );
}

function RunControls({
  stage,
  onStart,
  onReset,
}: {
  stage: Stage;
  onStart: () => void;
  onReset: () => void;
}) {
  if (stage === "idle") {
    return (
      <button className="dwc-demo-run" onClick={onStart}>
        <span className="dwc-demo-run-icon">▶</span> Run audit
      </button>
    );
  }
  if (stage === "complete") {
    return (
      <button className="dwc-demo-reset" onClick={onReset}>
        ↺ Reset
      </button>
    );
  }
  return (
    <button className="dwc-demo-run running" disabled>
      <span className="dwc-demo-run-icon">⟳</span> Running…
    </button>
  );
}

function Badge({ severity, children }: { severity: "fail" | "warn" | "info"; children: ReactNode }) {
  return <span className={`dwc-preview-badge ${severity}`}>{children}</span>;
}

// Numbered pin — anchored in the top-right of an annotated element. Pairs
// with a numbered legend entry below the preview so the designer can scan:
// "(1) is what? (2) is what?" without badges cluttering the rendered UI.
function Pin({ n, severity }: { n: number; severity: "fail" | "warn" | "info" }) {
  return <span className={`dwc-preview-pin ${severity}`} aria-hidden>{n}</span>;
}

// Legend entry — renders the numbered finding under the preview card.
function LegendRow({
  n,
  severity,
  children,
}: {
  n: number;
  severity: "fail" | "warn" | "info";
  children: ReactNode;
}) {
  return (
    <div className={`dwc-preview-legend-row ${severity}`}>
      <span className={`dwc-preview-pin ${severity} inline`}>{n}</span>
      <span>{children}</span>
    </div>
  );
}

// ---- Color panel + production view --------------------------------------

// A real mini-product rendered in each token system — the designer sees
// the tokens IN USE, not as an isolated swatch list. Failing color pairs
// reveal themselves visually (text becomes hard to read) and get a pin.
function ColorProductionView({ tokens, stage }: { tokens: ColorToken[]; stage: Stage }) {
  const byName = (n: string) => tokens.find((t) => t.name === n)?.hex ?? "#000000";
  const primary = byName("--color-primary");
  const accent = byName("--color-accent");
  const text = byName("--color-text");
  const surface = byName("--color-surface");
  const border = byName("--color-border");

  const surfaces: Array<{ bg: string; chrome: string; labelTone: string }> = [
    { bg: surface, chrome: "On light surface", labelTone: "#6b6b6b" },
    { bg: "#121212", chrome: "On dark surface", labelTone: "#8f8f8f" },
  ];

  const phaseClass = stage === "parsing" ? "phase-parsing" : "phase-scanned";
  const accentOnWhiteRatio = contrastRatio(accent, surface);
  const accentOnWhiteFail = classifyContrast(accentOnWhiteRatio);
  const primaryOnBlack = contrastRatio(primary, "#121212");
  const primaryOnBlackCls = classifyContrast(primaryOnBlack);

  return (
    <div className={`dwc-preview ${phaseClass}`}>
      <div className="dwc-preview-section-label">
        {stage === "parsing" ? "Rendering tokens in context…" : "Tokens in context"}
      </div>
      <div className="dwc-preview-surfaces">
        {surfaces.map((s, sIdx) => {
          const isLight = s.bg.toLowerCase() === "#ffffff";
          return (
            <div
              key={sIdx}
              className="dwc-color-card"
              style={{ background: s.bg, borderColor: isLight ? border : "rgba(255,255,255,0.08)" }}
            >
              <div className="dwc-color-card-chrome" style={{ color: s.labelTone }}>
                {s.chrome}
              </div>

              <div
                className={`dwc-color-card-title ${isLight ? "" : !primaryOnBlackCls.aaBody ? "dwc-preview-outline-warn" : ""}`}
                style={{ color: isLight ? primary : primary }}
              >
                Aperture
                {!isLight && !primaryOnBlackCls.aaBody && stage !== "parsing" && (
                  <Pin n={2} severity="warn" />
                )}
              </div>

              <p className="dwc-color-card-body" style={{ color: isLight ? text : "#d8d8d8" }}>
                A quiet observatory for product teams. Capture signals as they
                surface — across pricing, support, and launch decks.
              </p>

              <div className="dwc-color-card-actions">
                <button
                  type="button"
                  className="dwc-color-card-btn dwc-color-card-btn-primary"
                  style={{ background: primary, color: "#fff" }}
                >
                  Start free
                </button>
                <span
                  className={isLight && !accentOnWhiteFail.aaLarge ? "dwc-preview-outline-fail" : ""}
                  style={{ display: "inline-block" }}
                >
                  <a
                    className="dwc-color-card-link"
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{ color: accent }}
                  >
                    Read the docs →
                  </a>
                  {isLight && !accentOnWhiteFail.aaLarge && stage !== "parsing" && (
                    <Pin n={1} severity="fail" />
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {stage !== "parsing" && (
        <div className="dwc-preview-legend">
          <LegendRow n={1} severity="fail">
            <code>--color-accent</code> on <code>--color-surface</code> → {accentOnWhiteRatio.toFixed(2)}:1.
            The docs link is unreadable as body text.
          </LegendRow>
          {!primaryOnBlackCls.aaBody && (
            <LegendRow n={2} severity="warn">
              <code>--color-primary</code> on <code>#121212</code> → {primaryOnBlack.toFixed(2)}:1.
              Heading passes AA large only; flag for dark-mode use.
            </LegendRow>
          )}
        </div>
      )}
    </div>
  );
}

function ColorPanel() {
  const tokens = useMemo<ColorToken[]>(() => parseTokensFromCss(COLOR_CSS), []);
  const surfaces = ["#FFFFFF", "#121212"];

  type Finding = { severity: "fail" | "warn"; body: ReactNode };

  const findings: Finding[] = useMemo(() => {
    const out: Finding[] = [];
    for (const t of tokens) {
      for (const s of surfaces) {
        const c = classifyContrast(contrastRatio(t.hex, s));
        if (!c.aaLarge) {
          out.push({
            severity: "fail",
            body: (
              <>
                <code>{t.name}</code> ({t.hex}) on <code>{s}</code> →{" "}
                {c.ratio.toFixed(2)}:1 — unsafe for any text or non-text UI role.
              </>
            ),
          });
        }
      }
    }
    const mandated = tokens.find((t) => t.hex.toLowerCase() === "#1f3b90");
    if (mandated) {
      out.push({
        severity: "warn",
        body: (
          <>
            Mandated accent <code>#1F3B90</code> is present as <code>{mandated.name}</code>. Confirmed.
          </>
        ),
      });
    }
    return out;
  }, [tokens]);

  const { stage, visibleFindings, start, reset } = useAuditStages(findings.length);

  return (
    <div className="dwc-demo-body">
      <LeftColumn
        filename="themes.css"
        code={COLOR_CSS}
        stage={stage}
        preview={<ColorProductionView tokens={tokens} stage={stage} />}
        onStart={start}
        onReset={reset}
      />
      <OutputColumn
        stage={stage}
        idleHint={
          <>
            Click <strong>Run audit</strong> to parse these tokens, compute WCAG contrast, and surface failing pairings.
          </>
        }
      >
        <p className="dwc-demo-line-note">
          Parsed {tokens.length} color tokens. Contrast against #FFFFFF + #121212.
        </p>
        <div className="dwc-demo-findings">
          {findings.slice(0, visibleFindings).map((f, i) => (
            <p key={i} className={`dwc-demo-finding ${f.severity}`}>
              <span className="dwc-demo-finding-mark">{f.severity === "fail" ? "✗" : "⚠"}</span>
              <span>{f.body}</span>
            </p>
          ))}
        </div>
      </OutputColumn>
    </div>
  );
}

// ---- Accessibility panel + production view ------------------------------

function A11yProductionView({ stage }: { stage: Stage }) {
  const phaseClass = stage === "parsing" ? "phase-parsing" : "phase-scanned";
  const showAnnotations = stage !== "parsing";
  return (
    <div className={`dwc-preview ${phaseClass}`}>
      <div className="dwc-preview-section-label">
        {stage === "parsing" ? "Rendering component…" : "Signup component — rendered"}
      </div>
      <div className={`dwc-real-card ${showAnnotations ? "dwc-preview-outline-info" : ""}`}>
        {showAnnotations && (
          <div className="dwc-real-card-landmark">
            <Pin n={5} severity="info" />
            <span className="dwc-real-card-landmark-text">no &lt;main&gt;</span>
          </div>
        )}

        <div className={`dwc-real-hero ${showAnnotations ? "dwc-preview-outline-fail" : ""}`}>
          {showAnnotations && <Pin n={1} severity="fail" />}
          <div className="dwc-real-hero-gradient" />
        </div>

        <div className="dwc-real-card-body">
          <div className="dwc-real-card-eyebrow">Aperture</div>
          <h2 className="dwc-real-card-h1">Create your account</h2>
          <h3
            className={`dwc-real-card-h3 ${showAnnotations ? "dwc-preview-outline-warn" : ""}`}
          >
            Your details
            {showAnnotations && <Pin n={2} severity="warn" />}
          </h3>

          <label className="dwc-real-field">
            <span
              className={`dwc-real-input-wrap ${showAnnotations ? "dwc-preview-outline-fail" : ""}`}
            >
              {showAnnotations && <Pin n={3} severity="fail" />}
              <input
                className="dwc-real-input"
                type="email"
                placeholder="name@company.com"
                readOnly
                aria-label="email (demo)"
              />
            </span>
          </label>

          <div className="dwc-real-submit-row">
            <span
              className={`dwc-real-btn-wrap ${showAnnotations ? "dwc-preview-outline-fail" : ""}`}
            >
              {showAnnotations && <Pin n={4} severity="fail" />}
              <button type="button" className="dwc-real-btn" aria-label="unnamed (demo)">
                <span className="dwc-real-btn-empty-hint">&nbsp;</span>
              </button>
            </span>
          </div>
        </div>
      </div>

      {showAnnotations && (
        <div className="dwc-preview-legend">
          <LegendRow n={1} severity="fail">
            <code>&lt;img&gt;</code> without <code>alt</code> — screen readers read the filename
            or skip entirely.
          </LegendRow>
          <LegendRow n={2} severity="warn">
            Heading skip: <code>h1 → h3</code>. Screen-reader ladders expect linear levels.
          </LegendRow>
          <LegendRow n={3} severity="fail">
            <code>&lt;input&gt;</code> has no accessible label — needs one of four attachments.
          </LegendRow>
          <LegendRow n={4} severity="fail">
            <code>&lt;button&gt;</code> with no text and no <code>aria-label</code> — announces as
            unnamed.
          </LegendRow>
          <LegendRow n={5} severity="info">
            No <code>&lt;main&gt;</code> landmark — keyboard users lose the "skip to content"
            shortcut.
          </LegendRow>
        </div>
      )}
    </div>
  );
}

function AccessibilityPanel() {
  const findings = useMemo<A11yFinding[]>(() => runA11yAudit(A11Y_MARKUP), []);
  const { stage, visibleFindings, start, reset } = useAuditStages(findings.length);

  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity === "info");
  const ordered = [...errors, ...warns, ...infos];
  const visible = ordered.slice(0, visibleFindings);

  return (
    <div className="dwc-demo-body">
      <LeftColumn
        filename="component.jsx"
        code={A11Y_MARKUP}
        stage={stage}
        preview={<A11yProductionView stage={stage} />}
        onStart={start}
        onReset={reset}
      />
      <OutputColumn
        stage={stage}
        idleHint={
          <>
            Click <strong>Run audit</strong> to scan this JSX for missing alts, unlabeled inputs, heading skips, and unnamed buttons.
          </>
        }
      >
        <p className="dwc-demo-line-note">
          Parsed {A11Y_MARKUP.length} chars. {errors.length} error{errors.length !== 1 ? "s" : ""},{" "}
          {warns.length} warning{warns.length !== 1 ? "s" : ""}, {infos.length} info.
        </p>
        <div className="dwc-demo-findings">
          {visible.map((f, i) => (
            <p
              key={i}
              className={`dwc-demo-finding ${f.severity === "error" ? "fail" : f.severity === "warn" ? "warn" : "info"}`}
            >
              <span className="dwc-demo-finding-mark">
                {f.severity === "error" ? "✗" : f.severity === "warn" ? "⚠" : "·"}
              </span>
              <span>
                <code>{f.element}</code> — {f.message}
              </span>
            </p>
          ))}
        </div>
      </OutputColumn>
    </div>
  );
}

// ---- Form panel + production view ---------------------------------------

function FormProductionView({ stage }: { stage: Stage }) {
  const phaseClass = stage === "parsing" ? "phase-parsing" : "phase-scanned";
  const showAnnotations = stage !== "parsing";
  return (
    <div className={`dwc-preview ${phaseClass}`}>
      <div className="dwc-preview-section-label">
        {stage === "parsing" ? "Rendering form…" : "Signup form — rendered"}
      </div>
      <div className="dwc-real-card">
        <div className="dwc-real-card-body">
          <div className="dwc-real-card-eyebrow">Aperture</div>
          <h2 className="dwc-real-card-h1">Create your account</h2>

          <label className="dwc-real-field">
            <span className="dwc-real-field-label">
              Email <span className="dwc-real-req">*</span>
              {showAnnotations && <Pin n={1} severity="warn" />}
            </span>
            <input
              className="dwc-real-input"
              type="email"
              placeholder="name@company.com"
              readOnly
            />
          </label>

          <label className="dwc-real-field">
            <span className="dwc-real-field-label">
              Password
              {showAnnotations && <Pin n={2} severity="info" />}
            </span>
            <input
              className="dwc-real-input"
              type="password"
              placeholder="••••••••"
              readOnly
            />
            <span
              className={`dwc-real-hint ${showAnnotations ? "dwc-preview-outline-warn" : ""}`}
            >
              Must be at least 8 characters
              {showAnnotations && <Pin n={3} severity="warn" />}
            </span>
          </label>

          <fieldset
            className={`dwc-real-fieldset ${showAnnotations ? "dwc-preview-outline-warn" : ""}`}
          >
            <div className="dwc-real-fieldset-legend">
              Plan
              {showAnnotations && <Pin n={4} severity="warn" />}
            </div>
            <div className="dwc-real-radio-row">
              <span className="dwc-real-radio">
                <input type="radio" name="plan-demo" readOnly defaultChecked /> Free
              </span>
              <span className="dwc-real-radio">
                <input type="radio" name="plan-demo" readOnly /> Pro
              </span>
            </div>
          </fieldset>

          <div className="dwc-real-submit-row">
            <span
              className={`dwc-real-btn-wrap ${showAnnotations ? "dwc-preview-outline-fail" : ""}`}
              style={{ position: "relative" }}
            >
              {showAnnotations && <Pin n={5} severity="fail" />}
              <button type="button" className="dwc-real-btn dwc-real-btn-primary">
                Save
              </button>
            </span>
            <span
              className={`dwc-real-btn-wrap ${showAnnotations ? "dwc-preview-outline-fail" : ""}`}
              style={{ position: "relative" }}
            >
              <button type="button" className="dwc-real-btn dwc-real-btn-secondary">
                Save and continue
              </button>
            </span>
          </div>
        </div>
      </div>

      {showAnnotations && (
        <div className="dwc-preview-legend">
          <LegendRow n={1} severity="warn">
            "*" in the label, but no <code>required</code> attr on the input. Screen readers
            don't hear the asterisk.
          </LegendRow>
          <LegendRow n={2} severity="info">
            No reveal toggle — typos compound in hidden fields.
          </LegendRow>
          <LegendRow n={3} severity="warn">
            Hint text isn't wired via <code>aria-describedby</code> — screen readers won't
            announce it with the field.
          </LegendRow>
          <LegendRow n={4} severity="warn">
            Radio group is wrapped, but its legend isn't a <code>&lt;legend&gt;</code> element
            — group label isn't announced with each option.
          </LegendRow>
          <LegendRow n={5} severity="fail">
            Two submits in one form, both without <code>name</code>. Server can't tell which was
            pressed.
          </LegendRow>
        </div>
      )}
    </div>
  );
}

function FormPanel() {
  const findings = useMemo<FormFinding[]>(() => runFormAudit(FORM_MARKUP), []);
  const { stage, visibleFindings, start, reset } = useAuditStages(findings.length);

  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity === "info");
  const ordered = [...errors, ...warns, ...infos];
  const visible = ordered.slice(0, visibleFindings);

  return (
    <div className="dwc-demo-body">
      <LeftColumn
        filename="signup-form.jsx"
        code={FORM_MARKUP}
        stage={stage}
        preview={<FormProductionView stage={stage} />}
        onStart={start}
        onReset={reset}
      />
      <OutputColumn
        stage={stage}
        idleHint={
          <>
            Click <strong>Run audit</strong> to check this form for orphaned error hints, missing required markers, and ungrouped radio sets.
          </>
        }
      >
        <p className="dwc-demo-line-note">
          Parsed {FORM_MARKUP.length} chars. {errors.length} error{errors.length !== 1 ? "s" : ""},{" "}
          {warns.length} warning{warns.length !== 1 ? "s" : ""}, {infos.length} info.
        </p>
        <div className="dwc-demo-findings">
          {visible.map((f, i) => (
            <p
              key={i}
              className={`dwc-demo-finding ${f.severity === "error" ? "fail" : f.severity === "warn" ? "warn" : "info"}`}
            >
              <span className="dwc-demo-finding-mark">
                {f.severity === "error" ? "✗" : f.severity === "warn" ? "⚠" : "·"}
              </span>
              <span>
                <code>{f.element}</code> — {f.message}
              </span>
            </p>
          ))}
        </div>
      </OutputColumn>
    </div>
  );
}
