import "server-only";

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { countWords } from "@/lib/utils";
import { extractHeadings } from "@/lib/markdown";

/**
 * Blog posts live in content/blog/<slug>.md with frontmatter:
 *   title, description, date (YYYY-MM-DD), updated?, tags?: string[], relatedTools?: string[]
 */
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string;
  tags: string[];
  relatedTools: string[];
  markdown: string;
  wordCount: number;
  readingMinutes: number;
  headings: { id: string; text: string }[];
}

const blogDir = join(process.cwd(), "content", "blog");

async function readPost(file: string): Promise<BlogPost | null> {
  const slug = file.replace(/\.md$/, "");
  const raw = await readFile(join(blogDir, file), "utf8");
  const { content, data } = matter(raw);
  if (!data.title || !data.description || !data.date || data.draft) return null;
  const wordCount = countWords(content);
  return {
    slug,
    title: String(data.title),
    description: String(data.description),
    date: String(data.date),
    updated: String(data.updated ?? data.date),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    relatedTools: Array.isArray(data.relatedTools) ? data.relatedTools.map(String) : [],
    markdown: content,
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / 220)),
    headings: extractHeadings(content),
  };
}

export async function getAllPosts(): Promise<BlogPost[]> {
  if (!existsSync(blogDir)) return [];
  const files = (await readdir(blogDir)).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  const posts = (await Promise.all(files.map(readPost))).filter((p): p is BlogPost => p !== null);
  return posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = `${slug}.md`;
  if (!existsSync(join(blogDir, file))) return null;
  return readPost(file);
}
