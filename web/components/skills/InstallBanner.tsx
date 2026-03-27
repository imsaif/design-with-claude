export function InstallBanner() {
  return (
    <section id="install" className="skills-install">
      <div className="skills-install-inner">
        <h2 className="skills-install-title">How to install a skill</h2>
        <div className="skills-install-steps">
          <div className="skills-install-step">
            <div className="skills-install-step-num">Step 1</div>
            <div className="skills-install-step-title">
              Copy the install command
            </div>
            <div className="skills-install-step-desc">
              Click any skill card below to expand and copy
            </div>
          </div>
          <div className="skills-install-step">
            <div className="skills-install-step-num">Step 2</div>
            <div className="skills-install-step-title">
              Run in your project
            </div>
            <div className="skills-install-step-desc">
              Paste into your terminal inside any Claude Code project
            </div>
          </div>
          <div className="skills-install-step">
            <div className="skills-install-step-num">Step 3</div>
            <div className="skills-install-step-title">
              Use in Claude Code
            </div>
            <div className="skills-install-step-desc">
              Skill appears in .claude/skills/ — Claude picks it up
              automatically
            </div>
          </div>
        </div>
        <p className="skills-install-footer">
          Skills are plain markdown files. No dependencies, no configuration.
          Compatible with Claude Code, Cursor, and any agent that reads SKILL.md
          format.
        </p>
      </div>
    </section>
  );
}
