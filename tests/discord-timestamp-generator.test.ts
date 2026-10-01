import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DISCORD_EPOCH_MS,
  EXAMPLE_SNOWFLAKE,
  MAX_UNIX,
  STYLES,
  WORLD_CLOCK_ZONES,
  buildSnippet,
  decodeSnowflake,
  describeDelta,
  describeOffset,
  isoUtc,
  nextHour,
  parseUnixInput,
  preview,
  previewAbsolute,
  previewRelative,
  resolvePicker,
  tagFor,
  wallParts,
} from "../src/tools/discord-timestamp-generator/logic";

const GAME_NIGHT = 1794704400;
// A fixed "now" so nothing depends on the machine clock.
const NOW = Date.UTC(2026, 9, 1, 12, 0, 0);

test("the article's moment: 1794704400 is 01:00:00 UTC on 15 November 2026", () => {
  assert.equal(isoUtc(GAME_NIGHT * 1000), "2026-11-15T01:00:00Z");
});

test("worked example: Saturday 14 Nov 2026 20:00 in New York is 1794704400, UTC-05:00 (EST)", () => {
  const r = resolvePicker("2026-11-14", "20:00", "America/New_York", "earlier");
  assert.equal(r.kind, "ok");
  if (r.kind !== "ok") return;
  assert.equal(r.unix, GAME_NIGHT);
  assert.equal(describeOffset(r.ms, "America/New_York"), "UTC-05:00 (EST)");
  // In July the same 8:00 PM is UTC-04:00 and a different number
  const july = resolvePicker("2026-07-11", "20:00", "America/New_York", "earlier");
  assert.equal(july.kind, "ok");
  if (july.kind === "ok") assert.equal(describeOffset(july.ms, "America/New_York"), "UTC-04:00 (EDT)");
});

test("readers see their own clock: Karachi 6:00 AM, New York 8:00 PM the evening before", () => {
  assert.deepEqual(wallParts(GAME_NIGHT * 1000, "Asia/Karachi"), { y: 2026, m: 11, d: 15, h: 6, mi: 0, s: 0 });
  assert.deepEqual(wallParts(GAME_NIGHT * 1000, "America/New_York"), { y: 2026, m: 11, d: 14, h: 20, mi: 0, s: 0 });
});

test("preview table: New York US English and London UK English", () => {
  const ny: Record<string, string> = {
    t: "8:00 PM",
    T: "8:00:00 PM",
    d: "11/14/2026",
    D: "November 14, 2026",
    f: "November 14, 2026 8:00 PM",
    F: "Saturday, November 14, 2026 8:00 PM",
  };
  const ldn: Record<string, string> = {
    t: "01:00",
    T: "01:00:00",
    d: "15/11/2026",
    D: "15 November 2026",
    f: "15 November 2026 01:00",
    F: "Sunday, 15 November 2026 01:00",
  };
  for (const [style, text] of Object.entries(ny)) {
    assert.equal(previewAbsolute(GAME_NIGHT, style as "t", "en-US", "America/New_York"), text, `NY ${style}`);
  }
  for (const [style, text] of Object.entries(ldn)) {
    assert.equal(previewAbsolute(GAME_NIGHT, style as "t", "en-GB", "Europe/London"), text, `London ${style}`);
  }
});

test("seven styles and their codes", () => {
  assert.deepEqual(
    STYLES.map((s) => s.style),
    ["t", "T", "d", "D", "f", "F", "R"],
  );
  assert.equal(tagFor(GAME_NIGHT, "F"), "<t:1794704400:F>");
  assert.equal(tagFor(GAME_NIGHT, "R"), "<t:1794704400:R>");
  assert.equal(tagFor(GAME_NIGHT), "<t:1794704400>");
});

test("same moment around the world (eight cities)", () => {
  assert.equal(WORLD_CLOCK_ZONES.length, 8);
  const expected: Record<string, [number, number, number]> = {
    "America/Los_Angeles": [14, 17, 0],
    "America/New_York": [14, 20, 0],
    "America/Sao_Paulo": [14, 22, 0],
    "Europe/London": [15, 1, 0],
    "Europe/Berlin": [15, 2, 0],
    "Asia/Kolkata": [15, 6, 30],
    "Asia/Tokyo": [15, 10, 0],
    "Australia/Sydney": [15, 12, 0],
  };
  for (const z of WORLD_CLOCK_ZONES) {
    const w = wallParts(GAME_NIGHT * 1000, z.id);
    assert.deepEqual([w.d, w.h, w.mi], expected[z.id], z.id);
  }
});

test("skipped time: 8 March 2026 02:30 in New York becomes 03:30 EDT (1772955000)", () => {
  const r = resolvePicker("2026-03-08", "02:30", "America/New_York", "earlier");
  assert.equal(r.kind, "gap");
  if (r.kind !== "gap") return;
  assert.equal(r.unix, 1772955000);
  assert.equal(r.gapMinutes, 60);
  assert.equal(r.shifted.h, 3);
  assert.equal(r.shifted.mi, 30);
});

test("repeated time: 1 November 2026 01:30 in New York happens twice", () => {
  const first = resolvePicker("2026-11-01", "01:30", "America/New_York", "earlier");
  const second = resolvePicker("2026-11-01", "01:30", "America/New_York", "later");
  assert.equal(first.kind, "ambiguous");
  assert.equal(second.kind, "ambiguous");
  if (first.kind !== "ambiguous" || second.kind !== "ambiguous") return;
  assert.equal(first.unix, 1793511000);
  assert.equal(second.unix, 1793514600);
  assert.equal(first.later, 1793514600 * 1000);
  // London repeats 01:30 on 25 October 2026
  assert.equal(resolvePicker("2026-10-25", "01:30", "Europe/London", "earlier").kind, "ambiguous");
});

