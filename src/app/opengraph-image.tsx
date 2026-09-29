import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} – ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0b1020 0%, #1e1b4b 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#818cf8", display: "flex" }} />
          <div style={{ fontSize: 30, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>{siteConfig.tagline}</div>
          <div style={{ fontSize: 30, color: "#cbd5e1", lineHeight: 1.35, maxWidth: 1000 }}>{siteConfig.description}</div>
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 22, color: "#94a3b8" }}>
          <span>Free</span>
          <span>·  No sign-up</span>
          <span>·  Runs in your browser</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
