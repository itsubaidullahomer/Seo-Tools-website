import type { ToolSummary } from "./types";

/**
 * Tiny client-side search: token match over name, keywords, aliases and
 * description with simple scoring. Good enough for a few hundred tools without
 * shipping a search library.
 */
export function searchTools(tools: ToolSummary[], query: string): ToolSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return tools;
  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = tools
    .map((t) => {
      const name = t.name.toLowerCase();
      const keywords = t.keywords.map((k) => k.toLowerCase());
      const aliases = (t.aliases ?? []).map((a) => a.toLowerCase());
      const desc = t.shortDescription.toLowerCase();
      let score = 0;
      if (name === q) score += 100;
      if (name.startsWith(q)) score += 40;
      if (name.includes(q)) score += 25;
      for (const tok of tokens) {
        if (name.includes(tok)) score += 10;
        if (keywords.some((k) => k.includes(tok))) score += 6;
        if (aliases.some((a) => a.includes(tok))) score += 6;
        if (t.slug.includes(tok)) score += 4;
        if (desc.includes(tok)) score += 2;
      }
      return { t, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.t.name.localeCompare(b.t.name));

  return scored.map((s) => s.t);
}
