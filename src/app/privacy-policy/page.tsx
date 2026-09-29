import { StaticPageLayout, staticPageMetadata } from "@/components/layout/StaticPageLayout";

export const generateMetadata = () => staticPageMetadata("privacy-policy");

export default function PrivacyPolicyPage() {
  return <StaticPageLayout slug="privacy-policy" />;
}
