import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chartCsv,
  convertBulk,
  convertLine,
  describeNow,
  hourRows,
  MAX_BULK_LINES,
  MAX_INPUT_LENGTH,
  minuteGrid,
  parseTime,
  shiftZone,
  speak,
  STEPS,
  to12h,
  toColon,
  toMilitary,
  ZONE_BY_LETTER,
  ZONES,
  zoneForOffsetMinutes,
  type ClockTime,
} from "../src/tools/military-time-converter/logic";
import { buildChartPdf, PAPERS } from "../src/tools/military-time-converter/pdf";
import { buildPrintHtml } from "../src/tools/military-time-converter/print";

function ok(raw: string, assume?: "12h" | "24h") {
  const r = parseTime(raw, assume ? { assume } : {});
  assert.equal(r.status, "ok", `${raw}: ${JSON.stringify(r)}`);
  return r as Extract<ReturnType<typeof parseTime>, { status: "ok" }>;
}
const mil = (raw: string, assume?: "12h" | "24h") => toMilitary(ok(raw, assume).time);
const t = (hour: number, minute: number): ClockTime => ({ hour, minute });

test("intro examples: 5:30 PM = 1730 and 0630 = 6:30 AM", () => {
  const a = ok("5:30 PM");
  assert.equal(toMilitary(a.time), "1730");
  assert.equal(toColon(a.time), "17:30");
  assert.equal(a.source, "12h");
  assert.equal(speak(a.time, "standard"), "seventeen thirty hours");
  const b = ok("0630");
  assert.equal(to12h(b.time), "6:30 AM");
  assert.equal(b.source, "24h");
});

test("accepted notations: 5:30 PM, 5.30pm, 17:30, 1730, 0630, 1730h, 17h30, noon, midnight", () => {
  assert.equal(mil("5.30pm"), "1730");
  assert.equal(mil("17:30"), "1730");
  assert.equal(mil("1730"), "1730");
  assert.equal(mil("1730h"), "1730");
  assert.equal(mil("17h30"), "1730");
  assert.equal(mil("5:30 p.m."), "1730");
  assert.equal(mil("noon"), "1200");
  assert.equal(mil("midnight"), "0000");
  const z = ok("1730Z");
  assert.equal(z.zone, "Z");
  assert.equal(speak(z.time, "standard", ZONE_BY_LETTER[z.zone!]), "seventeen thirty Zulu");
});

test("worked conversion examples", () => {
  assert.equal(mil("5:30 PM"), "1730");
  assert.equal(mil("6:30 AM"), "0630");
  assert.equal(mil("12:15 AM"), "0015");
  assert.equal(mil("12:15 PM"), "1215");
  assert.equal(to12h(ok("1945").time), "7:45 PM");
  assert.equal(to12h(ok("0005").time), "12:05 AM");
  assert.equal(to12h(ok("1700").time), "5:00 PM");
  assert.equal(to12h(ok("1900").time), "7:00 PM");
  assert.equal(to12h(ok("2200").time), "10:00 PM");
  // FAQ
  assert.equal(to12h(ok("1930").time), "7:30 PM");
  assert.equal(to12h(ok("1545").time), "3:45 PM");
  assert.equal(to12h(ok("1200").time), "12:00 PM");
});

test("the one-line formula agrees with the converter for every minute of the day", () => {
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 1, 30, 59]) {
      const twelve = to12h(t(h, m));
      const back = ok(twelve).time;
      assert.deepEqual(back, t(h, m));
      const [hh, rest] = twelve.split(":");
      const pm = rest.endsWith("PM");
      assert.equal((Number(hh) % 12) + (pm ? 12 : 0), h);
      assert.equal(h % 12 || 12, Number(hh));
    }
  }
});

test("no AM/PM: 5:30 is ambiguous, offered as 0530 and 1730; military input reads 0530", () => {
  const r = parseTime("5:30");
  assert.equal(r.status, "ambiguous");
  if (r.status === "ambiguous") {
    assert.equal(toMilitary(r.am), "0530");
    assert.equal(toMilitary(r.pm), "1730");
  }
  assert.equal(mil("5:30", "24h"), "0530");
  assert.equal(parseTime("630").status, "ambiguous");
});

