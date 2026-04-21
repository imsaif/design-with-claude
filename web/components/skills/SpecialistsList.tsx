interface Specialist {
  name: string;
  tagline: string;
  audits: string;
}

const SPECIALISTS: Specialist[] = [
  {
    name: "color-specialist",
    tagline: "Contrast, accent drift, ramp coverage.",
    audits: "Parses CSS color tokens, computes WCAG contrast against surfaces you name, pins the mandated accent, flags structural gaps.",
  },
  {
    name: "typography-specialist",
    tagline: "Legibility floors, hierarchy integrity.",
    audits: "Parses font-size / line-height / weight tokens. Flags sub-12px minimums, body line-height outside 1.4–1.8, weight gaps, missing roles, mandated-font drift.",
  },
  {
    name: "spacing-specialist",
    tagline: "Rhythm, base-unit honesty.",
    audits: "Parses spacing tokens, infers base unit via GCD, flags off-grid values, oversized step-jumps, missing common steps.",
  },
  {
    name: "design-system-architect",
    tagline: "Structure, layering, theming.",
    audits: "Parses ALL token declarations. Splits primitive vs semantic, detects dark-scope theming, flags naming inconsistencies, broken var() references.",
  },
  {
    name: "accessibility-specialist",
    tagline: "WCAG 2.1 AA, screen-reader posture.",
    audits: "Parses HTML/JSX for missing alts, unlabeled inputs, heading skips, anchor-as-button patterns, unnamed buttons, missing landmarks, skip links. Optional server-computed color-pair contrast.",
  },
  {
    name: "form-designer",
    tagline: "Submit integrity, field a11y.",
    audits: "Parses form markup for inputs outside <form>, implicit types, required marker honesty, orphaned error hints, ungrouped radio/checkbox, multi-submit ambiguity.",
  },
  {
    name: "navigation-specialist",
    tagline: "Wayfinding, landmark labels.",
    audits: "Parses nav markup for unlabeled multiple navs, active-class-without-aria-current, missing skip links, deep nesting, large navs without disclosure.",
  },
];

export function SpecialistsList() {
  return (
    <section className="dwc-specialists">
      <div className="dwc-specialists-inner">
        <p className="dwc-specialists-eyebrow">Specialists</p>
        <h2 className="dwc-specialists-title">Seven auditors. Each one server-computed.</h2>
        <p className="dwc-specialists-sub">
          More rolling out in batches — copy, motion, empty-states, notifications
          next. Every specialist also has a generate mode for net-new work.
        </p>

        <ul className="dwc-specialists-list">
          {SPECIALISTS.map((s) => (
            <li key={s.name} className="dwc-specialist">
              <div className="dwc-specialist-head">
                <code className="dwc-specialist-name">{s.name}</code>
                <span className="dwc-specialist-tagline">{s.tagline}</span>
              </div>
              <p className="dwc-specialist-body">{s.audits}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
