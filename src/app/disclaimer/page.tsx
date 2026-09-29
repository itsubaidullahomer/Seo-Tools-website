import { StaticPageLayout, staticPageMetadata } from "@/components/layout/StaticPageLayout";

export const generateMetadata = () => staticPageMetadata("disclaimer");

export default function DisclaimerPage() {
  return <StaticPageLayout slug="disclaimer" />;
}
