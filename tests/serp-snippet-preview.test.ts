import { test } from "node:test";
import assert from "node:assert/strict";
import { FONT_PX, GEOMETRY, LIMITS, NEAR_RATIO } from "../src/tools/serp-snippet-preview/config";
import { BOLD_LAYOUT_FACTOR, charCount, cutToBudget, normalizeText, textWidth, toPieces, wrapPieces } from "../src/tools/serp-snippet-preview/measure";
import { boldSpans, buildChecks, buildLayout, countTermHits, formatSnippetDate, parseUrl, queryTerms, type LayoutInput } from "../src/tools/serp-snippet-preview/snippet";
import { AB_EXAMPLE, DEFAULT_FIELDS, decodeEntities, decodeHash, encodeHash, extractHeadTags, headTags, DEFAULT_PREFS } from "../src/tools/serp-snippet-preview/state";
import { DEFAULT_LIMITS as CHECKER_LIMITS } from "../src/tools/title-meta-description-length-checker/limits";

const text = (lines: { text: string }[][]) => lines.map((l) => l.map((r) => r.text).join("")).join("\n");
const base: LayoutInput = {
  title: DEFAULT_FIELDS.title,
  description: DEFAULT_FIELDS.description,
  url: DEFAULT_FIELDS.url,
  siteName: DEFAULT_FIELDS.siteName,
  date: "",
  query: DEFAULT_FIELDS.query,
};

test("article table: budgets, font sizes and line counts", () => {
  assert.deepEqual(LIMITS, { title: { desktop: 600, mobile: 540 }, description: { desktop: 920, mobile: 680 } });
  assert.equal(FONT_PX.title, 20);
  assert.equal(FONT_PX.description, 14);
  assert.equal(GEOMETRY.desktop.titleLines, 1);
  assert.equal(GEOMETRY.mobile.titleLines, 2);
  assert.equal(GEOMETRY.desktop.descriptionLines, 2);
  assert.equal(GEOMETRY.mobile.descriptionLines, 3);
  assert.equal(NEAR_RATIO, 0.95); // amber within 5 percent of the limit
  assert.equal(BOLD_LAYOUT_FACTOR, 1.07);
});

test("article: the budgets are the same ones the length checker uses", () => {
  assert.equal(CHECKER_LIMITS.title.desktop, LIMITS.title.desktop);
  assert.equal(CHECKER_LIMITS.title.mobile, LIMITS.title.mobile);
  assert.equal(CHECKER_LIMITS.description.desktop, LIMITS.description.desktop);
  assert.equal(CHECKER_LIMITS.description.mobile, LIMITS.description.mobile);
});

test("article worked example: the title is 52 characters and about 506 px; 94% of mobile, two lines", () => {
  assert.equal(charCount(base.title), 52);
  assert.equal(Math.round(textWidth(base.title, 20)), 506);
  assert.equal(Math.round((textWidth(base.title, 20) / 540) * 100), 94);
  const mobile = buildLayout(base, "mobile");
  assert.equal(mobile.titleLines.length, 2);
  assert.equal(mobile.titleCut, false);
  assert.equal(buildLayout(base, "desktop").titleCut, false);
});

test("article worked example: adding ' | Crumb & Crust' makes 654 px, cut after 'Crumb'", () => {
  const t = `${base.title} | Crumb & Crust`;
  assert.equal(Math.round(textWidth(t, 20)), 654);
  const d = buildLayout({ ...base, title: t }, "desktop");
  assert.ok(d.titleCut);
  assert.ok(text(d.titleLines).endsWith("Day-by-Day Guide | Crumb..."));
});

test("article worked example: 125-character, 765 px description fits desktop, not mobile; date costs ~105 px", () => {
  assert.equal(charCount(base.description), 125);
  assert.equal(Math.round(textWidth(base.description, 14)), 765);
  assert.equal(buildLayout(base, "desktop").descriptionCut, false);
  const m = buildLayout(base, "mobile");
  assert.equal(m.descriptionCut, true);
  assert.ok(text(m.descriptionLines).endsWith("and..."));
  const withDate = buildLayout({ ...base, date: "2026-09-12" }, "mobile");
  assert.equal(Math.round(withDate.dateWidth), 105);
  assert.ok(text(withDate.descriptionLines).startsWith("Sep 12, 2026 — "));
  assert.ok(text(withDate.descriptionLines).replace(/\n/g, " ").endsWith("what the..."));
});

test("article before/after table", () => {
  const blog = AB_EXAMPLE.title!;
  assert.equal(Math.round(textWidth(blog, 20)), 933);
  assert.ok(text(buildLayout({ ...base, title: blog }, "desktop").titleLines).endsWith("Tips for..."));
  const plumber = "Plumber Austin TX | Austin Plumbers | Emergency Plumber Austin | Best Plumbing Services Austin Texas";
  assert.equal(Math.round(textWidth(plumber, 20)), 936);
  assert.ok(text(buildLayout({ ...base, title: plumber }, "desktop").titleLines).endsWith("Emergency Plumber..."));
  assert.equal(Math.round(textWidth("Emergency Plumber in Austin, TX | Bluebonnet Plumbing", 20)), 507);
  const desc = AB_EXAMPLE.description!;
  assert.equal(Math.round(textWidth(desc, 14)), 1100);
  assert.ok(text(buildLayout({ ...base, description: desc }, "desktop").descriptionLines).endsWith("find out..."));
});

