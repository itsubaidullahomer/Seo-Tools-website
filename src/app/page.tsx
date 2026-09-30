import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cpu, EyeOff, Gauge, BookOpen } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ToolGrid } from "@/components/tools/ToolCard";
import { FaqSection } from "@/components/tools/FaqSection";
import { SearchTrigger } from "@/components/shell/SearchTrigger";
import { Icon } from "@/components/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { faqSchema } from "@/lib/seo/jsonld";
import { getCategoriesWithCounts, getFeaturedTools, getNavTree, getNewestTools, getToolCount } from "@/lib/tools/registry";
import { toSummary } from "@/lib/tools/types";

export const metadata: Metadata = { alternates: { canonical: "/" } };

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
      "We look at what people actually search for, what existing tools do badly, and what visitors ask for through the contact page. New tools ship every week; the newest ones are listed on this page.",
  },
];

const principles = [
  { icon: Gauge, title: "Instant", body: "Pages are pre-rendered and each tool loads only the code it needs. Results update as you type – no submit button, no server round-trip." },
  { icon: EyeOff, title: "Private", body: "Your text and files are processed on your device. There is no upload step because there is no upload – we never see your data." },
  { icon: BookOpen, title: "Explained", body: "Every tool page shows the method or formula behind the result, with worked examples, so you can trust what you copy." },
  { icon: Cpu, title: "No sign-up", body: "No accounts, no quotas, no watermarks, no “pro” tier. Open the page and use the tool." },
];

export default function HomePage() {
  const categories = getCategoriesWithCounts();
  const tree = getNavTree();
  const featured = getFeaturedTools(6).map(toSummary);
  const newest = getNewestTools(6).map(toSummary);
  const count = getToolCount();
  const quick = getFeaturedTools(5);

  return (
    <>
      {/* Hero */}
      <section className="bg-grid relative border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,var(--bg))]" aria-hidden />
        <Container size="xl" className="relative py-14 sm:py-20">
          <p className="label-mono flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-bright" aria-hidden />
            {count} free tools · runs in your browser
          </p>
          <h1 className="mt-4 max-w-3xl text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.035em] text-fg sm:text-6xl">
            The toolbox for everyday <span className="text-primary">web work.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">
            Count, convert, format, generate and check – instantly, privately, without an account. Built for writers, marketers, developers and anyone who just needs the tool to work.
          </p>
          <div className="mt-8 max-w-xl">
            <SearchTrigger variant="hero" placeholder="Search tools – try “json”, “words”, “percent”…" />
          </div>
          {quick.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="label-mono mr-1">Popular:</span>
              {quick.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  className="rounded-md border border-border bg-surface px-2.5 py-1 text-[13px] text-fg-secondary transition-colors hover:border-border-strong hover:text-fg"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      <Container size="xl" className="py-12">
        {/* Categories */}
        <section aria-labelledby="categories-heading">
          <SectionHeading id="categories-heading" kicker="01" title="Categories" action={{ href: "/tools", label: `All ${count} tools` }} />
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((c) => (
              <li key={c.slug}>
                <CategoryTile slug={c.slug} name={c.name} icon={c.icon} color={c.color} count={c.count} />
              </li>
            ))}
          </ul>
        </section>

        {featured.length > 0 && (
          <section aria-labelledby="popular-heading" className="mt-16">
            <SectionHeading id="popular-heading" kicker="02" title="Popular tools" />
            <ToolGrid tools={featured} showCategory className="mt-5" />
          </section>
        )}

        {newest.length > 0 && (
          <section aria-labelledby="newest-heading" className="mt-16">
            <SectionHeading id="newest-heading" kicker="03" title="Recently added" action={{ href: "/tools", label: "Browse all" }} />
            <ToolGrid tools={newest} showCategory className="mt-5" />
          </section>
        )}

        {/* Principles */}
        <section aria-labelledby="why-heading" className="mt-16">
          <SectionHeading id="why-heading" kicker="04" title={`How ${siteConfig.name} works`} />
          <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
            {principles.map((p) => (
              <div key={p.title} className="bg-surface p-5">
                <p.icon className="h-5 w-5 text-primary" aria-hidden />
                <h3 className="mt-3 font-semibold tracking-tight text-fg">{p.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Directory – every tool, grouped. Strong internal linking for crawlers and a fast index for people. */}
        <section aria-labelledby="directory-heading" className="mt-16">
          <SectionHeading id="directory-heading" kicker="05" title="Tool directory" />
          <div className="mt-5 grid gap-x-8 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            {tree.map((c) => (
              <div key={c.slug} className={`accent-${c.color}`}>
                <Link href={`/category/${c.slug}`} className="label-mono flex items-center gap-2 border-b border-border pb-2 hover:!text-fg">
                  <Icon name={c.icon} className="h-3.5 w-3.5 text-cat" />
                  {c.name}
                </Link>
                <ul className="mt-2 space-y-1 text-[14px]">
                  {c.tools.map((t) => (
                    <li key={t.slug}>
                      <Link href={`/tools/${t.slug}`} className="text-fg-secondary hover:text-primary">
                        {t.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <FaqSection faq={homeFaq} title="Common questions" />
      </Container>
      <JsonLd data={{ "@context": "https://schema.org", ...faqSchema(homeFaq) }} />
    </>
  );
}

function SectionHeading({ id, kicker, title, action }: { id: string; kicker: string; title: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
      <h2 id={id} className="flex items-baseline gap-3 text-xl font-semibold tracking-tight text-fg">
        <span className="font-mono text-xs font-medium text-primary">{kicker}</span>
        {title}
      </h2>
      {action && (
        <Link href={action.href} className="inline-flex items-center gap-1 text-[13px] font-medium text-fg-secondary hover:text-primary">
          {action.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function CategoryTile({ slug, name, icon, color, count }: { slug: string; name: string; icon: Parameters<typeof Icon>[0]["name"]; color: string; count: number }) {
  return (
    <Link
      href={`/category/${slug}`}
      className={`accent-${color} group flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-card-lg`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-cat-soft text-cat">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg">{name}</span>
        <span className="block font-mono text-[11px] text-muted">{count ? `${count} ${count === 1 ? "tool" : "tools"}` : "coming soon"}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
    </Link>
  );
}
