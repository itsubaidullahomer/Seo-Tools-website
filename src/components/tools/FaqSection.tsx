import { Plus } from "lucide-react";
import type { FaqItem } from "@/lib/tools/types";
import { Markdown } from "@/components/content/Markdown";

/** Native <details> accordion – works without JavaScript and is fully indexable. */
export function FaqSection({ faq, title = "Frequently asked questions" }: { faq: FaqItem[]; title?: string }) {
  if (!faq.length) return null;
  return (
    <section aria-labelledby="faq-heading" className="mt-16 scroll-mt-20">
      <h2 id="faq-heading" className="border-b border-border pb-3 text-xl font-semibold tracking-tight text-fg">
        {title}
      </h2>
      <div className="divide-y divide-border">
        {faq.map((item, i) => (
          <details key={i} className="group" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 text-left text-[15px] font-medium text-fg hover:text-primary [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <Plus className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-45" aria-hidden />
            </summary>
            <div className="pb-5 pr-8 text-sm leading-relaxed text-fg-secondary">
              <Markdown compact>{item.answer}</Markdown>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
