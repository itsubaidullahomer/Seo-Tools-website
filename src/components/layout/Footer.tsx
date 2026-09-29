import Link from "next/link";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { siteConfig } from "@/config/site";
import { categories } from "@/lib/tools/categories";
import { getFeaturedTools, getToolCount, toolPath } from "@/lib/tools/registry";

const legalLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function Footer() {
  const popular = getFeaturedTools(8);
  const count = getToolCount();
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <Container size="xl" className="grid gap-10 py-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            {siteConfig.description}
          </p>
          <p className="mt-3 text-xs text-muted">
            {count} free tools · No sign-up · Your data stays in your browser
          </p>
        </div>
        <div className="md:col-span-3">
          <h2 className="text-sm font-semibold text-fg">Categories</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-muted hover:text-fg">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-3">
          <h2 className="text-sm font-semibold text-fg">Popular tools</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {popular.map((t) => (
              <li key={t.slug}>
                <Link href={toolPath(t.slug)} className="text-muted hover:text-fg">
                  {t.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/tools" className="font-medium text-primary hover:underline">
                View all tools →
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <h2 className="text-sm font-semibold text-fg">Company</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted hover:text-fg">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <div className="border-t border-border">
        <Container size="xl" className="flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {siteConfig.foundedYear}
            {new Date().getFullYear() > siteConfig.foundedYear ? `–${new Date().getFullYear()}` : ""} {siteConfig.name}. All rights reserved.
          </p>
          <p>Made for people who just need the tool to work.</p>
        </Container>
      </div>
    </footer>
  );
}
