/**
 * Pure pay math and formatting for the Hourly to Salary Calculator.
 * No React, no DOM: easy to unit-test.
 *
 * Annual gross pay = rate x hours per week x weeks worked
 *                  + rate x overtime multiplier x overtime hours per week x weeks worked
 * where weeks worked = weeks per year - unpaid time off (weeks + days / days per week).
 */

export type Parsed = { kind: "empty" } | { kind: "invalid"; hint: string } | { kind: "ok"; value: number };

const NUMBER_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
/** Western (12,500,000) or Indian (1,25,00,000) digit grouping, optional decimals. */
const GROUPED_RE = /^[+-]?(?:\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d*)?$/;
/** What a field holds half-way through typing a number: "-", "+", ".", "-.". */
const IN_PROGRESS_RE = /^[+-]?\.?$/;
const LEADING_CURRENCY_RE = /^([+-]?)[$€£¥₹]/;
const TRAILING_CURRENCY_RE = /[$€£¥₹]$/;
/** "/hr", "/h", "per hour", "an hour", "hours", "hrs" typed after a number. */
const UNIT_SUFFIX_RE = /\s*(?:\/|per\s+|an\s+|a\s+)?(?:hours?|hrs?|h)$/i;

export const INVALID_HINT = "Enter a number, e.g. 25, 37.5 or 1,250";
export const DECIMAL_COMMA_HINT = "Use a dot for decimals, e.g. 22.5 (commas only group thousands)";
export const TOO_LARGE_HINT = "This number is too large to calculate with";

/**
 * Parse what a person types into a number field. Accepts thousands separators,
 * spaces, a currency symbol at either end, a leading "+", the unicode minus
 * sign and a trailing unit such as "/hr". A decimal comma such as "22,5" is
 * rejected with a hint instead of being silently read as 225.
 */
export function parseNumber(raw: string): Parsed {
  const cleaned = raw
    .trim()
    .replace(/[−–]/g, "-")
    .replace(UNIT_SUFFIX_RE, "")
    .replace(/[\s_]/g, "")
    .replace(LEADING_CURRENCY_RE, "$1")
    .replace(TRAILING_CURRENCY_RE, "");
  if (cleaned === "" || IN_PROGRESS_RE.test(cleaned)) return { kind: "empty" };
  let plain = cleaned;
  if (cleaned.includes(",")) {
    if (!GROUPED_RE.test(cleaned)) return { kind: "invalid", hint: DECIMAL_COMMA_HINT };
    plain = cleaned.replace(/,/g, "");
  }
  if (!NUMBER_RE.test(plain)) return { kind: "invalid", hint: INVALID_HINT };
  const value = Number(plain);
  if (!Number.isFinite(value)) return { kind: "invalid", hint: TOO_LARGE_HINT };
  return { kind: "ok", value };
}

// ---------------------------------------------------------------------------
// Fields and validation
// ---------------------------------------------------------------------------

export const CURRENCIES = ["USD", "GBP", "EUR", "CAD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const OT_MULTIPLIERS = ["1.25", "1.5", "1.75", "2", "2.5"] as const;

/** Raw text of every input, exactly as typed. */
export interface Fields {
  rate: string;
  hours: string;
  days: string;
  weeks: string;
  unpaidWeeks: string;
  unpaidDays: string;
  otHours: string;
  otMult: string;
  currency: Currency;
}

export const DEFAULT_FIELDS: Fields = {
  rate: "25",
  hours: "40",
  days: "5",
  weeks: "52",
  unpaidWeeks: "",
  unpaidDays: "",
  otHours: "",
  otMult: "1.5",
  currency: "USD",
};

export const MAX_RATE = 10000;
export const WARN_RATE = 1000;
export const MAX_WEEKS = 53;
export const HOURS_IN_WEEK = 168;

export interface PayValues {
  rate: number;
  hours: number;
  days: number;
  weeks: number;
  unpaidWeeks: number;
  unpaidDays: number;
  otHours: number;
  otMult: number;
}

export type FieldKey = "rate" | "hours" | "days" | "weeks" | "unpaidWeeks" | "unpaidDays" | "otHours";
export type FieldErrors = Partial<Record<FieldKey, string>>;

export type Evaluation =
  | { status: "empty"; errors: FieldErrors }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "ok"; errors: FieldErrors; values: PayValues; result: PayResult; notices: Notice[] };

export interface Notice {
  variant: "info" | "warning";
  title: string;
  text: string;
}

