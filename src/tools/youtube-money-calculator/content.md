## What this YouTube money calculator does

This YouTube money calculator turns a view count into an earnings range. Enter views per day or per month, choose long-form, Shorts or both, and set the rate with a niche preset, your own RPM from YouTube Studio, or a CPM you already know. Results appear per day, per month and per year as a low, typical and high case, with the formula written out using your numbers.

Nobody can honestly give one number for what YouTube pays, because revenue per 1,000 views moves with niche, viewer location, season and the ads advertisers buy. So the tool shows a range and tells you what drives it. It never looks up a channel, and nothing you type is uploaded. The rates behind the presets are dated September 29, 2026.

## How to use the calculator

1. **Choose the content type:** *Long-form*, *Shorts* or *Long-form + Shorts* (which adds a breakdown table).
2. **Pick *Per day* or *Per month*, then type your views.** The field accepts `12,500`, `10k` and `1.5m`.
3. **Set the long-form rate.** *Niche preset* uses the niche list and the audience card. *My RPM* takes the figure from Studio plus a month-to-month swing, with a helper that works out RPM from revenue and views. *From CPM* takes a playback-based CPM, the share of playbacks that ran an ad and your creator share.
4. **Set the Shorts rate.** *Estimate* uses the pooled-revenue model with your music use and creator share; *My Shorts RPM* takes a Studio figure. A switch applies the Shorts threshold reported for February 2027. It is off by default because it is not in force yet.
5. **Describe your audience.** Choose a preset or type the share of views from each of five regions, then pick a season. Shares that do not add up to 100% are scaled automatically. With your own RPM this card is hidden, because your RPM already reflects your audience.
6. **Read the results.** The big number is the typical case, with the low-to-high range under it. *How many views do I need?* works backwards from a monthly target. *Copy summary* and *Download CSV* save the numbers, and *Reset* clears everything.

Invalid fields turn red and say why. Inputs are remembered in this browser tab only.

## How the estimate is calculated

```
RPM (niche mode)   = niche RPM × audience multiplier × season multiplier
Earnings per day   = views per day ÷ 1,000 × RPM
Earnings per month = earnings per day × 365 ÷ 12
Earnings per year  = earnings per day × 365
```

The audience multiplier is the average of the regional multipliers, weighted by your view shares. Low, typical and high cases use the niche's low, typical and high RPM.

**Worked example: a tech channel with 10,000 views a day.** The technology niche has a typical RPM of $9.00 for an all-US audience. With 45% US, 15% Canada/UK/Australia, 15% other high-income, 15% middle-income and 10% lower-income views, the multiplier is 0.45 + 0.105 + 0.075 + 0.0375 + 0.01 = 0.6775. RPM is 9.00 × 0.6775 = $6.0975, which is $60.98 a day, $1,855 a month and $22,256 a year. The niche's $4 low and $18 high RPM give a monthly range of $824 to $3,709.

**From CPM.** RPM = playback-based CPM × monetized playbacks × creator share. A $12 CPM with 60% monetized playbacks and a 55% share gives 12 × 0.60 × 0.55 = $3.96 RPM, so 100,000 views earn about $396.

**Shorts.** Shorts are paid from a shared pool, so the tool starts from an assumed feed value per 1,000 views, applies the music cut, then your share:

```
Shorts RPM = feed value × audience multiplier × season
             × (1 − music use × music cut) × creator share
```

With a $0.25 feed value, the 0.6775 audience, 50% of views on Shorts with licensed music, a 50% music share and a 45% creator share, RPM is 0.25 × 0.6775 × 0.75 × 0.45 = $0.057, or $5.72 a day for 100,000 views. YouTube does not publish the pool's value per view, so the feed values are planning assumptions calibrated to the low-cent RPMs creators commonly report.

**Views needed.** Views = target ÷ RPM × 1,000. For $1,000 a month:

| RPM | Views per month | Views per day |
| --- | --- | --- |
| $1.50 | 666,667 | 21,918 |
| $3.00 | 333,333 | 10,959 |
| $6.00 | 166,667 | 5,479 |
| $10.00 | 100,000 | 3,288 |
| $18.00 | 55,556 | 1,826 |

## RPM vs CPM

CPM is what advertisers pay per 1,000 ads before YouTube takes its share, and it counts only playbacks that showed an ad. RPM is what you keep per 1,000 total views: it applies the revenue split, spreads earnings over every view, and in Studio can also include revenue such as Premium, memberships and Super Chat. RPM is therefore normally far lower than the CPM you see quoted, and multiplying views by a CPM overstates income. Use your Studio RPM once you have a few months of data.

## Niche RPM reference (as of September 29, 2026)

US dollars per 1,000 views for a channel whose views all come from the United States. These planning ranges were reconciled from public creator and agency roundups that disagree widely, so low and high are far apart. They are not YouTube data.

