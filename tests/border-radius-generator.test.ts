import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bakeRadii,
  collapse,
  convertUnit,
  cssLonghand,
  cssShorthand,
  detectMode,
  isOverlapping,
  LIMITS,
  normalizeState,
  parseBorderRadius,
  PRESETS,
  randomBlob,
  resolveRadii,
  scaleMatch,
  setRadius,
  shorthandValue,
  tailwindRows,
  toPx,
  TW_SCALE,
  type Radii,
} from "../src/tools/border-radius-generator/radius";

const same = (n: number): Radii => Array(8).fill(n);
const parse = (s: string, w = 320, h = 220) => {
  const r = parseBorderRadius(s, w, h);
  assert.ok(r.ok, `${s}: ${JSON.stringify(r)}`);
  return r;
};

test("one to four values expand clockwise from the top-left", () => {
  assert.deepEqual(parse("1px").radii.slice(0, 4), [1, 1, 1, 1]);
  assert.deepEqual(parse("1px 2px").radii.slice(0, 4), [1, 2, 1, 2]);
  assert.deepEqual(parse("1px 2px 3px").radii.slice(0, 4), [1, 2, 3, 2]);
  assert.deepEqual(parse("1px 2px 3px 4px").radii.slice(0, 4), [1, 2, 3, 4]);
  assert.deepEqual(collapse(["a", "b", "a", "b"]), ["a", "b"]);
  assert.deepEqual(collapse(["a", "b", "c", "b"]), ["a", "b", "c"]);
});

test("slash example: 10px 40px / 20px", () => {
  const r = parse("border-radius: 10px 40px / 20px;");
  assert.deepEqual(r.radii, [10, 40, 10, 40, 20, 20, 20, 20]);
  assert.equal(cssLonghand(r.radii, "px", false).split("\n")[0], "border-top-left-radius: 10px 20px;");
});

test("output drops the slash when lists match and collapses each list", () => {
  assert.equal(shorthandValue([0, 100, 0, 100, 0, 100, 0, 100], "%"), "0 100%");
  assert.equal(shorthandValue(same(24), "px"), "24px");
  assert.equal(cssShorthand(same(12), "px", true), "border-radius: 12px;\ncorner-shape: squircle;");
});

test("overlap rule: 200 × 100 box with 80px is drawn at 50px (f = 0.625)", () => {
  const r = resolveRadii(same(80), "px", 200, 100);
  assert.equal(r.scale, 0.625);
  assert.ok(r.px.every((v) => v === 50));
  assert.deepEqual(r.overlapping.sort(), ["left", "right"]);
  assert.ok(isOverlapping(r));
  assert.deepEqual(bakeRadii(same(80), "px", 200, 100), same(50));
  // Pill: any large value ends up at half the height.
  const pill = resolveRadii(same(9999), "px", 320, 120);
  assert.ok(pill.px.every((v) => Math.abs(v - 60) < 1e-9));
});

test("percentages: x against width, y against height (20% on 320 × 220 = 64 × 44)", () => {
  assert.equal(toPx(20, 0, "%", 320, 220), 64);
  assert.equal(toPx(20, 4, "%", 320, 220), 44);
  assert.deepEqual(convertUnit(same(20), "%", "px", 320, 220), [64, 64, 64, 64, 44, 44, 44, 44]);
  assert.deepEqual(convertUnit([64, 64, 64, 64, 44, 44, 44, 44], "px", "%", 320, 220), same(20));
  // 50% on a square is a circle; on a wide box an ellipse.
  const sq = resolveRadii(same(50), "%", 240, 240);
  assert.ok(sq.px.every((v) => v === 120));
  const wide = resolveRadii(same(50), "%", 320, 200);
  assert.deepEqual([wide.px[0], wide.px[4]], [160, 100]);
});

test("blob example on 300 × 200: corner ellipses 90×60, 210×60, 210×140, 90×140 and no overlap", () => {
  const r = parse("30% 70% 70% 30% / 30% 30% 70% 70%", 300, 200);
  assert.equal(r.unit, "%");
  const res = resolveRadii(r.radii, "%", 300, 200);
  assert.equal(res.scale, 1);
  const corners = [0, 1, 2, 3].map((c) => `${res.px[c]}x${res.px[c + 4]}`);
  assert.deepEqual(corners, ["90x60", "210x60", "210x140", "90x140"]);
});

test("random blob: every side sums to exactly 100%", () => {
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 200; i++) {
    const b = randomBlob(rand);
    assert.equal(b[0] + b[1], 100); // top
    assert.equal(b[3] + b[2], 100); // bottom
    assert.equal(b[4] + b[7], 100); // left
    assert.equal(b[5] + b[6], 100); // right
    assert.ok(b.every((v) => v >= 30 && v <= 70));
    assert.equal(resolveRadii(b, "%", 260, 260).scale, 1);
  }
});

