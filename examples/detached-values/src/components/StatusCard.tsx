// Planted violations for /design-enforce. Every one is decided from source
// alone — no rendering required.
//
//   1. DETACHED VALUE   #f79009 written raw; --color-warning holds exactly that
//   2. DETACHED VALUE   #027a48 raw; --color-success holds exactly that
//   3. DETACHED VALUE   #101828 raw; --color-text holds exactly that
//   4. OFF-SCALE        padding 13px and 21px against a 4px scale
//   5. OFF-SCALE        border-radius 5px; system defines 4 and 8
//   6. ARBITRARY SYNTAX Tailwind w-[347px] and text-[#1f3b90]
//   7. REINVENTED       a bare styled <button> when Button.tsx exists
//
// Decoys that must NOT be flagged:
//   - z-index 10 is not a design-token value
//   - the 200ms duration has no token to bypass — a gap, not a violation

export function StatusCard({ status }: { status: "warn" | "ok" }) {
  return (
    <div
      className="w-[347px] text-[#1f3b90]"
      style={{
        padding: "13px 21px",
        borderRadius: "5px",
        background: "var(--color-surface)",
        color: "#101828",
        zIndex: 10,
        transition: "opacity 200ms ease",
      }}
    >
      <span style={{ color: status === "warn" ? "#f79009" : "#027a48" }}>
        {status === "warn" ? "Needs attention" : "All good"}
      </span>

      <button
        style={{
          padding: "8px 16px",
          borderRadius: "8px",
          background: "#1f3b90",
          fontWeight: 700,
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
