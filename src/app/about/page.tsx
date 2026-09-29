import { StaticPageLayout, staticPageMetadata } from "@/components/layout/StaticPageLayout";

export const generateMetadata = () => staticPageMetadata("about");

export default function AboutPage() {
  return <StaticPageLayout slug="about" />;
}
