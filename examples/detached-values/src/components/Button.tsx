// The component library's Button. This is the one that already exists —
// the bare <button> in StatusCard.tsx reinvents it, which /design-enforce
// should catch.

export function Button({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  return (
    <button
      className={variant === "primary" ? "btn btn--primary" : "btn btn--ghost"}
      style={{
        padding: "var(--space-2) var(--space-4)",
        borderRadius: "var(--radius-md)",
        background: variant === "primary" ? "var(--color-primary)" : "transparent",
        fontWeight: "var(--font-weight-bold)",
      }}
    >
      {children}
    </button>
  );
}
