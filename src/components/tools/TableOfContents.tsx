export function TableOfContents({ headings, faq }: { headings: { id: string; text: string }[]; faq?: boolean }) {
  if (headings.length < 3) return null;
  return (
    <nav aria-label="On this page" className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">On this page</p>
      <ol className="mt-3 space-y-2 text-sm">
        {headings.map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`} className="text-fg-secondary hover:text-primary">
              {h.text}
            </a>
          </li>
        ))}
        {faq && (
          <li>
            <a href="#faq-heading" className="text-fg-secondary hover:text-primary">
              Frequently asked questions
            </a>
          </li>
        )}
      </ol>
    </nav>
  );
}
