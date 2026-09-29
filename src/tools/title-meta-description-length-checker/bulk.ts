/**
 * Bulk mode: parse pasted or uploaded rows (URL, title, description), measure
 * each one, flag duplicates and export the results as CSV. Pure functions only.
 */
import { DEFAULT_LIMITS, MAX_BULK_ROWS, type Device, type Limits } from "./limits";
import { analyzeField, normalizeText, titleChecks, type FallbackMeasure, type FieldResult } from "./logic";

export interface BulkRow {
  /** 1-based position among the data rows. */
  n: number;
  url: string;
  title: string;
  description: string;
}

export type Delimiter = "," | "\t" | ";";

export interface BulkParse {
  rows: BulkRow[];
  delimiter: Delimiter;
  hasHeader: boolean;
  /** Which columns were found, e.g. "URL, Title, Description". */
  layout: string;
  /** Data rows in the input before the row cap was applied. */
  totalRows: number;
  capped: boolean;
}

/** Split delimited text into rows of cells. Handles quoted cells, "" escapes and line breaks inside quotes. */
export function parseDelimited(text: string, delimiter: Delimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let cellStarted = false;
  const pushCell = () => {
    row.push(cell);
    cell = "";
    cellStarted = false;
  };
  const pushRow = () => {
    pushCell();
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"' && !cellStarted) {
      inQuotes = true;
      cellStarted = true;
    } else if (ch === delimiter) {
      pushCell();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      pushRow();
    } else {
      cell += ch;
      cellStarted = true;
    }
  }
  if (cell !== "" || cellStarted || row.length) pushRow();
  return rows;
}

/** Pick tab, semicolon or comma by looking at the first line outside quotes. */
export function detectDelimiter(text: string): Delimiter {
  const first = text.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  let inQuotes = false;
  const counts: Record<Delimiter, number> = { ",": 0, "\t": 0, ";": 0 };
  for (const ch of first) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (ch === "," || ch === "\t" || ch === ";")) counts[ch]++;
  }
  if (counts["\t"] > 0) return "\t";
  return counts[";"] > counts[","] ? ";" : ",";
}

const URL_HEADER_RE = /^(url|urls|address|page|page url|landing page|link|permalink)$/i;
const TITLE_HEADER_RE = /^(title|title 1|page title|meta title|seo title|title tag)$/i;
const DESC_HEADER_RE = /^(description|meta description|meta description 1|meta desc|seo description|snippet)$/i;

function looksLikeUrl(s: string): boolean {
  const t = s.trim();
  if (!t || /\s/.test(t)) return false;
  return /^(https?:\/\/|\/|www\.)/i.test(t) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t);
}

interface ColumnMap {
  url: number;
  title: number;
  description: number;
}

function label(map: ColumnMap): string {
  const parts: [number, string][] = [
    [map.url, "URL"],
    [map.title, "Title"],
    [map.description, "Description"],
  ];
  return parts
    .filter(([i]) => i >= 0)
    .sort((a, b) => a[0] - b[0])
    .map(([, name]) => name)
    .join(", ");
}

export function parseBulk(input: string, maxRows: number = MAX_BULK_ROWS): BulkParse {
  const delimiter = detectDelimiter(input);
  const table = parseDelimited(input, delimiter);
  if (!table.length) return { rows: [], delimiter, hasHeader: false, layout: "", totalRows: 0, capped: false };

  const header = table[0].map((c) => c.trim());
  const headerMap: ColumnMap = {
    url: header.findIndex((c) => URL_HEADER_RE.test(c)),
    title: header.findIndex((c) => TITLE_HEADER_RE.test(c)),
    description: header.findIndex((c) => DESC_HEADER_RE.test(c)),
  };
  const hasHeader = headerMap.title >= 0 || headerMap.description >= 0;

  let map: ColumnMap;
  let body: string[][];
  if (hasHeader) {
    map = headerMap;
    body = table.slice(1);
  } else {
    const cols = Math.max(...table.map((r) => r.length));
    body = table;
    if (cols >= 3) map = { url: 0, title: 1, description: 2 };
    else if (cols === 2) map = looksLikeUrl(table[0][0]) ? { url: 0, title: 1, description: -1 } : { url: -1, title: 0, description: 1 };
    else map = { url: -1, title: 0, description: -1 };
  }

  const totalRows = body.length;
  const kept = body.slice(0, maxRows);
  const cell = (r: string[], i: number) => (i >= 0 && i < r.length ? r[i].trim() : "");
  const rows: BulkRow[] = kept.map((r, i) => ({
    n: i + 1,
    url: cell(r, map.url),
    title: cell(r, map.title),
    description: cell(r, map.description),
  }));
  return { rows, delimiter, hasHeader, layout: label(map), totalRows, capped: totalRows > maxRows };
}