test("edge cases: 2400, 17:30 PM, 17:30 AM, seconds, out-of-range values", () => {
  const midnight = ok("2400");
  assert.equal(toMilitary(midnight.time), "0000");
  assert.ok(midnight.notes.some((n) => n.includes("2400")));
  const pm = ok("17:30 PM");
  assert.equal(toMilitary(pm.time), "1730");
  assert.ok(pm.notes.length > 0);
  assert.equal(parseTime("17:30 AM").status, "invalid");
  const secs = ok("17:30:45");
  assert.equal(toMilitary(secs.time), "1730");
  assert.ok(secs.notes.some((n) => /Seconds were ignored/.test(n)));
  assert.equal(parseTime("2500").status, "invalid");
  assert.equal(parseTime("1760").status, "invalid");
  assert.equal(parseTime("2401").status, "invalid");
  assert.equal(parseTime("x".repeat(MAX_INPUT_LENGTH + 1)).status, "invalid");
  assert.equal(MAX_INPUT_LENGTH, 60);
});

test("A, H and P suffixes are read as AM, hours and PM; other letters are zones", () => {
  assert.equal(parseTime("1530a").status, "invalid"); // 15:30 AM is contradictory
  assert.equal(ok("1530h").zone, undefined);
  assert.equal(ok("1530p").zone, undefined);
  assert.equal(ok("1530R").zone, "R");
  assert.equal(ok("1530 utc").zone, "Z");
});

test("how to say it: article table and rules", () => {
  const say = (s: string) => speak(ok(s).time, "standard");
  assert.equal(say("0000"), "zero hundred hours");
  assert.equal(say("0005"), "zero zero zero five hours");
  assert.equal(say("1000"), "ten hundred hours");
  assert.equal(say("2359"), "twenty-three fifty-nine hours");
  assert.equal(say("0700"), "zero seven hundred hours");
  assert.equal(say("1300"), "thirteen hundred hours");
  assert.equal(say("0630"), "zero six thirty hours");
  assert.equal(say("1745"), "seventeen forty-five hours");
  assert.equal(say("0605"), "zero six zero five hours");
  assert.equal(say("0600"), "zero six hundred hours");
  assert.equal(say("1700"), "seventeen hundred hours");
  assert.equal(say("1900"), "nineteen hundred hours");
  assert.equal(speak(t(19, 0), "radio"), "one niner zero zero hours");
  assert.equal(speak(t(6, 30), "oh"), "oh six thirty hours");
  assert.equal(speak(t(6, 30), "digits"), "zero six three zero hours");
});

test("zone letters: A–M ahead (skipping J), N–Y behind, Z is UTC, J is local", () => {
  const ahead = "ABCDEFGHIKLM".split("");
  ahead.forEach((l, i) => assert.equal(ZONE_BY_LETTER[l].offset, i + 1, l));
  "NOPQRSTUVWXY".split("").forEach((l, i) => assert.equal(ZONE_BY_LETTER[l].offset, -(i + 1), l));
  assert.equal(ZONE_BY_LETTER.Z.offset, 0);
  assert.equal(ZONE_BY_LETTER.Z.name, "Zulu");
  assert.equal(ZONE_BY_LETTER.J.offset, null);
  assert.equal(ZONES.length, 26);
  assert.equal(zoneForOffsetMinutes(330), undefined); // India, UTC+5:30
  // US daylight-saving table
  const us: [string, number][] = [
    ["R", -5],
    ["Q", -4],
    ["S", -6],
    ["T", -7],
    ["U", -8],
  ];
  for (const [l, off] of us) assert.equal(ZONE_BY_LETTER[l].offset, off);
});

test("zone arithmetic: 1530R = 2030Z, and 1430Z in Q and R", () => {
  assert.deepEqual(shiftZone(t(15, 30), -5, 0), { time: t(20, 30), dayShift: 0 });
  assert.equal(to12h(shiftZone(t(14, 30), 0, -4).time), "10:30 AM");
  assert.equal(to12h(shiftZone(t(14, 30), 0, -5).time), "9:30 AM");
  assert.deepEqual(shiftZone(t(23, 0), 0, 2), { time: t(1, 0), dayShift: 1 });
  assert.deepEqual(shiftZone(t(1, 0), 0, -5), { time: t(20, 0), dayShift: -1 });
});

