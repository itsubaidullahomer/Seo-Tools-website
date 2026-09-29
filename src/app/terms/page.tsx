import { StaticPageLayout, staticPageMetadata } from "@/components/layout/StaticPageLayout";

export const generateMetadata = () => staticPageMetadata("terms");

export default function TermsPage() {
  return <StaticPageLayout slug="terms" />;
}
