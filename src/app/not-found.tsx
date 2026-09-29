import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ToolGrid } from "@/components/tools/ToolCard";
import { getFeaturedTools } from "@/lib/tools/registry";
import { toSummary } from "@/lib/tools/types";

export const metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  const popular = getFeaturedTools(6).map(toSummary);
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-muted">The link may be outdated or mistyped. Try searching for the tool you need, or start from one of the popular tools below.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/tools" className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-fg hover:bg-primary-hover">
            Browse all tools
          </Link>
          <Link href="/" className="inline-flex h-11 items-center rounded-lg border border-border px-5 text-sm font-medium text-fg hover:bg-surface-2">
            Go home
          </Link>
        </div>
      </div>
      {popular.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-fg">Popular tools</h2>
          <ToolGrid tools={popular} showCategory />
        </section>
      )}
    </Container>
  );
}
