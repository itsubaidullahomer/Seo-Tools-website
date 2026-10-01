import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bestLevel,
  buildCsv,
  buildReport,
  contrastRatio,
  decodeHash,
  effectivePair,
  encodeHash,
  evaluate,
  formatRatio,
  MAX_PALETTE,
  oklchToRgb,
  pairResult,
  parseColor,
  parsePalette,
  relativeLuminance,
  REQUIRED,
  rgbToOklch,
  splitColorList,
  suggestFixes,
  toHex,
  toHslString,
  toOklchString,
  toRgbString,
  type Rgba,
} from "../src/tools/color-contrast-checker/contrast";

const c = (s: string): Rgba => {
  const r = parseColor(s);
  assert.ok(r.ok, s);
  return r.color;
};
const ratio = (fg: string, bg: string) => contrastRatio(c(fg), c(bg));
const gray = (n: number) => `#${n.toString(16).padStart(2, "0").repeat(3)}`;

test("parsing: HEX 3–8 digits (# optional), rgb(), hsl(), oklch(), names, declarations", () => {
  assert.equal(toHex(c("#c9400a")), "#c9400a");
  assert.equal(toHex(c("c9400a")), "#c9400a");
  assert.equal(toHex(c("#fff")), "#ffffff");
  assert.equal(toHex(c("#ffff")), "#ffffff");
  assert.equal(toHex(c("#00000080")), "#00000080");
  assert.equal(toHex(c("rgb(201 64 10)")), "#c9400a");
  assert.equal(toHex(c("rgba(201, 64, 10, 0.5)")), "#c9400a80");
  assert.equal(toHex(c("hsl(0 100% 50%)")), "#ff0000");
  assert.equal(toHex(c("tomato")), "#ff6347");
  assert.equal(toHex(c("color: #fff;")), "#ffffff");
  assert.equal(toHex(c("oklch(62.8% 0.2577 29.23)")), "#ff0000");
  assert.equal(parseColor("").ok, false);
  assert.equal(parseColor("#12345").ok, false);
  assert.equal(toRgbString(c("#c9400a")), "rgb(201, 64, 10)");
  assert.equal(toHslString(c("#ff0000")), "hsl(0, 100%, 50%)");
  assert.equal(toOklchString(c("#ffffff")), "oklch(100% 0 0)");
});

test("worked example: white on #c9400a is 4.97:1 (AA, not AAA)", () => {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  assert.deepEqual([201, 64, 10].map((v) => lin(v).toFixed(4)), ["0.5841", "0.0513", "0.0030"]);
  assert.equal(relativeLuminance(c("#c9400a")).toFixed(4), "0.1611");
  assert.equal(relativeLuminance(c("#ffffff")), 1);
  const r = ratio("#ffffff", "#c9400a");
  assert.equal(formatRatio(r), "4.97");
  const ok = evaluate(r);
  assert.ok(ok["aa-normal"] && !ok["aaa-normal"]);
});

test("ratio range is 1:1 to 21:1 and symmetric", () => {
  assert.equal(ratio("#000", "#fff"), 21);
  assert.equal(ratio("#fff", "#000"), 21);
  assert.equal(ratio("#808080", "#808080"), 1);
});

test("0.03928 vs 0.04045: no 8-bit channel value lies between them", () => {
  for (let v = 0; v < 256; v++) {
    const s = v / 255;
    assert.equal(s <= 0.03928, s <= 0.04045, String(v));
  }
});

test("WCAG 2.2 thresholds: 4.5 / 3 (AA), 7 / 4.5 (AAA), 3 for UI; large text sizes", () => {
  assert.deepEqual(REQUIRED, { "aa-normal": 4.5, "aaa-normal": 7, "aa-large": 3, "aaa-large": 4.5, ui: 3 });
  assert.equal(Math.round(((14 * 96) / 72) * 100) / 100, 18.67); // "about 18.66px"
  assert.equal((18 * 96) / 72, 24);
});

test("ratios are never rounded up onto a threshold", () => {
  assert.equal(evaluate(4.499)["aa-normal"], false);
  assert.equal(formatRatio(4.499), "4.49");
  assert.equal(formatRatio(6.996), "6.99");
  assert.equal(formatRatio(2.9999), "2.99");
  assert.equal(formatRatio(4.5), "4.50");
  assert.equal(formatRatio(4.5422), "4.54");
});

test("real pairs table", () => {
  const rows: [string, string, string, string][] = [
    ["#000000", "#ffffff", "21", "AAA"],
    ["#595959", "#ffffff", "7", "AAA"],
    ["#767676", "#ffffff", "4.54", "AA"],
    ["#777777", "#ffffff", "4.48", "Large"],
    ["#949494", "#ffffff", "3.03", "Large"],
    ["#ff0000", "#ffffff", "4", "Large"],
    ["#00ff00", "#ffffff", "1.37", "Fail"],
    ["#ffffff", "#c9400a", "4.97", "AA"],
    ["#ffffff", "#ff7a00", "2.61", "Fail"],
  ];
  for (const [fg, bg, shown, level] of rows) {
    const r = ratio(fg, bg);
    assert.equal(formatRatio(r), shown, `${fg} on ${bg}`);
    assert.equal(bestLevel(r), level, `${fg} on ${bg}`);
  }
  assert.equal(ratio("#595959", "#ffffff").toFixed(4), "7.0047");
  assert.equal(ratio("#ff0000", "#ffffff").toFixed(4), "3.9985");
  // Pure blue passes easily on white, pure green does not.
  assert.ok(ratio("#0000ff", "#ffffff") > 8);
});

