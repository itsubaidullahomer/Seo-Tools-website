import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

export const alt = "Article preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await getAllPosts()).map((p) => ({ slug: p.slug }));
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const title = post?.title ?? siteConfig.name;
  const description = post?.description ?? siteConfig.description;

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
          <div style={{ marginLeft: "auto", fontSize: 22, color: "#a5b4fc" }}>Guide</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5 }}>{title}</div>
          <div style={{ fontSize: 28, color: "#cbd5e1", lineHeight: 1.35, maxWidth: 1000 }}>{description}</div>
        </div>
        <div style={{ fontSize: 22, color: "#94a3b8" }}>{siteConfig.url.replace(/^https?:\/\//, "")}</div>
      </div>
    ),
    { ...size },
  );
}
