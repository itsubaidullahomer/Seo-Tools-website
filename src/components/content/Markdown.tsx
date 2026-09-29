import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { headingId } from "@/lib/markdown";
import { cn } from "@/lib/utils";

function textOf(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: unknown } }).props.children);
  }
  return "";
}

const components: Components = {
  h2: ({ children }) => <h2 id={headingId(textOf(children))}>{children}</h2>,
  h3: ({ children }) => <h3 id={headingId(textOf(children))}>{children}</h3>,
  a: ({ href = "", children }) => {
    const internal = href.startsWith("/") || href.startsWith("#");
    if (internal) return <Link href={href}>{children}</Link>;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow">
        {children}
      </a>
    );
  },
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" decoding="async" className="rounded-xl border border-border" />
  ),
};

/**
 * Renders trusted markdown (our own content files) with site typography.
 * `compact` is used for short snippets like FAQ answers.
 */
export function Markdown({ children, compact, className }: { children: string; compact?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        compact ? "article prose prose-sm max-w-none dark:prose-invert prose-p:my-2" : "article prose prose-slate max-w-none dark:prose-invert lg:prose-lg",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
