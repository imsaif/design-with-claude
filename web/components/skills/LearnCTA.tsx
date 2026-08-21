// Was a full-width banner sitting between the hero and the grid, with a solid
// navy button that outweighed the hero's install pill and read as the thing the
// page wanted you to do. It is now one card inside the grid: navy on white so it
// stands out among 48 pale skill cards, but in the row where it belongs rather
// than in front of them.
export function LearnCTA() {
  return (
    <a
      href="https://www.aiuxdesign.guide/guides/claude-code-learning-path"
      target="_blank"
      rel="noopener noreferrer"
      className="skills-guide-card"
    >
      <span className="skills-guide-card-label">New to Claude Code?</span>
      <span className="skills-guide-card-desc">
        A free guide to using Claude Code for design work, from setup to
        shipping.
      </span>
      <span className="skills-guide-card-link">Start learning ↗</span>
    </a>
  );
}
