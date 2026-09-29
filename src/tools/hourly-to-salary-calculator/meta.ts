import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "hourly-to-salary-calculator",
  name: "Hourly to Salary Calculator",
  title: "Hourly to Salary Calculator – Annual, Monthly & Weekly Pay",
  description:
    "Free hourly to salary calculator: turn any hourly wage into annual, monthly, biweekly and weekly pay, with overtime, unpaid time off and a $15 to $100 table.",
  shortDescription: "Convert an hourly wage to annual, monthly, biweekly, weekly and daily pay, with overtime and unpaid time off. Gross pay before tax.",
  category: "calculators",
  keywords: [
    "hourly to salary calculator",
    "hourly wage calculator",
    "hourly to annual salary",
    "wage calculator",
    "$20 an hour is how much a year",
    "how much is 25 an hour per year",
    "hourly to yearly calculator",
    "hourly to monthly salary",
    "2080 hours a year",
    "hourly pay calculator",
  ],
  aliases: ["hourly to annual calculator", "hourly rate to salary", "wage to salary calculator", "convert hourly to salary", "hourly to yearly"],
  icon: "banknote",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["salary-to-hourly-calculator", "percentage-calculator", "youtube-money-calculator", "military-time-converter"],
  faq: [
    {
      question: "How much is $20 an hour per year?",
      answer:
        "On a standard 40-hour week for 52 weeks, $20 an hour is $41,600 a year before tax (20 × 2,080 hours). That works out to about $3,467 a month, $1,600 every two weeks and $800 a week. Your take-home pay will be lower after taxes and deductions. If you work fewer hours or have unpaid time off, enter them in the calculator for a more accurate figure.",
    },
    {
      question: "How do I convert an hourly wage to an annual salary?",
      answer:
        "Multiply your hourly rate by the hours you work each week, then by the number of weeks you are paid per year. For a full-time schedule that is hourly rate × 40 × 52, or simply hourly rate × 2,080. A $32 hourly wage becomes $66,560 a year. For part-time work or unpaid weeks, change the hours and weeks and the same formula still applies.",
    },
    {
      question: "Why is a working year 2,080 hours?",
      answer:
        "Because 40 hours a week × 52 weeks = 2,080. It is also 260 weekdays × 8 hours. A real calendar year has 52 weeks plus a day or two, so some payroll systems use a slightly different divisor. The U.S. federal government, for example, uses 2,087 hours. The difference is roughly 0.3%, so 2,080 is accurate enough for comparing offers and budgeting.",
    },
    {
      question: "How do I include overtime in my annual pay?",
      answer:
        "Enter your regular hours, then the overtime hours you work in a typical week and choose the multiplier, usually 1.5x. Overtime pay is your rate × multiplier × overtime hours × weeks worked. At $22 an hour with 5 overtime hours a week, overtime adds $8,580 a year. Under U.S. federal rules, non-exempt employees must earn at least 1.5 times their regular rate for hours over 40 in a workweek, though some states add daily overtime rules.",
    },
    {
      question: "How do I account for unpaid vacation or holidays?",
      answer:
        "Leave Weeks per year at 52 and enter the unpaid weeks or days in the Unpaid time off fields. Paid vacation and paid holidays do not reduce your pay, so do not enter them. Two unpaid weeks at $25 an hour means 50 paid weeks, or $50,000 instead of $52,000. Unpaid days are converted to weeks using your days per week, so 10 unpaid days on a five-day week equals two weeks.",
    },
    {
      question: "Is the salary shown before or after tax?",
      answer:
        "It is gross pay, before any tax or deduction. Your paycheck will be smaller because of federal income tax, Social Security and Medicare (6.2% and 1.45% for employees), state and local taxes, and deductions such as health insurance or retirement contributions. The calculator does not estimate taxes because they depend on your state, filing status and benefits. Use your employer's payroll estimate for a take-home figure.",
    },
    {
      question: "How much does a part-time or four-day week pay over a year?",
      answer:
        "Use the same formula with your actual hours. At $18 an hour, 20 hours a week for 52 weeks pays $18,720 a year. At $30 an hour, a 32-hour four-day week pays $49,920, which is 20% less than the $62,400 you would earn at 40 hours. The schedule presets in the calculator fill in these common patterns so you only need to type the hourly rate.",
    },
    {
      question: "Is an hourly or salaried job better?",
      answer:
        "It depends on the hours, benefits and overtime rules, not the pay type. Hourly jobs pay for every hour and usually earn overtime, but income varies with the schedule. Salaried jobs offer steady pay and often richer benefits, yet exempt employees do not get overtime. Convert both offers to a yearly figure, add the value of benefits and paid time off, and compare the real hours you would work.",
    },
  ],
};
