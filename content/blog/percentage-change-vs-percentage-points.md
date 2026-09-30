---
title: "Percentage Change vs Percentage Points Explained"
description: "A percentage point is the gap between two percentages; percentage change divides that gap by the start. Worked examples with rates, polls and conversions."
date: "2026-09-30"
updated: "2026-09-30"
tags: [percentages, percentage-points, percent-change, statistics, reporting]
relatedTools: [percentage-calculator]
---
A percentage point is the plain difference between two percentages, so a rate that moves from 4% to 5% has risen by 1 percentage point. Percentage change measures the same move against the starting value: (5 − 4) ÷ 4 × 100 = 25%. Both statements are true, which is why "the rate rose 1%" is ambiguous until the writer says which one is meant.

*Last reviewed September 30, 2026.*

## Quick answer

- **Subtract two percentages** and the result is in percentage points (pp).
- **Divide that gap by the starting value** and multiply by 100, and the result is a percent change.
- **Prices, counts and salaries** have only a percent change. Points exist when the thing measured is itself a percentage: a rate, a share or a probability.
- **Percent changes do not add or cancel the way they look.** A 50% fall followed by a 50% rise leaves you at 75%, not 100%.
- **In writing**, give the before and after values and name the unit.

## The two definitions side by side

Percentage points answer "how far apart are these two rates on the percent scale?" Percent change answers "how big is that gap compared with where I started?" For a rate that goes from 4% to 5%:

- Points: 5 − 4 = 1 percentage point.
- Percent change: (5 − 4) ÷ |4| × 100 = 25%.

The 25 is bigger than the 1 because the starting rate is small. A gap of one unit is a quarter of 4 but a fifth of 5 and a tenth of 10, so the same one-point move looks larger in relative terms the lower the start. That is the source of most misleading headlines about rates.

The absolute-value bars matter only when the start is negative: from −120 to −90 is a rise of 30 on a base of 120, so +25%, and without the bars the sign would flip. From a start of 0 the percent change is undefined.

## The two-column rule

| Your two numbers are | What you can report |
| --- | --- |
| Not percentages: prices, counts, revenue, hours | Percent change only. "Points" does not apply. |
| Percentages: rates, shares, probabilities | Points for the gap, percent for the relative change. Say which, or give both. |

If you are unsure, ask what you did to the two numbers. Subtracting gives points; dividing the gap by the start gives percent. An hourly wage that moves from 20.00 to 21.50 is up (21.50 − 20) ÷ 20 × 100 = 7.5%, with no point figure because neither wage is a percentage.

## Formula reference

| You want | Formula | Example |
| --- | --- | --- |
| Gap between two rates, in pp | new% − old% | 5% − 4% = +1 pp |
| Relative change, in percent | (new − old) ÷ \|old\| × 100 | (5 − 4) ÷ 4 × 100 = +25% |
| Two changes in a row | (1 + a) × (1 + b) − 1 | (1 − 0.5) × (1 + 0.5) − 1 = −25% |
| Rise needed to undo a fall of f | f ÷ (1 − f) | 0.5 ÷ 0.5 = +100% |
| Points to basis points | pp × 100 | 0.25 pp = 25 bp |

The [percentage calculator](/tools/percentage-calculator) has a percentage change card that shows the relative-change formula with your own numbers substituted. The point figure is a single subtraction, so it needs no tool.

## Worked examples with rates

These numbers are made up to show the arithmetic. They are not real data or financial advice.

| Case | Before | After | Points | Percent change |
| --- | --- | --- | --- | --- |
| Savings rate | 4.5% | 4.0% | −0.5 pp | −11.1111% |
| Loan rate | 6.5% | 7.0% | +0.5 pp | +7.6923% |
| Poll support | 42% | 45% | +3 pp | +7.1429% |
| Checkout conversion | 2.0% | 2.5% | +0.5 pp | +25% |

### Interest rates

The same half point cuts in opposite directions for a saver and a borrower. On 10,000 in savings, 4.5% pays 450 a year and 4.0% pays 400. The 50 lost is −11.1111% of the interest, not −0.5%. On a 300,000 loan balance, first-year interest at 6.5% is 19,500 and at 7.0% is 21,000, which is 1,500 more before repayments shrink the balance.

That 1,500 is 7.6923% of 19,500, the same as the relative change in the rate, because with a fixed balance interest is proportional to the rate. Finance commonly quotes small moves in basis points (1 bp is 0.01 percentage point), so the half point above is 50 bp.

### Polls

A candidate polls at 42% in March and 45% in April: +3 pp, or +7.1429% in relative terms. Pollsters commonly state the margin of error in percentage points.

A rough check, assuming two independent simple random samples of 1,000 people, 95% confidence and support near 50%: each poll has a margin of 1.96 × √(0.25 ÷ 1,000) = 0.031, or ±3.1 points. The margin for the difference between the two is 1.96 × √(2 × 0.25 ÷ 1,000) = 0.044, or ±4.4 points, so a 3-point move is within what sampling noise alone could produce. Real polls are weighted and often have wider margins; read the pollster's methodology note.

