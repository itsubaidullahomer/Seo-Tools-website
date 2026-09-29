export function TableOfContents({ headings, faq }: { headings: { id: string; text: string }[]; faq?: boolean }) {
  if (headings.length < 3) return null;
  return (
    <nav aria-label="On this page">
      <p className="label-mono">On this page</p>
      <ol className="mt-3 space-y-0.5 border-l border-border text-[13px]">
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="-ml-px block border-l border-transparent py-1 pl-3 text-muted hover:border-primary hover:text-fg">
              {h.text}
            </a>
          </li>
        ))}
        {faq && (
          <li>
            <a href="#faq-heading" className="-ml-px block border-l border-transparent py-1 pl-3 text-muted hover:border-primary hover:text-fg">
              FAQ
            </a>
          </li>
        )}
      </ol>
    </nav>
  );
}
