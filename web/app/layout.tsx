import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { DM_Mono } from "next/font/google";
import "./globals.css";
import "./skills.css";

const bevellier = localFont({
  src: [
    { path: "../public/fonts/bevellier-regular.woff2", weight: "400" },
    { path: "../public/fonts/bevellier-medium.woff2", weight: "500" },
  ],
  variable: "--font-dm-serif",
  display: "swap",
});

const satoshi = localFont({
  src: [
    { path: "../public/fonts/satoshi-400.woff2", weight: "400" },
    { path: "../public/fonts/satoshi-500.woff2", weight: "500" },
    { path: "../public/fonts/satoshi-700.woff2", weight: "700" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

const siteUrl = "https://designwithclaude.com";
const title = "Design with Claude — 29 Design Agents for Claude Code";
const description =
  "29 specialist design agents as Claude Code slash commands. Accessibility, design systems, motion, color, typography, checkout flows, dashboards and more. No runtime, no dependencies — just expert design guidance in your coding workflow.";

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
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Design with Claude — 29 design agents for Claude Code",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
  keywords: [
    "claude code plugin",
    "design agents",
    "ai design tools",
    "accessibility",
    "design system",
    "ux design",
    "ui design",
    "claude code",
    "slash commands",
    "motion design",
    "color theory",
    "typography",
  ],
  authors: [{ name: "Imran", url: "https://www.imranaidesign.com" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0c0c0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`skills-page ${bevellier.variable} ${satoshi.variable} ${dmMono.variable}`}
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
        {children}
      </body>
    </html>
  );
}
