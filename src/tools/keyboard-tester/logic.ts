/**
 * Pure keyboard-test logic: the event reducer, rollover and chatter tracking,
 * combination checks and the text report. No DOM access, so it can be unit
 * tested in plain Node.
 */
import { normalizeCode, isCharacterCode, type KeyDef } from "./layouts";

export const MODIFIER_CODES: ReadonlySet<string> = new Set([
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "MetaLeft",
  "MetaRight",
]);

/** Toggle keys are left out of the "held" count: Mac browsers send them only once per toggle. */
const UNTRACKED_HELD = new Set(["CapsLock"]);

export const LOG_LIMIT = 80;
export const CHATTER_LIMIT = 200;

export interface KeyEventInfo {
  type: "down" | "up";
  code: string;
  key: string;
  keyCode: number;
  location: number;
  repeat: boolean;
  /** High-resolution timestamp in milliseconds (KeyboardEvent.timeStamp). */
  time: number;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
}

export interface ChatterEvent {
  code: string;
  key: string;
  gap: number;
  time: number;
}

export interface LogEntry {
  id: number;
  type: "down" | "up";
  code: string;
  key: string;
  keyCode: number;
  /** Milliseconds since the first event of this session. */
  time: number;
  /** On key-down: ms since the same key was last released. */
  gap: number | null;
  /** On key-up: ms the key was held. */
  held: number | null;
}

export interface LastEvent extends KeyEventInfo {
  gap: number | null;
  held: number | null;
}

export interface Session {
  /** Every code seen (on key-down or key-up) mapped to its last `event.key`. */
  seen: Record<string, string>;
  /** Codes currently held down, oldest first. */
  held: string[];
  /** Most non-modifier keys held at once. */
  maxHeld: number;
  /** Snapshot of held keys (modifiers included) when `maxHeld` was reached. */
  peak: string[];
  lastUp: Record<string, number>;
  downAt: Record<string, number>;
  chatter: ChatterEvent[];
  last: LastEvent | null;
  log: LogEntry[];
  /** Combination ids that were held together at least once. */
  combos: Record<string, true>;
  /** Number of non-repeat key-downs. */
  presses: number;
  /** Counter used to give every log row a stable id. */
  seq: number;
  origin: number | null;
  /** Labels learned from key presses on browsers without keyboard.getLayoutMap(). */
  learned: Record<string, string>;
}

export type SessionAction =
  | { kind: "key"; e: KeyEventInfo; threshold: number; mac: boolean }
  | { kind: "release" }
  | { kind: "reset" };

export function createSession(): Session {
  return {
    seen: {},
    held: [],
    maxHeld: 0,
    peak: [],
    lastUp: {},
    downAt: {},
    chatter: [],
    last: null,
    log: [],
    combos: {},
    presses: 0,
    seq: 0,
    origin: null,
    learned: {},
  };
}

export interface Combo {
  id: string;
  label: string;
  codes: string[];
}

