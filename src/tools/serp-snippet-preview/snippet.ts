/**
 * Snippet model: turns a title, description, URL, date and query into the exact
 * lines a preview card shows, plus the checks that go with them.
 * Pure functions, no React and no DOM access.
 */
import {
  FONT_PX,
  GEOMETRY,
  HEADER,
  LIMITS,
  MAX_FIELD_CHARS,
  MIN_CHARS,
  NEAR_RATIO,
  cardHeight,
  type Device,
} from "./config";
import {
  charCount,
  fitParagraph,
  normalizeText,
  textWidth,
  toPieces,
  toRuns,
  type FallbackMeasure,
  type Run,
  type Span,
} from "./measure";

/* -------------------------------------------------------------------------- */
/* Small parsers: URL, date, query                                             */
/* -------------------------------------------------------------------------- */

export interface ParsedUrl {
  empty: boolean;
  valid: boolean;
  host: string;
  segments: string[];
}

/** Read a page URL (with or without protocol) into a host and path segments. */
export function parseUrl(raw: string): ParsedUrl {
  const t = raw.trim();
  if (!t) return { empty: true, valid: false, host: "", segments: [] };
  if (/\s/.test(t)) return { empty: false, valid: false, host: "", segments: [] };
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`);
    const host = u.hostname.replace(/^www\./i, "");
    if (!host || (host !== "localhost" && !host.includes("."))) return { empty: false, valid: false, host: "", segments: [] };
    const segments = u.pathname
      .split("/")
      .filter(Boolean)
      .map((s) => {
        try {
          return decodeURIComponent(s);
        } catch {
          return s;
        }
      });
    return { empty: false, valid: true, host, segments };
  } catch {
    return { empty: false, valid: false, host: "", segments: [] };
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-12" -> "Sep 12, 2026". Returns null for anything that is not a real calendar date. */
export function formatSnippetDate(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 1900 || mo < 1 || mo > 12) return null;
  const days = new Date(Date.UTC(2000 + (y % 400), mo, 0)).getUTCDate();
  if (d < 1 || d > days) return null;
  return `${MONTHS[mo - 1]} ${d}, ${y}`;
}

/** Words of the search query that get bolded: 2+ characters, unique, at most eight. */
export function queryTerms(query: string): string[] {
  const out: string[] = [];
  for (const raw of query.toLowerCase().split(/\s+/)) {
    const t = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (charCount(t) >= 2 && !out.includes(t)) out.push(t);
    if (out.length >= 8) break;
  }
  return out;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A query word matches as a whole word, with an optional plural ending.
const BOUNDARY_BEFORE = "(?<![\\p{L}\\p{N}])";
const BOUNDARY_AFTER = "(?![\\p{L}\\p{N}])";

/** A query word also matches its singular or plural form, the way a results page matches stems. */
function termForms(term: string): string[] {
  const forms = [term];
  if (term.length >= 4 && term.endsWith("s") && !term.endsWith("ss")) forms.push(term.slice(0, -1));
  if (term.length >= 5 && term.endsWith("es") && !term.endsWith("ss")) forms.push(term.slice(0, -2));
  if (term.length >= 5 && term.endsWith("ies")) forms.push(`${term.slice(0, -3)}y`);
  return forms;
}

function termRegex(terms: string[]): RegExp | null {
  if (!terms.length) return null;
  const alts = [...new Set(terms.flatMap(termForms))].sort((a, b) => b.length - a.length).map(escapeRegExp).join("|");
  return new RegExp(`${BOUNDARY_BEFORE}(?:${alts})(?:es|s)?${BOUNDARY_AFTER}`, "giu");
}

/** Split text into regular and bold spans; bold spans are the words that match the query. */
export function boldSpans(text: string, terms: string[]): Span[] {
  const re = termRegex(terms);
  if (!re || !text) return [{ text, style: "regular" }];
  const spans: Span[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) spans.push({ text: text.slice(last, start), style: "regular" });
    spans.push({ text: m[0], style: "bold" });
    last = start + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last), style: "regular" });
  return spans;
}

/** How many distinct query words appear in the text. */
export function countTermHits(text: string, terms: string[]): number {
  let hits = 0;
  for (const t of terms) {
    const re = termRegex([t]);
    if (re && re.test(text)) hits++;
  }
  return hits;
}

/** Width in pixels before the first query word starts, or null when none appears. */
export function firstTermOffsetPx(text: string, terms: string[], fontPx: number, fallback?: FallbackMeasure | null): number | null {
  const re = termRegex(terms);
  if (!re) return null;
  const m = re.exec(text);
  if (!m) return null;
  return textWidth(text.slice(0, m.index ?? 0), fontPx, fallback);
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

export interface LayoutInput {
  title: string;
  description: string;
  url: string;
  siteName: string;
  /** ISO date, or empty. */
  date: string;
  query: string;
}

export interface SnippetLayout {
  device: Device;
  siteName: string;
  crumb: string;
  monogram: string;
  titleLines: Run[][];
  titlePlaceholder: boolean;
  descriptionLines: Run[][];
  descriptionPlaceholder: boolean;
  titleCut: boolean;
  descriptionCut: boolean;
  /** Estimated one-line width of the whole title. */
  titleWidth: number;
  titleLimit: number;
  /** Estimated one-line width of the date prefix plus the description. */
  descriptionWidth: number;
  descriptionLimit: number;
  /** Width of the date prefix alone (0 without a date). */
  dateWidth: number;
  titleChars: number;
  descriptionChars: number;
  /** Some characters were measured by the browser fallback or a rule of thumb. */
  estimated: boolean;
  height: number;
}

export const TITLE_PLACEHOLDER = "Your page title appears here";
export const DESCRIPTION_PLACEHOLDER = "No meta description set. Google will build a snippet from the page text.";

function clip(text: string): string {
  return text.length > MAX_FIELD_CHARS ? Array.from(text).slice(0, MAX_FIELD_CHARS).join("") : text;
}

/** Clip one line of header text to the width available beside the favicon. */
function fitSingle(text: string, fontPx: number, available: number, fallback?: FallbackMeasure | null): string {
  const { pieces } = toPieces([{ text, style: "regular" }], fontPx, fallback);
  const fitted = fitParagraph(pieces, { width: available, maxLines: 1, budget: available, fontPx, wordBoundary: false });
  return fitted.lines[0] ? toRuns(fitted.lines[0]).map((r) => r.text).join("") : "";
}

export function buildLayout(input: LayoutInput, device: Device, fallback?: FallbackMeasure | null): SnippetLayout {
  const g = GEOMETRY[device];
  const url = parseUrl(input.url);
  const host = url.valid ? url.host : "example.com";
  const segments = url.valid ? url.segments : url.empty ? ["your-page"] : [];
  const site = normalizeText(input.siteName) || host;
  const headerWidth = g.content - HEADER.favicon - HEADER.gap - HEADER.menu;
  // Desktop shows the protocol, host and path segments. Mobile shows only the domain: Google
  // dropped breadcrumbs from mobile results in January 2025.
  const crumbFull = device === "desktop" ? `https://${[host, ...segments].join(" › ")}` : host;

  const title = normalizeText(clip(input.title));
  const description = normalizeText(clip(input.description));
  const terms = queryTerms(input.query);

  // Title.
  const titleText = title || TITLE_PLACEHOLDER;
  const titleStyle = title ? "regular" : "muted";
  const titlePieces = toPieces([{ text: titleText, style: titleStyle }], FONT_PX.title, fallback);
  const titleFit = fitParagraph(titlePieces.pieces, {
    width: g.content,
    maxLines: g.titleLines,
    budget: LIMITS.title[device],
    fontPx: FONT_PX.title,
  });

  // Description, with the date prefix when there is one.
  const date = description ? formatSnippetDate(input.date) : null;
  const datePrefix = date ? `${date} — ` : "";
  const descSpans: Span[] = description
    ? [...(datePrefix ? [{ text: datePrefix, style: "muted" as const }] : []), ...boldSpans(description, terms)]
    : [{ text: DESCRIPTION_PLACEHOLDER, style: "muted" }];
  const descPieces = toPieces(descSpans, FONT_PX.description, fallback);
  const dateWidth = datePrefix ? toPieces([{ text: datePrefix, style: "muted" }], FONT_PX.description, fallback).pieces.reduce((a, p) => a + p.w, 0) : 0;
  const descFit = fitParagraph(descPieces.pieces, {
    width: g.content,
    maxLines: g.descriptionLines,
    budget: LIMITS.description[device],
    fontPx: FONT_PX.description,
  });

  const titleLines = titleFit.lines.map(toRuns);
  const descriptionLines = descFit.lines.map(toRuns);

  return {
    device,
    siteName: fitSingle(site, FONT_PX.site, headerWidth, fallback),
    crumb: fitSingle(crumbFull, FONT_PX.crumb, headerWidth, fallback),
    monogram: (Array.from(site.replace(/^[^\p{L}\p{N}]+/u, ""))[0] ?? "?").toUpperCase(),
    titleLines,
    titlePlaceholder: !title,
    descriptionLines,
    descriptionPlaceholder: !description,
    titleCut: !!title && titleFit.truncated,
    descriptionCut: !!description && descFit.truncated,
    titleWidth: title ? titleFit.total : 0,
    titleLimit: LIMITS.title[device],
    descriptionWidth: description ? descFit.total : 0,
    descriptionLimit: LIMITS.description[device],
    dateWidth,
    titleChars: charCount(title),
    descriptionChars: charCount(description),
    estimated: titlePieces.estimated + descPieces.estimated > 0,
    height: cardHeight(device, titleLines.length, descriptionLines.length),
  };
}

