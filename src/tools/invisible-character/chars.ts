/**
 * Data for the Invisible Character tool: which code points are "hidden", what
 * they are called, how they are grouped and what they are for. No React and no
 * DOM, so everything here can be imported by plain Node scripts.
 *
 * Code points are written as numbers on purpose. Keeping literal invisible
 * characters out of the source means no editor or formatter can silently drop
 * them.
 */

export type CategoryId = "zero-width" | "joiner" | "space" | "blank" | "bidi" | "control" | "linesep" | "variation" | "tag";

export type Action = "remove" | "space" | "newline" | "mark" | "keep";

export interface CategoryInfo {
  id: CategoryId;
  label: string;
  description: string;
  defaultAction: Action;
  actions: Action[];
}

export const CATEGORY_ORDER: CategoryId[] = ["zero-width", "joiner", "space", "blank", "bidi", "control", "linesep", "variation", "tag"];

const BASIC_ACTIONS: Action[] = ["remove", "space", "mark", "keep"];

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  "zero-width": {
    id: "zero-width",
    label: "Zero-width and format",
    description: "Invisible characters that control line breaking, hyphenation or math layout.",
    defaultAction: "remove",
    actions: BASIC_ACTIONS,
  },
  joiner: {
    id: "joiner",
    label: "Joiners (ZWNJ, ZWJ)",
    description: "Invisible connectors used in Arabic and Indic scripts and to glue emoji together.",
    defaultAction: "remove",
    actions: BASIC_ACTIONS,
  },
  space: {
    id: "space",
    label: "Look-alike spaces",
    description: "Spaces of other widths, such as non-breaking, em, thin and ideographic spaces.",
    defaultAction: "space",
    actions: ["space", "remove", "mark", "keep"],
  },
  blank: {
    id: "blank",
    label: "Blank-looking letters",
    description: "The Braille blank and the Hangul fillers: real characters that draw nothing.",
    defaultAction: "remove",
    actions: BASIC_ACTIONS,
  },
  bidi: {
    id: "bidi",
    label: "Text-direction controls",
    description: "Marks, embeddings, overrides and isolates that change how left-to-right and right-to-left text is ordered.",
    defaultAction: "remove",
    actions: BASIC_ACTIONS,
  },
  control: {
    id: "control",
    label: "Control codes",
    description: "Old terminal and transmission codes such as NUL, BEL, ESC and DEL. Tabs and line breaks are not flagged.",
    defaultAction: "remove",
    actions: BASIC_ACTIONS,
  },
  linesep: {
    id: "linesep",
    label: "Unusual line breaks",
    description: "Vertical tab, form feed, next line and the Unicode line and paragraph separators.",
    defaultAction: "newline",
    actions: ["newline", "remove", "space", "mark", "keep"],
  },
  variation: {
    id: "variation",
    label: "Variation selectors",
    description: "Invisible modifiers that pick a glyph variant, such as text or emoji style.",
    defaultAction: "remove",
    actions: BASIC_ACTIONS,
  },
  tag: {
    id: "tag",
    label: "Tag characters",
    description: "The Unicode tags block, an invisible copy of ASCII used inside some flag emoji.",
    defaultAction: "remove",
    actions: BASIC_ACTIONS,
  },
};

export const ACTION_LABELS: Record<Action, string> = {
  remove: "Remove",
  space: "Replace with a space",
  newline: "Replace with a line break",
  mark: "Mark as <U+XXXX>",
  keep: "Keep",
};

export interface CharInfo {
  cp: number;
  /** Short label used on highlight chips, e.g. "ZWSP". */
  abbr: string;
  /** Official Unicode character name (or a descriptive one for ranges). */
  name: string;
  category: CategoryId;
  /** What the character is for, in one sentence. Empty for detect-only entries. */
  note: string;
}

