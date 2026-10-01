import Link from "next/link";
import { LogoMark } from "./Logo";
import { siteConfig } from "@/config/site";
import { categories } from "@/lib/tools/categories";
import { getFeaturedTools, getToolCount, toolPath } from "@/lib/tools/registry";
import { PrivacySettingsButton } from "@/components/consent/PrivacySettingsButton";

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Guides" },
  { href: "/editorial-policy", label: "Editorial Policy" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function Footer() {
  const popular = getFeaturedTools(6);
  const count = getToolCount();
  return (
    <footer className="mt-20 border-t border-border">
      <div className="grid gap-10 px-4 py-10 sm:px-6 md:grid-cols-12 lg:px-10">
        <div className="md:col-span-5">
          <div className="flex items-center gap-2 font-semibold text-fg">
            <LogoMark className="h-6 w-6" />
            {siteConfig.name}
          </div>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-muted">{siteConfig.description}</p>
          <dl className="mt-5 grid max-w-sm grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border font-mono text-[11px]">
            {[
              [String(count), "tools"],
              ["0", "uploads"],
              ["0", "sign-ups"],
            ].map(([v, l]) => (
              <div key={l} className="bg-surface px-3 py-2">
                <dt className="sr-only">{l}</dt>
                <dd className="text-base font-semibold text-fg">{v}</dd>
                <dd className="uppercase tracking-wider text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="md:col-span-3">
          <h2 className="label-mono">Categories</h2>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-fg-secondary hover:text-primary">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <h2 className="label-mono">Popular</h2>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            {popular.map((t) => (
              <li key={t.slug}>
                <Link href={toolPath(t.slug)} className="text-fg-secondary hover:text-primary">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <h2 className="label-mono">Company</h2>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            {companyLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-fg-secondary hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
            {siteConfig.adsenseClient && (
              <li>
                <PrivacySettingsButton className="text-left text-fg-secondary hover:text-primary" />
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="flex flex-col gap-1 border-t border-border px-4 py-4 font-mono text-[11px] text-muted sm:flex-row sm:justify-between sm:px-6 lg:px-10">
        <p>
          © {siteConfig.foundedYear}
          {new Date().getFullYear() > siteConfig.foundedYear ? `–${new Date().getFullYear()}` : ""} {siteConfig.name}
        </p>
        <p>Everything runs in your browser.</p>
      </div>
    </footer>
  );
}
