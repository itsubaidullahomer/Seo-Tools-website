import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LIMITS, FONT_PX, MAX_BULK_ROWS, MAX_FIELD_CHARS, NEAR_RATIO, sanitizeLimits } from "../src/tools/title-meta-description-length-checker/limits";
import {
  analyzeField,
  analyzeKeyword,
  composeTitle,
  descriptionChecks,
  ellipsisWidth,
  extractFromHtml,
  metaDescriptionTag,
  normalizeText,
  pixelWidth,
  roomForPageTitle,
  statusLabel,
  titleChecks,
  titleTag,
} from "../src/tools/title-meta-description-length-checker/logic";
import { BULK_EXAMPLE, analyzeBulk, csvCell, parseBulk, resultsToCsv } from "../src/tools/title-meta-description-length-checker/bulk";

const r = Math.round;

test("article table: budgets and font sizes", () => {
  assert.deepEqual(DEFAULT_LIMITS, { title: { desktop: 600, mobile: 540 }, description: { desktop: 920, mobile: 680 } });
  assert.deepEqual(FONT_PX, { title: 20, description: 14 });
  assert.equal(NEAR_RATIO, 0.95);
  assert.equal(MAX_FIELD_CHARS, 20000);
  assert.equal(MAX_BULK_ROWS, 5000);
});

test("article: why pixels matter – W versus i", () => {
  assert.equal(r(pixelWidth("WWWW", 20)), 76);
  assert.equal(r(pixelWidth("iiii", 20)), 18);
  assert.ok(pixelWidth("WWWW", 20) / pixelWidth("iiii", 20) > 4);
  assert.equal(r(pixelWidth("W".repeat(30), 20)), 566);
  assert.equal(r(pixelWidth("i".repeat(30), 20)), 133);
});

test("article: same 48 characters in capitals are about 37% wider", () => {
  const t = "How to write a meta description that gets clicks";
  assert.equal(t.length, 48);
  assert.equal(r(pixelWidth(t, 20)), 416);
  assert.equal(r(pixelWidth(t.toUpperCase(), 20)), 570);
  assert.equal(r((pixelWidth(t.toUpperCase(), 20) / pixelWidth(t, 20) - 1) * 100), 37);
});

test("article worked example: Pruning Shears title", () => {
  const base = "Pruning Shears: Bypass and Anvil Types Compared";
  assert.equal(r(pixelWidth(base, 20)), 461);
  const full = composeTitle(base, "Example Co", " | ", "suffix");
  assert.equal(full, `${base} | Example Co`);
  const res = analyzeField(full, "title", "desktop");
  assert.equal(r(res.width), 587);
  assert.equal(r(res.view.remaining), 13);
  assert.equal(res.status, "good");
  assert.equal(res.near, true);
  assert.equal(statusLabel(res.status, res.near), "Tight fit");
  const mobile = res.byDevice.mobile;
  assert.ok(mobile.truncated);
  assert.equal(mobile.hidden, "Example Co");
  // The brand builder shows the room left for the page-specific part.
  const spacePx = (569 * 20) / 2048;
  assert.equal(r(roomForPageTitle("Example Co", " | ", 600)), r(600 - pixelWidth("Example Co |", 20) - spacePx));
  assert.equal(roomForPageTitle("", " | ", 600), 600);
});

test("article: the ellipsis costs about 17 px at 20 px", () => {
  assert.equal(r(ellipsisWidth(20)), 17);
});

test("article: separator widths at 20 px", () => {
  const cost = (sep: string) => r(pixelWidth(`a${sep}b`, 20) - pixelWidth("ab", 20));
  assert.equal(cost(" | "), 16);
  assert.equal(cost(" - "), 18);
  assert.equal(cost(" – "), 22);
  assert.equal(cost(" — "), 31);
});

test("article: good and truncated titles by page type", () => {
  const rows: [string, number, boolean, string?][] = [
    ["Buy Running Shoes Online | Best Running Shoes for Men, Women and Kids | Cheap Running Shoes Sale | Example Store", 1086, true, "for Men,"],
    ["Trail Running Shoes for Wide Feet | Example Store", 454, false],
    ["Example Plumbing in Austin: Emergency Repairs, Water Heaters, Drain Cleaning, Leak Detection and More", 954, true],
    ["Emergency Plumber in Austin, TX | Example Plumbing", 483, false],
    ["Sourdough Starter: A Complete Beginner's Guide to Feeding, Troubleshooting, Baking and Storing Your Starter", 986, true],
    ["Sourdough Starter Feeding Schedule: A Day-by-Day Guide", 525, false],
  ];
  for (const [title, width, long, cutAfter] of rows) {
    const res = analyzeField(title, "title", "desktop");
    assert.equal(r(res.width), width, title);
    assert.equal(res.status === "long", long, title);
    if (cutAfter) assert.ok(res.view.visible.endsWith(cutAfter), `${title} visible ends "${res.view.visible.slice(-20)}"`);
  }
});

