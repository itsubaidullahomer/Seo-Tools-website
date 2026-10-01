import { siteConfig } from "@/config/site";
import { OG_SIZE, renderOgImage } from "@/lib/seo/og-image";

export const dynamic = "force-static";
export const alt = `${siteConfig.name} – ${siteConfig.tagline}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return renderOgImage({
    eyebrow: "Free online tools",
    title: siteConfig.tagline,
    description: "Fast, private tools for writers, marketers, developers and designers. Everything runs in your browser – no sign-up, no uploads.",
  });
}