/* -------------------------------------------------------------------------- */
/* Analysis                                                                    */
/* -------------------------------------------------------------------------- */

export type RowStatus = "pass" | "warn" | "fail";

export interface BulkResult {
  row: BulkRow;
  title: FieldResult;
  description: FieldResult;
  /** Row numbers (n) that share this exact title, excluding this row. */
  duplicateTitleWith: number[];
  duplicateDescriptionWith: number[];
  issues: string[];
  status: RowStatus;
}

export interface BulkSummary {
  rows: number;
  pass: number;
  warn: number;
  fail: number;
  duplicateTitleRows: number;
  duplicateDescriptionRows: number;
  missingTitles: number;
  missingDescriptions: number;
}

function fieldLevel(r: FieldResult): RowStatus {
  if (r.status === "empty" || r.status === "long") return "fail";
  if (r.status === "short" || r.near) return "warn";
  return "pass";
}

function dupKey(s: string): string {
  return normalizeText(s).toLowerCase();
}

function groupDuplicates(rows: BulkRow[], pick: (r: BulkRow) => string): Map<string, number[]> {
  const groups = new Map<string, number[]>();
  for (const r of rows) {
    const k = dupKey(pick(r));
    if (!k) continue;
    const list = groups.get(k);
    if (list) list.push(r.n);
    else groups.set(k, [r.n]);
  }
  return groups;
}

function rowList(ns: number[]): string {
  const shown = ns.slice(0, 4).join(", ");
  return ns.length > 4 ? `${shown} and ${ns.length - 4} more` : shown;
}

export function analyzeBulk(
  rows: BulkRow[],
  device: Device,
  limits: Limits = DEFAULT_LIMITS,
  year: number,
  fallback?: FallbackMeasure,
): { results: BulkResult[]; summary: BulkSummary } {
  const titleGroups = groupDuplicates(rows, (r) => r.title);
  const descGroups = groupDuplicates(rows, (r) => r.description);
  const summary: BulkSummary = { rows: rows.length, pass: 0, warn: 0, fail: 0, duplicateTitleRows: 0, duplicateDescriptionRows: 0, missingTitles: 0, missingDescriptions: 0 };

  const results = rows.map((row): BulkResult => {
    const title = analyzeField(row.title, "title", device, limits, fallback);
    const description = analyzeField(row.description, "description", device, limits, fallback);
    const duplicateTitleWith = (titleGroups.get(dupKey(row.title)) ?? []).filter((n) => n !== row.n);
    const duplicateDescriptionWith = (descGroups.get(dupKey(row.description)) ?? []).filter((n) => n !== row.n);
    if (!title.text) duplicateTitleWith.length = 0;
    if (!description.text) duplicateDescriptionWith.length = 0;

    const issues: string[] = [];
    let status: RowStatus = "pass";
    const raise = (s: RowStatus) => {
      if (s === "fail" || (s === "warn" && status === "pass")) status = s;
    };

    if (title.status === "empty") issues.push("Title missing");
    else if (title.status === "long") issues.push(`Title too long (+${Math.round(title.width - title.view.limit)} px)`);
    else if (title.status === "short") issues.push(`Title short (${title.chars} chars)`);
    else if (title.near) issues.push("Title close to the limit");
    if (title.text) {
      for (const c of titleChecks(title, { year })) {
        if (c.level === "pass" || c.level === "info") continue;
        if (c.id === "generic") issues.push(c.level === "fail" ? "Generic title" : "Vague title part");
        else if (c.id === "stuffing") issues.push("Possible keyword stuffing in title");
        else if (c.id === "caps") issues.push("Title in capitals");
        else if (c.id === "repeat") issues.push("Repeated brand or phrase in title");
        else if (c.id === "year") issues.push("Old year in title");
        if (c.id !== "width" && c.id !== "length") raise(c.level === "fail" ? "fail" : "warn");
      }
    }
    if (duplicateTitleWith.length) {
      issues.push(`Duplicate title (rows ${rowList(duplicateTitleWith)})`);
      raise("warn");
    }

    if (description.status === "empty") issues.push("Description missing");
    else if (description.status === "long") issues.push(`Description too long (+${Math.round(description.width - description.view.limit)} px)`);
    else if (description.status === "short") issues.push(`Description short (${description.chars} chars)`);
    else if (description.near) issues.push("Description close to the limit");
    if (duplicateDescriptionWith.length) {
      issues.push(`Duplicate description (rows ${rowList(duplicateDescriptionWith)})`);
      raise("warn");
    }

    raise(fieldLevel(title));
    raise(fieldLevel(description));

    summary[status]++;
    if (duplicateTitleWith.length) summary.duplicateTitleRows++;
    if (duplicateDescriptionWith.length) summary.duplicateDescriptionRows++;
    if (title.status === "empty") summary.missingTitles++;
    if (description.status === "empty") summary.missingDescriptions++;

    return { row, title, description, duplicateTitleWith, duplicateDescriptionWith, issues, status };
  });

  return { results, summary };
}