export function codePointLabel(cp: number): string {
  return `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
}

type Row = [cp: number, abbr: string, name: string, category: CategoryId, note?: string];

const ROWS: Row[] = [
  // Zero-width and format characters
  [0x200b, "ZWSP", "ZERO WIDTH SPACE", "zero-width", "Marks a spot where a line may break, without showing a gap. Handy in long URLs and in Thai or Khmer text."],
  [0x2060, "WJ", "WORD JOINER", "zero-width", "Forbids a line break at its position. The modern replacement for U+FEFF as a joiner."],
  [0xfeff, "BOM", "ZERO WIDTH NO-BREAK SPACE", "zero-width", "Doubles as the byte order mark. At the start of a file it flags the encoding; anywhere else it is stray."],
  [0x00ad, "SHY", "SOFT HYPHEN", "zero-width", "Invisible until a line breaks there, when a hyphen appears. Common in text copied from PDFs."],
  [0x034f, "CGJ", "COMBINING GRAPHEME JOINER", "zero-width", "Separates combining marks so they sort and render in a chosen order. Rarely needed."],
  [0x2061, "FUNC", "FUNCTION APPLICATION", "zero-width", "Math markup: says that f(x) applies a function."],
  [0x2062, "ITIMES", "INVISIBLE TIMES", "zero-width", "Math markup: an implied multiplication, as in 2x."],
  [0x2063, "ISEP", "INVISIBLE SEPARATOR", "zero-width", "Math markup: separates indices such as i,j. Has no width."],
  [0x2064, "IPLUS", "INVISIBLE PLUS", "zero-width", "Math markup: an implied plus, as in 3 1/2."],
  [0x180e, "MVS", "MONGOLIAN VOWEL SEPARATOR", "zero-width", "Used in Mongolian script. It is no longer treated as a space."],
  [0x17b4, "KHMER AQ", "KHMER VOWEL INHERENT AQ", "zero-width"],
  [0x17b5, "KHMER AA", "KHMER VOWEL INHERENT AA", "zero-width"],
  [0x206a, "ISS", "INHIBIT SYMMETRIC SWAPPING", "zero-width"],
  [0x206b, "ASS", "ACTIVATE SYMMETRIC SWAPPING", "zero-width"],
  [0x206c, "IAFS", "INHIBIT ARABIC FORM SHAPING", "zero-width"],
  [0x206d, "AAFS", "ACTIVATE ARABIC FORM SHAPING", "zero-width"],
  [0x206e, "NADS", "NATIONAL DIGIT SHAPES", "zero-width"],
  [0x206f, "NODS", "NOMINAL DIGIT SHAPES", "zero-width"],
  [0xfff9, "IAA", "INTERLINEAR ANNOTATION ANCHOR", "zero-width"],
  [0xfffa, "IAS", "INTERLINEAR ANNOTATION SEPARATOR", "zero-width"],
  [0xfffb, "IAT", "INTERLINEAR ANNOTATION TERMINATOR", "zero-width"],

  // Joiners
  [0x200c, "ZWNJ", "ZERO WIDTH NON-JOINER", "joiner", "Stops two neighboring letters from joining. Required in Persian and several Indic scripts."],
  [0x200d, "ZWJ", "ZERO WIDTH JOINER", "joiner", "Asks letters to join, and glues emoji into one picture such as a family or a profession."],

  // Spaces
  [0x00a0, "NBSP", "NO-BREAK SPACE", "space", "Looks like a space but blocks line breaks, and HTML does not collapse it."],
  [0x1680, "OGSP", "OGHAM SPACE MARK", "space"],
  [0x2000, "ENQD", "EN QUAD", "space"],
  [0x2001, "EMQD", "EM QUAD", "space"],
  [0x2002, "ENSP", "EN SPACE", "space", "A space half an em wide."],
  [0x2003, "EMSP", "EM SPACE", "space", "A space one em wide, as wide as the font size."],
  [0x2004, "3/MSP", "THREE-PER-EM SPACE", "space"],
  [0x2005, "4/MSP", "FOUR-PER-EM SPACE", "space"],
  [0x2006, "6/MSP", "SIX-PER-EM SPACE", "space"],
  [0x2007, "FIGSP", "FIGURE SPACE", "space", "As wide as a digit, so columns of numbers stay aligned."],
  [0x2008, "PUNCSP", "PUNCTUATION SPACE", "space"],
  [0x2009, "THSP", "THIN SPACE", "space", "A narrow space for thousands groups and between a number and its unit."],
  [0x200a, "HSP", "HAIR SPACE", "space", "The thinnest standard space. Used to loosen dashes and quotation marks."],
  [0x202f, "NNBSP", "NARROW NO-BREAK SPACE", "space", "A thin space that blocks line breaks. Used before punctuation in French and in number groups."],
  [0x205f, "MMSP", "MEDIUM MATHEMATICAL SPACE", "space", "A four-eighteenths-em space used around operators in math."],
  [0x3000, "IDSP", "IDEOGRAPHIC SPACE", "space", "The full-width space used in Chinese, Japanese and Korean text."],

  // Blank-looking letters and symbols
  [0x2800, "BRAILLE", "BRAILLE PATTERN BLANK", "blank", "A Braille cell with no raised dots. It is a symbol, not a space, so trim() leaves it in place."],
  [0x3164, "HANGUL", "HANGUL FILLER", "blank", "A Korean placeholder letter that draws nothing. Its width depends on the fonts installed."],
  [0x115f, "CHOSEONG", "HANGUL CHOSEONG FILLER", "blank", "Placeholder for an empty leading-consonant slot in a Korean syllable block."],
  [0x1160, "JUNGSEONG", "HANGUL JUNGSEONG FILLER", "blank", "Placeholder for an empty vowel slot in a Korean syllable block."],
  [0xffa0, "HW HANGUL", "HALFWIDTH HANGUL FILLER", "blank", "The half-width form of the Hangul filler, from legacy Korean encodings."],

  // Direction controls
  [0x200e, "LRM", "LEFT-TO-RIGHT MARK", "bidi", "Acts like an invisible left-to-right letter. Fixes punctuation placement in mixed-direction text."],
  [0x200f, "RLM", "RIGHT-TO-LEFT MARK", "bidi", "Acts like an invisible right-to-left letter. Fixes punctuation placement in mixed-direction text."],
  [0x061c, "ALM", "ARABIC LETTER MARK", "bidi", "An invisible Arabic-letter direction mark used in Arabic text."],
  [0x202a, "LRE", "LEFT-TO-RIGHT EMBEDDING", "bidi"],
  [0x202b, "RLE", "RIGHT-TO-LEFT EMBEDDING", "bidi"],
  [0x202c, "PDF", "POP DIRECTIONAL FORMATTING", "bidi"],
  [0x202d, "LRO", "LEFT-TO-RIGHT OVERRIDE", "bidi"],
  [0x202e, "RLO", "RIGHT-TO-LEFT OVERRIDE", "bidi"],
  [0x2066, "LRI", "LEFT-TO-RIGHT ISOLATE", "bidi"],
  [0x2067, "RLI", "RIGHT-TO-LEFT ISOLATE", "bidi"],
  [0x2068, "FSI", "FIRST STRONG ISOLATE", "bidi"],
  [0x2069, "PDI", "POP DIRECTIONAL ISOLATE", "bidi"],

  // Unusual line breaks
  [0x000b, "VT", "LINE TABULATION", "linesep"],
  [0x000c, "FF", "FORM FEED", "linesep"],
  [0x0085, "NEL", "NEXT LINE", "linesep"],
  [0x2028, "LS", "LINE SEPARATOR", "linesep"],
  [0x2029, "PS", "PARAGRAPH SEPARATOR", "linesep"],

  // Tag characters that are not part of the ASCII mirror
  [0xe0001, "LANG", "LANGUAGE TAG", "tag"],
  [0xe007f, "CANCEL", "CANCEL TAG", "tag"],
];

const C0_NAMES: Record<number, [string, string]> = {
  0x00: ["NUL", "NULL"],
  0x01: ["SOH", "START OF HEADING"],
  0x02: ["STX", "START OF TEXT"],
  0x03: ["ETX", "END OF TEXT"],
  0x04: ["EOT", "END OF TRANSMISSION"],
  0x05: ["ENQ", "ENQUIRY"],
  0x06: ["ACK", "ACKNOWLEDGE"],
  0x07: ["BEL", "BELL"],
  0x08: ["BS", "BACKSPACE"],
  0x0e: ["SO", "SHIFT OUT"],
  0x0f: ["SI", "SHIFT IN"],
  0x10: ["DLE", "DATA LINK ESCAPE"],
  0x11: ["DC1", "DEVICE CONTROL ONE"],
  0x12: ["DC2", "DEVICE CONTROL TWO"],
  0x13: ["DC3", "DEVICE CONTROL THREE"],
  0x14: ["DC4", "DEVICE CONTROL FOUR"],
  0x15: ["NAK", "NEGATIVE ACKNOWLEDGE"],
  0x16: ["SYN", "SYNCHRONOUS IDLE"],
  0x17: ["ETB", "END OF TRANSMISSION BLOCK"],
  0x18: ["CAN", "CANCEL"],
  0x19: ["EM", "END OF MEDIUM"],
  0x1a: ["SUB", "SUBSTITUTE"],
  0x1b: ["ESC", "ESCAPE"],
  0x1c: ["FS", "INFORMATION SEPARATOR FOUR"],
  0x1d: ["GS", "INFORMATION SEPARATOR THREE"],
  0x1e: ["RS", "INFORMATION SEPARATOR TWO"],
  0x1f: ["US", "INFORMATION SEPARATOR ONE"],
  0x7f: ["DEL", "DELETE"],
};

const KNOWN = new Map<number, CharInfo>(
  ROWS.map(([cp, abbr, name, category, note]): [number, CharInfo] => [cp, { cp, abbr, name, category, note: note ?? "" }]),
);

/**
 * Format characters that are visible on purpose (Arabic number signs, the end
 * of ayah mark, the Syriac abbreviation mark, Kaithi number signs). They are in
 * Unicode category Cf but draw a glyph, so they are never reported as hidden.
 */
const VISIBLE_FORMAT_RE = /[؀-؅۝܏࢐࢑࣢\u{110bd}\u{110cd}]/u;

const ZERO_WIDTH_FALLBACK_RE = new RegExp(String.raw`[\p{Cf}\p{Default_Ignorable_Code_Point}]`, "u");
const SPACE_FALLBACK_RE = /[\p{Zs}]/u;

/**
 * Describe a code point if it is a hidden character, or return null for
 * anything that is visible (including the ordinary space, tab and line feed).
 */
export function classify(cp: number): CharInfo | null {
  const known = KNOWN.get(cp);
  if (known) return known;

  if (cp === 0x20 || cp === 0x09 || cp === 0x0a || cp === 0x0d) return null;

  if (cp <= 0x1f || cp === 0x7f) {
    const c0 = C0_NAMES[cp];
    return c0 ? { cp, abbr: c0[0], name: c0[1], category: "control", note: "" } : null;
  }
  if (cp >= 0x80 && cp <= 0x9f) return { cp, abbr: codePointLabel(cp), name: "C1 CONTROL CODE", category: "control", note: "" };

  if (cp >= 0xfe00 && cp <= 0xfe0f) {
    const n = cp - 0xfe00 + 1;
    return { cp, abbr: `VS${n}`, name: `VARIATION SELECTOR-${n}`, category: "variation", note: "" };
  }
  if (cp >= 0xe0100 && cp <= 0xe01ef) {
    const n = cp - 0xe0100 + 17;
    return { cp, abbr: `VS${n}`, name: `VARIATION SELECTOR-${n}`, category: "variation", note: "" };
  }
  if ((cp >= 0x180b && cp <= 0x180d) || cp === 0x180f) {
    const n = cp === 0x180f ? 4 : cp - 0x180b + 1;
    return { cp, abbr: `FVS${n}`, name: `MONGOLIAN FREE VARIATION SELECTOR ${["ONE", "TWO", "THREE", "FOUR"][n - 1]}`, category: "variation", note: "" };
  }
  if (cp >= 0xe0000 && cp <= 0xe007f) {
    if (cp >= 0xe0020 && cp <= 0xe007e) {
      const ch = String.fromCharCode(cp - 0xe0000);
      return { cp, abbr: `TAG ${ch === " " ? "SP" : ch}`, name: `TAG ${ch === " " ? "SPACE" : `"${ch}"`}`, category: "tag", note: "" };
    }
    return { cp, abbr: codePointLabel(cp), name: "TAG (RESERVED)", category: "tag", note: "" };
  }

  if (VISIBLE_FORMAT_RE.test(String.fromCodePoint(cp))) return null;

  const ch = String.fromCodePoint(cp);
  if (SPACE_FALLBACK_RE.test(ch)) return { cp, abbr: codePointLabel(cp), name: "SPACE SEPARATOR", category: "space", note: "" };
  if (ZERO_WIDTH_FALLBACK_RE.test(ch)) return { cp, abbr: codePointLabel(cp), name: "INVISIBLE FORMAT CHARACTER", category: "zero-width", note: "" };
  return null;
}

/* ---------------------------------------------------------------------------
 * The copy list
 * ------------------------------------------------------------------------- */

export type CopyFilter = "all" | "zero" | "space" | "blank" | "direction";

export const COPY_FILTER_OPTIONS: { value: CopyFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "zero", label: "Zero-width" },
  { value: "space", label: "Spaces" },
  { value: "blank", label: "Blank glyphs" },
  { value: "direction", label: "Direction marks" },
];

/** Code points offered on the Copy tab, in display order. */
export const COPY_LIST: number[] = [
  0x200b, 0x2060, 0xfeff, 0x00ad, 0x034f, 0x2061, 0x2062, 0x2063, 0x2064, 0x200c, 0x200d,
  0x00a0, 0x2002, 0x2003, 0x2007, 0x2009, 0x200a, 0x202f, 0x205f, 0x3000,
  0x2800, 0x3164, 0x115f, 0x1160, 0xffa0,
  0x200e, 0x200f, 0x061c,
];

export function copyFilterOf(cp: number): CopyFilter {
  const info = KNOWN.get(cp);
  switch (info?.category) {
    case "zero-width":
    case "joiner":
      return "zero";
    case "space":
      return "space";
    case "blank":
      return "blank";
    case "bidi":
      return "direction";
    default:
      return "all";
  }
}

export function infoFor(cp: number): CharInfo {
  const info = KNOWN.get(cp) ?? classify(cp);
  if (!info) throw new Error(`No info for ${codePointLabel(cp)}`);
  return info;
}

/** The four most requested characters, shown as quick-copy cards. */
export const QUICK_COPY: { cp: number; title: string; blurb: string }[] = [
  { cp: 0x200b, title: "Zero-width space", blurb: "No width at all. Marks where a line may break." },
  { cp: 0x2800, title: "Braille blank", blurb: "A blank cell that keeps its width. Not counted as whitespace." },
  { cp: 0x3164, title: "Hangul filler", blurb: "A blank Korean letter. Width depends on the font." },
  { cp: 0x00a0, title: "Non-breaking space", blurb: "Looks like a space, but never wraps or collapses." },
];

/* ---------------------------------------------------------------------------
 * Copy formats
 * ------------------------------------------------------------------------- */

export type CopyFormat = "char" | "code" | "js" | "html" | "css";

export const COPY_FORMAT_OPTIONS: { value: CopyFormat; label: string }[] = [
  { value: "char", label: "The character itself" },
  { value: "code", label: "Code point (U+200B)" },
  { value: "js", label: "JavaScript or JSON (\\u200B)" },
  { value: "html", label: "HTML entity (&#x200B;)" },
  { value: "css", label: "CSS escape (\\200B)" },
];

export const MAX_REPEAT = 500;

/** Parse the repeat box: anything invalid becomes 1, and the result is clamped to 1..MAX_REPEAT. */
export function parseRepeat(raw: string): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_REPEAT);
}

/** The exact string a Copy button puts on the clipboard. */
export function formatForCopy(cp: number, format: CopyFormat, repeat: number): string {
  const n = Math.max(1, Math.min(MAX_REPEAT, Math.floor(repeat)));
  const hex = cp.toString(16).toUpperCase();
  switch (format) {
    case "char":
      return String.fromCodePoint(cp).repeat(n);
    case "code":
      return Array(n).fill(codePointLabel(cp)).join(" ");
    case "js":
      return (cp > 0xffff ? `\\u{${hex}}` : `\\u${hex.padStart(4, "0")}`).repeat(n);
    case "html":
      return `&#x${hex};`.repeat(n);
    case "css":
      return `\\${hex.padStart(4, "0")}`.repeat(n);
  }
}

