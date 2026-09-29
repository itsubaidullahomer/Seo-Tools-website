/**
 * Tool state: the fields, the view preferences, the shareable URL hash, pasted-tag
 * extraction and the HTML output. Pure functions, no React and no DOM access.
 */
import type { Device, Theme } from "./config";

export type DeviceView = Device | "both";

export interface Fields {
  title: string;
  description: string;
  /** Version B, used when compare mode is on. */
  title2: string;
  description2: string;
  url: string;
  siteName: string;
  /** ISO date or empty. */
  date: string;
  query: string;
  /** Small PNG data URL of an uploaded favicon (kept in this tab only, never put in the link). */
  favicon: string;
}

export interface Prefs {
  device: DeviceView;
  theme: Theme;
  compare: boolean;
}

/** A realistic starting point so the preview is never a blank card. */
export const DEFAULT_FIELDS: Fields = {
  title: "Sourdough Starter Feeding Schedule: Day-by-Day Guide",
  description: "Follow this 7-day sourdough starter schedule: exact flour and water ratios, what the bubbles mean, and fixes for a slow rise.",
  title2: "",
  description2: "",
  url: "https://www.example.com/guides/sourdough-starter-schedule",
  siteName: "Crumb & Crust",
  date: "",
  query: "sourdough starter schedule",
  favicon: "",
};

export const DEFAULT_PREFS: Prefs = { device: "both", theme: "light", compare: false };

/** A "before and after" pair that shows truncation on one side and a clean result on the other. */
export const AB_EXAMPLE: Partial<Fields> = {
  title: "Home | Best Sourdough Bread Recipes and Baking Tips for Beginners and Experts Alike | Crumb & Crust",
  description:
    "Welcome to our website! We have lots of recipes and articles about bread, baking and much more. Click here to read our latest posts and find out more about us and what we do.",
  title2: DEFAULT_FIELDS.title,
  description2: DEFAULT_FIELDS.description,
};

export const EMPTY_FIELDS: Fields = {
  title: "",
  description: "",
  title2: "",
  description2: "",
  url: "",
  siteName: "",
  date: "",
  query: "",
  favicon: "",
};

/** Maximum stored length per field. */
const MAX = { title: 2000, description: 5000, url: 2048, siteName: 200, query: 300, favicon: 200_000 } as const;

const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

/** Coerce anything read from storage or a link into valid fields (unknown keys are dropped). */
export function sanitizeFields(input: unknown, base: Fields = DEFAULT_FIELDS): Fields {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const pick = <K extends keyof Fields>(key: K, max: number): string => (typeof src[key] === "string" ? str(src[key], max) : base[key]);
  const date = typeof src.date === "string" ? src.date.trim() : base.date;
  const favicon = typeof src.favicon === "string" && src.favicon.startsWith("data:image/") ? src.favicon.slice(0, MAX.favicon) : base.favicon;
  return {
    title: pick("title", MAX.title),
    description: pick("description", MAX.description),
    title2: pick("title2", MAX.title),
    description2: pick("description2", MAX.description),
    url: pick("url", MAX.url),
    siteName: pick("siteName", MAX.siteName),
    date: date === "" || isIsoDate(date) ? date : base.date,
    query: pick("query", MAX.query),
    favicon,
  };
}

export function sanitizePrefs(input: unknown, base: Prefs = DEFAULT_PREFS): Prefs {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return {
    device: src.device === "desktop" || src.device === "mobile" || src.device === "both" ? src.device : base.device,
    theme: src.theme === "light" || src.theme === "dark" ? src.theme : base.theme,
    compare: typeof src.compare === "boolean" ? src.compare : base.compare,
  };
}

/* -------------------------------------------------------------------------- */
/* URL hash                                                                    */
/* -------------------------------------------------------------------------- */

const DEVICE_CODE: Record<DeviceView, string> = { desktop: "d", mobile: "m", both: "b" };
const DEVICE_FROM_CODE: Record<string, DeviceView> = { d: "desktop", m: "mobile", b: "both" };

/**
 * Encode the state as a URL hash without the leading "#". Empty fields are left out and
 * default view settings are omitted, so a blank tool has no hash at all. The favicon is
 * never included: an uploaded image stays in this browser.
 */