/** Turn the raw fields into numbers, or say which field is wrong and why. */
export function evaluate(f: Fields): Evaluation {
  const errors: FieldErrors = {};
  let missing = false;

  const read = (key: FieldKey, raw: string, required: boolean): number | undefined => {
    const p = parseNumber(raw);
    if (p.kind === "invalid") {
      errors[key] = p.hint;
      return undefined;
    }
    if (p.kind === "empty") {
      if (required) missing = true;
      return required ? undefined : 0;
    }
    return p.value;
  };

  const rate = read("rate", f.rate, true);
  const hours = read("hours", f.hours, true);
  const days = read("days", f.days, true);
  const weeks = read("weeks", f.weeks, true);
  const unpaidWeeks = read("unpaidWeeks", f.unpaidWeeks, false);
  const unpaidDays = read("unpaidDays", f.unpaidDays, false);
  const otHours = read("otHours", f.otHours, false);
  const otMult = Number(f.otMult);

  if (rate !== undefined) {
    if (rate < 0) errors.rate = "The hourly rate cannot be negative";
    else if (rate > MAX_RATE)
      errors.rate = `That is more than ${MAX_RATE.toLocaleString("en-US")} an hour. If this is a yearly salary, use the salary to hourly calculator instead`;
  }
  if (hours !== undefined) {
    if (hours < 0) errors.hours = "Hours cannot be negative";
    else if (hours > HOURS_IN_WEEK) errors.hours = `A week has only ${HOURS_IN_WEEK} hours`;
  }
  if (days !== undefined) {
    if (days < 0) errors.days = "Days cannot be negative";
    else if (days > 7) errors.days = "A week has only 7 days";
  }
  if (weeks !== undefined) {
    if (weeks < 0) errors.weeks = "Weeks cannot be negative";
    else if (weeks > MAX_WEEKS) errors.weeks = `A year has about 52 weeks, so ${MAX_WEEKS} is the most you can enter`;
  }
  if (unpaidWeeks !== undefined && unpaidWeeks < 0) errors.unpaidWeeks = "Unpaid weeks cannot be negative";
  if (unpaidDays !== undefined && unpaidDays < 0) errors.unpaidDays = "Unpaid days cannot be negative";
  if (otHours !== undefined && otHours < 0) errors.otHours = "Overtime hours cannot be negative";
  if (hours !== undefined && otHours !== undefined && !errors.hours && !errors.otHours && hours + otHours > HOURS_IN_WEEK) {
    errors.otHours = `Regular plus overtime hours cannot exceed ${HOURS_IN_WEEK} a week`;
  }

  // Zero is only meaningful for the optional fields. Zero for a required field means "not entered yet".
  if (rate === 0 && !errors.rate) missing = true;
  if (hours === 0 && !errors.hours) missing = true;
  if (days === 0 && !errors.days) missing = true;
  if (weeks === 0 && !errors.weeks) missing = true;

  if (Object.keys(errors).length) return { status: "invalid", errors };

  if (rate === undefined || hours === undefined || days === undefined || weeks === undefined || missing) {
    return { status: "empty", errors };
  }

  const values: PayValues = {
    rate,
    hours,
    days,
    weeks,
    unpaidWeeks: unpaidWeeks ?? 0,
    unpaidDays: unpaidDays ?? 0,
    otHours: otHours ?? 0,
    otMult: Number.isFinite(otMult) && otMult >= 1 ? otMult : 1.5,
  };

  const unpaidTotal = values.unpaidWeeks + values.unpaidDays / values.days;
  if (unpaidTotal >= values.weeks) {
    errors.unpaidWeeks = "Unpaid time off has to be less than the weeks per year";
    return { status: "invalid", errors };
  }
  if ((values.hours + values.otHours) / values.days > 24) {
    errors.days = "That schedule needs more than 24 hours in a day. Add more days or reduce the hours";
    return { status: "invalid", errors };
  }

  const result = computePay(values);
  return { status: "ok", errors, values, result, notices: buildNotices(values) };
}

// ---------------------------------------------------------------------------
// Pay math
// ---------------------------------------------------------------------------

export interface PayPeriod {
  key: "annual" | "quarterly" | "monthly" | "semimonthly" | "biweekly" | "weekly" | "daily" | "hourly";
  label: string;
  /** How many of these periods fit in a year (0 when not a fixed count). */
  perYear: number;
  amount: number;
}

export interface PayResult {
  weeksWorked: number;
  unpaidWeeksTotal: number;
  hoursPerYear: number;
  daysPerYear: number;
  regularAnnual: number;
  overtimeAnnual: number;
  annual: number;
  /** Pay for one week you actually work (regular + overtime). */
  perWorkedWeek: number;
  /** Annual pay divided by every hour worked, overtime included. */
  effectiveHourly: number;
  /** What each extra 1.00 of hourly rate adds to the year. */
  perDollarRaise: number;
  periods: PayPeriod[];
}

