/**
 * Pure logic for the dead pixel test: pattern catalogue, gradient maths, flash
 * timing limits, ISO 9241-307 class allowances and the text report. Nothing in
 * this file touches the DOM, so every function can be tested on its own.
 */

/* ------------------------------------------------------------------ */
/* Test patterns                                                       */
/* ------------------------------------------------------------------ */

export type PatternId =
  | "black"
  | "white"
  | "red"
  | "green"
  | "blue"
  | "gray"
  | "cyan"
  | "magenta"
  | "yellow"
  | "gray-25"
  | "gray-75"
  | "steps-dark"
  | "steps-light"
  | "ramp-gray"
  | "ramp-rgb";

export type RampChannel = "gray" | "red" | "green" | "blue";

export type PatternKind =
  | { type: "solid"; color: string; level?: number }
  | { type: "steps"; from: number; count: number }
  | { type: "ramp"; channels: RampChannel[] };

export interface Pattern {
  id: PatternId;
  label: string;
  group: "color" | "tone";
  /** One line shown on the pattern tile. */
  short: string;
  /** What to look for, shown briefly in the on-screen bar during the test. */
  help: string;
  kind: PatternKind;
}

const solid = (color: string): PatternKind => ({ type: "solid", color });

export const PATTERNS: Pattern[] = [
  {
    id: "black",
    label: "Black",
    group: "color",
    short: "Bright dots and backlight bleed",
    help: "Look for lit dots (hot or stuck pixels). Dim the room and check the edges for light leaking in.",
    kind: solid("#000000"),
  },
  {
    id: "white",
    label: "White",
    group: "color",
    short: "Dark dots, dirt and tint",
    help: "Look for dark dots (dead pixels), colored dots, smudges and any yellow or blue tint.",
    kind: solid("#ffffff"),
  },
  {
    id: "red",
    label: "Red",
    group: "color",
    short: "Stuck green or blue subpixels",
    help: "Any dot that is not red has a green or blue subpixel stuck on, or a red subpixel that is dead.",
    kind: solid("#ff0000"),
  },
  {
    id: "green",
    label: "Green",
    group: "color",
    short: "Stuck red or blue subpixels",
    help: "Any dot that is not green has a red or blue subpixel stuck on, or a green subpixel that is dead.",
    kind: solid("#00ff00"),
  },
  {
    id: "blue",
    label: "Blue",
    group: "color",
    short: "Stuck red or green subpixels",
    help: "Any dot that is not blue has a red or green subpixel stuck on, or a blue subpixel that is dead.",
    kind: solid("#0000ff"),
  },
  {
    id: "gray",
    label: "Gray 50%",
    group: "color",
    short: "Uniformity and clouding",
    help: "Look for patches that are brighter, darker or tinted compared with the rest of the screen.",
    kind: { type: "solid", color: "#808080", level: 128 },
  },
  {
    id: "cyan",
    label: "Cyan",
    group: "color",
    short: "Red subpixel check",
    help: "Cyan is green plus blue, so a dead or stuck red subpixel shows up as a clearly different dot.",
    kind: solid("#00ffff"),
  },
  {
    id: "magenta",
    label: "Magenta",
    group: "color",
    short: "Green subpixel check",
    help: "Magenta is red plus blue, so a dead or stuck green subpixel shows up as a clearly different dot.",
    kind: solid("#ff00ff"),
  },
  {
    id: "yellow",
    label: "Yellow",
    group: "color",
    short: "Blue subpixel check",
    help: "Yellow is red plus green, so a dead or stuck blue subpixel shows up as a clearly different dot.",
    kind: solid("#ffff00"),
  },
  {
    id: "gray-25",
    label: "Gray 25%",
    group: "tone",
    short: "Dark-gray uniformity",
    help: "Dark grays reveal uneven backlighting and vignetting that mid-gray can hide.",
    kind: { type: "solid", color: "#404040", level: 64 },
  },
  {
    id: "gray-75",
    label: "Gray 75%",
    group: "tone",
    short: "Light-gray uniformity",
    help: "Light grays reveal color tint and cloudy or dirty-looking patches across the panel.",
    kind: { type: "solid", color: "#bfbfbf", level: 191 },
  },
  {
    id: "steps-dark",
    label: "Near-black steps",
    group: "tone",
    short: "Can you tell 0 from 15?",
    help: "Sixteen bars from level 0 to 15. On a well-set screen you can separate most of them; if the first few merge, shadows are crushed.",
    kind: { type: "steps", from: 0, count: 16 },
  },
  {
    id: "steps-light",
    label: "Near-white steps",
    group: "tone",
    short: "Can you tell 240 from 255?",
    help: "Sixteen bars from level 240 to 255. If the last few merge into pure white, highlights are clipping.",
    kind: { type: "steps", from: 240, count: 16 },
  },
  {
    id: "ramp-gray",
    label: "Gray gradient",
    group: "tone",
    short: "Banding in a smooth ramp",
    help: "A smooth black-to-white ramp. Hard vertical stripes or a color cast in the ramp are banding.",
    kind: { type: "ramp", channels: ["gray"] },
  },
  {
    id: "ramp-rgb",
    label: "Color gradients",
    group: "tone",
    short: "Gray, red, green, blue ramps",
    help: "Four ramps: gray, red, green and blue. Each should fade evenly. Visible stripes or a band that jumps are banding.",
    kind: { type: "ramp", channels: ["gray", "red", "green", "blue"] },
  },
];

