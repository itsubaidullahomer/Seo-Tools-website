import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { countWords } from "@/lib/utils";
import { extractHeadings } from "@/lib/markdown";

export interface ToolContent {
  /** Markdown body (frontmatter stripped). */
  markdown: string;
  /** Optional frontmatter fields authors may add. */
  data: Record<string, unknown>;
  wordCount: number;
  /** Table of contents built from `## ` headings. */
  headings: { id: string; text: string }[];
}

const toolsRoot = join(process.cwd(), "src", "tools");

/** Load `src/tools/<slug>/content.md` at build time. */
export async function getToolContent(slug: string): Promise<ToolContent> {
  const file = join(toolsRoot, slug, "content.md");
  const raw = await readFile(file, "utf8");
  const { content, data } = matter(raw);
  return {
    markdown: content,
    data,
    wordCount: countWords(content),
    headings: extractHeadings(content),
  };
}
