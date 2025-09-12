import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Design with Claude - AI-Powered Design Agents",
  description: "28 specialized design agents for Claude AI to enhance your design workflow. From UI/UX to brand strategy, get expert design assistance.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/favicon.ico' },
    ],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <footer className="simple-footer">
          <span>Built with ☕ by Imran</span>
          <span>·</span>
          <a href="https://www.imranaidesign.com" target="_blank" rel="noopener noreferrer">Portfolio</a>
          <span>·</span>
          <a href="https://github.com/imsaif" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span>·</span>
          <a href="https://linkedin.com/in/imsaif" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </footer>
      </body>
    </html>
  );
}
