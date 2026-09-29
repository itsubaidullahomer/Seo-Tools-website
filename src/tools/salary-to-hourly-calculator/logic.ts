/**
 * Pure pay math and formatting for the Salary to Hourly Calculator.
 * No React, no DOM: easy to unit-test.
 *
 *   annual salary  = amount x pay periods per year
 *   paid hours     = hours per week x weeks per year
 *   hourly rate    = annual salary / paid hours
 *   hours worked   = paid hours - paid time off hours
 *   per hour worked = annual salary / hours worked
 *
 * Optional overtime is paid on top of the salary at (hourly rate x multiplier)
 * for the extra hours, in the weeks you actually work.
 */

export type Parsed = { kind: "empty" } | { kind: "invalid"; hint: string } | { kind: "ok"; value: number };

const NUMBER_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
/** Western (12,500,000) or Indian (1,25,00,000) digit grouping, optional decimals. */
const GROUPED_RE = /^[+-]?(?:\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d*)?$/;
/** What a field holds half-way through typing a number: "-", "+", ".", "-.". */
const IN_PROGRESS_RE = /^[+-]?\.?$/;
const LEADING_CURRENCY_RE = /^([+-]?)[$€£¥₹]/;
const TRAILING_CURRENCY_RE = /[$€£¥₹]$/;
/** "/yr", "per year", "a month", "annually", "/wk" typed after a number. */
const UNIT_SUFFIX_RE = /\s*(?:\/|per\s+|an?\s+)?(?:years?|yrs?|annually|annum|months?|mos?|weeks?|wks?)$/i;

export const INVALID_HINT = "Enter a number, e.g. 40 or 37.5";
export const INVALID_MONEY_HINT = "Enter an amount, e.g. 50000, 50,000 or 50k";
export const DECIMAL_COMMA_HINT = "Use a dot for decimals, e.g. 22.5 (commas only group thousands)";
export const TOO_LARGE_HINT = "This number is too large to calculate with";

/**
 * Parse what a person types into a number field. Accepts thousands separators,
 * spaces, a currency symbol at either end, a leading "+", the unicode minus
 * sign, a trailing unit such as "/yr" and, for money fields, a "k" suffix
 * (50k = 50,000). A decimal comma such as "22,5" is rejected with a hint
 * instead of being silently read as 225.
 */
