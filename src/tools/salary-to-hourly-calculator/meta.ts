import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "salary-to-hourly-calculator",
  name: "Salary to Hourly Calculator",
  title: "Salary to Hourly Calculator – Yearly Pay to Hourly Wage",
  description:
    "Free salary to hourly calculator: turn any annual, monthly, biweekly or weekly salary into an hourly wage, with paid time off, overtime and a $30k–$200k table.",
  shortDescription: "Convert an annual, monthly, biweekly or weekly salary to an hourly wage, with paid time off, overtime and extra hours. Gross pay before tax.",
  category: "calculators",
  keywords: [
    "salary to hourly calculator",
    "annual salary to hourly",
    "salary to hourly",
    "yearly to hourly",
    "50k a year is how much an hour",
    "60000 a year is how much an hour",
    "convert salary to hourly wage",
    "annual to hourly calculator",
    "monthly salary to hourly",
    "salary to hourly with pto",
  ],
  aliases: ["annual to hourly", "yearly salary to hourly", "salary to wage converter", "hourly wage from salary", "how much an hour is my salary"],
  icon: "banknote",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["hourly-to-salary-calculator", "percentage-calculator", "youtube-money-calculator", "military-time-converter"],
  faq: [
    {
      question: "How do I convert a salary to an hourly wage?",
      answer:
        "Divide the annual salary by the number of hours you are paid for in a year. For a standard full-time job that is 40 hours a week for 52 weeks, or 2,080 hours, so a $65,000 salary is $65,000 ÷ 2,080 = $31.25 an hour. If your schedule differs, multiply your own hours per week by your own weeks per year and divide by that number instead.",
    },
    {
      question: "$50,000 a year is how much an hour? What about $60,000 or $80,000?",
      answer:
        "On a 40-hour week for 52 weeks (2,080 hours), $50,000 a year is $24.04 an hour, $60,000 is $28.85 and $80,000 is $38.46, all before tax. Two unpaid weeks turn the $50,000 into $25.00 an hour, because you work 50 weeks instead of 52. Working 50 hours a week instead of 40 drops the $60,000 rate to $23.08.",
    },
    {
      question: "How do I convert a monthly, biweekly or weekly salary to hourly?",
      answer:
        "First turn the paycheck amount into a yearly figure: multiply a monthly salary by 12, a semi-monthly one by 24, a biweekly one by 26 and a weekly one by 52. Then divide by 2,080 for a 40-hour week. A $4,000 monthly salary is $48,000 a year, or $23.08 an hour. A $2,000 biweekly paycheck is $52,000 a year, or $25.00 an hour.",
    },
    {
      question: "Should I divide by 2,080 or 2,087 hours?",
      answer:
        "Use 2,080 (40 hours × 52 weeks) for everyday comparisons, since it is the most common convention. The U.S. Office of Personnel Management divides federal annual pay by 2,087 hours, an average that smooths out calendar drift and leap years. The gap is about 0.3%, so $50,000 is $24.04 an hour with 2,080 and $23.96 with 2,087. To use 2,087 here, set weeks per year to 52.175.",
    },
    {
      question: "Does paid time off change my hourly rate?",
      answer:
        "It does not change the standard conversion, but it changes what you earn for the hours you actually work. Vacation, holidays and sick days are paid, so your salary also covers hours you are not on the job. Enter your paid days off and the calculator shows both figures: $50,000 with 20 paid days off is $24.04 an hour over 2,080 paid hours and $26.04 an hour over the 1,920 hours worked.",
    },
    {
      question: "How do I find my real hourly rate if I work more than 40 hours?",
      answer:
        "Put your actual weekly hours in Hours per week. A salary is fixed, so every extra hour lowers the rate: $60,000 is $28.85 an hour at 40 hours, $25.64 at 45 hours and $23.08 at 50 hours. The table under the calculator shows this for your salary. If you are a non-exempt employee, use the overtime field instead, because those extra hours should be paid at a premium.",
    },
    {
      question: "Are salaried employees entitled to overtime?",
      answer:
        "Sometimes. In the U.S., being salaried does not by itself make someone exempt from overtime. Most exempt white-collar roles must be paid a minimum salary (at the time of writing $684 a week, or $35,568 a year, under federal rules, and higher in some states) and pass a job-duties test. Non-exempt employees generally get at least 1.5 times their regular rate over 40 hours a week. This is general information, not legal advice; check with your state labor department.",
    },
    {
      question: "Is the hourly rate before or after tax?",
      answer:
        "Before. Salary figures are normally gross, and the hourly rate here is gross too. Your paycheck is smaller after federal income tax, Social Security (6.2%) and Medicare (1.45%) for employees, any state and local taxes, and deductions such as health insurance or retirement contributions. The calculator does not estimate taxes because they depend on your state, filing status and benefits. For take-home pay, use your employer's payroll estimate.",
    },
  ],
};
