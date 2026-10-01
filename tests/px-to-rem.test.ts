import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildTable,
  convertCss,
  convertSingle,
  DEFAULT_ROOT,
  formatNum,
  matchProp,
  maskProtected,
  MAX_ROOT,
  MAX_VALUE,
  modeFromHash,
  parseIgnoreList,
  parseLength,
  parseRoot,
  rootAsPercent,
  tableToCsv,
  tailwindFor,
  type BulkOptions,
} from "../src/tools/px-to-rem/logic";

const pxToRem = (px: number, root = 16, d = 4) => formatNum(convertSingle(px, "px-to-rem", root, root).rem, d);
const remToPx = (rem: number, root = 16, d = 4) => formatNum(convertSingle(rem, "rem-to-px", root, root).px, d);
const DEFAULTS: BulkOptions = { from: "px", root: 16, decimals: 4, convertQueries: false, ignore: "0, 1px", skipProps: "" };
const bulk = (css: string, o: Partial<BulkOptions> = {}) => convertCss(css, { ...DEFAULTS, ...o });

test("intro: 24 → 1.5rem and 1.5rem → 24px at the 16px default", () => {
  assert.equal(DEFAULT_ROOT, 16);
  assert.equal(pxToRem(24), "1.5");
  assert.equal(remToPx(1.5), "24");
  // FAQ
  assert.equal(pxToRem(14), "0.875");
  assert.equal(remToPx(1.25), "20");
});

test("formula table at 16px", () => {
  const rows: [number, string][] = [
    [16, "1"],
    [13, "0.8125"],
    [15, "0.9375"],
    [22, "1.375"],
    [100, "6.25"],
    [0.5, "0.03125"],
  ];
  for (const [px, rem] of rows) assert.equal(pxToRem(px, 16, 6), rem);
});

test("non-terminating results and other roots", () => {
  assert.equal(pxToRem(10, 18), "0.5556");
  assert.equal(pxToRem(24, 10), "2.4");
  assert.equal(pxToRem(14, 10), "1.4");
  assert.equal(remToPx(1.5, 10), "15");
  assert.equal(rootAsPercent(10), "62.5");
});

test("em: against the parent size; nested 1.2em compounds, 1.2rem does not", () => {
  assert.equal(convertSingle(10, "px-to-rem", 16, 20).em, 0.5);
  assert.equal(convertSingle(20, "px-to-rem", 16, 20).em, 1);
  let em = 16;
  const levels = [1, 2, 3].map(() => (em = em * 1.2));
  assert.deepEqual(levels.map((v) => formatNum(v, 4)), ["19.2", "23.04", "27.648"]);
  assert.equal(formatNum(1.2 * 16, 4), "19.2");
});

test("input parsing: 16px, 1.5rem, .5, negatives, other units flagged", () => {
  assert.deepEqual(parseLength("16px", "px"), { kind: "ok", value: 16 });
  assert.deepEqual(parseLength("1.5 rem", "rem"), { kind: "ok", value: 1.5 });
  assert.deepEqual(parseLength(".5", "px"), { kind: "ok", value: 0.5 });
  assert.deepEqual(parseLength("−8", "px"), { kind: "ok", value: -8 });
  assert.deepEqual(parseLength("1,024", "px"), { kind: "ok", value: 1024 });
  assert.equal(parseLength("12pt", "px").kind, "invalid");
  assert.equal(parseLength("1,5", "px").kind, "invalid");
  assert.equal(parseLength(String(MAX_VALUE + 1), "px").kind, "invalid");
  assert.equal(parseRoot("0").kind, "invalid");
  assert.equal(parseRoot(String(MAX_ROOT)).kind, "ok");
  assert.equal(parseRoot("1001").kind, "invalid");
  assert.equal(modeFromHash("#rem-to-px"), "rem-to-px");
  assert.equal(modeFromHash(""), null);
});

