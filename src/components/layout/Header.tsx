import Link from "next/link";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { HeaderSearch } from "@/components/tools/HeaderSearch";
import { categories } from "@/lib/tools/categories";
import { getToolSummaries } from "@/lib/tools/registry";

const primaryLinks = [
  { href: "/tools", label: "All tools" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

export function Header() {
  const tools = getToolSummaries();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <Container size="xl" className="flex h-16 items-center gap-4">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {primaryLinks.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-fg-secondary hover:bg-surface-2 hover:text-fg">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <HeaderSearch tools={tools} />
          <MobileNav links={primaryLinks} categories={categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name }))} />
        </div>
      </Container>
      <div className="hidden border-t border-border/60 md:block">
        <Container size="xl">
          <nav aria-label="Categories" className="-mx-1 flex items-center gap-1 overflow-x-auto py-1.5 text-sm">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="whitespace-nowrap rounded-md px-2.5 py-1 text-fg-secondary hover:bg-surface-2 hover:text-fg"
              >
                {c.shortName}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
    </header>
  );
}
