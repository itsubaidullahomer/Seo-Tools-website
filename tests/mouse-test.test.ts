import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BUTTON_INFO,
  DEFAULT_THRESHOLD_MS,
  FLIP_MS,
  MAX_THRESHOLD_MS,
  MIN_THRESHOLD_MS,
  POLL_MAX_RATE,
  PollingTracker,
  buildReport,
  buildVerdict,
  clampThreshold,
  createSession,
  describeEntry,
  describePolling,
  intervalMs,
  sessionReducer,
  snapRate,
  summarizeButtons,
  totalsOf,
  type Action,
  type Session,
} from "../src/tools/mouse-test/logic";

const run = (actions: Action[], start: Session = createSession()) => actions.reduce(sessionReducer, start);

/** Left presses at 12.000 s, 12.050 s and 12.250 s on the session clock (session starts at 0). */
function workedExample(): Session {
  return run([
    { type: "down", button: 1, ts: 0 },
    { type: "up", button: 1, ts: 100 },
    { type: "down", button: 0, ts: 12000 },
    { type: "up", button: 0, ts: 12020 },
    { type: "down", button: 0, ts: 12050 },
    { type: "up", button: 0, ts: 12080 },
    { type: "down", button: 0, ts: 12250 },
    { type: "up", button: 0, ts: 12300 },
  ]);
}

test("button numbers and bits", () => {
  assert.deepEqual(
    Object.entries(BUTTON_INFO).map(([id, b]) => [Number(id), b.name, b.bit]),
    [
      [0, "Left", 1],
      [1, "Middle", 4],
      [2, "Right", 2],
      [3, "Back", 8],
      [4, "Forward", 16],
    ],
  );
});

test("detector limit: 80 ms default, 20 to 300 ms range (80 ms = 12.5 presses a second)", () => {
  assert.equal(DEFAULT_THRESHOLD_MS, 80);
  assert.equal(MIN_THRESHOLD_MS, 20);
  assert.equal(MAX_THRESHOLD_MS, 300);
  assert.equal(clampThreshold(5), 20);
  assert.equal(clampThreshold(1000), 300);
  assert.equal(1000 / DEFAULT_THRESHOLD_MS, 12.5);
});

test("worked example: gaps of 50 ms and 200 ms", () => {
  const s = workedExample();
  assert.deepEqual(
    s.buttons[0].gaps.map((g) => g.gap),
    [50, 200],
  );
  const left = (threshold: number) => summarizeButtons(s, threshold)[0];
  assert.equal(left(80).flagged, 1);
  assert.equal(left(80).fastestGap, 50);
  assert.equal(buildVerdict(summarizeButtons(s, 80), 80).variant, "warning");
  assert.equal(left(250).flagged, 2);
  assert.equal(left(40).flagged, 0);
  // the log line also shows the time since the previous release (12,020 -> 12,050 = 30 ms)
  const line = s.log.find((e) => e.kind === "down" && e.t === 12050)!;
  assert.equal(describeEntry(line, 80).text, "Left pressed · 50 ms after the previous press (30 ms after release) · FLAGGED");
});

test("different buttons never count against each other", () => {
  const s = run([
    { type: "down", button: 0, ts: 0 },
    { type: "down", button: 2, ts: 5 },
    { type: "up", button: 0, ts: 50 },
    { type: "up", button: 2, ts: 55 },
  ]);
  assert.equal(totalsOf(summarizeButtons(s, 80)).flagged, 0);
});

test("wheel: notches count by direction; a reversal within 150 ms is a flip", () => {
  assert.equal(FLIP_MS, 150);
  const s = run([
    { type: "wheel", ts: 0, dx: 0, dy: -100, mode: 0 },
    { type: "wheel", ts: 50, dx: 0, dy: -100, mode: 0 },
    { type: "wheel", ts: 120, dx: 0, dy: 100, mode: 0 }, // 70 ms after an up: flip
    { type: "wheel", ts: 1000, dx: 0, dy: -3, mode: 1 }, // slow reversal: not a flip
  ]);
  assert.equal(s.wheel.up, 3);
  assert.equal(s.wheel.down, 1);
  assert.equal(s.wheel.flips, 1);
  assert.equal(describeEntry(s.log[s.log.length - 1], 80).text, "Wheel up · last Δy -3 lines");
});

test("polling intervals: 1,000 / Hz", () => {
  const rows: [number, number][] = [
    [125, 8],
    [500, 2],
    [1000, 1],
    [2000, 0.5],
    [4000, 0.25],
    [8000, 0.125],
  ];
  for (const [hz, ms] of rows) assert.equal(intervalMs(hz), ms);
});

test("polling worked example: 801 updates over 0.8 s is 1,000 Hz", () => {
  const t = new PollingTracker();
  for (let i = 0; i <= 800; i++) t.push(1000 + i); // 801 updates, 1 ms apart, 0.8 s run
  const snap = t.snapshot();
  assert.equal(snap.events, 801);
  assert.equal(Math.round(snap.bestHz), 1000);
  assert.equal(snapRate(snap.bestHz), 1000);
  assert.equal(describePolling(snap)?.headline, "≈ 1,000 Hz");
});

test("polling: runs shorter than 0.3 s do not count; slow movement reads low", () => {
  const short = new PollingTracker();
  for (let i = 0; i < 250; i++) short.push(i);
  assert.equal(short.snapshot().bestHz, 0);
  const slow = new PollingTracker();
  for (let i = 0; i < 100; i++) slow.push(i * 20); // 50 Hz
  assert.equal(Math.round(slow.snapshot().bestHz), 50);
});

test("polling: snaps within 15%, ignores runs above 8,800 Hz, caps at 8,000 Hz", () => {
  assert.equal(snapRate(870), 1000);
  assert.equal(snapRate(1150), 1000);
  assert.equal(snapRate(700), null);
  const bogus = new PollingTracker();
  for (let i = 0; i < 4000; i++) bogus.push(i * 0.1); // 10,000 Hz
  assert.equal(bogus.snapshot().bestHz, 0);
  assert.ok(bogus.snapshot().discarded > 0);
  const fast = new PollingTracker();
  for (let i = 0; i < 4000; i++) fast.push(i * 0.12); // ~8,333 Hz
  assert.equal(fast.snapshot().bestHz, POLL_MAX_RATE);
});

test("DPI x sensitivity shorthand: 800 x 0.5 = 400 x 1.0", () => {
  assert.equal(800 * 0.5, 400 * 1.0);
});

test("report summarises buttons, detector and wheel", () => {
  const report = buildReport(workedExample(), 80, null, "2026-09-30");
  assert.ok(report.includes("Buttons (2 of 5 registered)"));
  assert.ok(report.includes("Left: 3 presses, fastest repeat 50 ms, flagged 1"));
  assert.ok(report.includes("Flagged presses: 1 of 4"));
  assert.ok(report.includes("Direction flips (opposite direction within 150 ms): 0"));
});
