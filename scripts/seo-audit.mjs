/**
 * Crawl a running copy of the site and check every page in its sitemap for the
 * things that decide whether Google (and AI search) can find, understand and
 * trust it.
 *
 *   npm run build && npx next start -p 3200      # in one terminal
 *   node scripts/seo-audit.mjs http://localhost:3200
 *
 * Exits 1 when any ERROR is found. WARN items are advice.
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");

const errors = [];
const warns = [];
const err = (url, msg) => errors.push({ url, msg });
const warn = (url, msg) => warns.push({ url, msg });

const get = async (path, init) => {
  const res = await fetch(base + path, { redirect: "manual", ...init });
  return { res, text: await res.text() };
};

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const meta = (html, re) => {
  const m = html.match(re);
  return m ? decode(m[1]) : null;
};

// ---------- site-level ----------
const sitemap = await get("/sitemap.xml");
const locs = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!locs.length) {
  err("/sitemap.xml", "no URLs found");
}
const origin = locs[0] ? new URL(locs[0]).origin : "";

const robots = await get("/robots.txt");
if (/Disallow:\s*\/_next/i.test(robots.text)) err("/robots.txt", "blocks /_next/ – Googlebot needs those CSS/JS files to render pages");
if (/Disallow:\s*\/\s*$/im.test(robots.text)) err("/robots.txt", "disallows the whole site");
if (!/Sitemap:/i.test(robots.text)) err("/robots.txt", "no Sitemap: line");

for (const p of ["/llms.txt", "/ads.txt"]) {
  const r = await get(p);
  if (r.res.status !== 200) warn(p, `missing (HTTP ${r.res.status})`);
}
const notFound = await get("/this-page-does-not-exist-" + Date.now());
if (notFound.res.status !== 404) err("/(404 page)", `unknown URL returned HTTP ${notFound.res.status}, expected 404 (soft-404s hurt indexing)`);

// ---------- per page ----------
const titles = new Map();
const descriptions = new Map();
const summary = { pages: 0, tools: 0, words: [], internalLinks: [] };

for (const loc of locs) {
  const path = new URL(loc).pathname;
  const { res, text: html } = await get(path);
  summary.pages++;
  if (res.status !== 200) {
    err(path, `HTTP ${res.status}`);
    continue;
  }
  const isTool = /^\/tools\/[^/]+$/.test(path);
  if (isTool) summary.tools++;

  if (!/<html[^>]*\slang="[a-z]/i.test(html)) err(path, "missing <html lang>");

  const title = meta(html, /<title>([^<]*)<\/title>/i);
  if (!title) err(path, "missing <title>");
  else {
    if (title.length > 70) warn(path, `title is ${title.length} chars (may be truncated): "${title}"`);
    if (title.length < 20) warn(path, `title is short (${title.length}): "${title}"`);
    titles.set(title, [...(titles.get(title) ?? []), path]);
  }

  const desc = meta(html, /<meta name="description" content="([^"]*)"/i);
  if (!desc) err(path, "missing meta description");
  else {
    if (desc.length < 70 || desc.length > 175) warn(path, `meta description is ${desc.length} chars`);
    descriptions.set(desc, [...(descriptions.get(desc) ?? []), path]);
  }

  const canonical = meta(html, /<link rel="canonical" href="([^"]*)"/i);
  if (!canonical) err(path, "missing canonical");
  else if (canonical.replace(/\/$/, "") !== loc.replace(/\/$/, "")) err(path, `canonical ${canonical} differs from sitemap URL ${loc}`);

  const robotsMeta = meta(html, /<meta name="robots" content="([^"]*)"/i) ?? "";
  if (/noindex/i.test(robotsMeta)) err(path, `in the sitemap but marked noindex (${robotsMeta})`);

  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) err(path, `${h1s} <h1> elements (need exactly 1)`);

  for (const tag of ['property="og:title"', 'property="og:description"', 'property="og:image"', 'name="twitter:card"']) {
    if (!html.includes(tag)) warn(path, `missing ${tag}`);
  }

  const imgsNoAlt = (html.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) ?? []).length;
  if (imgsNoAlt) warn(path, `${imgsNoAlt} <img> without alt`);

  // JSON-LD
  const types = new Set();
  let faqSchemaCount = 0;
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const doc = JSON.parse(m[1]);
      const nodes = doc["@graph"] ?? [doc];
      for (const n of nodes) {
        types.add(n["@type"]);
        if (n["@type"] === "FAQPage") faqSchemaCount = n.mainEntity?.length ?? 0;
      }
    } catch (e) {
      err(path, `invalid JSON-LD: ${e.message}`);
    }
  }
  if (!types.has("BreadcrumbList") && path !== "/") warn(path, "no BreadcrumbList schema");
  if (isTool) {
    for (const t of ["WebApplication", "FAQPage", "BreadcrumbList"]) if (!types.has(t)) err(path, `tool page missing ${t} schema`);
    // Count only the FAQ section – tools may use <details> in their own UI.
    const faqStart = html.indexOf('id="faq-heading"');
    const faqHtml = faqStart >= 0 ? html.slice(faqStart, html.indexOf("</section>", faqStart)) : "";
    const visibleFaq = (faqHtml.match(/<details[\s>]/g) ?? []).length;
    if (faqSchemaCount && visibleFaq !== faqSchemaCount) err(path, `FAQ schema has ${faqSchemaCount} questions but ${visibleFaq} are visible (Google requires markup to match visible content)`);
  }

  // Visible text + links
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const words = decode(body).split(/\s+/).filter(Boolean).length;
  const internal = new Set([...html.matchAll(/<a [^>]*href="(\/[^"#?]*)/g)].map((m) => m[1]));
  summary.words.push(words);
  summary.internalLinks.push(internal.size);
  if (isTool && words < 1100) warn(path, `only ${words} visible words`);
  if (internal.size < 15) warn(path, `only ${internal.size} distinct internal links`);
}

for (const [map, label] of [[titles, "title"], [descriptions, "meta description"]]) {
  for (const [value, paths] of map) if (paths.length > 1) err(paths.join(", "), `duplicate ${label}: "${value.slice(0, 80)}"`);
}

// ---------- report ----------
const avg = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);
console.log(`\nAudited ${summary.pages} pages (${summary.tools} tool pages) at ${base}  [sitemap origin: ${origin}]`);
console.log(`Average visible words: ${avg(summary.words)} · average distinct internal links per page: ${avg(summary.internalLinks)}\n`);
for (const { url, msg } of errors) console.log(`✖ ${url}  ${msg}`);
for (const { url, msg } of warns) console.log(`⚠ ${url}  ${msg}`);
console.log(`\n${errors.length} error(s), ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
