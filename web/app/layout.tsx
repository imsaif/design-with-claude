import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import "./skills.css";

// Satoshi-only typography (aiex design system).
// Mounted under both --font-satoshi (aiex name) and --font-dm-sans (existing
// dwic CSS references) so we don't have to touch every class. Bevellier (serif)
// and DM Mono are intentionally dropped — aiex uses Satoshi for everything.
const satoshi = localFont({
  src: [
    { path: "../public/fonts/satoshi-400.woff2", weight: "400" },
    { path: "../public/fonts/satoshi-500.woff2", weight: "500" },
    { path: "../public/fonts/satoshi-700.woff2", weight: "700" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

const siteUrl = "https://designwithclaude.com";
const title = "dwic — a senior designer inside your terminal";
const description =
  "dwic (design with claude) is an MCP server that audits your design system from inside Claude Code. Flags contrast failures, mandated-accent drift, and structural gaps in your CSS — then prescribes the fix and remembers it across every session.";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Design with Claude",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  keywords: [
    "dwic",
    "design with claude",
    "design system audit",
    "accessibility audit",
    "wcag contrast checker",
    "design tokens",
    "claude code mcp",
    "claude code plugin",
    "ai design tools",
    "design system",
    "ux design",
    "ui design",
    "claude code",
    "typography",
  ],
  authors: [{ name: "Imran", url: "https://www.imranaidesign.com" }],
  icons: {
    icon: [{ url: "/favicon-light.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon-light.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Mount Satoshi under two CSS variable names so legacy CSS (var(--font-dm-sans))
  // and any new aiex-style references (var(--font-satoshi)) both resolve to the
  // same loaded font.
  const satoshiAliases = `${satoshi.variable}`;
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  return (
    <html lang="en">
      <body
        className={`skills-page ${satoshiAliases}`}
        style={{ ["--font-dm-sans" as string]: "var(--font-satoshi)" }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Design with Claude",
              description,
              url: siteUrl,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Person",
                name: "Imran",
                url: "https://www.imranaidesign.com",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Design with Claude",
              alternateName: "dwic",
              url: siteUrl,
            }),
          }}
        />
        {clarityProjectId && (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityProjectId}");`}
          </Script>
        )}
        {children}
      </body>
    </html>
  );
}
