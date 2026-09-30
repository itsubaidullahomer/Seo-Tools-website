/**
 * Quality gate for tool folders. Fails the build when a tool is incomplete so
 * thin or broken pages never reach production (AdSense "low value content" is
 * the #1 rejection reason for tool sites).
 *
 * Checks each src/tools/<slug>/:
 *   - meta.ts exports `meta` with the required fields and slug === folder name
 *   - category exists, icon exists, related slugs exist
 *   - title <= 60 chars, description 120-165 chars, shortDescription <= 140
 *   - 4-10 FAQ items with real answers
 *   - content.md exists with >= MIN_WORDS words and at least 3 `## ` sections
 *   - Tool.tsx starts with "use client" and has a default export
 */
import { readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const MIN_WORDS = Number(process.env.TOOL_MIN_WORDS ?? 800);
const root = process.cwd();
const toolsDir = join(root, "src", "tools");

type Problem = { slug: string; level: "error" | "warn"; message: string };
const problems: Problem[] = [];
const err = (slug: string, message: string) => problems.push({ slug, level: "error", message });
const warn = (slug: string, message: string) => problems.push({ slug, level: "warn", message });

async function main() {
  const { categorySlugs } = await import(pathToFileURL(join(root, "src/lib/tools/categories.ts")).href);
  const { iconNames } = await import(pathToFileURL(join(root, "src/lib/icons.ts")).href);

  const slugs = readdirSync(toolsDir)
    .filter((n) => !n.startsWith("_") && !n.startsWith("."))
    .filter((n) => statSync(join(toolsDir, n)).isDirectory());

  const metas = new Map<string, Record<string, unknown>>();

  for (const slug of slugs) {
    const dir = join(toolsDir, slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) err(slug, "folder name must be a lowercase hyphenated slug");

    for (const f of ["meta.ts", "content.md", "Tool.tsx"]) {
      if (!existsSync(join(dir, f))) err(slug, `missing ${f}`);
    }
    if (!existsSync(join(dir, "meta.ts"))) continue;

    let meta: Record<string, unknown>;
    try {
      const mod = await import(pathToFileURL(join(dir, "meta.ts")).href);
      meta = mod.meta;
      if (!meta) throw new Error("no `meta` export");
    } catch (e) {
      err(slug, `meta.ts failed to load: ${(e as Error).message}`);
      continue;
    }
    metas.set(slug, meta);

    const str = (k: string) => (typeof meta[k] === "string" ? (meta[k] as string) : "");
    if (str("slug") !== slug) err(slug, `meta.slug "${str("slug")}" must equal folder name`);
    if (!str("name")) err(slug, "meta.name is required");
    if (str("name").length > 60) warn(slug, `name is ${str("name").length} chars (keep <= 60)`);
    const title = str("title") || `${str("name")} – Free Online Tool`;
    if (title.length > 65) warn(slug, `title is ${title.length} chars (aim for <= 60)`);
    const d = str("description");
    if (!d) err(slug, "meta.description is required");
    else if (d.length < 120 || d.length > 165) warn(slug, `description is ${d.length} chars (aim for 140-160)`);
    const sd = str("shortDescription");
    if (!sd) err(slug, "meta.shortDescription is required");
    else if (sd.length > 140) warn(slug, `shortDescription is ${sd.length} chars (keep <= 140)`);
    if (!categorySlugs.includes(meta.category)) err(slug, `unknown category "${String(meta.category)}"`);
    if (meta.icon && !iconNames.includes(meta.icon)) err(slug, `unknown icon "${String(meta.icon)}" (see src/lib/icons.ts)`);
    if (!Array.isArray(meta.keywords) || meta.keywords.length < 3) err(slug, "meta.keywords needs at least 3 entries");
    for (const k of ["datePublished", "dateModified"]) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(str(k))) err(slug, `${k} must be YYYY-MM-DD`);
    }
    const faq = Array.isArray(meta.faq) ? (meta.faq as { question?: string; answer?: string }[]) : [];
    if (faq.length < 4) err(slug, `faq has ${faq.length} items (need 4-10)`);
    if (faq.length > 10) warn(slug, `faq has ${faq.length} items (keep <= 10)`);
    faq.forEach((f, i) => {
      if (!f.question?.trim() || !f.answer?.trim()) err(slug, `faq[${i}] is missing question or answer`);
      else if (f.answer.trim().split(/\s+/).length < 15) warn(slug, `faq[${i}] answer is very short (< 15 words)`);
    });

    const contentPath = join(dir, "content.md");
    if (existsSync(contentPath)) {
      const raw = readFileSync(contentPath, "utf8").replace(/^---[\s\S]*?---\s*/, "");
      const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
      if (words < MIN_WORDS) err(slug, `content.md has ${words} words (minimum ${MIN_WORDS})`);
      const h2 = (raw.match(/^##\s+/gm) ?? []).length;
      if (h2 < 3) err(slug, `content.md has ${h2} "## " sections (need at least 3)`);
      if (/^#\s+/m.test(raw)) warn(slug, "content.md contains an H1 (# ) – the page already renders the H1; use ## and ###");
      if (/lorem ipsum/i.test(raw) && slug !== "lorem-ipsum-generator") warn(slug, "content.md contains placeholder text");
      if (/\bTODO\b|\bTBD\b|\[insert/i.test(raw)) err(slug, "content.md contains TODO/TBD/placeholder markers");
    }

    const toolPath = join(dir, "Tool.tsx");
    if (existsSync(toolPath)) {
      const src = readFileSync(toolPath, "utf8");
      if (!/^\s*(["'])use client\1;?/.test(src)) err(slug, 'Tool.tsx must start with "use client"');
      if (!/export\s+default\s+/.test(src)) err(slug, "Tool.tsx needs a default export");
    }
  }

  // cross-tool checks
  for (const [slug, meta] of metas) {
    for (const r of (meta.related as string[] | undefined) ?? []) {
      // Warning, not error: tools ship incrementally and the page skips missing related slugs.
      if (!metas.has(r)) warn(slug, `related slug "${r}" does not exist (link skipped until it ships)`);
      if (r === slug) warn(slug, "related includes itself");
    }
  }
  const names = new Map<string, string>();
  for (const [slug, meta] of metas) {
    const n = String(meta.name).toLowerCase();
    if (names.has(n)) err(slug, `duplicate tool name "${meta.name}" (also ${names.get(n)})`);
    names.set(n, slug);
  }

  // ---- blog posts (content/blog/*.md) ----
  const blogDir = join(root, "content", "blog");
  if (existsSync(blogDir)) {
    const matter = (await import("gray-matter")).default;
    for (const f of readdirSync(blogDir).filter((n) => n.endsWith(".md") && !n.startsWith("_"))) {
      const id = `blog/${f.replace(/\.md$/, "")}`;
      const { data, content } = matter(readFileSync(join(blogDir, f), "utf8"));
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(f)) err(id, "file name must be a lowercase hyphenated slug");
      if (!data.title) err(id, "frontmatter title is required");
      else if (String(data.title).length > 65) warn(id, `title is ${String(data.title).length} chars (aim for <= 60)`);
      const d = String(data.description ?? "");
      if (!d) err(id, "frontmatter description is required");
      else if (d.length < 120 || d.length > 165) warn(id, `description is ${d.length} chars (aim for 140-160)`);
      for (const k of ["date", "updated"]) if (data[k] && !/^\d{4}-\d{2}-\d{2}$/.test(String(data[k]))) err(id, `${k} must be YYYY-MM-DD`);
      if (!data.date) err(id, "frontmatter date is required");
      if (!Array.isArray(data.tags) || !data.tags.length) warn(id, "add at least one tag");
      const words = content.trim() ? content.trim().split(/\s+/).length : 0;
      if (words < 900) err(id, `only ${words} words (minimum 900)`);
      if ((content.match(/^##\s+/gm) ?? []).length < 4) err(id, "needs at least 4 '## ' sections");
      if (/^#\s+/m.test(content)) warn(id, "contains an H1 – the page already renders the title");
      if (/\bTODO\b|\bTBD\b|\[insert/i.test(content)) err(id, "contains TODO/TBD/placeholder markers");
      const related = Array.isArray(data.relatedTools) ? (data.relatedTools as string[]) : [];
      if (!related.length) warn(id, "relatedTools is empty – every guide should link to a tool");
      for (const r of related) if (!metas.has(r)) err(id, `relatedTools slug "${r}" does not exist`);
      const toolLinks = (content.match(/\]\(\/tools\/([a-z0-9-]+)\)/g) ?? []).length;
      if (toolLinks < 2) warn(id, `only ${toolLinks} in-text link(s) to tools (aim for 3+)`);
      for (const m of content.matchAll(/\]\(\/tools\/([a-z0-9-]+)\)/g)) if (!metas.has(m[1])) err(id, `links to missing tool /tools/${m[1]}`);
    }
  }

  const errors = problems.filter((p) => p.level === "error");
  const warns = problems.filter((p) => p.level === "warn");
  for (const p of [...errors, ...warns]) {
    console.log(`${p.level === "error" ? "✖" : "⚠"} [${p.slug}] ${p.message}`);
  }
  console.log(`[validate] ${metas.size} tools checked – ${errors.length} error(s), ${warns.length} warning(s)`);
  if (errors.length && !process.env.TOOL_VALIDATE_SOFT) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
