import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { getCategory } from "@/lib/tools/categories";
import { getAllTools, getToolBySlug } from "@/lib/tools/registry";

export const dynamic = "force-static";
export const alt = "Tool preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllTools().map((t) => ({ slug: t.slug }));
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  const name = tool?.name ?? siteConfig.name;
  const description = tool?.shortDescription ?? siteConfig.description;
  const category = tool ? getCategory(tool.category)?.name ?? "" : "";

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
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>{siteConfig.name}</div>
          {category && (
            <div style={{ marginLeft: "auto", fontSize: 22, color: "#a5b4fc", border: "2px solid #3730a3", borderRadius: 999, padding: "8px 20px" }}>
              {category}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>{name}</div>
          <div style={{ fontSize: 30, color: "#cbd5e1", lineHeight: 1.35, maxWidth: 1000 }}>{description}</div>
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