test("date-time group: 291930Z SEP 26", () => {
  const now = describeNow(Date.UTC(2026, 8, 29, 19, 30) / 60_000);
  assert.equal(now.dtg, "291930Z SEP 26");
  assert.deepEqual(now.utc, t(19, 30));
});

test("hour chart and minute grid", () => {
  const rows = hourRows();
  assert.equal(rows.length, 24);
  assert.equal(rows[0].twelve, "12:00 AM");
  assert.equal(rows[0].note, "Midnight");
  assert.equal(rows[12].twelve, "12:00 PM");
  assert.equal(rows[12].note, "Noon");
  assert.equal(rows[17].military, "1700");
  assert.equal(rows[17].twelve, "5:00 PM");
  assert.equal(to12h(ok("1747").time), "5:47 PM");
  assert.deepEqual([...STEPS], [5, 10, 15, 30]);
  assert.equal(minuteGrid(15).columns.length, 4);
  assert.equal(minuteGrid(5).rows[13].cells[3], "1315");
  assert.ok(chartCsv("hours", 15).startsWith("Military,12-hour,How to say it\n0000,12:00 AM,zero hundred hours"));
});

test("list/timesheet: ranges, durations across midnight, 12-hour flagging, line cap", () => {
  const shift = convertLine("2200 - 0600", "12h");
  assert.equal(shift.kind, "ok");
  assert.equal(shift.military, "2200 - 0600");
  assert.match(shift.note, /Duration 8h 00m \(crosses midnight\)/);
  const day = convertLine("8:00 AM - 4:30 PM", "12h");
  assert.match(day.note, /Duration 8h 30m/);
  assert.equal(convertLine("5:30", "12h").kind, "ambiguous");
  assert.equal(convertLine("5:30", "24h").military, "0530");
  // Article tips: 0800-1730 is 9h30; 0930-1415 is 285 minutes = 4h45
  assert.match(convertLine("0800 - 1730", "24h").note, /9h 30m/);
  assert.match(convertLine("0930 - 1415", "24h").note, /4h 45m/);
  assert.equal(14 * 60 + 15 - (9 * 60 + 30), 285);
  const many = convertBulk(Array(MAX_BULK_LINES + 5).fill("1200").join("\n"), "24h");
  assert.equal(many.rows.length, 2000);
  assert.ok(many.truncated);
});

test("nurse example: every six hours from 0600", () => {
  const times = [0, 6, 12, 18].map((h) => toMilitary(shiftZone(t(6, 0), 0, h).time));
  assert.deepEqual(times, ["0600", "1200", "1800", "0000"]);
});

test("afternoon shortcut (subtract 2, keep last digit) works 1300–2159 and fails at 2200/2300", () => {
  for (let h = 13; h <= 23; h++) {
    const shortcut = (h - 2) % 10;
    const real = h - 12;
    assert.equal(shortcut === real, h <= 21, String(h));
  }
});

test("printable chart: two pages, US Letter or A4", () => {
  assert.deepEqual([PAPERS.letter.width, PAPERS.letter.height], [612, 792]);
  assert.deepEqual([Math.round(PAPERS.a4.width / 72 * 25.4), Math.round(PAPERS.a4.height / 72 * 25.4)], [210, 297]);
  for (const paper of ["letter", "a4"] as const) {
    const pdf = buildChartPdf(paper, 15);
    assert.ok(pdf.startsWith("%PDF-1.4"));
    assert.match(pdf, /\/Count 2/);
    assert.equal(pdf.match(/\/Type \/Page /g)?.length, 2);
    // xref offsets point at the objects they name
    const xref = pdf.slice(pdf.indexOf("xref\n"));
    const offsets = [...xref.matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    offsets.forEach((off, i) => assert.ok(pdf.startsWith(`${i + 1} 0 obj`, off), `object ${i + 1}`));
    const startxref = Number(/startxref\n(\d+)/.exec(pdf)![1]);
    assert.ok(pdf.startsWith("xref", startxref));
    const html = buildPrintHtml(paper, 15, "test");
    assert.equal(html.match(/<section class="page">/g)?.length, 2);
  }
});
