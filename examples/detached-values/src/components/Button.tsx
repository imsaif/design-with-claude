// The component library's Button — the canonical implementation.

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
