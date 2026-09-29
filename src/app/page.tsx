import Link from "next/link";
import { ArrowRight, Lock, Smartphone, Sparkles, Zap } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { CategoryCard } from "@/components/tools/CategoryCard";
import { ToolGrid } from "@/components/tools/ToolCard";
import { HeaderSearch } from "@/components/tools/HeaderSearch";
import { FaqSection } from "@/components/tools/FaqSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { faqSchema } from "@/lib/seo/jsonld";
import { getCategoriesWithCounts, getFeaturedTools, getNewestTools, getToolCount, getToolSummaries } from "@/lib/tools/registry";
import { toSummary } from "@/lib/tools/types";

const homeFaq = [
  {
    question: `Are the tools on ${siteConfig.name} really free?`,
    answer:
      "Yes. Every tool is free to use with no limits, no account and no watermarks. The site is supported by unobtrusive advertising, which lets us keep everything free and add new tools regularly.",
  },
  {
    question: "Is my data safe when I use these tools?",
    answer:
      "All processing happens inside your browser using JavaScript. Text you paste and files you open are never uploaded to our servers, so there is nothing for us to store, read or share. Close the tab and it is gone.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. Every tool runs in a normal web browser on desktop, tablet and phone. There is nothing to download and nothing to update – you always get the latest version.",
  },
  {
    question: "How do you decide which tools to build next?",
    answer:
      "We look at what people actually search for, what existing tools do badly, and what our visitors ask for through the contact page. New tools ship every week; the newest ones are listed right here on the homepage.",
  },
];

export default function HomePage() {
  const categories = getCategoriesWithCounts();
  const featured = getFeaturedTools(9).map(toSummary);
  const newest = getNewestTools(6).map(toSummary);
  const summaries = getToolSummaries();
  const count = getToolCount();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary-soft),transparent_60%)]" aria-hidden />
        <Container className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1 text-xs font-medium text-muted">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              {count} free tools · new ones every week
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
              Free online tools that <span className="text-primary">just work</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              Count words, convert units, format code, compress images and more – instantly, in your browser, with no sign-up. Nothing you enter ever leaves your device.
            </p>
            <div className="mt-8 flex justify-center">
              <HeaderSearch tools={summaries} large />
            </div>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
              <li className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" aria-hidden /> Instant results
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-primary" aria-hidden /> 100% private
              </li>
              <li className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-primary" aria-hidden /> Works on any device
              </li>
            </ul>
          </div>
        </Container>
      </section>

      {/* Categories */}
      <section aria-labelledby="categories-heading">
        <Container className="py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight text-fg">
                Browse by category
              </h2>
              <p className="mt-1 text-sm text-muted">Every tool is grouped so you can find the right one in seconds.</p>
            </div>
            <Link href="/tools" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
              All tools <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.slug}>
                <CategoryCard category={c} count={c.count} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Popular */}
      {featured.length > 0 && (
        <section aria-labelledby="popular-heading" className="border-y border-border bg-surface">
          <Container className="py-14">
            <div className="mb-6">
              <h2 id="popular-heading" className="text-2xl font-semibold tracking-tight text-fg">
                Popular tools
              </h2>
              <p className="mt-1 text-sm text-muted">The tools people come back to most.</p>
            </div>
            <ToolGrid tools={featured} showCategory />
          </Container>
        </section>
      )}

      {/* Newest */}
      {newest.length > 0 && (
        <section aria-labelledby="newest-heading">
          <Container className="py-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 id="newest-heading" className="text-2xl font-semibold tracking-tight text-fg">
                  Recently added
                </h2>
                <p className="mt-1 text-sm text-muted">Fresh from the workshop.</p>
              </div>
              <Link href="/tools" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View all {count} tools <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <ToolGrid tools={newest} showCategory />
          </Container>
        </section>
      )}

      {/* Why */}
      <section aria-labelledby="why-heading" className="border-y border-border bg-surface">
        <Container className="py-14">
          <h2 id="why-heading" className="text-2xl font-semibold tracking-tight text-fg">
            Why people use {siteConfig.name}
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-semibold text-fg">Built to be fast</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Pages are pre-rendered and each tool loads only the code it needs, so results appear the moment you type. No loading spinners, no waiting for a server.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Private by design</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                We process everything on your device. That is not a marketing promise – it is how the tools are built. There is no upload button because there is no upload.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-fg">Explained, not just executed</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Every tool page explains how the result is calculated, with worked examples and answers to the questions people actually ask, so you can trust what you copy.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="pb-4">
        <FaqSection faq={homeFaq} title="Common questions" />
      </Container>
      <JsonLd data={{ "@context": "https://schema.org", ...faqSchema(homeFaq) }} />
    </>
  );
}