test("address line: desktop shows protocol and path with arrows, mobile only the domain", () => {
  assert.equal(buildLayout(base, "desktop").crumb, "https://example.com › guides › sourdough-starter-schedule");
  assert.equal(buildLayout(base, "mobile").crumb, "example.com");
  assert.deepEqual(parseUrl("www.example.com/a/b%20c"), { empty: false, valid: true, host: "example.com", segments: ["a", "b c"] });
  assert.equal(parseUrl("not a url").valid, false);
  assert.equal(buildLayout({ ...base, siteName: "" }, "desktop").siteName, "example.com");
});

test("query words are bolded as whole words, with plural forms", () => {
  assert.deepEqual(queryTerms("Sourdough  starter schedule a"), ["sourdough", "starter", "schedule"]);
  const spans = boldSpans("Starters and a schedule for sourdough", ["starter", "schedule"]);
  assert.deepEqual(
    spans.filter((s) => s.style === "bold").map((s) => s.text),
    ["Starters", "schedule"],
  );
  assert.equal(countTermHits("restarter", ["starter"]), 0);
});

test("truncation: cut with room for the ellipsis, back up to a whole word", () => {
  const { pieces } = toPieces([{ text: "alpha beta gamma delta", style: "regular" }], 20);
  const budget = textWidth("alpha beta gam", 20);
  const ell = textWidth("...", 20);
  const cut = cutToBudget(pieces, budget, ell);
  assert.ok(cut.truncated);
  // "alpha beta..." fits because three dots are narrower than " gam"; the partial word is dropped.
  assert.equal(cut.kept.map((p) => p.c).join(""), "alpha beta");
  const tight = cutToBudget(pieces, textWidth("alpha be", 20), ell);
  assert.equal(tight.kept.map((p) => p.c).join(""), "alpha");
  // Bold words take ~7% more room when lines wrap.
  const plain = toPieces([{ text: "aaaa aaaa", style: "regular" }], 14).pieces;
  const bold = toPieces([{ text: "aaaa aaaa", style: "bold" }], 14).pieces;
  const width = textWidth("aaaa aaaa", 14) + 1;
  assert.equal(wrapPieces(plain, width).length, 1);
  assert.equal(wrapPieces(bold, width).length, 2);
});

test("checks: cut titles fail on desktop, fit cases pass, capitals and repeats are flagged", () => {
  const layouts = (i: LayoutInput) => ({ desktop: buildLayout(i, "desktop"), mobile: buildLayout(i, "mobile") });
  const ok = buildChecks(base, layouts(base));
  assert.equal(ok.find((c) => c.id === "title-fit")?.level, "pass"); // 94% of mobile is under the 95% warning line
  const near = { ...base, title: `${base.title} Now` };
  assert.equal(buildChecks(near, layouts(near)).find((c) => c.id === "title-fit")?.level, "warn");
  const long = { ...base, title: AB_EXAMPLE.title! };
  assert.equal(buildChecks(long, layouts(long)).find((c) => c.id === "title-fit")?.level, "fail");
  const caps = { ...base, title: "SOURDOUGH STARTER GUIDE" };
  assert.ok(buildChecks(caps, layouts(caps)).some((c) => c.id === "caps"));
  const rep = { ...base, description: `${base.title} and more` };
  assert.ok(buildChecks(rep, layouts(rep)).some((c) => c.id === "repeat"));
});

test("dates: 'Sep 12, 2026' and invalid dates rejected", () => {
  assert.equal(formatSnippetDate("2026-09-12"), "Sep 12, 2026");
  assert.equal(formatSnippetDate("2026-02-30"), null);
  assert.equal(formatSnippetDate("2024-02-29"), "Feb 29, 2024");
});

test("pasted head tags are read and entities decoded; HTML output is escaped", () => {
  const pasted = `<title>Tips &amp; Tricks</title>\n<meta name="description" content="Bread &lt;3 &#x2014; done">`;
  assert.deepEqual(extractHeadTags(pasted), { title: "Tips & Tricks", description: "Bread <3 — done" });
  assert.equal(extractHeadTags("plain text"), null);
  assert.equal(decodeEntities("&hellip;&nbsp;&bogus;"), "…\u0020&bogus;"); // &nbsp; becomes a plain space (same width)
  assert.equal(headTags("A & B", 'Say "hi"'), '<title>A &amp; B</title>\n<meta name="description" content="Say &quot;hi&quot;">');
});

test("share link round-trips the text and leaves out the favicon", () => {
  const fields = { ...DEFAULT_FIELDS, favicon: "data:image/png;base64,AAAA", date: "2026-09-12" };
  const hash = encodeHash(fields, { ...DEFAULT_PREFS, compare: true });
  assert.ok(!hash.includes("data"));
  const back = decodeHash(`#${hash}`);
  assert.equal(back.found, true);
  assert.equal(back.fields.title, fields.title);
  assert.equal(back.fields.date, "2026-09-12");
  assert.equal(back.prefs.compare, true);
  assert.equal(back.fields.favicon, undefined);
});

test("whitespace is collapsed like HTML", () => {
  assert.equal(normalizeText("  a\n\tb   c "), "a b c");
});
