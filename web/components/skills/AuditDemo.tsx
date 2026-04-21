"use client";

import { useState } from "react";

type TabKey = "color" | "accessibility" | "form";

const TABS: Array<{ key: TabKey; label: string; tool: string }> = [
  { key: "color", label: "Color", tool: "color-specialist" },
  { key: "accessibility", label: "Accessibility", tool: "accessibility-specialist" },
  { key: "form", label: "Form", tool: "form-designer" },
];

export function AuditDemo() {
  const [tab, setTab] = useState<TabKey>("color");

  return (
    <section className="dwc-demo">
      <div className="dwc-demo-inner">
        <p className="dwc-demo-eyebrow">What dwc returns</p>
        <h2 className="dwc-demo-title">Real audit output. Not LLM mood-board.</h2>
        <p className="dwc-demo-sub">
          Every finding below is computed server-side — ratios, parse results,
          structural checks. Claude reads them and explains them to you in
          plain language. No hallucinated numbers.
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

function ColorPanel() {
  return (
    <div className="dwc-demo-body">
      <p className="dwc-demo-line-note">
        Parsed 7 color tokens from your <code>themes.css</code>. Contrast computed against <code>#FFFFFF</code> and <code>#121212</code>.
      </p>
      <table className="dwc-demo-matrix">
        <thead>
          <tr>
            <th>Token</th>
            <th>Hex</th>
            <th>on #FFFFFF</th>
            <th>on #121212</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--color-primary</code></td>
            <td><span className="swatch" style={{ background: "#1F3B90" }} />#1F3B90</td>
            <td className="ok">10.06:1 · AA body ✓</td>
            <td className="warn">2.09:1 · AA body ✗</td>
          </tr>
          <tr>
            <td><code>--color-accent</code></td>
            <td><span className="swatch" style={{ background: "#00B7BD" }} />#00B7BD</td>
            <td className="fail">2.47:1 · AA body ✗ · AA large/UI ✗</td>
            <td className="ok">8.48:1 · AA body ✓</td>
          </tr>
          <tr>
            <td><code>--color-text</code></td>
            <td><span className="swatch" style={{ background: "#231F20" }} />#231F20</td>
            <td className="ok">14.91:1 · AAA ✓</td>
            <td className="warn">1.41:1 · body ✗</td>
          </tr>
        </tbody>
      </table>
      <div className="dwc-demo-findings">
        <p className="dwc-demo-finding fail">
          <span className="dwc-demo-finding-mark">✗</span>
          <code>--color-accent</code> (#00B7BD) on <code>#FFFFFF</code> → 2.47:1 — unsafe for any text or non-text UI role.
        </p>
        <p className="dwc-demo-finding warn">
          <span className="dwc-demo-finding-mark">⚠</span>
          Mandated accent <code>#1F3B90</code> is present. Confirmed.
        </p>
      </div>
    </div>
  );
}

function AccessibilityPanel() {
  return (
    <div className="dwc-demo-body">
      <p className="dwc-demo-line-note">
        Parsed 248 chars of JSX. Flagged 3 errors, 2 warnings, 1 info.
      </p>
      <div className="dwc-demo-findings">
        <p className="dwc-demo-finding fail">
          <span className="dwc-demo-finding-mark">✗</span>
          <code>&lt;img src=&quot;hero.png&quot;&gt;</code> — no alt attribute. Screen readers announce the filename.
        </p>
        <p className="dwc-demo-finding fail">
          <span className="dwc-demo-finding-mark">✗</span>
          <code>&lt;input type=&quot;email&quot;&gt;</code> — no accessible label. Needs <code>&lt;label for=id&gt;</code>, wrapping <code>&lt;label&gt;</code>, <code>aria-label</code>, or <code>aria-labelledby</code>.
        </p>
        <p className="dwc-demo-finding fail">
          <span className="dwc-demo-finding-mark">✗</span>
          <code>&lt;button&gt;&lt;/button&gt;</code> — no text content, no aria-label. Screen readers announce it as an unnamed button.
        </p>
        <p className="dwc-demo-finding warn">
          <span className="dwc-demo-finding-mark">⚠</span>
          Heading level skipped: <code>h1</code> → <code>h3</code>. Screen readers rely on a linear ladder.
        </p>
        <p className="dwc-demo-finding warn">
          <span className="dwc-demo-finding-mark">⚠</span>
          No <code>&lt;main&gt;</code> landmark. Screen-reader users rely on it to jump past the nav.
        </p>
        <p className="dwc-demo-finding info">
          <span className="dwc-demo-finding-mark">·</span>
          No skip-to-content link detected — keyboard users tab through the nav on every page.
        </p>
      </div>
    </div>
  );
}

function FormPanel() {
  return (
    <div className="dwc-demo-body">
      <p className="dwc-demo-line-note">
        Parsed a signup form. Flagged 2 errors, 2 warnings, 1 info note.
      </p>
      <div className="dwc-demo-findings">
        <p className="dwc-demo-finding fail">
          <span className="dwc-demo-finding-mark">✗</span>
          <code>aria-describedby</code> — <code>#email-error</code> exists but no input references it. Screen readers won&apos;t announce the hint with the field.
        </p>
        <p className="dwc-demo-finding warn">
          <span className="dwc-demo-finding-mark">⚠</span>
          2 label(s) contain a <code>*</code> asterisk, but no input has a <code>required</code> attribute. Screen readers don&apos;t hear the asterisk.
        </p>
        <p className="dwc-demo-finding warn">
          <span className="dwc-demo-finding-mark">⚠</span>
          Radio group <code>color</code> not wrapped in <code>&lt;fieldset&gt;&lt;legend&gt;</code>. Screen readers won&apos;t announce the group label with each option.
        </p>
        <p className="dwc-demo-finding warn">
          <span className="dwc-demo-finding-mark">⚠</span>
          2 submit controls in one <code>&lt;form&gt;</code>, both without a <code>name</code> attribute. Server can&apos;t tell which was pressed.
        </p>
        <p className="dwc-demo-finding info">
          <span className="dwc-demo-finding-mark">·</span>
          Password field detected with no reveal toggle — consider a show/hide button with <code>aria-pressed</code>.
        </p>
      </div>
    </div>
  );
}