/* -------------------------------------------------------------------------- */
/* Checks                                                                      */
/* -------------------------------------------------------------------------- */

export type CheckLevel = "pass" | "warn" | "fail" | "info";

export interface Check {
  id: string;
  level: CheckLevel;
  label: string;
  detail: string;
}

const px = (n: number) => `${Math.round(n)} px`;

function capsRatio(text: string): { letters: number; ratio: number } {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (!letters.length) return { letters: 0, ratio: 0 };
  const upper = letters.filter((l) => l !== l.toLowerCase() && l === l.toUpperCase()).length;
  return { letters: letters.length, ratio: upper / letters.length };
}

export interface CheckInput {
  title: string;
  description: string;
  query: string;
}

/** Build the checklist for one version from its two device layouts. */
export function buildChecks(input: CheckInput, layouts: Record<Device, SnippetLayout>, fallback?: FallbackMeasure | null): Check[] {
  const checks: Check[] = [];
  const d = layouts.desktop;
  const m = layouts.mobile;
  const title = normalizeText(clip(input.title));
  const description = normalizeText(clip(input.description));
  const terms = queryTerms(input.query);

  // Title length.
  if (!title) {
    checks.push({
      id: "title-empty",
      level: "fail",
      label: "The title is empty",
      detail: "Without a title element Google builds a headline from page headings, links or the domain name, so you lose control of the first thing searchers read.",
    });
  } else if (d.titleCut) {
    checks.push({
      id: "title-fit",
      level: "fail",
      label: "The title is cut off on desktop",
      detail: `About ${px(d.titleWidth)} against a ${px(d.titleLimit)} budget, roughly ${px(d.titleWidth - d.titleLimit)} too wide. Put the important words first and shorten or drop the brand.`,
    });
  } else if (m.titleCut) {
    checks.push({
      id: "title-fit",
      level: "warn",
      label: "The title fits on desktop but is cut off on mobile",
      detail: `About ${px(m.titleWidth)} against a ${px(m.titleLimit)} mobile budget. Trim roughly ${px(m.titleWidth - m.titleLimit)} if most of your visitors search on phones.`,
    });
  } else if (d.titleWidth / d.titleLimit >= NEAR_RATIO || m.titleWidth / m.titleLimit >= NEAR_RATIO) {
    checks.push({
      id: "title-fit",
      level: "warn",
      label: "The title is close to the limit",
      detail: `About ${px(d.titleWidth)} of ${px(d.titleLimit)} on desktop and ${px(m.titleWidth)} of ${px(m.titleLimit)} on mobile. A different font could tip it over, so leave a small margin.`,
    });
  } else {
    checks.push({
      id: "title-fit",
      level: "pass",
      label: "The title fits on desktop and mobile",
      detail: `About ${px(d.titleWidth)} of ${px(d.titleLimit)} on desktop and ${px(m.titleWidth)} of ${px(m.titleLimit)} on mobile.`,
    });
  }
  if (title && d.titleChars < MIN_CHARS.title) {
    checks.push({
      id: "title-short",
      level: "warn",
      label: "The title is short",
      detail: `${d.titleChars} characters. Under ${MIN_CHARS.title} usually leaves room for a more specific promise or a brand.`,
    });
  }

  // Description length.
  if (!description) {
    checks.push({
      id: "desc-empty",
      level: "warn",
      label: "There is no meta description",
      detail: "Google will pick text from the page instead. That can work, but you lose control of the pitch under the title.",
    });
  } else if (d.descriptionCut) {
    checks.push({
      id: "desc-fit",
      level: "warn",
      label: "The description is cut off on desktop and mobile",
      detail: `About ${px(d.descriptionWidth)}${d.dateWidth ? " including the date" : ""} against a ${px(d.descriptionLimit)} desktop budget. Put the main message in the first sentence.`,
    });
  } else if (m.descriptionCut) {
    checks.push({
      id: "desc-fit",
      level: "warn",
      label: "The description fits on desktop but is cut off on mobile",
      detail: `About ${px(m.descriptionWidth)}${m.dateWidth ? " including the date" : ""} against a ${px(m.descriptionLimit)} mobile budget. The first 100 characters or so are safe on both.`,
    });
  } else {
    checks.push({
      id: "desc-fit",
      level: "pass",
      label: "The description fits on desktop and mobile",
      detail: `About ${px(d.descriptionWidth)}${d.dateWidth ? " including the date" : ""} of ${px(d.descriptionLimit)} on desktop and ${px(m.descriptionWidth)} of ${px(m.descriptionLimit)} on mobile.`,
    });
  }
  if (description && d.descriptionChars < MIN_CHARS.description) {
    checks.push({
      id: "desc-short",
      level: "warn",
      label: "The description is short",
      detail: `${d.descriptionChars} characters. There is room to add a benefit, a number or a reason to click.`,
    });
  }

  // Query words.
  if (!terms.length) {
    checks.push({
      id: "query",
      level: "info",
      label: "Add a search query to preview bolding",
      detail: "Words from the query that appear in the description are shown in bold, the way a results page highlights matches.",
    });
  } else {
    const inTitle = title ? countTermHits(title, terms) : 0;
    if (title) {
      if (inTitle === terms.length) {
        const offset = firstTermOffsetPx(title, terms, FONT_PX.title, fallback);
        const late = offset !== null && offset / d.titleLimit > 0.4;
        checks.push({
          id: "query-title",
          level: late ? "info" : "pass",
          label: late ? "The query words appear late in the title" : "The query words appear in the title",
          detail: late
            ? `The first one starts about ${px(offset ?? 0)} in. Moving the main words forward keeps them visible when a title is shortened.`
            : `All ${terms.length} query word${terms.length === 1 ? "" : "s"} found near the start.`,
        });
      } else if (inTitle > 0) {
        checks.push({
          id: "query-title",
          level: "warn",
          label: `Only ${inTitle} of ${terms.length} query words are in the title`,
          detail: "Searchers scan for their own words. A title that repeats the phrase they typed looks more relevant.",
        });
      } else {
        checks.push({
          id: "query-title",
          level: "warn",
          label: "The title does not contain the query words",
          detail: "Searchers scan for their own words, so a title without them can look off-topic even when the page is right.",
        });
      }
    }
    if (description) {
      const inDesc = countTermHits(description, terms);
      checks.push({
        id: "query-desc",
        level: inDesc === terms.length ? "pass" : inDesc > 0 ? "info" : "warn",
        label:
          inDesc === terms.length
            ? "The query words appear in the description"
            : inDesc > 0
              ? `${inDesc} of ${terms.length} query words are in the description`
              : "The description does not contain the query words",
        detail: inDesc === terms.length ? "They are shown in bold in the preview." : "Google may show other page text instead when the description does not answer the query.",
      });
    }
  }

  // Style.
  if (title) {
    const caps = capsRatio(title);
    if (caps.letters >= 8 && caps.ratio > 0.6) {
      checks.push({
        id: "caps",
        level: "warn",
        label: "The title is mostly capitals",
        detail: "Capital letters are wide, so the title uses far more of its budget, and it reads as shouting.",
      });
    }
  }
  if (title && description) {
    const t = title.toLowerCase();
    const s = description.toLowerCase();
    if (t.length >= 12 && s.startsWith(t)) {
      checks.push({
        id: "repeat",
        level: "warn",
        label: "The description starts by repeating the title",
        detail: "The title is already right above it. Use the space for a detail the title cannot fit.",
      });
    }
  }
  return checks;
}

