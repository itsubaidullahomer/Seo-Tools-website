/**
 * Keyboard layouts as data.
 *
 * Every board is generated from one base description (an ANSI Windows main
 * block) plus a small set of overrides for ISO, Mac and the four board sizes.
 * Each key is `{ code, label, x, y, w, h }` in keyboard units (1u = one standard
 * key), where `code` is the `KeyboardEvent.code` value the browser reports for
 * that physical key.
 */

export type BoardSize = "full" | "tkl" | "compact" | "sixty";
export type Standard = "ansi" | "iso";
export type Platform = "windows" | "mac";

export interface KeyDef {
  code: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** ISO Enter is an inverted L; everything else is a rectangle. */
  shape?: "iso-enter";
}

export interface BoardLayout {
  keys: KeyDef[];
  /** Total width in key units. */
  width: number;
  /** Total height in key units. */
  height: number;
}

export const BOARD_SIZES: { value: BoardSize; label: string }[] = [
  { value: "full", label: "Full-size (with numpad)" },
  { value: "tkl", label: "Tenkeyless (TKL)" },
  { value: "compact", label: "75% / laptop (no numpad)" },
  { value: "sixty", label: "60% (no function row)" },
];

export const STANDARDS: { value: Standard; label: string }[] = [
  { value: "ansi", label: "ANSI (US)" },
  { value: "iso", label: "ISO (UK / Europe)" },
];

type Cell = { code: string; label: string; w: number; h?: number; shape?: KeyDef["shape"] } | { gap: number };

const k = (code: string, label: string, w = 1, extra: { h?: number; shape?: KeyDef["shape"] } = {}): Cell => ({ code, label, w, ...extra });
const gap = (n: number): Cell => ({ gap: n });
const letters = (chars: string): Cell[] => [...chars].map((c) => k(`Key${c}`, c));

/** Labels that differ on Mac keyboards. */
const MAC_LABELS: Record<string, string> = {
  Backspace: "Delete",
  Enter: "Return",
  ControlLeft: "Control",
  AltLeft: "Option",
  AltRight: "Option",
  MetaLeft: "Cmd",
  MetaRight: "Cmd",
  PrintScreen: "F13",
  ScrollLock: "F14",
  Pause: "F15",
  NumLock: "Clear",
  Insert: "Help",
  Delete: "Del",
};

/** Labels that differ on ISO boards. */
const ISO_LABELS: Record<string, string> = {
  Backslash: "#",
  IntlBackslash: "\\",
};

/**
 * Mac keyboards report F13, F14 and F15 for the keys that sit where PrintScreen,
 * ScrollLock and Pause are on a PC board. Map them back to the layout slots.
 */
const MAC_ALIASES: Record<string, string> = { F13: "PrintScreen", F14: "ScrollLock", F15: "Pause" };

export function normalizeCode(code: string, mac: boolean): string {
  return mac ? (MAC_ALIASES[code] ?? code) : code;
}

/** Codes whose caps show a typed character and can be relabeled for other layouts. */
export function isCharacterCode(code: string): boolean {
  return /^(Key[A-Z]|Digit[0-9]|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash|IntlBackslash|IntlRo|IntlYen)$/.test(code);
}

function functionRow(): Cell[] {
  const f = (n: number) => k(`F${n}`, `F${n}`);
  return [k("Escape", "Esc"), gap(1), f(1), f(2), f(3), f(4), gap(0.5), f(5), f(6), f(7), f(8), gap(0.5), f(9), f(10), f(11), f(12)];
}

function numberRow(): Cell[] {
  const digits: Cell[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => k(`Digit${d}`, String(d)));
  return [k("Backquote", "`"), ...digits, k("Minus", "-"), k("Equal", "="), k("Backspace", "Backspace", 2)];
}

function topRow(standard: Standard): Cell[] {
  const base: Cell[] = [k("Tab", "Tab", 1.5), ...letters("QWERTYUIOP"), k("BracketLeft", "["), k("BracketRight", "]")];
  return standard === "iso" ? [...base, k("Enter", "Enter", 1.5, { h: 2, shape: "iso-enter" })] : [...base, k("Backslash", "\\", 1.5)];
}

function homeRow(standard: Standard): Cell[] {
  const base: Cell[] = [k("CapsLock", "Caps Lock", 1.75), ...letters("ASDFGHJKL"), k("Semicolon", ";"), k("Quote", "'")];
  return standard === "iso" ? [...base, k("Backslash", "#")] : [...base, k("Enter", "Enter", 2.25)];
}

function shiftRow(standard: Standard, size: BoardSize): Cell[] {
  const slash: Cell[] = [...letters("ZXCVBNM"), k("Comma", ","), k("Period", "."), k("Slash", "/")];
  const left: Cell[] = standard === "iso" ? [k("ShiftLeft", "Shift", 1.25), k("IntlBackslash", "\\"), ...slash] : [k("ShiftLeft", "Shift", 2.25), ...slash];
  return [...left, k("ShiftRight", "Shift", size === "compact" ? 1.75 : 2.75)];
}