/* ---------------------------------------------------------------------------
 * Verified behavior of a few common characters
 * ------------------------------------------------------------------------- */

/** Date the rows below were last checked. Update it whenever they are re-run. */
export const BEHAVIOR_VERIFIED_ON = "2026-09-29";

export const BEHAVIOR_VERIFIED_WITH = "Unicode 17.0 data in Node.js 22 (V8) and Python 3.11 (Unicode 14.0 data)";

export interface BehaviorRow {
  cp: number;
  /** Unicode general category. */
  gc: string;
  /** Has the Unicode White_Space property. */
  unicodeSpace: boolean;
  /** JavaScript: "x".trim() returns an empty string (and /\s/ matches). */
  jsTrim: boolean;
  /** Python 3: "x".strip() returns an empty string. */
  pyStrip: boolean;
}

export const BEHAVIOR: BehaviorRow[] = [
  { cp: 0x200b, gc: "Cf", unicodeSpace: false, jsTrim: false, pyStrip: false },
  { cp: 0x200c, gc: "Cf", unicodeSpace: false, jsTrim: false, pyStrip: false },
  { cp: 0x200d, gc: "Cf", unicodeSpace: false, jsTrim: false, pyStrip: false },
  { cp: 0x2060, gc: "Cf", unicodeSpace: false, jsTrim: false, pyStrip: false },
  { cp: 0xfeff, gc: "Cf", unicodeSpace: false, jsTrim: true, pyStrip: false },
  { cp: 0x00ad, gc: "Cf", unicodeSpace: false, jsTrim: false, pyStrip: false },
  { cp: 0x00a0, gc: "Zs", unicodeSpace: true, jsTrim: true, pyStrip: true },
  { cp: 0x2003, gc: "Zs", unicodeSpace: true, jsTrim: true, pyStrip: true },
  { cp: 0x202f, gc: "Zs", unicodeSpace: true, jsTrim: true, pyStrip: true },
  { cp: 0x3000, gc: "Zs", unicodeSpace: true, jsTrim: true, pyStrip: true },
  { cp: 0x2028, gc: "Zl", unicodeSpace: true, jsTrim: true, pyStrip: true },
  { cp: 0x0085, gc: "Cc", unicodeSpace: true, jsTrim: false, pyStrip: true },
  { cp: 0x2800, gc: "So", unicodeSpace: false, jsTrim: false, pyStrip: false },
  { cp: 0x3164, gc: "Lo", unicodeSpace: false, jsTrim: false, pyStrip: false },
  { cp: 0x200e, gc: "Cf", unicodeSpace: false, jsTrim: false, pyStrip: false },
];
