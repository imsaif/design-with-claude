// CSS pre-processor shared by every helper that reads tokens or declarations.
// Commented-out CSS isn't live: without this, an alternate theme parked in a
// comment gets audited as though it shipped.
export function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}