function bottomRow(size: BoardSize, platform: Platform): Cell[] {
  const space = k("Space", "Space", 6.25);
  if (size === "compact") {
    return platform === "mac"
      ? [k("ControlLeft", "Ctrl", 1.25), k("AltLeft", "Alt", 1.25), k("MetaLeft", "Win", 1.25), space, k("MetaRight", "Win"), k("AltRight", "Alt"), gap(1)]
      : [k("ControlLeft", "Ctrl", 1.25), k("MetaLeft", "Win", 1.25), k("AltLeft", "Alt", 1.25), space, k("AltRight", "Alt"), k("ControlRight", "Ctrl"), gap(1)];
  }
  if (platform === "mac") {
    return [k("ControlLeft", "Ctrl", 1.25), k("AltLeft", "Alt", 1.25), k("MetaLeft", "Win", 1.25), space, k("MetaRight", "Win", 1.25), k("AltRight", "Alt", 1.25), gap(2.5)];
  }
  return [
    k("ControlLeft", "Ctrl", 1.25),
    k("MetaLeft", "Win", 1.25),
    k("AltLeft", "Alt", 1.25),
    space,
    k("AltRight", "Alt", 1.25),
    k("MetaRight", "Win", 1.25),
    k("ContextMenu", "Menu", 1.25),
    k("ControlRight", "Ctrl", 1.25),
  ];
}

/** Build the layout for a board size, key standard and modifier-label set. */
export function buildLayout(size: BoardSize, standard: Standard, platform: Platform): BoardLayout {
  const keys: KeyDef[] = [];
  const hasFunctionRow = size !== "sixty";
  const numY = hasFunctionRow ? 1.5 : 0;
  const rows = { fn: 0, num: numY, top: numY + 1, home: numY + 2, shift: numY + 3, bottom: numY + 4 };
  let maxX = 0;

  const put = (cells: Cell[], x: number, y: number): number => {
    let cx = x;
    for (const c of cells) {
      if ("gap" in c) {
        cx += c.gap;
        continue;
      }
      keys.push({ code: c.code, label: c.label, x: cx, y, w: c.w, h: c.h ?? 1, shape: c.shape });
      cx += c.w;
      maxX = Math.max(maxX, cx);
    }
    return cx;
  };

  if (hasFunctionRow) put(functionRow(), 0, rows.fn);
  put(numberRow(), 0, rows.num);
  put(topRow(standard), 0, rows.top);
  put(homeRow(standard), 0, rows.home);
  put(shiftRow(standard, size), 0, rows.shift);
  put(bottomRow(size, platform), 0, rows.bottom);

  if (size === "compact") {
    // One extra column on the right plus a shortened arrow cluster.
    put([k("Delete", "Del")], 15, rows.fn);
    put([k("Home", "Home")], 15, rows.num);
    put([k("PageUp", "PgUp")], 15, rows.top);
    put([k("PageDown", "PgDn")], 15, rows.home);
    put([k("ArrowUp", "↑"), k("End", "End")], 14, rows.shift);
    put([k("ArrowLeft", "←"), k("ArrowDown", "↓"), k("ArrowRight", "→")], 13, rows.bottom);
  }

  if (size === "full" || size === "tkl") {
    const nx = 15.5;
    put([k("PrintScreen", "PrtSc"), k("ScrollLock", "ScrLk"), k("Pause", "Pause")], nx, rows.fn);
    put([k("Insert", "Ins"), k("Home", "Home"), k("PageUp", "PgUp")], nx, rows.num);
    put([k("Delete", "Del"), k("End", "End"), k("PageDown", "PgDn")], nx, rows.top);
    put([gap(1), k("ArrowUp", "↑")], nx, rows.shift);
    put([k("ArrowLeft", "←"), k("ArrowDown", "↓"), k("ArrowRight", "→")], nx, rows.bottom);
  }

  if (size === "full") {
    const px = 19;
    put([k("NumLock", "Num"), k("NumpadDivide", "/"), k("NumpadMultiply", "*"), k("NumpadSubtract", "-")], px, rows.num);
    put([k("Numpad7", "7"), k("Numpad8", "8"), k("Numpad9", "9"), k("NumpadAdd", "+", 1, { h: 2 })], px, rows.top);
    put([k("Numpad4", "4"), k("Numpad5", "5"), k("Numpad6", "6")], px, rows.home);
    put([k("Numpad1", "1"), k("Numpad2", "2"), k("Numpad3", "3"), k("NumpadEnter", "Enter", 1, { h: 2 })], px, rows.shift);
    put([k("Numpad0", "0", 2), k("NumpadDecimal", ".")], px, rows.bottom);
  }

  // Platform and standard label overrides. Mac boards have no Menu or right Ctrl
  // key, which is why their bottom row (above) leaves them out.
  const overrides: Record<string, string> = { ...(standard === "iso" ? ISO_LABELS : {}), ...(platform === "mac" ? MAC_LABELS : {}) };
  if (standard === "iso" && platform === "windows") overrides.AltRight = "Alt Gr";
  const finalKeys = keys.map((key) => ({ ...key, label: overrides[key.code] ?? key.label }));

  const width = maxX;
  const height = hasFunctionRow ? 6.5 : 5;
  return { keys: finalKeys, width, height };
}
