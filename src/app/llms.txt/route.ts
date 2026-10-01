import { absoluteUrl, siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/blog";
import { categories } from "@/lib/tools/categories";
import { getToolsByCategory, toolPath } from "@/lib/tools/registry";

export const dynamic = "force-static";

/**
 * /llms.txt – a plain-markdown map of the site for AI assistants and crawlers
 * (the llms.txt convention). Generated from the tool registry, so it is always
 * complete. No search engine has confirmed it affects rankings or citations;
 * it is cheap, harmless and makes the site easy to ingest.
 */
export async function GET() {
  const posts = await getAllPosts();
  const lines: string[] = [];

  lines.push(`# ${siteConfig.name}`, "");
  lines.push(`> ${siteConfig.description}`, "");
  lines.push(
    `${siteConfig.name} is a collection of free online tools that run entirely in the visitor's browser: no sign-up, no uploads, no usage quotas. ` +
      `Each tool page contains the working tool, a plain-English explanation of how the result is calculated with worked examples, a reference table where useful, and answers to common questions. ` +
      `Content is maintained by ${siteConfig.author.name}; contact ${siteConfig.contactEmail}.`,
    "",
  );

  for (const category of categories) {
    const tools = getToolsByCategory(category.slug);
    if (!tools.length) continue;
    lines.push(`## ${category.name}`, "");
    for (const tool of tools) {
      lines.push(`- [${tool.name}](${absoluteUrl(toolPath(tool.slug))}): ${tool.shortDescription}`);
    }
    lines.push("");
  }

  if (posts.length) {
    lines.push("## Guides", "");
    for (const post of posts) lines.push(`- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)}): ${post.description}`);
    lines.push("");
  }

  lines.push("## About", "");
  lines.push(`- [About ${siteConfig.name}](${absoluteUrl("/about")}): who runs the site and the principles behind it`);
  lines.push(`- [Privacy Policy](${absoluteUrl("/privacy-policy")}): what is and is not collected`);
  lines.push(`- [Contact](${absoluteUrl("/contact")}): report a bug or suggest a tool`, "");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
