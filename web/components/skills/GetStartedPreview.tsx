import { EmailGate } from "@/components/skills/EmailGate";

export function GetStartedPreview() {
  return (
    <div className="gs">
      <section className="gs-hero">
        <p className="gs-hero-eyebrow">Free during alpha · no card needed</p>
        <h1 className="gs-hero-title">
          dwic is a <em>senior designer</em> inside your terminal
        </h1>
        <p className="gs-hero-sub">
          It knows your design system and your design choices. It catches
          changes before they ship and keeps your system healthy.
        </p>
        <div id="install" className="gs-hero-form">
          <EmailGate />
        </div>
        <div className="gs-hero-trust">
          <span>No credit card</span>
          <span aria-hidden="true">·</span>
          <span>We never see your files</span>
          <span aria-hidden="true">·</span>
          <span>Cancel any time</span>
        </div>
      </section>

      <section className="gs-flow" aria-label="How dwic works after you sign up">
        {/* Step 1 — Install */}
        <article className="gs-step">
          <div className="gs-step-copy">
            <span className="gs-step-num">01</span>
            <h2 className="gs-step-title">Install in one command</h2>
            <p className="gs-step-body">
              Check your inbox for a setup link, then paste the line it gives
              you into your terminal. That hooks dwic into Claude Code so
              it&apos;s ready whenever you open the project. No extra apps, no
              logins, it just shows up.
            </p>
            <ul className="gs-step-meta">
              <li>Takes a few seconds, like installing any tool</li>
              <li>Easy to remove later if you change your mind</li>
            </ul>
          </div>
          <div className="gs-step-visual">
            <div className="gs-mock gs-mock-terminal" role="img" aria-label="Terminal showing successful dwic install">
              <div className="gs-mock-term-bar">
                <span className="gs-mock-dot gs-mock-dot-r" aria-hidden="true" />
                <span className="gs-mock-dot gs-mock-dot-y" aria-hidden="true" />
                <span className="gs-mock-dot gs-mock-dot-g" aria-hidden="true" />
                <span className="gs-mock-term-title">~/your-project</span>
              </div>
              <div className="gs-mock-term-body">
                <div className="gs-mock-term-line">
                  <span className="gs-mock-tok-prompt">$</span>
                  <span>npx @imrandwc/dwic setup --token=imr_AbC123dEfG</span>
                </div>
                <div className="gs-mock-term-line gs-mock-term-out">
                  <span className="gs-mock-tok-ok">✓</span> Detected Claude Code (mcp add-json)
                </div>
                <div className="gs-mock-term-line gs-mock-term-out">
                  <span className="gs-mock-tok-ok">✓</span> Wrote <span className="gs-mock-tok-path">.mcp.json</span> in this project
                </div>
                <div className="gs-mock-term-line gs-mock-term-out">
                  <span className="gs-mock-tok-ok">✓</span> Token validated · free tier 10 calls
                </div>
                <div className="gs-mock-term-line gs-mock-term-out gs-mock-term-hint">
                  Open Claude Code in this folder. dwic is wired in.
                </div>
                <div className="gs-mock-term-line">
                  <span className="gs-mock-tok-prompt">$</span>
                  <span className="gs-mock-term-cursor" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Step 2 — dwic learns */}
        <article className="gs-step gs-step-flip">
          <div className="gs-step-copy">
            <span className="gs-step-num">02</span>
            <h2 className="gs-step-title">dwic gets to know your project</h2>
            <p className="gs-step-body">
              The first time you ask it for help, dwic takes a look at your
              project and figures out what you&apos;re using: your colours,
              fonts, spacing, the lot. It only asks you what it genuinely
              can&apos;t see for itself.
            </p>
            <ul className="gs-step-meta">
              <li>Looks at your project on your computer. Nothing leaves it</li>
              <li>Usually just one or two questions, not a long form</li>
            </ul>
          </div>
          <div className="gs-step-visual">
            <div className="gs-mock gs-mock-detect" role="img" aria-label="Sample auto-detection summary">
              <div className="gs-mock-detect-head">
                <span className="gs-mock-detect-tag">dwic detected</span>
                <span className="gs-mock-detect-conf">high confidence</span>
              </div>
              <dl className="gs-mock-detect-list">
                <div>
                  <dt>Framework</dt>
                  <dd>Next.js 15 (App Router)</dd>
                </div>
                <div>
                  <dt>Styling</dt>
                  <dd>Tailwind CSS v4 + CSS tokens</dd>
                </div>
                <div>
                  <dt>Tokens found</dt>
                  <dd>
                    <code>--color-*</code> · <code>--space-*</code> ·{" "}
                    <code>--font-*</code>
                  </dd>
                </div>
                <div>
                  <dt>Mandated accent</dt>
                  <dd className="gs-mock-detect-swatch">
                    <span style={{ background: "#1F3B90" }} aria-hidden="true" />
                    #1F3B90
                  </dd>
                </div>
              </dl>
              <p className="gs-mock-detect-ask">
                One question left: <em>What should I prioritise, accessibility
                or aesthetic consistency?</em>
              </p>
            </div>
          </div>
        </article>

        {/* Step 3 — Drift */}
        <article className="gs-step">
          <div className="gs-step-copy">
            <span className="gs-step-num">03</span>
            <h2 className="gs-step-title">It spots changes before they ship</h2>
            <p className="gs-step-body">
              dwic remembers what your design looked like last time. If a
              colour goes off, a font drifts, or something breaks
              accessibility, it tells you straight away, like a careful
              second pair of eyes.
            </p>
            <ul className="gs-step-meta">
              <li>Catches things that are easy to miss in review</li>
              <li>Only flags real changes. Won&apos;t bug you about noise</li>
            </ul>
          </div>
          <div className="gs-step-visual">
            <div className="gs-mock gs-mock-drift" role="img" aria-label="Sample drift dashboard">
              <div className="gs-mock-drift-head">
                <span className="gs-mock-drift-tag">dwic audit · drift since last run</span>
              </div>
              <ul className="gs-mock-drift-rows">
                <li>
                  <span className="gs-mock-drift-cat">Color</span>
                  <span className="gs-mock-drift-up">↑ 1 new</span>
                  <span className="gs-mock-drift-err">1 error</span>
                  <span className="gs-mock-drift-flat">→ 4 unchanged</span>
                </li>
                <li>
                  <span className="gs-mock-drift-cat">Typography</span>
                  <span className="gs-mock-drift-flat">→ 6 unchanged</span>
                </li>
                <li>
                  <span className="gs-mock-drift-cat">Spacing</span>
                  <span className="gs-mock-drift-down">↓ 2 resolved</span>
                  <span className="gs-mock-drift-flat">→ 8 unchanged</span>
                </li>
                <li>
                  <span className="gs-mock-drift-cat">Accessibility</span>
                  <span className="gs-mock-drift-flat">→ 12 unchanged</span>
                </li>
              </ul>
              <p className="gs-mock-drift-foot">
                Headline action: <strong>color-specialist</strong>. Mandated
                accent missing on one surface.
              </p>
            </div>
          </div>
        </article>

        {/* Step 4 — Maintenance */}
        <article className="gs-step gs-step-flip">
          <div className="gs-step-copy">
            <span className="gs-step-num">04</span>
            <h2 className="gs-step-title">Keeps your system healthy over time</h2>
            <p className="gs-step-body">
              Design systems get messy if no one tends to them. dwic checks
              in regularly, tracks how things are holding up, and tells you
              what&apos;s worth tidying first. Like having a maintenance plan
              you don&apos;t have to remember.
            </p>
            <ul className="gs-step-meta">
              <li>A weekly health summary, in plain language</li>
              <li>One clear suggestion at a time, not a giant to-do list</li>
            </ul>
          </div>
          <div className="gs-step-visual">
            <div className="gs-mock gs-mock-health" role="img" aria-label="Sample weekly health summary">
              <div className="gs-mock-health-head">
                <span className="gs-mock-health-tag">This week · design-system health</span>
                <span className="gs-mock-health-score">82<small>/100</small></span>
              </div>
              <div className="gs-mock-health-stats">
                <div>
                  <span className="gs-mock-health-num">3</span>
                  <span className="gs-mock-health-label">drifts caught</span>
                </div>
                <div>
                  <span className="gs-mock-health-num">2</span>
                  <span className="gs-mock-health-label">patterns tidied</span>
                </div>
                <div>
                  <span className="gs-mock-health-num">42</span>
                  <span className="gs-mock-health-label">tokens in use</span>
                </div>
              </div>
              <div className="gs-mock-health-suggest">
                <span className="gs-mock-health-suggest-label">Worth tidying next</span>
                <p>
                  Button corner-radius is set to <strong>4 different values</strong>
                  across the app. Want me to suggest a single value?
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="gs-outro" aria-labelledby="gs-outro-title">
        <div className="gs-outro-inner">
          <p className="gs-outro-eyebrow">Ready when you are</p>
          <h2 id="gs-outro-title" className="gs-outro-title">
            Bring a senior designer into your terminal
          </h2>
          <p className="gs-outro-sub">
            Drop your email and we&apos;ll send the setup link. Free during
            alpha. Ten goes to try it out, no card needed.
          </p>
          <div className="gs-outro-form">
            <EmailGate />
          </div>
          <p className="gs-outro-fine">
            We never see your files or your code · One click to unsubscribe
          </p>
        </div>
      </section>
    </div>
  );
}