/** Multi-key checks that reveal blocking on matrix keyboards and the 6-key limit. */
export const COMBOS: Combo[] = [
  { id: "wasd", label: "W + A + D + Space + Shift", codes: ["KeyW", "KeyA", "KeyD", "Space", "ShiftLeft"] },
  { id: "qwert", label: "Q + W + E + R + T", codes: ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT"] },
  { id: "modifiers", label: "Ctrl + Shift + Alt + A", codes: ["ControlLeft", "ShiftLeft", "AltLeft", "KeyA"] },
  { id: "arrows", label: "Up + Left + Space", codes: ["ArrowUp", "ArrowLeft", "Space"] },
  { id: "seven", label: "A + S + D + F + J + K + L (7 keys)", codes: ["KeyA", "KeyS", "KeyD", "KeyF", "KeyJ", "KeyK", "KeyL"] },
  { id: "nine", label: "A S D F J K L ; + Space (9 keys)", codes: ["KeyA", "KeyS", "KeyD", "KeyF", "KeyJ", "KeyK", "KeyL", "Semicolon", "Space"] },
];

export function isModifier(code: string): boolean {
  return MODIFIER_CODES.has(code);
}

function nonModifierCount(held: string[]): number {
  return held.reduce((n, c) => (MODIFIER_CODES.has(c) ? n : n + 1), 0);
}

function learnLabel(learned: Record<string, string>, e: KeyEventInfo, code: string): Record<string, string> {
  if (e.type !== "down" || !isCharacterCode(code)) return learned;
  if (e.ctrl || e.alt || e.meta || e.shift) return learned;
  if ([...e.key].length !== 1) return learned;
  const upper = e.key.toUpperCase();
  if ([...upper].length !== 1) return learned;
  if (learned[code] === upper) return learned;
  return { ...learned, [code]: upper };
}

export function sessionReducer(state: Session, action: SessionAction): Session {
  switch (action.kind) {
    case "reset":
      return { ...createSession(), learned: state.learned };
    case "release":
      return state.held.length === 0 && Object.keys(state.downAt).length === 0 ? state : { ...state, held: [], downAt: {} };
    case "key":
      return applyKey(state, action.e, action.threshold, action.mac);
  }
}

function applyKey(state: Session, raw: KeyEventInfo, threshold: number, mac: boolean): Session {
  const code = normalizeCode(raw.code, mac);
  const e: KeyEventInfo = code === raw.code ? raw : { ...raw, code };
  const t = e.time;
  const origin = state.origin ?? t;

  if (e.type === "down") {
    if (e.repeat) {
      // Auto-repeat: refresh the read-out but never count it as a press.
      const prev = state.last;
      return { ...state, origin, last: { ...e, gap: prev?.code === code ? prev.gap : null, held: null } };
    }

    const lastUp = state.lastUp[code];
    const gap = lastUp !== undefined ? t - lastUp : null;
    const isChatter = gap !== null && gap >= 0 && gap < threshold;
    const held = UNTRACKED_HELD.has(code) || state.held.includes(code) ? state.held : [...state.held, code];
    const nonMod = nonModifierCount(held);
    const newMax = nonMod > state.maxHeld;
    const combos = { ...state.combos };
    for (const combo of COMBOS) {
      if (!combos[combo.id] && combo.codes.every((c) => held.includes(c))) combos[combo.id] = true;
    }
    const presses = state.presses + 1;
    const seq = state.seq + 1;
    const entry: LogEntry = { id: seq, type: "down", code, key: e.key, keyCode: e.keyCode, time: t - origin, gap, held: null };

    return {
      ...state,
      origin,
      seen: { ...state.seen, [code]: e.key },
      held,
      maxHeld: newMax ? nonMod : state.maxHeld,
      peak: newMax ? [...held] : state.peak,
      downAt: { ...state.downAt, [code]: t },
      chatter: isChatter ? [...state.chatter, { code, key: e.key, gap: gap as number, time: t - origin }].slice(-CHATTER_LIMIT) : state.chatter,
      last: { ...e, gap, held: null },
      log: [...state.log, entry].slice(-LOG_LIMIT),
      combos,
      presses,
      seq,
      learned: learnLabel(state.learned, e, code),
    };
  }

  // Key up.
  const downAt = state.downAt[code];
  const heldMs = downAt !== undefined ? t - downAt : null;
  const restDown = { ...state.downAt };
  delete restDown[code];
  let held = state.held.filter((c) => c !== code);
  let downMap = restDown;
  if (mac && (code === "MetaLeft" || code === "MetaRight")) {
    // macOS sends no key-up for other keys while Command is down, so drop them here.
    held = held.filter((c) => MODIFIER_CODES.has(c));
    downMap = Object.fromEntries(Object.entries(restDown).filter(([c]) => MODIFIER_CODES.has(c)));
  }
  const seq = state.seq + 1;
  const entry: LogEntry = { id: seq, type: "up", code, key: e.key, keyCode: e.keyCode, time: t - origin, gap: null, held: heldMs };
  return {
    ...state,
    origin,
    seen: state.seen[code] === undefined ? { ...state.seen, [code]: e.key } : state.seen,
    held,
    downAt: downMap,
    lastUp: { ...state.lastUp, [code]: t },
    seq,
    last: { ...e, gap: null, held: heldMs },
    log: [...state.log, entry].slice(-LOG_LIMIT),
  };
}

/* ------------------------------------------------------------------ */
/* Display helpers                                                     */
/* ------------------------------------------------------------------ */

/** Readable form of `event.key`, which is a space or a long name for many keys. */
export function displayKey(key: string): string {
  if (key === " ") return "Space";
  if (key === "") return "(empty)";
  return key;
}

export function locationName(location: number): string {
  return ["Standard", "Left", "Right", "Numpad"][location] ?? String(location);
}

export function formatMs(ms: number): string {
  return ms >= 100 ? `${Math.round(ms)} ms` : `${ms.toFixed(1)} ms`;
}

export interface ChatterSummary {
  code: string;
  count: number;
  shortest: number;
}

export function summarizeChatter(events: ChatterEvent[]): ChatterSummary[] {
  const map = new Map<string, ChatterSummary>();
  for (const ev of events) {
    const cur = map.get(ev.code);
    if (cur) {
      cur.count += 1;
      cur.shortest = Math.min(cur.shortest, ev.gap);
    } else {
      map.set(ev.code, { code: ev.code, count: 1, shortest: ev.gap });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.shortest - b.shortest);
}

export interface Progress {
  tested: number;
  total: number;
  untested: KeyDef[];
  skipped: KeyDef[];
}

/** Count tested keys. A skipped key that gets pressed anyway counts as tested. */
export function computeProgress(keys: KeyDef[], seen: Record<string, string>, skipped: Record<string, true>): Progress {
  const untested: KeyDef[] = [];
  const skippedKeys: KeyDef[] = [];
  let tested = 0;
  let total = 0;
  for (const key of keys) {
    const isSeen = seen[key.code] !== undefined;
    if (skipped[key.code] && !isSeen) {
      skippedKeys.push(key);
      continue;
    }
    total += 1;
    if (isSeen) tested += 1;
    else untested.push(key);
  }
  return { tested, total, untested, skipped: skippedKeys };
}

export function keyName(key: Pick<KeyDef, "code" | "label">): string {
  if (key.label === key.code) return key.code;
  // A plain letter cap (W for KeyW) needs no code beside it; a relabeled one (A for KeyQ) does.
  return key.label.toUpperCase() === key.code.replace(/^Key/, "") ? key.label : `${key.label} (${key.code})`;
}

export interface ReportInput {
  layoutName: string;
  keys: KeyDef[];
  session: Session;
  skipped: Record<string, true>;
  threshold: number;
}

/** Plain-text summary of a test run, ready to paste into a support ticket or a listing chat. */
export function buildReport({ layoutName, keys, session, skipped, threshold }: ReportInput): string {
  const progress = computeProgress(keys, session.seen, skipped);
  const layoutCodes = new Set(keys.map((k) => k.code));
  const extras = Object.keys(session.seen).filter((c) => !layoutCodes.has(c));
  const chatter = summarizeChatter(session.chatter);
  const passed = COMBOS.filter((c) => session.combos[c.id]);
  const lines: string[] = ["Keyboard test report", `Layout: ${layoutName}`, `Keys tested: ${progress.tested} of ${progress.total}`];
  if (progress.skipped.length) lines.push(`Marked as not on this keyboard: ${progress.skipped.map(keyName).join(", ")}`);
  lines.push(progress.untested.length ? `Untested keys (${progress.untested.length}): ${progress.untested.map(keyName).join(", ")}` : "Untested keys: none");
  if (extras.length) lines.push(`Other keys detected: ${extras.join(", ")}`);
  const peakKeys = session.peak.filter((c) => !MODIFIER_CODES.has(c));
  lines.push(session.maxHeld ? `Most keys held at once (excluding modifiers): ${session.maxHeld} (${peakKeys.join(", ")})` : "Most keys held at once: no key presses recorded");
  lines.push(
    chatter.length
      ? `Possible key chatter (same key pressed again within ${threshold} ms): ${chatter.map((c) => `${c.code} x${c.count}, shortest ${formatMs(c.shortest)}`).join("; ")}`
      : `Possible key chatter (same key pressed again within ${threshold} ms): none detected`,
  );
  lines.push(`Combination checks passed: ${passed.length} of ${COMBOS.length}`);
  for (const combo of COMBOS) lines.push(`  ${session.combos[combo.id] ? "[passed]" : "[not seen]"} ${combo.label}`);
  lines.push("Note: browsers cannot see the Fn key and some system shortcuts, so those keys are not part of this report.");
  return lines.join("\n");
}
