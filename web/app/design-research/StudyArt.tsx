/**
 * Hand-drawn spot icons for the research index cards — one per study.
 *
 * Icons: react-doodle-icons (github.com/svatsa159/react-doodle-icons) — MIT,
 * no attribution. SVGs in /public/doodles are recolored to brand navy
 * (#162036 = --dr-ink). Purely decorative — the card thumb is aria-hidden.
 */

type ArtKind = "terminal" | "accessibility" | "soon";

// Swapping a study's icon is a one-line change.
const ICON: Record<ArtKind, string> = {
  terminal: "file-code", // the code the terminal produces
  accessibility: "hide", // eye-off — the accessibility angle
  soon: "clock", // in the pipeline
};

export function StudyArt({ kind }: { kind: ArtKind }) {
  return <img src={`/doodles/${ICON[kind]}.svg`} alt="" />;
}
