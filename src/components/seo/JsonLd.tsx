import type { JsonLd as JsonLdDoc } from "@/lib/seo/jsonld";

/**
 * Renders a JSON-LD script tag. The payload is serialised with `<` escaped so
 * user-authored strings can never break out of the script element.
 */
export function JsonLd({ data }: { data: JsonLdDoc }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
