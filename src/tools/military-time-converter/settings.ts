import { isPaper, type Paper } from "./pdf";
import { isStep, isZoneLetter, type Assume, type ChartView, type SpokenStyle, type Step, ZONE_BY_LETTER } from "./logic";

export type Tab = "convert" | "bulk" | "chart" | "zones";

export interface Settings {
  tab: Tab;
  input: string;
  /** Optional zone letter appended to the converted time ("" = none). */
  zone: string;
  style: SpokenStyle;
  zulu: boolean;
  bulk: string;
  bulkAssume: Assume;
  chartView: ChartView;
  step: Step;
  paper: Paper;
  tzTime: string;
  tzFrom: string;
  tzTo: string;
}

export const EXAMPLE_BULK = "6:30 AM\n8:00 AM - 4:30 PM\n12:00 AM\n9:45 PM\n10:00 PM - 6:00 AM\n11:59 PM";

export const DEFAULTS: Settings = {
  tab: "convert",
  input: "5:30 PM",
  zone: "",
  style: "standard",
  zulu: false,
  bulk: EXAMPLE_BULK,
  bulkAssume: "12h",
  chartView: "hours",
  step: 15,
  paper: "letter",
  tzTime: "1530",
  tzFrom: "R",
  tzTo: "Z",
};

export type Update = (patch: Partial<Settings>) => void;

const TABS: readonly Tab[] = ["convert", "bulk", "chart", "zones"];
const STYLES: readonly SpokenStyle[] = ["standard", "oh", "digits", "radio"];
const ASSUMES: readonly Assume[] = ["12h", "24h"];
const VIEWS: readonly ChartView[] = ["hours", "minutes"];

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function convertibleLetter(value: unknown, fallback: string): string {
  return isZoneLetter(value) && ZONE_BY_LETTER[value].offset !== null ? value : fallback;
}

/**
 * Stored state comes from session storage and may be missing, outdated or hand
 * edited. Rebuild it field by field so a bad value can never crash the tool.
 */
export function normalizeSettings(stored: unknown): Settings {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const step = Number(src.step);
  return {
    tab: pick(src.tab, TABS, DEFAULTS.tab),
    input: text(src.input, DEFAULTS.input),
    zone: src.zone === "" ? "" : isZoneLetter(src.zone) ? src.zone : DEFAULTS.zone,
    style: pick(src.style, STYLES, DEFAULTS.style),
    zulu: typeof src.zulu === "boolean" ? src.zulu : DEFAULTS.zulu,
    bulk: text(src.bulk, DEFAULTS.bulk),
    bulkAssume: pick(src.bulkAssume, ASSUMES, DEFAULTS.bulkAssume),
    chartView: pick(src.chartView, VIEWS, DEFAULTS.chartView),
    step: isStep(step) ? step : DEFAULTS.step,
    paper: isPaper(src.paper) ? src.paper : DEFAULTS.paper,
    tzTime: text(src.tzTime, DEFAULTS.tzTime),
    tzFrom: convertibleLetter(src.tzFrom, DEFAULTS.tzFrom),
    tzTo: convertibleLetter(src.tzTo, DEFAULTS.tzTo),
  };
}