| Niche | Low | Typical | High |
| --- | --- | --- | --- |
| Finance, investing & business | $10.00 | $18.00 | $35.00 |
| Technology & software | $4.00 | $9.00 | $18.00 |
| Education & how-to | $3.00 | $7.00 | $14.00 |
| Health, fitness & wellness | $3.00 | $7.00 | $13.00 |
| Cars & automotive | $3.00 | $6.00 | $12.00 |
| Food & cooking | $2.50 | $5.00 | $10.00 |
| Travel & lifestyle | $2.00 | $5.00 | $10.00 |
| Beauty & fashion | $2.00 | $4.50 | $9.00 |
| Gaming | $1.00 | $3.00 | $6.00 |
| Entertainment, comedy & vlogs | $0.50 | $1.50 | $4.00 |

Finance pays most because banks, insurers and software companies pay heavily to reach a future customer. Entertainment and gaming have huge audiences and cheap ad inventory.

## Audience country mix

Viewer location often matters as much as niche. The tool groups countries into five regions with a multiplier relative to the United States. These multipliers are planning assumptions, not YouTube figures, and you can edit them under *Advanced*.

| Audience region | Multiplier |
| --- | --- |
| United States | 1.00 |
| Canada, UK, Australia, NZ, Ireland | 0.70 |
| Other high-income (W. Europe, Japan, S. Korea, Gulf) | 0.50 |
| Middle-income (Latin America, E. Europe, Turkey) | 0.25 |
| Lower-income, high-volume (India, SE Asia, Africa) | 0.10 |

The tech channel above earns about $2,308 a month with a mostly-US audience, $1,855 with the mixed one and $814 with a mostly lower-income one: same videos, nearly a threefold gap. Your split is in Studio under Analytics, Audience, Geography.

## Revenue share and Partner Program rules

| Rule | Value used here |
| --- | --- |
| Long-form creator share of net ad revenue | 55% |
| Shorts creator share of the pool amount allocated to you | 45% |
| Music share of a Short that uses one licensed track | 50% |
| Ad-revenue tier | 1,000 subscribers plus 4,000 public watch hours in 12 months, or 10 million public Shorts views in 90 days |
| Fan-funding tier | 500 subscribers, 3 uploads in 90 days, and 3,000 watch hours or 3 million Shorts views |
| Reported from Feb 1, 2027 | 8,000 watch hours or 20 million Shorts views for new applicants; 10 million qualified Shorts views in 90 days to earn from the Shorts pool |
| AdSense payment threshold | Usually $100 (varies by currency) |

Checked September 29, 2026 against several published summaries of YouTube's policies. YouTube's own help pages could not be opened during that check, and the 2027 row rests on consistent news reports of YouTube's August 2026 announcement, so confirm the exact wording on YouTube Help before you plan around it. AdSense pays monthly for the previous month's finalized earnings once your balance passes the threshold and your payment and tax details are verified.

## Worked examples: tech, gaming and Shorts

| Channel | Views | Typical RPM | Per day | Per month | Per year |
| --- | --- | --- | --- | --- | --- |
| Tech, long-form | 10,000 a day | $6.10 | $60.98 | $1,855 | $22,256 |
| Gaming, long-form | 10,000 a day | $2.03 | $20.33 | $618 | $7,419 |
| Shorts | 100,000 a day | $0.057 | $5.72 | $173.87 | $2,086 |

All three use the mixed audience. Tech and gaming have identical views, so the threefold gap is niche alone. The Shorts channel has ten times the views yet earns under a third of the gaming channel. A channel posting the tech videos and the Shorts earns about $2,029 a month, with Shorts under a tenth of it.

## Seasonality and income beyond AdSense

Advertiser spending rises in the fourth quarter and softens in early January. The season setting applies planning multipliers of 1.25 for October to December and 0.85 for January to March, moving the tech example from $1,855 a month to $2,318 in Q4 and $1,576 in Q1. Use your own past months if you have them.

Only YouTube ad revenue is priced here. Sponsorships, memberships, merchandise, affiliate links and courses depend on deals and audience trust, and are not estimated.

## Tips and common mistakes

- **Do not multiply views by a CPM.** Use RPM, or the From CPM mode, which applies both adjustments.
- **Check the period.** Ten thousand views a month is about 330 a day. Entering it as daily overstates income thirtyfold.
- **One good month is one good month.** The swing field builds a range around your own RPM.
- **Length matters.** Mid-roll ads generally need videos of about eight minutes or more. The [words to time converter](/tools/words-to-time) shows how many script words that takes.
- **Estimated revenue is estimated.** Studio adjusts figures until the month is finalized.
- **Turn the total into a wage** with the [salary to hourly calculator](/tools/salary-to-hourly-calculator), or model growth targets with the [percentage calculator](/tools/percentage-calculator).

## Privacy and limitations

Everything runs in your browser and nothing is uploaded. Inputs live in this tab's session storage and disappear when the tab closes.

Presets come from public figures, not your channel. The Shorts model simplifies YouTube's pooled system. The tool ignores taxes, ad blockers, advertiser-friendliness limits and reversed revenue, and amounts are in US dollars. Rates were last reviewed on September 29, 2026 and should be re-checked quarterly. This is an estimate, not a promise of earnings and not financial advice.

This is an independent tool, not affiliated with, endorsed by or sponsored by YouTube or Google. YouTube is a trademark of Google LLC.