export function computePay(v: PayValues): PayResult {
  const unpaidWeeksTotal = v.unpaidWeeks + v.unpaidDays / v.days;
  const weeksWorked = v.weeks - unpaidWeeksTotal;
  const regularAnnual = v.rate * v.hours * weeksWorked;
  const overtimeAnnual = v.rate * v.otMult * v.otHours * weeksWorked;
  const annual = regularAnnual + overtimeAnnual;
  const hoursPerYear = (v.hours + v.otHours) * weeksWorked;
  const daysPerYear = v.days * weeksWorked;
  const perWorkedWeek = v.rate * v.hours + v.rate * v.otMult * v.otHours;
  const effectiveHourly = hoursPerYear > 0 ? annual / hoursPerYear : v.rate;
  const perDollarRaise = (v.hours + v.otHours * v.otMult) * weeksWorked;

  const periods: PayPeriod[] = [
    { key: "annual", label: "Annual", perYear: 1, amount: annual },
    { key: "quarterly", label: "Quarterly", perYear: 4, amount: annual / 4 },
    { key: "monthly", label: "Monthly", perYear: 12, amount: annual / 12 },
    { key: "semimonthly", label: "Semi-monthly", perYear: 24, amount: annual / 24 },
    { key: "biweekly", label: "Biweekly", perYear: 26, amount: annual / 26 },
    { key: "weekly", label: "Weekly", perYear: 52, amount: annual / 52 },
    { key: "daily", label: "Daily (per day worked)", perYear: daysPerYear, amount: daysPerYear > 0 ? annual / daysPerYear : 0 },
    { key: "hourly", label: v.otHours > 0 ? "Hourly (average with overtime)" : "Hourly", perYear: hoursPerYear, amount: effectiveHourly },
  ];

  return {
    weeksWorked,
    unpaidWeeksTotal,
    hoursPerYear,
    daysPerYear,
    regularAnnual,
    overtimeAnnual,
    annual,
    perWorkedWeek,
    effectiveHourly,
    perDollarRaise,
    periods,
  };
}

/** Annual gross for a different hourly rate, using every other setting unchanged. */
export function annualFor(rate: number, v: PayValues): number {
  return computePay({ ...v, rate }).annual;
}

/** Rates shown in the quick reference table. */
export const QUICK_RATES = [15, 16, 17, 18, 20, 22, 25, 28, 30, 32, 35, 40, 45, 50, 60, 70, 75, 80, 90, 100] as const;

export interface QuickRow {
  rate: number;
  weekly: number;
  biweekly: number;
  monthly: number;
  annual: number;
}

export function quickTable(v: PayValues, rates: readonly number[] = QUICK_RATES): QuickRow[] {
  return rates.map((rate) => {
    const annual = annualFor(rate, v);
    return { rate, weekly: annual / 52, biweekly: annual / 26, monthly: annual / 12, annual };
  });
}

// ---------------------------------------------------------------------------
// Notices (soft warnings that do not block the result)
// ---------------------------------------------------------------------------

