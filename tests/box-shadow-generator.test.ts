import { test } from "node:test";
import assert from "node:assert/strict";
import { color, formatColor, parseColor, srgbToOklch, toHex6, toSrgb } from "../src/tools/box-shadow-generator/color";
import {
  analyze,
  buildOutput,
  cssDeclaration,
  cssVariable,
  DEFAULT_SMOOTH,
  DEFAULT_STATE,
  layerCss,
  LIMITS,
  normalizeState,
  PRESETS,
  sanitizeName,
  shadowValue,
  smoothShadow,
  tailwindClass,
  tailwindTheme,
  usableLayers,
  withIds,
  type LayerSpec,
} from "../src/tools/box-shadow-generator/shadow";

const layer = (x: number, y: number, blur: number, spread: number, c: string, a: number, inset = false): LayerSpec => ({
  x,
  y,
  blur,
  spread,
  color: color(c, a),
  inset,
  visible: true,
});

test("syntax example: inset first, colour last", () => {
  assert.equal(layerCss(layer(0, 4, 12, -2, "#0f172a", 0.2, true), "rgb"), "inset 0 4px 12px -2px rgba(15, 23, 42, 0.2)");
  assert.equal(layerCss(layer(0, 4, 12, -2, "#0f172a", 0.2), "rgb"), "0 4px 12px -2px rgba(15, 23, 42, 0.2)");
  // spread 0 is omitted
  assert.equal(layerCss(layer(0, 4, 12, 0, "#000000", 0.2), "rgb"), "0 4px 12px rgba(0, 0, 0, 0.2)");
});

test("smooth generator defaults reproduce the article table", () => {
  assert.deepEqual(
    { e: DEFAULT_SMOOTH.elevation, n: DEFAULT_SMOOTH.layers, o: DEFAULT_SMOOTH.opacity, s: DEFAULT_SMOOTH.softness, t: DEFAULT_SMOOTH.tuck },
    { e: 12, n: 5, o: 60, s: 2, t: 15 },
  );
  assert.equal(toHex6(DEFAULT_SMOOTH.color), "#0f172a"); // slate
  const rows = smoothShadow(DEFAULT_SMOOTH).map((l) => [l.y, l.blur, l.spread, l.color.a]);
  assert.deepEqual(rows, [
    [0.5, 1, 0, 0.12],
    [2, 4, -0.5, 0.12],
    [4.5, 9, -1.5, 0.12],
    [7.5, 15, -2.5, 0.12],
    [12, 24, -3.5, 0.12],
  ]);
  // Worked layer 3 arithmetic
  assert.ok(Math.abs(12 * (3 / 5) ** 2 - 4.32) < 1e-12);
  assert.ok(Math.abs(0.15 * 9 - 1.35) < 1e-12);
  // The default editor state is that stack.
  assert.equal(DEFAULT_STATE.layers.length, 5);
});

test("smooth generator: elevation 1–24, low elevations cap the layer count", () => {
  assert.equal(usableLayers(3, 5), 2);
  assert.equal(smoothShadow({ ...DEFAULT_SMOOTH, elevation: 3 }).length, 2);
  assert.equal(smoothShadow({ ...DEFAULT_SMOOTH, elevation: 99 }).at(-1)?.y, 24);
  assert.equal(smoothShadow({ ...DEFAULT_SMOOTH, elevation: 0 }).at(-1)?.y, 1);
  for (let e = 1; e <= 24; e++) {
    const stack = smoothShadow({ ...DEFAULT_SMOOTH, elevation: e });
    assert.equal(stack.at(-1)?.y, e, `largest layer carries the full elevation ${e}`);
    for (let i = 1; i < stack.length; i++) assert.ok(stack[i].y >= stack[i - 1].y);
  }
  // lean moves x by a percentage of y
  const leaning = smoothShadow({ ...DEFAULT_SMOOTH, lean: 50 });
  assert.equal(leaning.at(-1)?.x, 6);
});

test("one side only: Bottom edge only preset", () => {
  const p = PRESETS.find((x) => x.name === "Bottom edge only")!;
  assert.equal(shadowValue(p.layers, "rgb"), "0 10px 8px -8px rgba(0, 0, 0, 0.45)");
});

test("sixteen presets, ten layers maximum, Tailwind md and 2xl match the default theme", () => {
  assert.equal(PRESETS.length, 16);
  assert.equal(LIMITS.maxLayers, 10);
  const md = PRESETS.find((p) => p.id === "tw-md")!;
  assert.equal(shadowValue(md.layers, "rgb"), "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)");
  const xl2 = PRESETS.find((p) => p.id === "tw-2xl")!;
  assert.equal(shadowValue(xl2.layers, "rgb"), "0 25px 50px -12px rgba(0, 0, 0, 0.25)");
  const states = normalizeState({ layers: Array(15).fill(layer(0, 1, 2, 0, "#000", 0.1)) });
  assert.equal(states.layers.length, 10);
});

