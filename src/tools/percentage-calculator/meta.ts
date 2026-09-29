import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "percentage-calculator",
  name: "Percentage Calculator",
  title: "Percentage Calculator – Percent Change, Increase & Decrease",
  description:
    "Free percentage calculator: find X% of Y, what percent X is of Y, percentage change, difference and reverse percentages, with each formula worked out for you.",
  shortDescription: "Six percentage calculators on one page: percent of, what percent, change, difference, add/subtract and reverse.",
  category: "calculators",
  keywords: [
    "percentage calculator",
    "percent calculator",
    "percentage change calculator",
    "percentage increase calculator",
    "percentage decrease calculator",
    "percentage difference calculator",
    "what is x percent of y",
    "reverse percentage calculator",
    "percent off calculator",
    "how to calculate percentage",
  ],
  aliases: ["percent of calculator", "percentage finder", "discount percentage calculator", "percent change formula"],
  icon: "percent",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["word-counter", "character-counter", "password-generator", "json-formatter"],
  faq: [
    {
      question: "How do I calculate a percentage of a number?",
      answer:
        "Divide the percentage by 100 and multiply by the number. For 18% of 250, that is 18 ÷ 100 × 250 = 45. You can also move the decimal point: 18% is 0.18, and 0.18 × 250 = 45. The order does not matter, so 18% of 250 equals 250% of 18. Use whichever version is easier to do in your head.",
    },
    {
      question: "How do you calculate percentage increase or decrease?",
      answer:
        "Subtract the old value from the new value, divide by the old value, and multiply by 100. Rent that rises from 1,200 to 1,290 is (1,290 − 1,200) ÷ 1,200 × 100 = 7.5%, an increase. A positive result is an increase and a negative result is a decrease. Always divide by the starting value, not the new one, or the answer will be wrong.",
    },
    {
      question: "What is the difference between percent change and percent difference?",
      answer:
        "Percent change has a direction: it measures movement from an old value to a new one and divides by the old value. Percent difference has no direction: it compares two values of equal standing and divides by their average. Use change for before-and-after figures such as last year's sales versus this year's. Use difference for side-by-side comparisons such as two lab measurements or two stores' prices.",
    },
    {
      question: "How do I calculate 20% off a price?",
      answer:
        "Multiply the price by 0.80, because paying 20% less means paying 80% of the price. A 65 jacket at 20% off costs 65 × 0.80 = 52, a saving of 13. In the calculator, use Add or subtract a percentage, choose Subtract %, enter the price and 20. For stacked discounts, such as 20% off then an extra 10% off, multiply by 0.80 and then by 0.90. The total is 28% off, not 30%.",
    },
    {
      question: "How do you reverse a percentage to find the original price?",
      answer:
        "Divide the final value by the multiplier that produced it. If a sale price of 68 is after 15% off, the original is 68 ÷ 0.85 = 80. If a total of 108.25 includes 8.25% tax, the pre-tax price is 108.25 ÷ 1.0825 = 100. Do not add 15% back onto 68: that gives 78.20, because 15% of the smaller sale price is less than 15% of the original.",
    },
    {
      question: "What is the difference between percent and percentage points?",
      answer:
        "Percentage points measure the plain gap between two percentages. Percent measures the relative change. If a mortgage rate goes from 4% to 5%, it rose by 1 percentage point, which is a 25% increase in the rate itself. News reports often mix these up. Use percentage points when you subtract one rate from another, and percent when you divide by the starting rate.",
    },
    {
      question: "How do I calculate a percentage in Excel or Google Sheets?",
      answer:
        "Both use the same formulas. For X% of a value, enter =A2*15% or =A2*0.15. For what percent A2 is of B2, enter =A2/B2 and format the cell as a percentage. For percentage change from A2 to B2, enter =(B2-A2)/A2, or =(B2-A2)/ABS(A2) when the old value can be negative. Percent formatting multiplies by 100 for display, so do not multiply by 100 in the formula as well.",
    },
    {
      question: "Why can't I calculate a percentage change from zero?",
      answer:
        "Percentage change divides by the starting value, and dividing by zero is undefined. Going from 0 to 50 is an infinitely large relative increase, so no percentage describes it. Report the absolute change instead (“up 50 from zero”), or pick a non-zero baseline period. The calculator shows a message when this happens instead of a misleading number.",
    },
  ],
};
