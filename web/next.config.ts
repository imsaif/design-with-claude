import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // /how-to-design-with-claude was merged into /how-it-works.
        source: "/how-to-design-with-claude",
        destination: "/how-it-works",
        permanent: true,
      },
      // The V2 companion flow (/start -> /profile -> /install -> /companion,
      // plus /upgrade and /account) was removed; /get-started replaced all of
      // it. These were 404ing, including /start, which TESTING.md hands to
      // testers and CLAUDE.md names as the entry point.
      ...["/start", "/profile", "/install", "/companion", "/upgrade", "/account"].map(
        (source) => ({ source, destination: "/get-started", permanent: true }),
      ),
    ];
  },
};

export default nextConfig;
