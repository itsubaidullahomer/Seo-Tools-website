import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMBOS,
  MODIFIER_CODES,
  buildReport,
  computeProgress,
  createSession,
  sessionReducer,
  type KeyEventInfo,
  type Session,
} from "../src/tools/keyboard-tester/logic";
import { buildLayout } from "../src/tools/keyboard-tester/layouts";

const ev = (type: "down" | "up", code: string, time: number, extra: Partial<KeyEventInfo> = {}): KeyEventInfo => ({
  type,
  code,
  key: code.replace(/^Key/, "").toLowerCase(),
  keyCode: 0,
  location: 0,
  repeat: false,
  time,
  shift: false,
  ctrl: false,
  alt: false,
  meta: false,
  ...extra,
});

function play(events: KeyEventInfo[], opts: { threshold?: number; mac?: boolean } = {}, start: Session = createSession()): Session {
  return events.reduce((s, e) => sessionReducer(s, { kind: "key", e, threshold: opts.threshold ?? 30, mac: opts.mac ?? false }), start);
}

test("chatter worked example: released at 4,210.3 ms, down again at 4,218.1 ms is a 7.8 ms gap", () => {
  const s = play([ev("down", "KeyE", 4100), ev("up", "KeyE", 4210.3), ev("down", "KeyE", 4218.1)]);
  assert.equal(s.chatter.length, 1);
  assert.equal(s.chatter[0].gap.toFixed(1), "7.8");
  // a deliberate second tap 90 ms later passes
  const ok = play([ev("down", "KeyE", 0), ev("up", "KeyE", 100), ev("down", "KeyE", 190)]);
  assert.equal(ok.chatter.length, 0);
});

test("chatter threshold is configurable (15 ms ignores a 20 ms re-press)", () => {
  const events = [ev("down", "KeyA", 0), ev("up", "KeyA", 50), ev("down", "KeyA", 70)];
  assert.equal(play(events, { threshold: 30 }).chatter.length, 1);
  assert.equal(play(events, { threshold: 15 }).chatter.length, 0);
});

test("auto-repeat is ignored for chatter and presses", () => {
  const s = play([ev("down", "KeyA", 0), ev("down", "KeyA", 500, { repeat: true }), ev("down", "KeyA", 533, { repeat: true }), ev("up", "KeyA", 600)]);
  assert.equal(s.presses, 1);
  assert.equal(s.chatter.length, 0);
  assert.equal(s.last?.held, 600);
});

test("most held at once counts regular keys and leaves out modifiers", () => {
  const s = play([
    ev("down", "ShiftLeft", 0),
    ev("down", "ControlLeft", 1),
    ev("down", "KeyQ", 2),
    ev("down", "KeyW", 3),
    ev("down", "KeyE", 4),
  ]);
  assert.equal(s.maxHeld, 3);
  assert.equal(MODIFIER_CODES.size, 8);
});

test("combination checks: sizes and the 6KRO boundary", () => {
  const byId = Object.fromEntries(COMBOS.map((c) => [c.id, c]));
  assert.equal(byId.wasd.codes.length, 5);
  assert.equal(byId.qwert.codes.length, 5);
  assert.equal(byId.modifiers.codes.length, 4);
  assert.deepEqual(byId.arrows.codes, ["ArrowUp", "ArrowLeft", "Space"]);
  // the seven- and nine-key checks need more than six regular keys
  const regular = (codes: string[]) => codes.filter((c) => !MODIFIER_CODES.has(c)).length;
  assert.equal(regular(byId.seven.codes), 7);
  assert.equal(regular(byId.nine.codes), 9);
  for (const c of COMBOS.filter((x) => x.id !== "seven" && x.id !== "nine")) assert.ok(regular(c.codes) <= 6, c.id);

  const s = play(byId.seven.codes.map((code, i) => ev("down", code, i)));
  assert.ok(s.combos.seven);
  assert.ok(!s.combos.nine);
});

test("Mac: releasing Command clears keys whose key-up never arrives; Caps Lock is not 'held'", () => {
  const s = play([ev("down", "MetaLeft", 0), ev("down", "KeyC", 10), ev("up", "MetaLeft", 50)], { mac: true });
  assert.deepEqual(s.held, []);
  const caps = play([ev("down", "CapsLock", 0)]);
  assert.deepEqual(caps.held, []);
  assert.equal(caps.seen.CapsLock, "capslock");
  // F13-F15 map to the PrintScreen / ScrollLock / Pause slots on a Mac
  assert.ok(play([ev("down", "F13", 0)], { mac: true }).seen.PrintScreen !== undefined);
});

test("skipped keys leave the count; pressing one anyway counts it as tested", () => {
  const keys = buildLayout("full", "ansi", "windows").keys;
  const s = play([ev("down", "KeyA", 0), ev("down", "Numpad1", 5)]);
  const p = computeProgress(keys, s.seen, { NumLock: true, Numpad1: true });
  assert.equal(p.total, keys.length - 1);
  assert.equal(p.tested, 2);
  assert.equal(p.skipped.map((k) => k.code).join(), "NumLock");
});

test("board sizes: full 104, TKL 87, 60% 61 keys (ANSI); ISO adds a key beside left Shift", () => {
  const codes = (size: "full" | "tkl" | "compact" | "sixty", std: "ansi" | "iso" = "ansi") => buildLayout(size, std, "windows").keys.map((k) => k.code);
  assert.equal(codes("full").length, 104);
  assert.equal(codes("tkl").length, 87);
  assert.equal(codes("sixty").length, 61);
  assert.equal(codes("full", "iso").length, 105);
  assert.ok(codes("full", "iso").includes("IntlBackslash"));
  // 60% has no function row and no cursor keys
  assert.ok(!codes("sixty").includes("F1"));
  assert.ok(!codes("sixty").includes("ArrowUp"));
  assert.ok(!codes("compact").includes("Numpad1"));
});

test("Mac labels swap Windows and Alt for Command and Option", () => {
  const mac = buildLayout("full", "ansi", "mac").keys;
  const label = (code: string) => mac.find((k) => k.code === code)?.label;
  assert.equal(label("MetaLeft"), "Cmd");
  assert.equal(label("AltLeft"), "Option");
  assert.equal(mac.find((k) => k.code === "ContextMenu"), undefined);
});

test("report lists chatter, peak and combinations", () => {
  const keys = buildLayout("sixty", "ansi", "windows").keys;
  const s = play([ev("down", "KeyE", 0), ev("up", "KeyE", 100), ev("down", "KeyE", 107.8)]);
  const report = buildReport({ layoutName: "60% ANSI", keys, session: s, skipped: {}, threshold: 30 });
  assert.ok(report.includes("Keys tested: 1 of 61"));
  assert.ok(report.includes("KeyE x1, shortest 7.8 ms"));
  assert.ok(report.includes(`Combination checks passed: 0 of ${COMBOS.length}`));
});

test("reset keeps learned labels but clears the run", () => {
  const s = play([ev("down", "KeyQ", 0, { key: "a" })]);
  assert.equal(s.learned.KeyQ, "A"); // AZERTY: physical KeyQ typed "a"
  const r = sessionReducer(s, { kind: "reset" });
  assert.equal(r.presses, 0);
  assert.equal(r.learned.KeyQ, "A");
});