export function encodeHash(fields: Fields, prefs: Prefs): string {
  const p = new URLSearchParams();
  const put = (k: string, v: string) => {
    if (v) p.set(k, v);
  };
  put("t", fields.title);
  put("d", fields.description);
  put("u", fields.url);
  put("n", fields.siteName);
  put("dt", fields.date);
  put("q", fields.query);
  if (prefs.compare) {
    p.set("ab", "1");
    put("t2", fields.title2);
    put("d2", fields.description2);
  }
  if (prefs.device !== DEFAULT_PREFS.device) p.set("v", DEVICE_CODE[prefs.device]);
  if (prefs.theme !== DEFAULT_PREFS.theme) p.set("th", prefs.theme === "dark" ? "d" : "l");
  return p.toString();
}

export interface DecodedHash {
  fields: Partial<Fields>;
  prefs: Partial<Prefs>;
  /** True when the hash carried any tool state. */
  found: boolean;
}

/** Read a hash produced by encodeHash. Unknown or malformed parts are ignored. */
export function decodeHash(hash: string): DecodedHash {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const empty: DecodedHash = { fields: {}, prefs: {}, found: false };
  if (!raw || raw.length > 20000) return empty;
  let p: URLSearchParams;
  try {
    p = new URLSearchParams(raw);
  } catch {
    return empty;
  }
  const known = ["t", "d", "u", "n", "dt", "q", "ab", "t2", "d2", "v", "th"];
  if (!known.some((k) => p.has(k))) return empty;
  const fields: Partial<Fields> = {};
  const set = (key: keyof Fields, param: string, max: number) => {
    const v = p.get(param);
    if (v !== null) fields[key] = v.slice(0, max);
  };
  // A link is a complete description of the snippet, so anything it omits is blank.
  fields.title = "";
  fields.description = "";
  fields.title2 = "";
  fields.description2 = "";
  fields.url = "";
  fields.siteName = "";
  fields.date = "";
  fields.query = "";
  set("title", "t", MAX.title);
  set("description", "d", MAX.description);
  set("url", "u", MAX.url);
  set("siteName", "n", MAX.siteName);
  set("query", "q", MAX.query);
  set("title2", "t2", MAX.title);
  set("description2", "d2", MAX.description);
  const date = p.get("dt")?.trim() ?? "";
  fields.date = isIsoDate(date) ? date : "";
  const prefs: Partial<Prefs> = {};
  prefs.compare = p.get("ab") === "1";
  prefs.device = DEVICE_FROM_CODE[p.get("v") ?? ""] ?? DEFAULT_PREFS.device;
  prefs.theme = p.get("th") === "d" ? "dark" : "light";
  return { fields, prefs, found: true };
}

/* -------------------------------------------------------------------------- */
/* Pasted HTML tags and HTML output                                            */
/* -------------------------------------------------------------------------- */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  copy: "©",
  reg: "®",
  trade: "™",
  raquo: "»",
  laquo: "«",
  middot: "·",
  bull: "•",
  euro: "€",
  pound: "£",
};

/** Decode the HTML entities people meet in titles and descriptions. */
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code < 1 || code > 0x10ffff) return whole;
      try {
        return String.fromCodePoint(code);
      } catch {
        return whole;
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

/**
 * Pull the title and meta description out of pasted HTML such as
 * `<title>...</title>` or `<meta name="description" content="...">`.
 * Returns null when the text does not look like either tag.
 */
export function extractHeadTags(raw: string): { title?: string; description?: string } | null {
  if (!raw.includes("<")) return null;
  const out: { title?: string; description?: string } = {};
  const t = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(raw);
  if (t) out.title = decodeEntities(t[1]).replace(/\s+/g, " ").trim();
  for (const tag of raw.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/\bname\s*=\s*["']?description["']?/i.test(tag)) continue;
    const c = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
    if (c) {
      out.description = decodeEntities(c[1] ?? c[2] ?? "").replace(/\s+/g, " ").trim();
      break;
    }
  }
  return out.title !== undefined || out.description !== undefined ? out : null;
}

const escText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => escText(s).replace(/"/g, "&quot;");

/** The two head tags for a title and description, HTML-escaped. */
export function headTags(title: string, description: string): string {
  const lines: string[] = [];
  const t = title.replace(/\s+/g, " ").trim();
  const d = description.replace(/\s+/g, " ").trim();
  if (t) lines.push(`<title>${escText(t)}</title>`);
  if (d) lines.push(`<meta name="description" content="${escAttr(d)}">`);
  return lines.join("\n");
}