test("gray-line table: the passing gray closest to each background, and one step closer fails", () => {
  const table: [string, string, string, string][] = [
    ["#ffffff", "#949494", "#767676", "#595959"],
    ["#f6f5f1", "#8e8e8e", "#707070", "#535353"],
    ["#121212", "#616161", "#7d7d7d", "#9f9f9f"],
    ["#000000", "#5a5a5a", "#757575", "#959595"],
  ];
  for (const [bg, ...grays] of table) {
    const bgLum = relativeLuminance(c(bg));
    const darkBg = bgLum < 0.18;
    [3, 4.5, 7].forEach((target, i) => {
      const g = parseInt(grays[i].slice(1, 3), 16);
      assert.ok(ratio(grays[i], bg) >= target, `${grays[i]} on ${bg} reaches ${target}`);
      const closer = gray(darkBg ? g - 1 : g + 1);
      assert.ok(ratio(closer, bg) < target, `${closer} on ${bg} misses ${target}`);
    });
  }
});

test("nearest passing colours: white on #ff7a00 → #bf5900 background or #373737 text", () => {
  const r = suggestFixes(c("#ffffff"), c("#ff7a00"), 4.5);
  assert.equal(formatRatio(r.ratio), "2.61");
  assert.equal(r.passes, false);
  const bg = r.suggestions.find((s) => s.role === "background")!;
  const fg = r.suggestions.find((s) => s.role === "text")!;
  assert.equal(bg.bgHex, "#bf5900");
  assert.equal(formatRatio(bg.ratio), "4.52");
  assert.equal(fg.fgHex, "#373737");
  assert.equal(formatRatio(fg.ratio), "4.56");
  // The reported ratio is re-measured on the rounded 8-bit colour.
  assert.equal(bg.ratio, ratio("#ffffff", "#bf5900"));
  // Hue is kept for the orange.
  const before = rgbToOklch(255, 122, 0);
  const after = rgbToOklch(0xbf, 0x59, 0x00);
  assert.ok(Math.abs(before.h - after.h) < 2);
  assert.equal(r.suggestions[0], bg); // smallest change first ("Closest")
});

test("suggestions reach every goal and grays stay gray", () => {
  for (const [fg, bg] of [
    ["#777777", "#ffffff"],
    ["#ff7a00", "#ffffff"],
    ["#3366cc", "#222222"],
  ]) {
    for (const goal of [3, 4.5, 7]) {
      const r = suggestFixes(c(fg), c(bg), goal);
      if (r.passes) continue;
      assert.ok(r.suggestions.length > 0);
      for (const s of r.suggestions) assert.ok(ratio(s.fgHex, s.bgHex) >= goal, `${fg}/${bg} @${goal}`);
    }
  }
  const g = suggestFixes(c("#777777"), c("#ffffff"), 4.5).suggestions.find((s) => s.role === "text")!;
  assert.match(g.fgHex, /^#([0-9a-f]{2})\1\1$/);
});

test("mid-gray on mid-gray at 7:1 needs a combined change", () => {
  const r = suggestFixes(c("#777777"), c("#888888"), 7);
  assert.equal(r.suggestions.length, 1);
  assert.equal(r.suggestions[0].role, "both");
  assert.ok(ratio(r.suggestions[0].fgHex, r.suggestions[0].bgHex) >= 7);
});

test("transparency: text blended over the background, background over white", () => {
  const e = effectivePair(c("rgba(0, 0, 0, 0.5)"), c("#ffffff"));
  assert.equal(toHex(e.fg), "#808080");
  const bg = effectivePair(c("#000000"), c("rgba(0, 0, 255, 0.5)"));
  assert.equal(toHex(bg.bg), "#8080ff");
  assert.equal(pairResult(c("rgba(0,0,0,0.5)"), c("#fff")).fgHex, "#808080");
});

test("out-of-gamut OKLCH is mapped into sRGB and flagged", () => {
  const r = parseColor("oklch(0.7 0.4 150)");
  assert.ok(r.ok && r.color.outOfGamut);
  assert.equal(oklchToRgb(0.5, 0.05, 250).outOfGamut, false);
});

test("palette: 12 colours give 132 pairs, at most 24 colours, duplicates and bad entries reported", () => {
  const twelve = Array.from({ length: 12 }, (_, i) => gray(i * 20)).join("\n");
  const pal = parsePalette(twelve);
  assert.equal(pal.colors.length, 12);
  assert.equal(buildCsv(pal.colors).split("\n").length - 1, 132);
  assert.equal(MAX_PALETTE, 24);
  const many = parsePalette(Array.from({ length: 30 }, (_, i) => gray(i * 8)).join(","));
  assert.equal(many.colors.length, 24);
  assert.ok(many.truncated);
  const mixed = parsePalette("#fff, #ffffff, nope, rgb(0, 0, 0)");
  assert.equal(mixed.colors.length, 2);
  assert.equal(mixed.duplicates, 1);
  assert.deepEqual(mixed.invalid, ["nope"]);
  assert.deepEqual(splitColorList("rgb(1, 2, 3); hsl(0 0% 0%)\n#abc"), ["rgb(1, 2, 3)", "hsl(0 0% 0%)", "#abc"]);
});

test("report and share link", () => {
  const report = buildReport(c("#ffffff"), c("#c9400a"));
  assert.ok(report.includes("Contrast ratio: 4.97:1"));
  assert.ok(report.includes("Normal text: AA Pass (4.5:1), AAA Fail (7:1)"));
  const hash = encodeHash({ mode: "pair", fg: "#fff", bg: "#c9400a", palette: "", target: "aaa" });
  assert.equal(hash, "fg=ffffff&bg=c9400a&goal=aaa");
  assert.deepEqual(decodeHash(`#${hash}`), { fg: "#ffffff", bg: "#c9400a", target: "aaa", mode: "pair" });
  assert.equal(decodeHash("#nothing=here"), null);
});