### Conversion rates

A shop converts 2.0% of visits into orders. After a checkout redesign it converts 2.5%, and the dashboard reports +0.5 pp. With 40,000 visits, orders go from 2.0% × 40,000 = 800 to 2.5% × 40,000 = 1,000: 200 more orders, up 25%.

The point figure compares two rates. The percent figure tells you what happens to orders, and so revenue, if traffic and order value hold steady: at a hypothetical 30 per order, 6,000 more.

## Stock moves and the asymmetric trap

Returns on shares and funds are percent changes, not points, and equal-looking moves do not cancel. Start at 100. A 50% fall leaves 100 × 0.5 = 50. A 50% rise is then applied to 50, so it adds only 25 and the total is 75. To get back to 100 you need +50 on a base of 50, which is +100%.

| Fall | Rise needed to recover |
| --- | --- |
| −5% | +5.2632% |
| −30% | +42.8571% |
| −60% | +150% |
| −90% | +900% |

Smaller swings show the same effect. A fund that falls 20% and rises 20% is at 0.8 × 1.2 = 0.96 of its starting value. To confirm the first case, enter 100 and 75 in the percentage change card of the [percentage calculator](/tools/percentage-calculator) and it reports −25%.

Index points are a separate unit: when a report says an index rose 300 points, divide 300 by the previous level to get a percent change. *This guide explains arithmetic and wording; it is not financial advice.*

## Points add up, percent changes multiply

Take a rate that rises 1 point twice, from 4% to 5% and then to 6%. The points add: 1 + 1 = 2 pp. The relative changes do not. The first step is 1 ÷ 4 = +25% and the second is 1 ÷ 5 = +20%. The whole move is 2 ÷ 4 = +50%, not 25% + 20% = 45%.

## How to write the change correctly

| Ambiguous | Clear |
| --- | --- |
| "The rate rose 1%." | "The rate rose from 4% to 5%, up 1 percentage point." |
| "Conversion is up 25%." | "Conversion rose from 2.0% to 2.5%: +0.5 percentage points, or 25% in relative terms." |

A few habits remove the ambiguity:

1. **Put both values in the sentence.** "From 4% to 5%" lets the reader check any figure you attach to it.
2. **Name the unit.** Write "percentage points" on first use and "pp" afterward if you have defined it. The bare word "points" can be read as index points or score points.
3. **Label a relative figure as relative.** "A 25% relative increase" tells the reader the 25 is a ratio.
4. **Do not pick the bigger number for effect.** When both are true, give both.
5. **Check your publication's style guide.** House rules on "pp" and "bp" differ.

## Doing it in a spreadsheet

With the old rate in A2 and the new rate in B2, both entered as percentages, points are `=B2-A2` and relative change is `=IF(A2=0,"n/a",(B2-A2)/ABS(A2))`.

The trap is formatting. If the cells are percent-formatted, `5% − 4%` is usually displayed as 1%, which a reader takes for a relative change. Multiply by 100 and use a custom format such as `0.0" pp"` (check that your app accepts it), or put the unit in the column header. To verify a column of formulas, run two or three rows through the [percentage calculator](/tools/percentage-calculator).

## Common mistakes

- **Calling the relative figure points.** Saying a rate "rose 25 points" for 4% to 5% overstates the move by 24 points.
- **Dividing by the wrong base.** The base is the old value, so (5 − 4) ÷ 5 = 20% is wrong for a rise from 4% to 5%. The reverse move, 5% to 4%, really is −20%.
- **Adding percent changes.** +25% then +20% is +50%, as shown above, not +45%.
- **Quoting a huge relative change from a tiny base.** A checkout error rate that rises from 0.1% to 0.3% is +200% but only 0.2 pp. Report both, with the counts behind them.
- **Rounding too early.** A difference of 0.5 pp rounded to whole percentages can become 1 pp or 0. Round only the final figure.

## Frequently asked questions

### Is a percentage point the same as a percent?

No. A percentage point is a unit for the difference between two percentages. A percent change is a ratio: that difference divided by the starting value. A move from 4% to 5% is 1 percentage point and 25 percent.

### How do I convert percentage points into a percent change?

Divide the point change by the starting percentage and multiply by 100: 1 ÷ 4 × 100 = 25%. To go the other way, multiply the start by the percent change: 25% of 4 is 1 point. Either conversion needs the starting rate.

### Can a percentage change be bigger than 100%?

Yes, for increases. A rate that goes from 0.1% to 0.3% has risen 200%. A decrease of a non-negative quantity stops at −100%, which is reaching zero.

### What is a basis point?

A basis point is one hundredth of a percentage point, so 100 bp equal 1 pp and 25 bp equal 0.25 pp. Finance commonly uses it because "rates rose 50 bp" can only mean half a point.

### If a rate falls from 8% to 4%, is it down 4% or 50%?

Both, in different units. It is down 4 percentage points (4 − 8 = −4) and down 50% in relative terms (−4 ÷ 8 × 100). Write it as "fell from 8% to 4%, down 4 percentage points, or by half".