test("UK/US clock change week: New York is 4 hours behind London; weekly events 169 hours apart", () => {
  const oct31 = resolvePicker("2026-10-31", "20:00", "America/New_York", "earlier");
  const nov7 = resolvePicker("2026-11-07", "20:00", "America/New_York", "earlier");
  assert.equal(oct31.kind, "ok");
  assert.equal(nov7.kind, "ok");
  if (oct31.kind !== "ok" || nov7.kind !== "ok") return;
  // midnight in London as 31 October ends, then 1:00 AM a week later
  assert.deepEqual(wallParts(oct31.ms, "Europe/London"), { y: 2026, m: 11, d: 1, h: 0, mi: 0, s: 0 });
  assert.deepEqual(wallParts(nov7.ms, "Europe/London"), { y: 2026, m: 11, d: 8, h: 1, mi: 0, s: 0 });
  assert.equal((nov7.unix - oct31.unix) / 3600, 169);
  assert.equal(describeOffset(oct31.ms, "America/New_York"), "UTC-04:00 (EDT)");
  assert.equal(describeOffset(oct31.ms, "Europe/London"), "UTC+00:00");
});

test("snowflake: Discord's documentation example", () => {
  assert.equal(DISCORD_EPOCH_MS, BigInt(1420070400000));
  assert.equal(BigInt(EXAMPLE_SNOWFLAKE) >> BigInt(22), BigInt(41944705796));
  const s = decodeSnowflake(EXAMPLE_SNOWFLAKE, NOW);
  assert.equal(s.kind, "ok");
  if (s.kind !== "ok") return;
  assert.equal(s.ms, 1462015105796);
  assert.equal(new Date(s.ms).toISOString(), "2016-04-30T11:18:25.796Z");
  assert.equal(s.worker, 1);
  assert.equal(s.process, 0);
  assert.equal(s.increment, 7);
  assert.equal(s.bits.timestamp.length, 42);
  assert.equal(s.bits.worker.length, 5);
  assert.equal(s.bits.process.length, 5);
  assert.equal(s.bits.increment.length, 12);
  assert.deepEqual(s.notes, []);
});

test("snowflake warnings: below 4,194,304 and future dates", () => {
  assert.equal(2 ** 22, 4194304);
  const tiny = decodeSnowflake("4194303", NOW);
  assert.ok(tiny.kind === "ok" && tiny.notes.some((n) => n.includes("4,194,304")));
  const future = decodeSnowflake(((BigInt(NOW + 86_400_000) - DISCORD_EPOCH_MS) << BigInt(22)).toString(), NOW);
  assert.ok(future.kind === "ok" && future.notes.some((n) => n.includes("future")));
  assert.equal(decodeSnowflake("abc", NOW).kind, "invalid");
});

test("Unix tab: seconds, 13-digit milliseconds and pasted codes", () => {
  assert.deepEqual(parseUnixInput("1794704400"), { kind: "ok", seconds: GAME_NIGHT, note: undefined });
  const ms = parseUnixInput("1794704400000");
  assert.equal(ms.kind, "ok");
  if (ms.kind === "ok") {
    assert.equal(ms.seconds, GAME_NIGHT);
    assert.ok(ms.note?.includes("milliseconds"));
  }
  assert.equal(parseUnixInput("<t:1794704400:R>").kind, "ok");
  assert.equal(parseUnixInput("-5").kind, "invalid");
  assert.equal(parseUnixInput(String(MAX_UNIX + 1)).kind, "invalid");
});

test("date range 1970 through 9999", () => {
  assert.equal(resolvePicker("1969-12-31", "12:00", "UTC", "earlier").kind, "invalid");
  assert.equal(resolvePicker("9999-12-31", "23:59:59", "UTC", "earlier").kind, "ok");
  assert.equal(isoUtc(MAX_UNIX * 1000), "9999-12-31T23:59:59Z");
});

test("fields default to the next full hour in the zone", () => {
  const at = Date.UTC(2026, 10, 15, 0, 37, 12); // 19:37:12 EST on 14 Nov
  assert.deepEqual(nextHour(at, "America/New_York"), { date: "2026-11-14", time: "20:00:00" });
  // half-hour zone: 06:07 IST -> 07:00 IST
  assert.deepEqual(nextHour(at, "Asia/Kolkata"), { date: "2026-11-15", time: "07:00:00" });
});

test("relative preview and exact countdown use the supplied clock", () => {
  const now = (GAME_NIGHT - 3 * 3600) * 1000;
  assert.equal(previewRelative(GAME_NIGHT, now, "en-US"), "in 3 hours");
  assert.equal(previewRelative(GAME_NIGHT, (GAME_NIGHT + 2 * 86400) * 1000, "en-US"), "2 days ago");
  assert.equal(preview(GAME_NIGHT, "R", "en-US", "UTC", now), "in 3 hours");
  assert.equal(describeDelta(GAME_NIGHT, (GAME_NIGHT - 93784) * 1000), "in 1d 2h 3m 4s");
});

test("bot snippets produce the plain <t:UNIX:STYLE> text", () => {
  const js = buildSnippet("js", GAME_NIGHT, "R");
  assert.ok(js.includes("TimestampStyles.RelativeTime"));
  assert.ok(js.includes('"<t:1794704400:R>"'));
  const py = buildSnippet("python", GAME_NIGHT, "F");
  assert.ok(py.includes('discord.utils.format_dt(when, style="F")'));
  assert.equal(buildSnippet("raw", GAME_NIGHT, "F"), "<t:1794704400:F>");
});