/* -------------------------------------------------------------------------- */
/* A/B comparison                                                              */
/* -------------------------------------------------------------------------- */

export type Tone = "ok" | "warn" | "bad" | "none";

export interface CompareCell {
  text: string;
  tone: Tone;
}

export interface CompareRow {
  label: string;
  a: CompareCell;
  b: CompareCell;
}

export interface CompareSide {
  input: CheckInput;
  layouts: Record<Device, SnippetLayout>;
  checks: Check[];
}

function widthCell(width: number, limit: number, cut: boolean): CompareCell {
  if (width === 0) return { text: "Empty", tone: "none" };
  const tone: Tone = cut ? "bad" : width / limit >= NEAR_RATIO ? "warn" : "ok";
  return { text: `${Math.round(width)} / ${limit} px${cut ? ", cut" : ""}`, tone };
}

function hitsCell(text: string, terms: string[]): CompareCell {
  if (!terms.length) return { text: "No query", tone: "none" };
  if (!normalizeText(text)) return { text: "Empty", tone: "none" };
  const hits = countTermHits(normalizeText(text), terms);
  return { text: `${hits} of ${terms.length}`, tone: hits === terms.length ? "ok" : hits > 0 ? "warn" : "bad" };
}

/** Side-by-side rows for the A/B table. */
export function compareRows(a: CompareSide, b: CompareSide): CompareRow[] {
  const terms = queryTerms(a.input.query);
  const field = (label: string, device: Device, kind: "title" | "description"): CompareRow => {
    const cell = (s: CompareSide): CompareCell => {
      const l = s.layouts[device];
      return kind === "title" ? widthCell(l.titleWidth, l.titleLimit, l.titleCut) : widthCell(l.descriptionWidth, l.descriptionLimit, l.descriptionCut);
    };
    return { label, a: cell(a), b: cell(b) };
  };
  const rows: CompareRow[] = [
    field("Title, desktop", "desktop", "title"),
    field("Title, mobile", "mobile", "title"),
    field("Description, desktop", "desktop", "description"),
    field("Description, mobile", "mobile", "description"),
    { label: "Query words in title", a: hitsCell(a.input.title, terms), b: hitsCell(b.input.title, terms) },
    { label: "Query words in description", a: hitsCell(a.input.description, terms), b: hitsCell(b.input.description, terms) },
  ];
  const summary = (s: CompareSide): CompareCell => {
    const problems = s.checks.filter((c) => c.level === "fail" || c.level === "warn").length;
    const passed = s.checks.filter((c) => c.level === "pass").length;
    const scored = s.checks.filter((c) => c.level !== "info").length;
    return { text: `${passed} of ${scored} passed`, tone: problems === 0 ? "ok" : s.checks.some((c) => c.level === "fail") ? "bad" : "warn" };
  };
  rows.push({ label: "Checks passed", a: summary(a), b: summary(b) });
  return rows;
}