export function buildNotices(v: PayValues): Notice[] {
  const out: Notice[] = [];
  if (v.rate >= WARN_RATE) {
    out.push({
      variant: "warning",
      title: "That is a very high hourly rate",
      text: "If you meant a yearly salary, use the salary to hourly calculator to find the hourly equivalent.",
    });
  }
  if (v.hours > 40 && v.otHours === 0) {
    out.push({
      variant: "info",
      title: "More than 40 regular hours",
      text: "In the U.S., most non-exempt employees are paid time and a half for hours over 40 in a workweek. If that applies to you, enter the hours above 40 in the overtime field instead of the regular hours.",
    });
  }
  if (v.otHours > 0 && v.otMult > 1 && v.hours + v.otHours <= 40) {
    out.push({
      variant: "info",
      title: "Overtime under 40 total hours",
      text: "U.S. federal overtime starts after 40 hours in a workweek, so a premium on fewer hours depends on your employer, contract or state. The calculator applies the multiplier you chose.",
    });
  }
  if (v.weeks > 52.2) {
    out.push({
      variant: "info",
      title: "More than 52 weeks",
      text: "A calendar year has about 52.18 weeks. Use 52 unless you are deliberately modeling a 53-pay-week year.",
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const formatters = new Map<string, Intl.NumberFormat>();

function moneyFormatter(currency: Currency, digits: 0 | 2): Intl.NumberFormat {
  const key = `${currency}:${digits}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits });
    formatters.set(key, f);
  }
  return f;
}

/**
 * Format money for people: whole amounts show no cents ($52,000), other amounts
 * show two decimals ($4,333.33). Amounts of 100,000 or more drop the cents so
 * big numbers stay readable on a phone.
 */
export function formatMoney(n: number, currency: Currency): string {
  if (!Number.isFinite(n)) return "n/a";
  const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
  const value = rounded === 0 ? 0 : rounded;
  const whole = Number.isInteger(value) || Math.abs(value) >= 100000;
  return moneyFormatter(currency, whole ? 0 : 2).format(value);
}

/** Always two decimals, for the CSV and the hourly rate. */
export function formatMoneyExact(n: number, currency: Currency): string {
  return moneyFormatter(currency, 2).format(n);
}

const numFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** Plain number with up to two decimals and thousands separators (2,080 or 37.5). */
export function formatNum(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  const s = numFmt.format(n);
  return s === "-0" ? "0" : s;
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = { USD: "$", GBP: "£", EUR: "€", CAD: "$", AUD: "$" };

// ---------------------------------------------------------------------------
// Copy and download text
// ---------------------------------------------------------------------------

/** The multiplication behind the annual figure, with the user's own numbers. */
export function formulaText(v: PayValues, r: PayResult, currency: Currency): string {
  const wk = `${formatNum(r.weeksWorked)} wk`;
  if (v.otHours > 0) {
    return `(${formatMoney(v.rate, currency)} × ${formatNum(v.hours)} h + ${formatMoney(v.rate * v.otMult, currency)} × ${formatNum(v.otHours)} h overtime) × ${wk}`;
  }
  return `${formatMoney(v.rate, currency)} × ${formatNum(v.hours)} h × ${wk}`;
}

/** One-line description of the schedule used, e.g. "40 h/week, 5 days/week, 52 weeks/year". */
export function describeSchedule(v: PayValues): string {
  const parts = [`${formatNum(v.hours)} hours/week`, `${formatNum(v.days)} days/week`, `${formatNum(v.weeks)} weeks/year`];
  if (v.otHours > 0) parts.push(`${formatNum(v.otHours)} overtime hours/week at ${formatNum(v.otMult)}x`);
  const unpaid: string[] = [];
  if (v.unpaidWeeks > 0) unpaid.push(`${formatNum(v.unpaidWeeks)} unpaid ${v.unpaidWeeks === 1 ? "week" : "weeks"}`);
  if (v.unpaidDays > 0) unpaid.push(`${formatNum(v.unpaidDays)} unpaid ${v.unpaidDays === 1 ? "day" : "days"}`);
  if (unpaid.length) parts.push(unpaid.join(" + "));
  return parts.join(", ");
}

export function summaryText(v: PayValues, r: PayResult, currency: Currency): string {
  const lines = [
    "Hourly to salary estimate (gross, before tax and deductions)",
    `Hourly rate: ${formatMoneyExact(v.rate, currency)}`,
    `Schedule: ${describeSchedule(v)}`,
    `Hours worked per year: ${formatNum(r.hoursPerYear)}`,
    "",
  ];
  for (const p of r.periods) {
    if (p.key === "hourly" && v.otHours === 0) continue;
    lines.push(`${p.label}: ${formatMoney(p.amount, currency)}`);
  }
  return lines.join("\n");
}

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(v: PayValues, r: PayResult, currency: Currency): string {
  const rows: string[][] = [["Period", "Periods per year", `Gross pay (${currency})`]];
  for (const p of r.periods) {
    rows.push([p.label, p.perYear ? formatNum(p.perYear).replace(/,/g, "") : "", p.amount.toFixed(2)]);
  }
  rows.push([]);
  rows.push(["Assumption", "Value"]);
  rows.push(["Hourly rate", v.rate.toFixed(2)]);
  rows.push(["Hours per week", String(v.hours)]);
  rows.push(["Days per week", String(v.days)]);
  rows.push(["Weeks per year", String(v.weeks)]);
  rows.push(["Unpaid weeks off", String(v.unpaidWeeks)]);
  rows.push(["Unpaid days off", String(v.unpaidDays)]);
  rows.push(["Overtime hours per week", String(v.otHours)]);
  rows.push(["Overtime multiplier", String(v.otMult)]);
  rows.push(["Weeks worked", String(Math.round(r.weeksWorked * 10000) / 10000)]);
  rows.push(["Hours worked per year", String(Math.round(r.hoursPerYear * 100) / 100)]);
  rows.push(["Note", "Gross pay before tax and deductions. Estimate only."]);
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}
