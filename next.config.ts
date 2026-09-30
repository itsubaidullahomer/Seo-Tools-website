import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
];

/**
 * Set STATIC_EXPORT=1 (via `npm run build:static`) to produce a plain HTML/JS/CSS
 * folder in ./out that any static host can serve (Cloudflare Pages, Netlify, S3…).
 * On Vercel the normal server build is used and `headers()` below applies; in export
 * mode headers/redirects are ignored, so static-host/_headers is used instead.
 */
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const } : {}),
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
