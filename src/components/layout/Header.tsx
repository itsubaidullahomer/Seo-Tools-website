import Link from "next/link";
import { Logo } from "./Logo";
import { MobileNav } from "@/components/shell/MobileNav";
import { SearchTrigger } from "@/components/shell/SearchTrigger";
import { getNavTree } from "@/lib/tools/registry";

const links = [
  { href: "/tools", label: "All tools" },
  { href: "/blog", label: "Guides" },
  { href: "/about", label: "About" },
];

/** Sticky top bar. The logo column matches the sidebar width on desktop. */
export function Header() {
  const tree = getNavTree();
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-2 px-3 sm:px-4">
        <MobileNav tree={tree} links={links} />
        <div className="flex shrink-0 items-center lg:w-[236px] lg:pl-1">
          <Logo />
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-1 sm:ml-0 sm:flex-1">
          <SearchTrigger className="hidden max-w-md sm:flex" />
          <SearchTrigger variant="icon" className="sm:hidden" />
        </div>
        <nav aria-label="Primary" className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-fg-secondary hover:bg-surface-2 hover:text-fg">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
