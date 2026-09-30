import { StaticPageLayout, staticPageMetadata } from "@/components/layout/StaticPageLayout";

export const generateMetadata = () => staticPageMetadata("editorial-policy");

export default function EditorialPolicyPage() {
  return <StaticPageLayout slug="editorial-policy" />;
}