test("common sizes table: rem, Tailwind spacing (v4 and v3) and text classes", () => {
  const rows: [number, string, string, string | null][] = [
    [8, "0.5", "p-2", null],
    [10, "0.625", "p-2.5", null],
    [12, "0.75", "p-3", "text-xs"],
    [14, "0.875", "p-3.5", "text-sm"],
    [16, "1", "p-4", "text-base"],
    [18, "1.125", "p-4.5", "text-lg"],
    [20, "1.25", "p-5", "text-xl"],
    [24, "1.5", "p-6", "text-2xl"],
    [28, "1.75", "p-7", null],
    [32, "2", "p-8", null],
    [36, "2.25", "p-9", "text-4xl"],
    [48, "3", "p-12", "text-5xl"],
    [64, "4", "p-16", null],
    [96, "6", "p-24", "text-8xl"],
    [128, "8", "p-32", "text-9xl"],
  ];
  for (const [px, rem, spacing, text] of rows) {
    const r = px / 16;
    assert.equal(formatNum(r, 4), rem);
    assert.equal(tailwindFor(r, px, "padding", "v4", 4).exact, spacing, `${px}px v4`);
    const v3 = tailwindFor(r, px, "padding", "v3", 4).exact;
    assert.equal(v3, px === 18 ? null : spacing, `${px}px v3`); // p-4.5 is v4 only
    assert.equal(tailwindFor(r, px, "font-size", "v4", 4).exact, text, `${px}px text`);
  }
  assert.equal(tailwindFor(48 / 16, 48, "height", "v4", 4).exact, "h-12");
});

test("Tailwind: v4 multiples of 0.25; v3 nearest step plus arbitrary class", () => {
  const v4 = tailwindFor(13 / 16, 13, "padding", "v4", 4);
  assert.equal(v4.exact, "p-3.25");
  for (const [n, ok] of [
    [0.75, true],
    [2.75, true],
    [12.5, true],
    [0.125, false],
    [0.1, false],
  ] as const) {
    const rem = n * 0.25;
    assert.equal(tailwindFor(rem, rem * 16, "padding", "v4", 6).exact !== null, ok, String(n));
  }
  const v3 = tailwindFor(13 / 16, 13, "padding", "v3", 4);
  assert.equal(v3.exact, null);
  assert.equal(v3.arbitrary, "p-[0.8125rem]");
  assert.equal(v3.nearest?.className, "p-3");
  assert.equal(tailwindFor(15 / 16, 15, "padding", "v3", 4).exact, null);
  assert.equal(tailwindFor(1 / 16, 1, "padding", "v4", 4).exact, "p-px");
  assert.equal(tailwindFor(-0.5, -8, "margin", "v4", 4).exact, "-m-2");
  assert.equal(tailwindFor(-0.5, -8, "padding", "v4", 4).applicable, false);
});

test("reference table: 1–128 px, recalculated for the root", () => {
  const rows = buildTable(16, 4, "padding", "v4");
  assert.equal(rows.length, 128);
  assert.deepEqual(rows[23], { px: 24, rem: "1.5", tailwind: "p-6" });
  assert.equal(buildTable(10, 4, "padding", "v4")[23].rem, "2.4");
  assert.ok(tableToCsv(rows.slice(0, 2), "padding").startsWith("px,rem,padding\n1,0.0625,p-px\n2,0.125,p-0.5"));
});

test("article worked example: the built-in card at 16px with default settings", () => {
  const css = `/* Card component */
.card {
  width: 320px;
  padding: 24px 16px;
  border: 1px solid #d9d4c7;
  border-radius: 12px;
  background: url("/img/card-16px.png") no-repeat;
}
.card__title {
  font: 600 24px/32px "Inter", sans-serif;
  letter-spacing: -0.5px;
}`;
  const r = bulk(css);
  assert.ok(r.output.includes("width: 20rem;"));
  assert.ok(r.output.includes("padding: 1.5rem 1rem;"));
  assert.ok(r.output.includes("border: 1px solid #d9d4c7;"));
  assert.ok(r.output.includes("border-radius: 0.75rem;"));
  assert.ok(r.output.includes('font: 600 1.5rem/2rem "Inter", sans-serif;'));
  assert.ok(r.output.includes("letter-spacing: -0.0313rem;"));
  assert.ok(r.output.includes('url("/img/card-16px.png")'));
  assert.ok(r.output.startsWith("/* Card component */\n.card {"));
  assert.equal(r.ignored, 1);
  assert.equal(formatNum(-0.5 / 16, 4), "-0.0313");
  assert.equal(formatNum(0.0313 * 16, 3), "0.501");
  assert.equal(bulk("a { letter-spacing: -0.5px }", { decimals: 6 }).output, "a { letter-spacing: -0.03125rem }");
  // box-shadow is converted unless it is listed as a skipped property
  assert.equal(bulk("a{box-shadow:0 2px 8px red}").output, "a{box-shadow:0 0.125rem 0.5rem red}");
  assert.equal(bulk("a{box-shadow:0 2px 8px red}", { skipProps: "box-shadow" }).output, "a{box-shadow:0 2px 8px red}");
});