export type BulkFilter = "all" | "fail" | "warn" | "pass" | "duplicates";

export function filterResults(results: BulkResult[], filter: BulkFilter): BulkResult[] {
  switch (filter) {
    case "fail":
    case "warn":
    case "pass":
      return results.filter((r) => r.status === filter);
    case "duplicates":
      return results.filter((r) => r.duplicateTitleWith.length || r.duplicateDescriptionWith.length);
    default:
      return results;
  }
}

/* -------------------------------------------------------------------------- */
/* CSV export                                                                  */
/* -------------------------------------------------------------------------- */

/** Quote a CSV cell and neutralise spreadsheet formulas (a leading = + - @ becomes text). */
export function csvCell(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const CSV_HEADER = [
  "url",
  "title",
  "title_characters",
  "title_estimated_px",
  "title_status",
  "description",
  "description_characters",
  "description_estimated_px",
  "description_status",
  "duplicate_title",
  "duplicate_description",
  "issues",
  "result",
] as const;

function fieldStatusName(r: FieldResult): string {
  if (r.status === "good") return r.near ? "close to limit" : "ok";
  return r.status === "long" ? "too long" : r.status === "short" ? "too short" : "missing";
}

export function resultsToCsv(results: BulkResult[], device: Device): string {
  const lines = [[...CSV_HEADER, "device"].join(",")];
  for (const r of results) {
    lines.push(
      [
        r.row.url,
        r.title.text,
        r.title.chars,
        Math.round(r.title.width),
        fieldStatusName(r.title),
        r.description.text,
        r.description.chars,
        Math.round(r.description.width),
        fieldStatusName(r.description),
        r.duplicateTitleWith.length ? "yes" : "no",
        r.duplicateDescriptionWith.length ? "yes" : "no",
        r.issues.join("; "),
        r.status,
        device,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return lines.join("\n");
}

export const BULK_EXAMPLE = [
  "URL,Title,Meta Description",
  'https://example.com/,Home,"Welcome to Example Co, the home of quality garden tools since 1998."',
  'https://example.com/tools/pruning-shears,"Pruning Shears: Bypass and Anvil Types Compared | Example Co","Bypass or anvil? Learn which pruning shears cut cleanly, which suit small hands and how to keep the blades sharp all season."',
  'https://example.com/tools/garden-hose,Garden Hose Buying Guide | Example Co,"Find the right garden hose for your yard: length, diameter, material and fittings explained, with a quick chart for choosing the right size."',
  'https://example.com/blog/best-garden-tools-2019,"BEST GARDEN TOOLS 2019 - GARDEN TOOLS - CHEAP GARDEN TOOLS - GARDEN TOOL SALE","Buy the best garden tools online!!! Free delivery on orders over $50, so shop our huge range of garden tools today and save money on every order you place with us this season."',
  "https://example.com/tools/loppers,Loppers,",
  'https://example.com/tools/hand-trowel,Loppers,"A short description."',
].join("\n");