export type TestSet = "essential" | "all";

export const TEST_SETS: { value: TestSet; label: string }[] = [
  { value: "essential", label: "Essential: 6 screens" },
  { value: "all", label: "Full: 15 screens" },
];

const ESSENTIAL_IDS: PatternId[] = ["black", "white", "red", "green", "blue", "gray"];

export function patternsForSet(set: TestSet): Pattern[] {
  if (set === "all") return PATTERNS;
  return ESSENTIAL_IDS.map((id) => PATTERNS.find((p) => p.id === id) as Pattern);
}

/** The gray level (0-255) of a solid pattern, if it is a gray. */
export function solidGrayLevel(kind: PatternKind): number | null {
  if (kind.type !== "solid") return null;
  if (kind.level !== undefined) return kind.level;
  if (kind.color === "#000000") return 0;
  if (kind.color === "#ffffff") return 255;
  return null;
}

/* ------------------------------------------------------------------ */
/* Gradient maths                                                      */
/* ------------------------------------------------------------------ */

/** The 8-bit level (0-255) for column `x` of a ramp that is `width` columns wide. */
export function rampLevel(x: number, width: number): number {
  if (width <= 1) return 0;
  const clamped = Math.min(width - 1, Math.max(0, x));
  return Math.round((clamped / (width - 1)) * 255);
}

/** RGB for a ramp channel at a given level. */
export function channelRgb(channel: RampChannel, level: number): [number, number, number] {
  switch (channel) {
    case "red":
      return [level, 0, 0];
    case "green":
      return [0, level, 0];
    case "blue":
      return [0, 0, level];
    default:
      return [level, level, level];
  }
}

/**
 * RGBA pixel data for a ramp image `width` wide with one row per channel. The
 * canvas is stretched to the screen, so each row becomes one horizontal band.
 */