test("bulk: selectors, comments, strings and url() are protected; whitespace preserved", () => {
  const css = ".w-16px { width: 16px; } /* 16px */\n\t.a::after { content: '16px'; background: url(/a-16px.png); }";
  const r = bulk(css);
  assert.equal(r.output, ".w-16px { width: 1rem; } /* 16px */\n\t.a::after { content: '16px'; background: url(/a-16px.png); }");
  assert.equal(maskProtected("a /* x */ b").length, "a /* x */ b".length);
});

test("bulk: media queries skipped by default; 768px = 48rem only at a 16px root", () => {
  const css = "@media (min-width: 768px) { .a { padding: 32px; } }";
  const off = bulk(css);
  assert.equal(off.output, "@media (min-width: 768px) { .a { padding: 2rem; } }");
  assert.equal(off.skippedQueries, 1);
  assert.equal(bulk(css, { convertQueries: true }).output, "@media (min-width: 48rem) { .a { padding: 2rem; } }");
  assert.ok(bulk(css, { convertQueries: true, root: 10 }).output.includes("76.8rem"));
  assert.equal(76.8 * 16, 1228.8);
});

test("bulk: ignore list (signs ignored) and wildcard skipped properties", () => {
  assert.equal(bulk("a{margin:-1px 0 1px}", { ignore: "1" }).output, "a{margin:-1px 0 1px}");
  assert.deepEqual([...parseIgnoreList("0, 1px, 2rem, foo", "px").values], [0, 1]);
  assert.deepEqual(parseIgnoreList("0, 1px, foo", "px").invalid, ["foo"]);
  assert.ok(matchProp("outline*", "outline-offset"));
  assert.ok(!matchProp("outline*", "border"));
  const r = bulk("a{outline-offset:4px;border-width:2px;padding:8px}", { skipProps: "border-width, outline*" });
  assert.equal(r.output, "a{outline-offset:4px;border-width:2px;padding:0.5rem}");
  assert.equal(r.skippedProps, 2);
});

test("bulk: calc(), clamp(), var() fallbacks, custom properties, Sass/Less variables are converted", () => {
  assert.equal(bulk("a{width:calc(100% - 32px)}").output, "a{width:calc(100% - 2rem)}");
  assert.equal(bulk("a{font-size:clamp(16px, 2vw, 24px)}").output, "a{font-size:clamp(1rem, 2vw, 1.5rem)}");
  assert.equal(bulk("a{gap:var(--gap, 8px)}").output, "a{gap:var(--gap, 0.5rem)}");
  assert.equal(bulk(":root{--space: 24px}").output, ":root{--space: 1.5rem}");
  assert.equal(bulk("$pad: 16px;\n@gap: 8px;").output, "$pad: 1rem;\n@gap: 0.5rem;");
  // No evaluation: calc(2px * 3) keeps its structure.
  assert.equal(bulk("a{width:calc(2px * 3)}").output, "a{width:calc(0.125rem * 3)}");
  // With the default ignore list, 1px inside calc() is left as written.
  assert.equal(bulk("a{width:calc(1px * 2)}").output, "a{width:calc(1px * 2)}");
  // Only px is touched; em, pt and vh stay.
  assert.equal(bulk("a{margin:1em 12pt 10vh 4px}").output, "a{margin:1em 12pt 10vh 0.25rem}");
});

test("bulk: rem to px", () => {
  assert.equal(bulk("a{padding:1.5rem 1rem}", { from: "rem", ignore: "0" }).output, "a{padding:24px 16px}");
});
