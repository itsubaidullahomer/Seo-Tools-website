import "server-only";

import { categories, type CategorySlug, getCategory } from "./categories";
import { toolMetas } from "./registry.generated";
import { toSummary, type ToolMeta, type ToolSummary } from "./types";
import type { IconName } from "@/lib/icons";

/**
 * Read-only access to the tool catalogue. Server components only – client
 * components receive `ToolSummary[]` via props (see getToolSummaries()).
 */

const bySlug = new Map<string, ToolMeta>(toolMetas.map((t) => [t.slug, t]));

export function getAllTools(): ToolMeta[] {
  return [...toolMetas].sort((a, b) => a.name.localeCompare(b.name));
}

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return bySlug.get(slug);
}

export function getToolsByCategory(category: CategorySlug): ToolMeta[] {
  return getAllTools().filter((t) => t.category === category);
}

export function getFeaturedTools(limit = 8): ToolMeta[] {
  const featured = getAllTools().filter((t) => t.featured);
  return (featured.length ? featured : getAllTools()).slice(0, limit);
}

export function getNewestTools(limit = 8): ToolMeta[] {
  return [...toolMetas]
    .sort((a, b) => (a.datePublished < b.datePublished ? 1 : a.datePublished > b.datePublished ? -1 : 0))
    .slice(0, limit);
}

/**
 * Related tools: explicit `related` slugs first, then same-category tools,
 * never the tool itself, de-duplicated, capped at `limit`.
 */
export function getRelatedTools(tool: ToolMeta, limit = 6): ToolMeta[] {
  const out: ToolMeta[] = [];
  const seen = new Set<string>([tool.slug]);
  for (const slug of tool.related ?? []) {
    const t = bySlug.get(slug);
    if (t && !seen.has(t.slug)) {
      out.push(t);
      seen.add(t.slug);
    }
  }
  for (const t of getToolsByCategory(tool.category)) {
    if (out.length >= limit) break;
    if (!seen.has(t.slug)) {
      out.push(t);
      seen.add(t.slug);
    }
  }
  return out.slice(0, limit);
}

export function getToolSummaries(): ToolSummary[] {
  return getAllTools().map(toSummary);
}

/** Categories with their tools (name/slug/icon only) for navigation trees. */
export function getNavTree(): NavCategory[] {
  return categories
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      shortName: c.shortName,
      icon: c.icon,
      color: c.color,
      tools: getToolsByCategory(c.slug).map((t) => ({ slug: t.slug, name: t.name, icon: t.icon })),
    }))
    .filter((c) => c.tools.length > 0);
}

export interface NavCategory {
  slug: string;
  name: string;
  shortName: string;
  icon: IconName;
  color: string;
  tools: { slug: string; name: string; icon?: IconName }[];
}

export function getCategoriesWithCounts() {
  return categories.map((c) => ({ ...c, count: toolMetas.filter((t) => t.category === c.slug).length }));
}

export function toolPath(slug: string): string {
  return `/tools/${slug}`;
}

export function getToolCategory(tool: ToolMeta) {
  const cat = getCategory(tool.category);
  if (!cat) throw new Error(`Tool "${tool.slug}" references unknown category "${tool.category}"`);
  return cat;
}

export function getToolCount(): number {
  return toolMetas.length;
}