export function buildRampPixels(width: number, channels: RampChannel[]): Uint8ClampedArray {
  const w = Math.max(1, Math.floor(width));
  const data = new Uint8ClampedArray(w * channels.length * 4);
  channels.forEach((channel, row) => {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = channelRgb(channel, rampLevel(x, w));
      const i = (row * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  });
  return data;
}

/** Width in screen pixels of one gray step when a 256-level ramp spans `screenWidth` pixels. */
export function pixelsPerStep(screenWidth: number): number {
  return screenWidth / 256;
}

/* ------------------------------------------------------------------ */
/* Flasher limits                                                      */
/* ------------------------------------------------------------------ */

/** Hard ceiling on full-screen colour changes per second (WCAG 2.3.1 allows up to three flashes per second). */
export const FLASH_MAX_PER_SECOND = 3;
/** The flasher always stops by itself after this many seconds. */
export const FLASH_MAX_SECONDS = 60;
/** Colors the flasher cycles through, in order. */
export const FLASH_COLORS = ["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000"] as const;

export type FlashRate = 1 | 2 | 3;

export const FLASH_RATES: { value: string; label: string }[] = [
  { value: "1", label: "1 change per second (gentlest)" },
  { value: "2", label: "2 changes per second" },
  { value: "3", label: "3 changes per second (maximum)" },
];

/**
 * Milliseconds between two color changes. The rate is clamped to the hard cap,
 * and to one change per second when the system asks for reduced motion.
 * Rounded up, so the real rate never exceeds the requested one.
 */
export function flashIntervalMs(perSecond: number, reducedMotion = false): number {
  const cap = reducedMotion ? 1 : FLASH_MAX_PER_SECOND;
  const wanted = Number.isFinite(perSecond) ? Math.floor(perSecond) : 1;
  const rate = Math.min(cap, Math.max(1, wanted));
  return Math.ceil(1000 / rate);
}

/** Most color changes that can fall inside any window of one second, for a given interval. */
export function maxChangesPerSecond(intervalMs: number): number {
  return Math.ceil(1000 / intervalMs);
}

export const SQUARE_SIZES: { value: string; label: string }[] = [
  { value: "100", label: "100 px" },
  { value: "200", label: "200 px" },
  { value: "300", label: "300 px" },
];

/* ------------------------------------------------------------------ */
/* Locator grid                                                        */
/* ------------------------------------------------------------------ */

export type GridSize = "off" | "coarse" | "medium" | "fine";

export const GRID_SIZES: { value: GridSize; label: string; cols: number; rows: number }[] = [
  { value: "off", label: "Off", cols: 0, rows: 0 },
  { value: "coarse", label: "Coarse: 6 × 4 cells", cols: 6, rows: 4 },
  { value: "medium", label: "Medium: 12 × 8 cells", cols: 12, rows: 8 },
  { value: "fine", label: "Fine: 24 × 14 cells", cols: 24, rows: 14 },
];

export function gridDimensions(size: GridSize): { cols: number; rows: number } {
  const g = GRID_SIZES.find((s) => s.value === size) ?? GRID_SIZES[0];
  return { cols: g.cols, rows: g.rows };
}

export function nextGrid(size: GridSize): GridSize {
  const i = GRID_SIZES.findIndex((s) => s.value === size);
  return GRID_SIZES[(i + 1) % GRID_SIZES.length].value;
}

/** Spreadsheet-style column name: 0 -> A, 25 -> Z, 26 -> AA. */
export function columnName(index: number): string {
  let n = Math.max(0, Math.floor(index));
  let name = "";
  do {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return name;
}

/** Cell label such as "C7" for the point (x, y) on a screen of the given size. */
export function cellLabel(x: number, y: number, width: number, height: number, size: GridSize): string | null {
  const { cols, rows } = gridDimensions(size);
  if (!cols || !rows || width <= 0 || height <= 0) return null;
  const c = Math.min(cols - 1, Math.max(0, Math.floor((x / width) * cols)));
  const r = Math.min(rows - 1, Math.max(0, Math.floor((y / height) * rows)));
  return `${columnName(c)}${r + 1}`;
}

/* ------------------------------------------------------------------ */
/* ISO 9241-307 classes                                                */
/* ------------------------------------------------------------------ */

export type IsoClassId = "I" | "II" | "III" | "IV";

export interface IsoClass {
  id: IsoClassId;
  name: string;
  /** Allowed defects per one million pixels. */
  type1: number;
  type2: number;
  type3: number;
  note: string;
}

export const ISO_CLASSES: IsoClass[] = [
  { id: "I", name: "Class I", type1: 0, type2: 0, type3: 0, note: "No defects allowed. Rare and usually sold as a premium guarantee." },
  { id: "II", name: "Class II", type1: 2, type2: 2, type3: 5, note: "The class most manufacturers quote for ordinary monitors." },
  { id: "III", name: "Class III", type1: 5, type2: 15, type3: 50, note: "A looser class, seen on some budget panels." },
  { id: "IV", name: "Class IV", type1: 50, type2: 150, type3: 500, note: "Generally treated as the reject level in manufacturing." },
];

export interface DefectCounts {
  /** Always-lit pixels (white or bright on a black screen). */
  type1: number;
  /** Always-dark pixels (black on a white screen). */
  type2: number;
  /** Stuck or dead subpixels (a colored dot). */
  type3: number;
}

export const EMPTY_COUNTS: DefectCounts = { type1: 0, type2: 0, type3: 0 };

export interface ResolutionPreset {
  value: string;
  label: string;
  width: number;
  height: number;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { value: "1280x720", label: "1280 × 720 (HD)", width: 1280, height: 720 },
  { value: "1366x768", label: "1366 × 768 (laptop HD)", width: 1366, height: 768 },
  { value: "1920x1080", label: "1920 × 1080 (Full HD)", width: 1920, height: 1080 },
  { value: "1920x1200", label: "1920 × 1200 (WUXGA)", width: 1920, height: 1200 },
  { value: "2560x1080", label: "2560 × 1080 (ultrawide)", width: 2560, height: 1080 },
  { value: "2560x1440", label: "2560 × 1440 (QHD)", width: 2560, height: 1440 },
  { value: "2560x1600", label: "2560 × 1600 (WQXGA)", width: 2560, height: 1600 },
  { value: "3440x1440", label: "3440 × 1440 (ultrawide QHD)", width: 3440, height: 1440 },
  { value: "3840x2160", label: "3840 × 2160 (4K UHD)", width: 3840, height: 2160 },
];

export const MAX_DIMENSION = 16384;
export const MAX_COUNT = 100000;

/**
 * Parse a whole number from text. Plain digits and properly grouped thousands ("1,920") are accepted;
 * empty, fractional, negative, oddly grouped ("1,5") or non-numeric input returns null.
 */
export function parseWholeNumber(text: string): number | null {
  const t = text.trim();
  if (!/^(\d+|\d{1,3}(,\d{3})+)$/.test(t)) return null;
  const n = Number(t.replace(/,/g, ""));
  return Number.isSafeInteger(n) ? n : null;
}

export interface PanelCheck {
  ok: boolean;
  error?: string;
  pixels: number;
}

export function checkPanelSize(width: number | null, height: number | null): PanelCheck {
  if (width === null || height === null) return { ok: false, error: "Enter the panel width and height as whole numbers.", pixels: 0 };
  if (width < 1 || height < 1) return { ok: false, error: "Width and height must be at least 1 pixel.", pixels: 0 };
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return { ok: false, error: `Width and height must be ${MAX_DIMENSION.toLocaleString("en-US")} pixels or less.`, pixels: 0 };
  }
  return { ok: true, pixels: width * height };
}

/** Defects allowed on a panel of `pixels` pixels for a rate quoted per million pixels. */
export function scaledAllowance(perMillion: number, pixels: number): number {
  return (perMillion * pixels) / 1_000_000;
}

export interface ClassResult {
  cls: IsoClass;
  allowed: DefectCounts;
  pass: boolean;
  /** Which defect types exceed the allowance. */
  exceeded: (keyof DefectCounts)[];
}

export interface Classification {
  results: ClassResult[];
  /** The strictest class the panel meets, or null when it is worse than Class IV. */
  best: IsoClass | null;
}

export function classify(counts: DefectCounts, pixels: number): Classification {
  const results = ISO_CLASSES.map((cls): ClassResult => {
    const allowed: DefectCounts = {
      type1: scaledAllowance(cls.type1, pixels),
      type2: scaledAllowance(cls.type2, pixels),
      type3: scaledAllowance(cls.type3, pixels),
    };
    const exceeded = (["type1", "type2", "type3"] as const).filter((k) => counts[k] > allowed[k]);
    return { cls, allowed, pass: exceeded.length === 0, exceeded };
  });
  const best = results.find((r) => r.pass)?.cls ?? null;
  return { results, best };
}

export function formatAllowance(n: number): string {
  if (n === 0) return "0";
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatMegapixels(pixels: number): string {
  return `${(pixels / 1_000_000).toFixed(2)} million`;
}

export function totalDefects(c: DefectCounts): number {
  return c.type1 + c.type2 + c.type3;
}

export interface ReportInput {
  width: number;
  height: number;
  counts: DefectCounts;
  screenNote?: string;
}

export function buildReport({ width, height, counts, screenNote }: ReportInput): string {
  const pixels = width * height;
  const { results, best } = classify(counts, pixels);
  const lines = [
    "Dead pixel test report",
    "======================",
    `Panel: ${width} x ${height} (${pixels.toLocaleString("en-US")} pixels, ${formatMegapixels(pixels)})`,
    ...(screenNote ? [`Browser-reported screen: ${screenNote}`] : []),
    "",
    "Defects found",
    `  Type 1, always-lit pixels (bright on black): ${counts.type1}`,
    `  Type 2, always-dark pixels (black on white): ${counts.type2}`,
    `  Type 3, stuck or dead subpixels (colored dots): ${counts.type3}`,
    `  Total: ${totalDefects(counts)}`,
    "",
    "Allowance by class for this panel (rates per million pixels, scaled to the panel)",
    ...results.map(
      (r) =>
        `  ${r.cls.name}: Type 1 up to ${formatAllowance(r.allowed.type1)}, Type 2 up to ${formatAllowance(r.allowed.type2)}, Type 3 up to ${formatAllowance(r.allowed.type3)} -> ${r.pass ? "within" : "over"}`,
    ),
    "",
    best ? `Strictest class met: ${best.name}` : "Over the Class IV allowance.",
    "",
    "Notes: Class rates are the commonly cited ISO 9241-307 figures. Manufacturers set their own warranty terms and may",
    "count clusters of neighboring defects separately. Check the maker's pixel policy before you claim.",
  ];
  return lines.join("\n");
}
