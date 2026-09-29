import { Mail } from "lucide-react";
import { StaticPageLayout, staticPageMetadata } from "@/components/layout/StaticPageLayout";
import { siteConfig } from "@/config/site";

export const generateMetadata = () => staticPageMetadata("contact");

export default function ContactPage() {
  return (
    <StaticPageLayout slug="contact">
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-fg">Email us</h2>
        <p className="mt-1 text-sm text-muted">We read every message and usually reply within two business days.</p>
        <a
          href={`mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(`${siteConfig.name} – message from the website`)}`}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-fg hover:bg-primary-hover"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {siteConfig.contactEmail}
        </a>
      </div>
    </StaticPageLayout>
  );
}