export function parseNumber(raw: string, opts: { allowK?: boolean } = {}): Parsed {
  const hint = opts.allowK ? INVALID_MONEY_HINT : INVALID_HINT;
  let cleaned = raw
    .trim()
    .replace(/[−–]/g, "-")
    .replace(UNIT_SUFFIX_RE, "")
    .replace(/[\s_]/g, "")
    .replace(LEADING_CURRENCY_RE, "$1")
    .replace(TRAILING_CURRENCY_RE, "");
  let multiplier = 1;
  if (opts.allowK && /k$/i.test(cleaned)) {
    multiplier = 1000;
    cleaned = cleaned.slice(0, -1);
  }
  if (cleaned === "" || IN_PROGRESS_RE.test(cleaned)) return multiplier === 1 ? { kind: "empty" } : { kind: "invalid", hint };
  let plain = cleaned;
  if (cleaned.includes(",")) {
    if (!GROUPED_RE.test(cleaned)) return { kind: "invalid", hint: DECIMAL_COMMA_HINT };
    plain = cleaned.replace(/,/g, "");
  }
  if (!NUMBER_RE.test(plain)) return { kind: "invalid", hint };
  const scaled = Number(plain) * multiplier;
  // Trim binary floating point noise such as 1.1 * 1000 = 1100.0000000000002.
  const value = multiplier === 1 ? scaled : Number(scaled.toFixed(6));
  if (!Number.isFinite(value)) return { kind: "invalid", hint: TOO_LARGE_HINT };
  return { kind: "ok", value };
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export const CURRENCIES = ["USD", "GBP", "EUR", "CAD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const OT_MULTIPLIERS = ["1.25", "1.5", "1.75", "2", "2.5"] as const;

export const PERIODS = ["year", "month", "semimonth", "biweek", "week"] as const;
export type Period = (typeof PERIODS)[number];

export interface PeriodInfo {
  value: Period;
  label: string;
  /** Paychecks (or periods) in one year. */
  perYear: number;
  /** Used in sentences: "$4,166.67 a month". */
  unit: string;
}

export const PERIOD_INFO: PeriodInfo[] = [
  { value: "year", label: "Yearly", perYear: 1, unit: "a year" },
  { value: "month", label: "Monthly", perYear: 12, unit: "a month" },
  { value: "semimonth", label: "Semi-monthly", perYear: 24, unit: "per semi-monthly paycheck" },
  { value: "biweek", label: "Biweekly", perYear: 26, unit: "per biweekly paycheck" },
  { value: "week", label: "Weekly", perYear: 52, unit: "a week" },
];

export function periodInfo(p: Period): PeriodInfo {
  return PERIOD_INFO.find((x) => x.value === p) ?? PERIOD_INFO[0];
}

// ---------------------------------------------------------------------------
// Fields and validation
// ---------------------------------------------------------------------------

/** Raw text of every input, exactly as typed. */
export interface Fields {
  salary: string;
  period: Period;
  hours: string;
  days: string;
  weeks: string;
  pto: string;
  otHours: string;
  otMult: string;
  currency: Currency;
  /** Offer B in the comparison: annual salary, hours per week and paid days off. */
  cmpSalary: string;
  cmpHours: string;
  cmpPto: string;
}

export const DEFAULT_FIELDS: Fields = {
  salary: "50000",
  period: "year",
  hours: "40",
  days: "5",
  weeks: "52",
  pto: "",
  otHours: "",
  otMult: "1.5",
  currency: "USD",
  cmpSalary: "",
  cmpHours: "40",
  cmpPto: "",
};

export const MAX_SALARY = 1e10;
export const HOURS_IN_WEEK = 168;
export const MAX_WEEKS = 53;
/** Federal minimum wage in USD, unchanged since July 2009. */
export const FEDERAL_MIN_WAGE = 7.25;
/** Federal minimum salary for most exempt white-collar roles: $684 a week. */
export const EXEMPT_SALARY_FLOOR = 35568;

export type FieldKey = "salary" | "hours" | "days" | "weeks" | "pto" | "otHours" | "cmpSalary" | "cmpHours" | "cmpPto";
export type FieldErrors = Partial<Record<FieldKey, string>>;

export interface PayValues {
  /** The amount typed, in its own pay period. */
  salary: number;
  period: Period;
  /** Gross salary for a full year. */
  annual: number;
  hours: number;
  days: number;
  weeks: number;
  /** Paid days off per year (vacation, holidays, sick days). */
  pto: number;
  otHours: number;
  otMult: number;
}

export interface Notice {
  variant: "info" | "warning";
  title: string;
  text: string;
}

export type Evaluation =
  | { status: "empty"; errors: FieldErrors }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "ok"; errors: FieldErrors; values: PayValues; result: PayResult; notices: Notice[] };

const fmtInt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Turn the raw fields into numbers, or say which field is wrong and why. */
export function evaluate(f: Fields, currency: Currency = f.currency): Evaluation {
  const errors: FieldErrors = {};
  let missing = false;

  const read = (key: FieldKey, raw: string, required: boolean, money = false): number | undefined => {
    const p = parseNumber(raw, { allowK: money });
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

  const salary = read("salary", f.salary, true, true);
  const hours = read("hours", f.hours, true);
  const days = read("days", f.days, true);
  const weeks = read("weeks", f.weeks, true);
  const pto = read("pto", f.pto, false);
  const otHours = read("otHours", f.otHours, false);
  const otMult = Number(f.otMult);
  const info = periodInfo(f.period);

  if (salary !== undefined) {
    if (salary < 0) errors.salary = "The salary cannot be negative";
    else if (salary * info.perYear > MAX_SALARY) errors.salary = "This amount is too large to calculate with";
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
  if (pto !== undefined && pto < 0) errors.pto = "Paid days off cannot be negative";
  if (otHours !== undefined && otHours < 0) errors.otHours = "Overtime hours cannot be negative";
  if (hours !== undefined && otHours !== undefined && !errors.hours && !errors.otHours && hours + otHours > HOURS_IN_WEEK) {
    errors.otHours = `Regular plus overtime hours cannot exceed ${HOURS_IN_WEEK} a week`;
  }

  // Zero is only meaningful for the optional fields. Zero for a required field means "not entered yet".
  if (salary === 0 && !errors.salary) missing = true;
  if (hours === 0 && !errors.hours) missing = true;
  if (days === 0 && !errors.days) missing = true;
  if (weeks === 0 && !errors.weeks) missing = true;

  if (Object.keys(errors).length) return { status: "invalid", errors };

  if (salary === undefined || hours === undefined || days === undefined || weeks === undefined || missing) {
    return { status: "empty", errors };
  }

  const values: PayValues = {
    salary,
    period: f.period,
    annual: salary * info.perYear,
    hours,
    days,
    weeks,
    pto: pto ?? 0,
    otHours: otHours ?? 0,
    otMult: Number.isFinite(otMult) && otMult >= 1 ? otMult : 1.5,
  };

  if (values.pto >= values.days * values.weeks) {
    errors.pto = `Paid days off must be fewer than the ${fmtInt.format(values.days * values.weeks)} days you work in a year`;
    return { status: "invalid", errors };
  }
  if ((values.hours + values.otHours) / values.days > 24) {
    errors.days = "That schedule needs more than 24 hours in a day. Add more days or reduce the hours";
    return { status: "invalid", errors };
  }

  const result = computePay(values);
  return { status: "ok", errors, values, result, notices: buildNotices(values, result, currency) };
}

// ---------------------------------------------------------------------------
// Pay math
// ---------------------------------------------------------------------------

export interface PayPeriodAmount {
  key: "annual" | "monthly" | "semimonthly" | "biweekly" | "weekly" | "daily";
  label: string;
  /** How many of these periods fit in a year. */
  perYear: number;
  amount: number;
}

export interface PayResult {
  annual: number;
  /** Hours the salary covers in a year, paid time off included. */
  paidHours: number;
  /** Annual salary / paid hours. The headline answer. */
  hourly: number;
  hoursPerDay: number;
  ptoHours: number;
  /** Paid hours minus paid time off. */
  workedHours: number;
  weeksWorked: number;
  /** Annual salary / hours actually worked, before overtime. */
  perWorkedHour: number;
  /** Overtime rate per hour: hourly x multiplier. */
  otRate: number;
  otHoursYear: number;
  otPay: number;
  /** Salary plus overtime pay. */
  totalPay: number;
  /** Every hour worked, overtime included. */
  totalWorkedHours: number;
  /** Total pay / total hours worked, overtime included. */
  effectiveHourly: number;
  /** What each extra 1,000 of annual salary adds to the hourly rate. */
  perThousand: number;
  periods: PayPeriodAmount[];
}

export interface Schedule {
  hours: number;
  days: number;
  weeks: number;
  pto: number;
}

export interface ScheduleHours {
  paidHours: number;
  hoursPerDay: number;
  ptoHours: number;
  workedHours: number;
  weeksWorked: number;
}

export function scheduleHours(s: Schedule): ScheduleHours {
  const paidHours = s.hours * s.weeks;
  const hoursPerDay = s.hours / s.days;
  const ptoHours = s.pto * hoursPerDay;
  return { paidHours, hoursPerDay, ptoHours, workedHours: paidHours - ptoHours, weeksWorked: s.weeks - s.pto / s.days };
}

export function computePay(v: PayValues): PayResult {
  const { paidHours, hoursPerDay, ptoHours, workedHours, weeksWorked } = scheduleHours(v);
  const annual = v.annual;
  const hourly = annual / paidHours;
  const perWorkedHour = annual / workedHours;
  const otHoursYear = v.otHours * weeksWorked;
  const otRate = hourly * v.otMult;
  const otPay = otRate * otHoursYear;
  const totalPay = annual + otPay;
  const totalWorkedHours = workedHours + otHoursYear;
  const effectiveHourly = totalPay / totalWorkedHours;
  const workingDays = v.days * v.weeks;

  const periods: PayPeriodAmount[] = [
    { key: "annual", label: "Annual", perYear: 1, amount: annual },
    { key: "monthly", label: "Monthly", perYear: 12, amount: annual / 12 },
    { key: "semimonthly", label: "Semi-monthly", perYear: 24, amount: annual / 24 },
    { key: "biweekly", label: "Biweekly", perYear: 26, amount: annual / 26 },
    { key: "weekly", label: "Weekly", perYear: 52, amount: annual / 52 },
    { key: "daily", label: "Daily (per paid working day)", perYear: workingDays, amount: annual / workingDays },
  ];

  return {
    annual,
    paidHours,
    hourly,
    hoursPerDay,
    ptoHours,
    workedHours,
    weeksWorked,
    perWorkedHour,
    otRate,
    otHoursYear,
    otPay,
    totalPay,
    totalWorkedHours,
    effectiveHourly,
    perThousand: 1000 / paidHours,
    periods,
  };
}

/** Hourly rates for any annual salary under a given schedule. */
export function hourlyFor(annual: number, s: Schedule): { hourly: number; perWorkedHour: number } {
  const h = scheduleHours(s);
  return { hourly: annual / h.paidHours, perWorkedHour: annual / h.workedHours };
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/** Annual salaries shown in the reference table. */
export const SALARY_STEPS = [30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 100000, 110000, 120000, 130000, 140000, 150000, 175000, 200000] as const;

export interface SalaryRow {
  annual: number;
  monthly: number;
  biweekly: number;
  weekly: number;
  hourly: number;
  perWorkedHour: number;
}

export function salaryTable(s: Schedule, steps: readonly number[] = SALARY_STEPS): SalaryRow[] {
  return steps.map((annual) => {
    const r = hourlyFor(annual, s);
    return { annual, monthly: annual / 12, biweekly: annual / 26, weekly: annual / 52, hourly: r.hourly, perWorkedHour: r.perWorkedHour };
  });
}

/** Weekly hours shown in the "same salary, different hours" table. */
export const HOUR_STEPS = [30, 32, 35, 37.5, 40, 45, 50, 55, 60] as const;

export interface HoursRow {
  hours: number;
  hourly: number;
  /** Change against the same salary at 40 hours a week, as a fraction (-0.2 = 20% lower). */
  versus40: number;
}

/** The hours table always includes the visitor's own weekly hours. */
export function hoursTable(v: PayValues): HoursRow[] {
  const set = new Set<number>(HOUR_STEPS);
  set.add(v.hours);
  const hours = [...set].filter((h) => h > 0 && h <= HOURS_IN_WEEK).sort((a, b) => a - b);
  const at40 = v.annual / (40 * v.weeks);
  return hours.map((h) => {
    const hourly = v.annual / (h * v.weeks);
    return { hours: h, hourly, versus40: hourly / at40 - 1 };
  });
}

// ---------------------------------------------------------------------------
// Offer comparison
// ---------------------------------------------------------------------------

export interface OfferInput {
  annual: number;
  hours: number;
  pto: number;
}

export interface OfferResult extends OfferInput {
  paidHours: number;
  workedHours: number;
  hourly: number;
  perWorkedHour: number;
}

export function offerResult(o: OfferInput, days: number, weeks: number): OfferResult {
  const h = scheduleHours({ hours: o.hours, days, weeks, pto: o.pto });
  return { ...o, paidHours: h.paidHours, workedHours: h.workedHours, hourly: o.annual / h.paidHours, perWorkedHour: o.annual / h.workedHours };
}

export type CompareState =
  | { status: "empty" }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "ok"; a: OfferResult; b: OfferResult; diff: number; pct: number; winner: "a" | "b" | "tie" };

/**
 * Compare offer A (the main inputs, without overtime) with offer B by pay per
 * hour actually worked. Both offers use the same days per week and weeks per year.
 */
export function compareOffers(f: Fields, a: PayValues | null): CompareState {
  if (!a) return { status: "empty" };
  const errors: FieldErrors = {};
  const sal = parseNumber(f.cmpSalary, { allowK: true });
  const hrs = parseNumber(f.cmpHours);
  const pto = parseNumber(f.cmpPto);
  if (sal.kind === "invalid") errors.cmpSalary = sal.hint;
  if (hrs.kind === "invalid") errors.cmpHours = hrs.hint;
  if (pto.kind === "invalid") errors.cmpPto = pto.hint;
  if (sal.kind === "ok") {
    if (sal.value < 0) errors.cmpSalary = "The salary cannot be negative";
    else if (sal.value > MAX_SALARY) errors.cmpSalary = "This amount is too large to calculate with";
  }
  if (hrs.kind === "ok") {
    if (hrs.value < 0) errors.cmpHours = "Hours cannot be negative";
    else if (hrs.value > HOURS_IN_WEEK) errors.cmpHours = `A week has only ${HOURS_IN_WEEK} hours`;
  }
  if (pto.kind === "ok" && pto.value < 0) errors.cmpPto = "Paid days off cannot be negative";
  if (Object.keys(errors).length) return { status: "invalid", errors };

  const salary = sal.kind === "ok" ? sal.value : 0;
  const hours = hrs.kind === "ok" ? hrs.value : 0;
  const paidDays = pto.kind === "ok" ? pto.value : 0;
  if (salary <= 0 || hours <= 0) return { status: "empty" };
  if (paidDays >= a.days * a.weeks) {
    return { status: "invalid", errors: { cmpPto: `Paid days off must be fewer than the ${fmtInt.format(a.days * a.weeks)} days you work in a year` } };
  }
  if (hours / a.days > 24) {
    return { status: "invalid", errors: { cmpHours: "That needs more than 24 hours a day at your days per week" } };
  }

  const ra = offerResult({ annual: a.annual, hours: a.hours, pto: a.pto }, a.days, a.weeks);
  const rb = offerResult({ annual: salary, hours, pto: paidDays }, a.days, a.weeks);
  const diff = rb.perWorkedHour - ra.perWorkedHour;
  const pct = diff / ra.perWorkedHour;
  const winner = Math.abs(diff) < 0.005 ? "tie" : diff > 0 ? "b" : "a";
  return { status: "ok", a: ra, b: rb, diff, pct, winner };
}

// ---------------------------------------------------------------------------
// Notices (soft warnings that do not block the result)
// ---------------------------------------------------------------------------

export function buildNotices(v: PayValues, r: PayResult, currency: Currency): Notice[] {
  const out: Notice[] = [];
  const usd = currency === "USD";

  if (r.hourly < 1) {
    out.push({
      variant: "warning",
      title: "That works out to less than 1 an hour",
      text: "Check the pay period. A yearly salary entered as monthly, or a monthly figure entered as yearly, gives an hourly rate that is far too high or far too low. You can also type 50k for 50,000.",
    });
  } else if (usd && r.hourly < FEDERAL_MIN_WAGE) {
    out.push({
      variant: "warning",
      title: "Below the U.S. federal minimum wage",
      text: `At ${formatMoneyExact(r.hourly, currency)} an hour this is under the U.S. federal minimum wage of $7.25, which covers most non-exempt employees, and many states set a higher minimum. Check the pay period and the hours you entered. This is general information, not legal advice.`,
    });
  } else if (r.hourly >= 1000) {
    out.push({
      variant: "warning",
      title: "That is a very high hourly rate",
      text: "Check the pay period. If you typed a yearly figure but chose per week or per month, the hourly rate will look far too high.",
    });
  }

  if (v.hours > 40 && v.otHours === 0) {
    const low = usd && v.annual < EXEMPT_SALARY_FLOOR;
    out.push({
      variant: "info",
      title: "Salaried and working more than 40 hours",
      text:
        "The salary is spread over every hour you enter, so the extra hours lower your rate. If you are a non-exempt employee, U.S. federal law generally requires at least 1.5 times your regular rate for hours over 40 in a workweek, so enter those hours in the overtime field instead. If you are exempt, your salary covers all hours and this is your real rate." +
        (low
          ? ` At ${formatMoney(v.annual, currency)} a year this is below the federal minimum salary of $35,568 for most exempt white-collar roles, which suggests overtime may be owed.`
          : "") +
        " General information, not legal advice.",
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

/** Always two decimals: the hourly rate ($25.00, $24.04). */
export function formatMoneyExact(n: number, currency: Currency): string {
  if (!Number.isFinite(n)) return "n/a";
  return moneyFormatter(currency, 2).format(n);
}

const numFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** Plain number with up to two decimals and thousands separators (2,080 or 37.5). */
export function formatNum(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  const s = numFmt.format(n);
  return s === "-0" ? "0" : s;
}

/** Signed percentage with one decimal: +11.4%, -20%. */
export function formatPct(fraction: number): string {
  if (!Number.isFinite(fraction)) return "n/a";
  const pct = Math.round(fraction * 1000) / 10;
  const sign = pct > 0 ? "+" : pct < 0 ? "-" : "";
  return `${sign}${Math.abs(pct).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = { USD: "$", GBP: "£", EUR: "€", CAD: "$", AUD: "$" };

// ---------------------------------------------------------------------------
// Explanations, copy and download text
// ---------------------------------------------------------------------------

/** The arithmetic behind the answer, one step per line, using the person's own numbers. */
export function explainSteps(v: PayValues, r: PayResult, currency: Currency): string[] {
  const steps: string[] = [];
  const info = periodInfo(v.period);
  if (v.period !== "year") {
    steps.push(`${formatMoney(v.salary, currency)} × ${info.perYear} pay periods = ${formatMoney(v.annual, currency)} a year`);
  }
  steps.push(`${formatNum(v.hours)} hours × ${formatNum(v.weeks)} weeks = ${formatNum(r.paidHours)} paid hours`);
  steps.push(`${formatMoney(v.annual, currency)} ÷ ${formatNum(r.paidHours)} hours = ${formatMoneyExact(r.hourly, currency)} an hour`);
  if (v.pto > 0) {
    steps.push(
      `${formatNum(r.paidHours)} − ${formatNum(r.ptoHours)} hours of paid time off (${formatNum(v.pto)} days × ${formatNum(r.hoursPerDay)} h) = ${formatNum(r.workedHours)} hours worked`,
    );
    steps.push(`${formatMoney(v.annual, currency)} ÷ ${formatNum(r.workedHours)} hours = ${formatMoneyExact(r.perWorkedHour, currency)} per hour worked`);
  }
  if (v.otHours > 0) {
    steps.push(
      `Overtime: ${formatMoneyExact(r.hourly, currency)} × ${formatNum(v.otMult)} = ${formatMoneyExact(r.otRate, currency)} an hour × ${formatNum(r.otHoursYear)} hours = ${formatMoney(r.otPay, currency)}`,
    );
    steps.push(
      `(${formatMoney(v.annual, currency)} + ${formatMoney(r.otPay, currency)}) ÷ ${formatNum(r.totalWorkedHours)} hours worked = ${formatMoneyExact(r.effectiveHourly, currency)} average an hour`,
    );
  }
  return steps;
}

/** One-line description of the schedule used. */
export function describeSchedule(v: PayValues): string {
  const parts = [`${formatNum(v.hours)} hours/week`, `${formatNum(v.days)} days/week`, `${formatNum(v.weeks)} weeks/year`];
  if (v.pto > 0) parts.push(`${formatNum(v.pto)} paid days off`);
  if (v.otHours > 0) parts.push(`${formatNum(v.otHours)} overtime hours/week at ${formatNum(v.otMult)}x`);
  return parts.join(", ");
}

export function summaryText(v: PayValues, r: PayResult, currency: Currency): string {
  const info = periodInfo(v.period);
  const lines = [
    "Salary to hourly estimate (gross, before tax and deductions)",
    `Salary: ${formatMoneyExact(v.salary, currency)} ${info.unit}${v.period === "year" ? "" : ` (${formatMoney(v.annual, currency)} a year)`}`,
    `Schedule: ${describeSchedule(v)}`,
    `Paid hours per year: ${formatNum(r.paidHours)}`,
    "",
    `Hourly rate: ${formatMoneyExact(r.hourly, currency)}`,
  ];
  if (v.pto > 0) lines.push(`Per hour worked (after paid time off): ${formatMoneyExact(r.perWorkedHour, currency)}`);
  if (v.otHours > 0) {
    lines.push(`Overtime rate: ${formatMoneyExact(r.otRate, currency)}`);
    lines.push(`Average per hour with overtime: ${formatMoneyExact(r.effectiveHourly, currency)}`);
    lines.push(`Total pay with overtime: ${formatMoney(r.totalPay, currency)}`);
  }
  lines.push("");
  for (const p of r.periods) lines.push(`${p.label}: ${formatMoney(p.amount, currency)}`);
  return lines.join("\n");
}

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function round(n: number, digits: number): string {
  const f = 10 ** digits;
  return String(Math.round(n * f) / f);
}

export function toCsv(v: PayValues, r: PayResult, currency: Currency): string {
  const rows: string[][] = [["Measure", "Periods per year", `Gross pay (${currency})`]];
  rows.push(["Hourly rate", "", r.hourly.toFixed(2)]);
  if (v.pto > 0) rows.push(["Per hour worked (after paid time off)", "", r.perWorkedHour.toFixed(2)]);
  if (v.otHours > 0) rows.push(["Average per hour with overtime", "", r.effectiveHourly.toFixed(2)]);
  for (const p of r.periods) rows.push([p.label, round(p.perYear, 2), p.amount.toFixed(2)]);
  if (v.otHours > 0) rows.push(["Total pay with overtime", "", r.totalPay.toFixed(2)]);
  rows.push([]);
  rows.push(["Assumption", "Value"]);
  rows.push(["Salary entered", v.salary.toFixed(2)]);
  rows.push(["Pay period", periodInfo(v.period).label]);
  rows.push(["Hours per week", String(v.hours)]);
  rows.push(["Days per week", String(v.days)]);
  rows.push(["Weeks per year", String(v.weeks)]);
  rows.push(["Paid days off per year", String(v.pto)]);
  rows.push(["Overtime hours per week", String(v.otHours)]);
  rows.push(["Overtime multiplier", String(v.otMult)]);
  rows.push(["Paid hours per year", round(r.paidHours, 2)]);
  rows.push(["Hours worked per year", round(r.workedHours, 2)]);
  rows.push(["Note", "Gross pay before tax and deductions. Estimate only."]);
  rows.push([]);
  const showWorked = v.pto > 0;
  rows.push(["Annual salary", "Monthly", "Biweekly", "Weekly", "Hourly", ...(showWorked ? ["Per hour worked"] : [])]);
  for (const row of salaryTable(v)) {
    rows.push([
      row.annual.toFixed(2),
      row.monthly.toFixed(2),
      row.biweekly.toFixed(2),
      row.weekly.toFixed(2),
      row.hourly.toFixed(2),
      ...(showWorked ? [row.perWorkedHour.toFixed(2)] : []),
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}