test("Tailwind v4 radius scale and classes", () => {
  assert.deepEqual(
    TW_SCALE.map((s) => `${s.name}:${s.px}`),
    ["none:0", "xs:2", "sm:4", "md:6", "lg:8", "xl:12", "2xl:16", "3xl:24", "4xl:32"],
  );
  assert.equal(scaleMatch(8)?.name, "lg");
  assert.equal(scaleMatch(12)?.name, "xl");
  assert.equal(scaleMatch(9999)?.name, "full");
  assert.deepEqual(scaleMatch(10), { name: "lg", px: 8, diff: 2, exact: false });
  assert.equal(scaleMatch(100), null);
  const blob = [30, 70, 70, 30, 30, 30, 70, 70];
  assert.equal(tailwindRows(blob, "%", false)[0].code, "rounded-[30%_70%_70%_30%/30%_30%_70%_70%]");
  const tab = tailwindRows([16, 16, 0, 0, 16, 16, 0, 0], "px", false);
  assert.equal(tab.at(-1)?.code, "rounded-tl-2xl rounded-tr-2xl rounded-br-none rounded-bl-none");
  assert.equal(tailwindRows(same(0), "px", false)[0].code, "rounded-none");
  assert.equal(tailwindRows(same(50), "%", false)[1].code, "rounded-full");
});

test("common shapes table matches the presets", () => {
  const byName = Object.fromEntries(PRESETS.map((p) => [p.name, shorthandValue(p.radii, p.unit)]));
  assert.equal(byName.Pill, "9999px");
  assert.equal(byName.Circle, "50%");
  assert.equal(byName.Leaf, "0 100%");
  assert.equal(byName.Teardrop, "0 50% 50%");
  assert.equal(byName.Tab, "16px 16px 0 0");
  assert.equal(byName.Bubble, "24px 24px 24px 4px");
  assert.equal(byName.Egg, "50% / 60% 60% 40% 40%");
  assert.equal(byName["Blob 1"], "30% 70% 70% 30% / 30% 30% 70% 70%");
  const circle = PRESETS.find((p) => p.id === "circle")!;
  assert.equal(circle.box?.[0], circle.box?.[1]);
});

test("speech bubble: left side needs 24 + 4 = 28px of 160px, no overlap", () => {
  const bubble = PRESETS.find((p) => p.id === "bubble")!;
  assert.deepEqual(bubble.box, [320, 160]);
  const r = resolveRadii(bubble.radii, "px", 320, 160);
  assert.equal(r.scale, 1);
  assert.equal(bubble.radii[4] + bubble.radii[7], 28);
});

test("importing CSS: longhands, Tailwind classes, rem, mixed units, invalid values", () => {
  const lh = parse("border-top-left-radius: 10px 20px; border-bottom-right-radius: 5px;");
  assert.deepEqual(lh.radii, [10, 0, 5, 0, 20, 0, 5, 0]);
  assert.deepEqual(parse("rounded-[30%_70%_70%_30%/30%_30%_70%_70%]").radii, [30, 70, 70, 30, 30, 30, 70, 70]);
  assert.deepEqual(parse("1rem").radii, same(16));
  const mixed = parse("10% 20px", 300, 200);
  assert.equal(mixed.unit, "px");
  assert.deepEqual(mixed.radii, [30, 20, 30, 20, 20, 20, 20, 20]);
  assert.ok(mixed.note?.includes("converted to px"));
  assert.equal(parseBorderRadius("-5px", 100, 100).ok, false);
  assert.equal(parseBorderRadius("calc(1px + 2px)", 100, 100).ok, false);
  assert.equal(parseBorderRadius("1px / 2px / 3px", 100, 100).ok, false);
  const capped = parse("20000px");
  assert.equal(capped.radii[0], LIMITS.px);
});

test("editing modes and stored state", () => {
  assert.deepEqual(setRadius(same(0), 2, 9, "all"), same(9));
  assert.deepEqual(setRadius(same(0), 6, 9, "corner"), [0, 0, 9, 0, 0, 0, 9, 0]);
  assert.deepEqual(setRadius(same(0), 6, 9, "ellipse"), [0, 0, 0, 0, 0, 0, 9, 0]);
  assert.equal(detectMode(same(3)), "all");
  assert.equal(detectMode([1, 2, 3, 4, 1, 2, 3, 4]), "corner");
  assert.equal(detectMode([1, 2, 3, 4, 4, 3, 2, 1]), "ellipse");
  const st = normalizeState({ unit: "%", radii: same(150), width: 5000 });
  assert.deepEqual(st.radii, same(100));
  assert.equal(st.width, LIMITS.boxMax);
});
