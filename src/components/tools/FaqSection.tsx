import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/tools/types";
import { Markdown } from "@/components/content/Markdown";

/** Native <details> accordion – works without JavaScript and is fully indexable. */
export function FaqSection({ faq, title = "Frequently asked questions" }: { faq: FaqItem[]; title?: string }) {
  if (!faq.length) return null;
  return (
    <section aria-labelledby="faq-heading" className="mt-14">
      <h2 id="faq-heading" className="text-xl font-semibold tracking-tight text-fg">
        {title}
      </h2>
      <div className="mt-5 divide-y divide-border rounded-2xl border border-border bg-surface">
        {faq.map((item, i) => (
          <details key={i} className="group px-5" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium text-fg [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="pb-5 text-sm leading-relaxed text-fg-secondary">
              <Markdown compact>{item.answer}</Markdown>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
