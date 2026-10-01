import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

/**
 * Shared Open Graph / link-preview image (1200×630) in the site's own brand: warm paper
 * background, ink text, the jar logo and the signal-orange accent. Used by the homepage,
 * every tool page and every guide, so a shared link always looks like ToolkitJar.
 */
export const OG_SIZE = { width: 1200, height: 630 };

const C = {
  bg: "#f6f5f1",
  ink: "#1a1916",
  muted: "#6e6a62",
  border: "#e4e1d9",
  orange: "#ff5f1f",
  orangeText: "#c9400a",
};

// The site's own typeface (Geist, SIL Open Font License – see fonts/OFL-Geist.txt). Read at build time only.
const fontDir = join(process.cwd(), "src", "lib", "seo", "fonts");
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700; style: "normal" }[]> | null = null;
function loadFonts() {
  fonts ??= Promise.all([
    readFile(join(fontDir, "Geist-Regular.ttf")).then((data) => ({ name: "Geist", data, weight: 400 as const, style: "normal" as const })),
    readFile(join(fontDir, "Geist-Bold.ttf")).then((data) => ({ name: "Geist", data, weight: 700 as const, style: "normal" as const })),
  ]);
  return fonts;
}

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).replace(/[\s,.;:–-]+\S*$/, "")}…` : text;
}

export async function renderOgImage({ eyebrow, title, description }: { eyebrow?: string; title: string; description: string }) {
  const titleSize = title.length > 48 ? 58 : title.length > 28 ? 68 : 80;
  const host = siteConfig.url.replace(/^https?:\/\//, "");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: C.bg, color: C.ink, fontFamily: "Geist" }}>
        <div style={{ width: 18, height: "100%", background: C.orange, display: "flex" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 72px 56px 64px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <svg width="64" height="64" viewBox="0 0 32 32">
              <rect x="2" y="6" width="28" height="24" rx="6" fill={C.ink} />
              <rect x="9" y="2" width="14" height="6" rx="2" fill={C.orange} />
              <path d="M9 15h14M9 21h9" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
            <div style={{ marginLeft: 18, fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>{siteConfig.name}</div>
            {eyebrow && (
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 700,
                  color: C.orangeText,
                  border: `2px solid ${C.orange}`,
                  borderRadius: 999,
                  padding: "8px 22px",
                }}
              >
                {eyebrow}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: titleSize, fontWeight: 700, lineHeight: 1.06, letterSpacing: -2, maxWidth: 1040 }}>{clip(title, 80)}</div>
            <div style={{ marginTop: 22, fontSize: 31, lineHeight: 1.35, color: C.muted, maxWidth: 1000 }}>{clip(description, title.length > 28 ? 118 : 150)}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", borderTop: `2px solid ${C.border}`, paddingTop: 26, fontSize: 24, color: C.muted }}>
            {["Free", "No sign-up", "Runs in your browser"].map((t, i) => (
              <div key={t} style={{ display: "flex", alignItems: "center", marginRight: 28 }}>
                {i > 0 && <div style={{ width: 8, height: 8, borderRadius: 999, background: C.orange, marginRight: 28 }} />}
                {t}
              </div>
            ))}
            <div style={{ marginLeft: "auto", fontWeight: 700, color: C.ink }}>{host}</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
