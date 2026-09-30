import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // The temporary *.vercel.app addresses must never compete with the real domain in search
      // (duplicate content). Only the custom domain is indexable.
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<host>.*\\.vercel\\.app)" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      // ads.txt must be fetchable by Google's crawler and should not be cached for long.
      { source: "/ads.txt", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] },
    ];
  },
  async redirects() {
    // Add permanent redirects here whenever a tool slug or category is renamed,
    // e.g. { source: "/tools/old-slug", destination: "/tools/new-slug", permanent: true }
    return [];
  },
};

export default nextConfig;
