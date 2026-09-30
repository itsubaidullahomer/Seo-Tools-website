/**
 * Content quality gate for the written pages (tool articles, tool FAQs, blog posts).
 *
 * Google's spam policies target content produced at scale that repeats itself or
 * says nothing specific. This script measures exactly that, instead of guessing:
 *
 *   1. PAIRWISE OVERLAP   – share of 6-word phrases that two articles have in common.
 *                           Fails above MAX_OVERLAP (default 30%).
 *   2. REPEATED BOILERPLATE – 8-word phrases that appear on many different pages
 *                           (a template showing through). Reported as a warning.
 *   3. FILLER PHRASES     – vague "says nothing" wording per article. Warning.
 *
 *   npm run content-check
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const MAX_OVERLAP = Number(process.env.MAX_OVERLAP ?? 0.3);
const BOILERPLATE_MIN_PAGES = Number(process.env.BOILERPLATE_MIN_PAGES ?? 5);
const SHINGLE = 6;
const BOILER_SHINGLE = 8;

interface Doc {
  id: string;
  text: string;
  words: string[];
}

function tokenize(markdown: string): string[] {
  return markdown
    .replace(/^---[\s\S]*?---/, " ") // frontmatter
    .replace(/```[\s\S]*?```/g, " ") // code blocks are data, not prose
    .replace(/\|[^\n]*\|/g, " ") // table rows
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> text
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9'’-]*/g) ?? [];
}

const docs: Doc[] = [];
const toolsDir = join(root, "src", "tools");
for (const slug of readdirSync(toolsDir)) {
  if (slug.startsWith("_") || !statSync(join(toolsDir, slug)).isDirectory()) continue;
  const f = join(toolsDir, slug, "content.md");
  if (!existsSync(f)) continue;
  const text = readFileSync(f, "utf8");
  docs.push({ id: `tools/${slug}`, text, words: tokenize(text) });
}
const blogDir = join(root, "content", "blog");
if (existsSync(blogDir)) {
  for (const f of readdirSync(blogDir)) {
    if (!f.endsWith(".md") || f.startsWith("_")) continue;
    const text = readFileSync(join(blogDir, f), "utf8");
    docs.push({ id: `blog/${f.replace(/\.md$/, "")}`, text, words: tokenize(text) });
  }
}

const shingles = (words: string[], n: number): Set<string> => {
  const s = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) s.add(words.slice(i, i + n).join(" "));
  return s;
};

// ---------- 1. pairwise overlap ----------
const sets = docs.map((d) => shingles(d.words, SHINGLE));
const pairs: { a: string; b: string; overlap: number }[] = [];
for (let i = 0; i < docs.length; i++) {
  for (let j = i + 1; j < docs.length; j++) {
    const [small, large] = sets[i].size <= sets[j].size ? [sets[i], sets[j]] : [sets[j], sets[i]];
    let shared = 0;
    for (const s of small) if (large.has(s)) shared++;
    pairs.push({ a: docs[i].id, b: docs[j].id, overlap: small.size ? shared / small.size : 0 });
  }
}
pairs.sort((x, y) => y.overlap - x.overlap);
const worst = pairs.slice(0, 5);
const failing = pairs.filter((p) => p.overlap > MAX_OVERLAP);

// ---------- 2. repeated boilerplate ----------
const pageCount = new Map<string, Set<string>>();
for (const d of docs) {
  for (const s of shingles(d.words, BOILER_SHINGLE)) {
    let set = pageCount.get(s);
    if (!set) pageCount.set(s, (set = new Set()));
    set.add(d.id);
  }
}
const repeated = [...pageCount.entries()].filter(([, p]) => p.size >= BOILERPLATE_MIN_PAGES).sort((a, b) => b[1].size - a[1].size);
// collapse overlapping shingles into readable runs
const runs: { text: string; pages: number }[] = [];
for (const [s, p] of repeated) {
  const last = runs[runs.length - 1];
  const tail = last?.text.split(" ").slice(-(BOILER_SHINGLE - 1)).join(" ");
  if (last && tail === s.split(" ").slice(0, BOILER_SHINGLE - 1).join(" ") && Math.abs(last.pages - p.size) <= 1) {
    last.text += " " + s.split(" ").at(-1);
  } else runs.push({ text: s, pages: p.size });
}

// ---------- 3. filler phrases ----------
const FILLER: [string, RegExp][] = [
  ["in today's … world", /\bin today'?s\b/g],
  ["it is important to note", /\bit(?:'s| is) (?:important|worth) (?:to note|noting)\b/g],
  ["delve", /\bdelv(?:e|es|ing)\b/g],
  ["seamless", /\bseamless(?:ly)?\b/g],
  ["robust", /\brobust\b/g],
  ["leverage", /\bleverag(?:e|es|ing)\b/g],
  ["game-changer", /\bgame[- ]chang(?:er|ing)\b/g],
  ["look no further", /\blook no further\b/g],
  ["comprehensive guide", /\bcomprehensive guide\b/g],
  ["ever-evolving", /\bever[- ](?:evolving|changing)\b/g],
  ["landscape", /\b(?:digital|seo|online) landscape\b/g],
  ["plays a crucial role", /\bplays? a (?:crucial|vital|key|pivotal) role\b/g],
  ["whether you're … or", /\bwhether you(?:'re| are)\b/g],
  ["in conclusion", /\bin conclusion\b/g],
  ["unlock", /\bunlock(?:s|ing)? the\b/g],
];
const fillerReport: { id: string; total: number; hits: string[] }[] = [];
for (const d of docs) {
  const lower = d.text.toLowerCase();
  let total = 0;
  const hits: string[] = [];
  for (const [label, re] of FILLER) {
    const n = (lower.match(re) ?? []).length;
    if (n) {
      total += n;
      hits.push(`${label}×${n}`);
    }
  }
  if (total) fillerReport.push({ id: d.id, total, hits });
}
fillerReport.sort((a, b) => b.total - a.total);

// ---------- report ----------
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
console.log(`\nContent quality – ${docs.length} articles (${docs.reduce((n, d) => n + d.words.length, 0).toLocaleString()} words)\n`);
console.log(`1. Pairwise overlap (limit ${pct(MAX_OVERLAP)}); most similar pairs:`);
for (const p of worst) console.log(`   ${pct(p.overlap).padStart(6)}  ${p.a}  ↔  ${p.b}`);
console.log(failing.length ? `   ✖ ${failing.length} pair(s) above the limit` : "   ✓ no pair above the limit");

console.log(`\n2. Phrases repeated on ${BOILERPLATE_MIN_PAGES}+ different pages (template showing through): ${runs.length}`);
for (const r of runs.slice(0, 12)) console.log(`   ${String(r.pages).padStart(3)} pages  “${r.text}”`);
if (runs.length > 12) console.log(`   … and ${runs.length - 12} more`);

console.log(`\n3. Filler phrases: ${fillerReport.length} article(s) with at least one`);
for (const f of fillerReport.slice(0, 8)) console.log(`   ${String(f.total).padStart(3)}  ${f.id}  (${f.hits.join(", ")})`);

process.exit(failing.length ? 1 : 0);
