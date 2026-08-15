// A status card in a project that has a design system. Deliberately not
// annotated: the expected findings live in ../../EXPECTED.md, which should not
// be read until after /design-enforce has run against this fixture.
// The violations here are the point of the fixture. Do not fix them.

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
