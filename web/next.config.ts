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
    ];
  },
};

export default nextConfig;