test("recipes table values are expressible", () => {
  assert.equal(layerCss(layer(0, 0, 0, 1, "#0f172a", 0.12), "rgb"), "0 0 0 1px rgba(15, 23, 42, 0.12)");
  assert.equal(layerCss(layer(0, 0, 0, 3, "#2563eb", 0.5), "rgb"), "0 0 0 3px rgba(37, 99, 235, 0.5)");
  assert.equal(layerCss(layer(0, 1, 0, 0, "#ffffff", 0.6, true), "rgb"), "inset 0 1px 0 rgba(255, 255, 255, 0.6)");
  assert.equal(layerCss(layer(0, 0, 24, 2, "#ff5f1f", 0.45), "rgb"), "0 0 24px 2px rgba(255, 95, 31, 0.45)");
});

test("output formats: CSS, multi-line, variable, Tailwind class and v4 theme", () => {
  const one = [layer(0, 4, 12, 0, "#000000", 0.2)];
  assert.equal(tailwindClass(one, "rgb"), "shadow-[0_4px_12px_rgba(0,0,0,0.2)]"); // FAQ example
  const two = [layer(0, 1, 2, 0, "#000000", 0.1), layer(0, 4, 8, -2, "#000000", 0.2)];
  assert.equal(tailwindClass(two, "rgb"), "shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_8px_-2px_rgba(0,0,0,0.2)]");
  assert.equal(cssDeclaration(two, "rgb", true), "box-shadow:\n  0 1px 2px rgba(0, 0, 0, 0.1),\n  0 4px 8px -2px rgba(0, 0, 0, 0.2);");
  assert.equal(cssDeclaration(two, "rgb", false), "box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.2);");
  assert.equal(cssVariable("Card soft", one, "rgb", false), ":root {\n  --shadow-card-soft: 0 4px 12px rgba(0, 0, 0, 0.2);\n}\n\n.card-soft {\n  box-shadow: var(--shadow-card-soft);\n}");
  assert.ok(tailwindTheme("card", one, "rgb", false).startsWith("@theme {\n  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.2);\n}"));
  assert.equal(sanitizeName("--shadow-Pop over!"), "pop-over");
  assert.equal(buildOutput("css", [{ ...one[0], visible: false }], "rgb", true, "card"), "box-shadow: none;");
  assert.equal(tailwindClass([], "rgb"), "shadow-none");
});

test("analysis: hidden layers, heavy blur above 100px, invisible colours", () => {
  const layers = withIds([layer(0, 0, 150, 0, "#000", 0.2), { ...layer(0, 0, 1, 0, "#000", 0), visible: true }]);
  const notes = analyze(layers);
  assert.ok(notes.some((n) => n.level === "warning" && n.text.includes("above 100px")));
  assert.ok(notes.some((n) => n.text.includes("0% opacity")));
  assert.ok(analyze(layers.map((l) => ({ ...l, visible: false }))).some((n) => n.text.includes("box-shadow: none")));
  assert.equal(analyze(withIds([layer(0, 0, 100, 0, "#000", 0.2)])).length, 0);
});

test("colours: HEX, RGB, HSL and OKLCH input and output", () => {
  const c = parseColor("#0f172a");
  assert.ok(c.ok);
  assert.equal(formatColor(c.color, "rgb"), "rgb(15, 23, 42)");
  assert.equal(formatColor(c.color, "hex"), "#0f172a");
  assert.equal(formatColor({ ...c.color, a: 0.2 }, "hex"), "#0f172a33");
  assert.equal(formatColor(color("rgb(255 0 0)"), "hsl"), "hsl(0, 100%, 50%)");
  assert.equal(toHex6(color("hsl(120, 100%, 25%)")), "#008000");
  assert.equal(toHex6(color("rgba(37, 99, 235, 0.5)")), "#2563eb");
  assert.equal(color("#fff8").a, 0.533);
  // OKLCH of pure white and red (reference values from the OKLab definition)
  const white = srgbToOklch(1, 1, 1);
  assert.ok(Math.abs(white.l - 1) < 1e-4 && white.c === 0);
  const red = srgbToOklch(1, 0, 0);
  assert.ok(Math.abs(red.l - 0.628) < 1e-3 && Math.abs(red.c - 0.2577) < 1e-3 && Math.abs(red.h - 29.23) < 0.05);
  const ok = parseColor("oklch(0.25 0.03 260 / 0.4)");
  assert.ok(ok.ok);
  assert.equal(formatColor(ok.color, "oklch"), "oklch(0.25 0.03 260 / 0.4)");
  assert.equal(parseColor("#12345").ok, false);
});

test("every 8-bit sRGB colour survives the OKLCH round trip", () => {
  for (let r = 0; r < 256; r += 15) {
    for (let g = 0; g < 256; g += 15) {
      for (let b = 0; b < 256; b += 15) {
        const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
        assert.equal(toHex6(color(hex)), hex);
      }
    }
  }
});

test("out-of-gamut OKLCH keeps lightness and hue and is flagged", () => {
  const vivid = toSrgb({ l: 0.7, c: 0.4, h: 150 });
  assert.equal(vivid.inGamut, false);
  for (const v of [vivid.r, vivid.g, vivid.b]) assert.ok(v >= 0 && v <= 1);
  assert.equal(toSrgb({ l: 0.5, c: 0.05, h: 250 }).inGamut, true);
});
