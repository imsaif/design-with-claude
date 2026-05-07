import type { MetadataRoute } from "next";

const BASE = "https://designwithclaude.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${BASE}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/how-to-design-with-claude`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/get-started`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/library`, lastModified, changeFrequency: "weekly", priority: 0.7 },
  ];
}