test("article: description examples", () => {
  const long = analyzeField(
    "Our extensive range of trail running shoes includes styles for men, women and kids in every size and colour, with free delivery on orders over $50, easy returns and a price match guarantee on every pair we sell online.",
    "description",
    "desktop",
  );
  assert.equal(r(long.width), 1344);
  assert.ok(long.byDevice.desktop.visible.endsWith("over $50,"));
  assert.ok(long.byDevice.mobile.visible.endsWith("size and"));

  const tight = analyzeField(
    "Trail running shoes in wide fits, with rock plates and deep lugs. Compare grip and cushioning before you buy.",
    "description",
    "mobile",
  );
  assert.equal(r(tight.width), 675);
  assert.equal(tight.byDevice.desktop.truncated, false);
  assert.equal(tight.byDevice.mobile.truncated, false);
  assert.equal(tight.near, true);

  const local = analyzeField(
    "Burst pipe or no hot water? A licensed Austin plumber can be at your door within the hour. Upfront pricing and a one-year repair guarantee.",
    "description",
    "desktop",
  );
  assert.equal(r(local.width), 861);
  assert.equal(local.byDevice.desktop.truncated, false);
  assert.ok(local.byDevice.mobile.visible.endsWith("Upfront pricing"));
});

test("FAQ: about 6 px per character of prose, so ~140-155 / ~105-115 description characters", () => {
  const prose = "Learn how to choose, prune and care for fruit trees in a small garden, with simple steps for every season and tips that save time and money.";
  const perChar = pixelWidth(prose, 14) / prose.length;
  assert.ok(perChar > 5.8 && perChar < 6.6);
  const fitDesktop = 920 / perChar;
  const fitMobile = 680 / perChar;
  assert.ok(fitDesktop >= 140 && fitDesktop <= 160, String(fitDesktop));
  assert.ok(fitMobile >= 103 && fitMobile <= 117, String(fitMobile));
});

test("status: empty, short, good, long; whitespace collapsed", () => {
  assert.equal(analyzeField("", "title", "desktop").status, "empty");
  assert.equal(analyzeField("Short title", "title", "desktop").status, "short");
  assert.equal(analyzeField("A specific and useful page title for testing", "title", "desktop").status, "good");
  const ws = analyzeField("line one\n\n  line   two", "description", "desktop");
  assert.equal(ws.text, "line one line two");
  assert.equal(ws.collapsedWhitespace, true);
  assert.equal(normalizeText(" a\tb\r\nc  d "), "a b c d");
});

test("pasted tags are read and entities decoded; copied tags are escaped", () => {
  assert.deepEqual(extractFromHtml("<title>Tips &amp; Tricks</title>", "title"), { text: "Tips & Tricks", extracted: true });
  assert.deepEqual(extractFromHtml(`<meta content='Say &quot;hi&quot;' name="description">`, "description"), { text: 'Say "hi"', extracted: true });
  assert.equal(titleTag('A & B <C> "D"'), "<title>A &amp; B &lt;C&gt; &quot;D&quot;</title>");
  assert.equal(metaDescriptionTag("x & y"), '<meta name="description" content="x &amp; y">');
});

test("keyword track: survives the cut or not, front-loaded or not", () => {
  const res = analyzeField("Pruning Shears: Bypass and Anvil Types Compared | Example Co", "title", "mobile");
  const kw = analyzeKeyword(res, "pruning shears");
  assert.equal(kw?.match, "exact");
  assert.equal(kw?.visible, true);
  assert.equal(kw?.front, true);
  const late = analyzeKeyword(res, "example co");
  assert.equal(late?.visible, false);
});

test("checklist: generic labels, capitals, stuffing and stale years", () => {
  const ids = (t: string) => titleChecks(analyzeField(t, "title", "desktop"), { year: 2026 }).filter((c) => c.level !== "pass").map((c) => c.id);
  assert.ok(ids("Home").includes("generic"));
  assert.ok(ids("BEST GARDEN TOOLS FOR EVERY SEASON").includes("caps"));
  assert.ok(ids("Garden tools, garden hoses, garden gloves and more").includes("stuffing"));
  assert.ok(ids("Best Garden Tools of 2019 Reviewed and Compared").includes("year"));
  const d = descriptionChecks(analyzeField("Buy now!!! The best tools online for every garden and every gardener.", "description", "desktop"));
  assert.equal(d.find((c) => c.id === "tone")?.level, "warn");
});

test("bulk: crawler headers, duplicates, cap and formula-safe CSV", () => {
  const parsed = parseBulk("Address,Title 1,Meta Description 1\nhttps://a.com/,Same,Desc one long enough to pass the short check easily ok\nhttps://a.com/b,same,Desc two");
  assert.equal(parsed.hasHeader, true);
  assert.equal(parsed.layout, "URL, Title, Description");
  const { results, summary } = analyzeBulk(parsed.rows, "desktop", DEFAULT_LIMITS, 2026);
  assert.deepEqual(results[0].duplicateTitleWith, [2]);
  assert.equal(summary.duplicateTitleRows, 2);
  assert.equal(parseBulk("a\nb\nc", 2).capped, true);
  assert.equal(csvCell("=1+1"), "'=1+1");
  assert.equal(csvCell("-5"), "'-5");
  assert.equal(csvCell("@x"), "'@x");
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  const ex = analyzeBulk(parseBulk(BULK_EXAMPLE).rows, "desktop", DEFAULT_LIMITS, 2026);
  assert.equal(ex.results.length, 6);
  assert.ok(resultsToCsv(ex.results, "desktop").split("\n")[0].endsWith(",device"));
});

test("adjusted limits are sanitised", () => {
  assert.deepEqual(sanitizeLimits({ title: { desktop: 50, mobile: 700 } }), { title: { desktop: 600, mobile: 700 }, description: { desktop: 920, mobile: 680 } });
});
