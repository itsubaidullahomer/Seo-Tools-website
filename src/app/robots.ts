import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";

/**
 * Everything public is crawlable – including /_next/ (Googlebot needs the CSS
 * and JavaScript there to render the pages) and the AI search crawlers, so the
 * site can be found and cited by Google, ChatGPT, Gemini, Perplexity, Claude
 * and Bing-powered assistants.
 *
 * The explicit AI-bot entries change nothing today (they would be allowed by the
 * wildcard rule anyway) but record the decision and keep it stable if the
 * wildcard rule is ever tightened. To opt out of AI *training* while staying in
 * AI *search*, move GPTBot, ClaudeBot, Google-Extended, Applebot-Extended and
 * CCBot to a `disallow: "/"` rule and keep the search/user bots allowed.
 */
const AI_SEARCH_AND_USER_BOTS = ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "Claude-SearchBot", "Claude-User"];
const AI_TRAINING_BOTS = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot"];

export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
      { userAgent: AI_SEARCH_AND_USER_BOTS, allow: "/" },
      { userAgent: AI_TRAINING_BOTS, allow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
