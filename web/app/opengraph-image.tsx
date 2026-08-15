import { ImageResponse } from "next/og";

export const alt = "dwic — a product designer inside your terminal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#F0F1F5",
          color: "#162036",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#162036",
              color: "#F0F1F5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            d
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 500 }}>
            <span>d</span>
            <span style={{ opacity: 0.4 }}>esign</span>
            <span>wi</span>
            <span style={{ opacity: 0.4 }}>th</span>
            <span>c</span>
            <span style={{ opacity: 0.4 }}>laude</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2.5,
              maxWidth: 1000,
            }}
          >
            dwic is a product designer inside your terminal.
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.35,
              color: "#3A4358",
              maxWidth: 920,
            }}
          >
            It knows your design system, your design choices, and your code. It catches changes before they get shipped.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 24px",
              borderRadius: 999,
              background: "#162036",
              color: "#F0F1F5",
              fontSize: 24,
              fontWeight: 500,
            }}
          >
            <span style={{ opacity: 0.55 }}>$</span>
            <span>npx dwic-audit</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 500, opacity: 0.6 }}>
            designwithclaude.com
          </div>
        </div>
      </div>
    ),
    size,
  );
}
