import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "youtube-money-calculator",
  name: "Money Calculator for YouTube Creators (Long-Form & Shorts)",
  title: "YouTube Money Calculator – Long-Form & Shorts Earnings",
  description:
    "Free YouTube money calculator: estimate earnings per day, month and year from views, niche RPM, audience country and Shorts, with the formula shown.",
  shortDescription: "Estimate YouTube earnings from views, niche RPM, audience country and Shorts, with low, typical and high ranges.",
  category: "social-media",
  keywords: [
    "youtube money calculator",
    "youtube earnings calculator",
    "youtube revenue calculator",
    "how much does youtube pay per 1000 views",
    "youtube shorts money calculator",
    "youtube rpm by niche",
    "how much do youtubers make",
    "youtube rpm calculator",
    "youtube income calculator",
  ],
  aliases: ["youtube pay per view calculator", "youtube cpm calculator", "youtube shorts earnings calculator", "youtube views to money"],
  icon: "coins",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["percentage-calculator", "hourly-to-salary-calculator", "salary-to-hourly-calculator", "words-to-time", "character-counter"],
  faq: [
    {
      question: "How much does YouTube pay per 1,000 views?",
      answer:
        "There is no single rate. Creators are paid revenue per mille (RPM), the amount they keep per 1,000 views, and it depends mainly on niche and audience country. Most public roundups put long-form RPM at roughly $2 to $10, with finance and business channels well above that and entertainment and gaming often below $3. Shorts pay far less per view, usually a few cents per 1,000. Enter your niche and audience above to see a range.",
    },
    {
      question: "How much does 1 million views pay on YouTube?",
      answer:
        "At an RPM of $2 to $10, one million long-form views pays roughly $2,000 to $10,000. With this calculator's default tech niche and mixed international audience, the typical figure is about $6,100. Finance channels can earn several times that. One million Shorts views usually pays far less, about $23 to $126 with the default Shorts settings. Type 1m in the views box to see your own range.",
    },
    {
      question: "What is the difference between RPM and CPM on YouTube?",
      answer:
        "CPM is what advertisers pay per 1,000 monetized playbacks, before YouTube takes its share. RPM is what you keep per 1,000 total views: it applies YouTube's share and spreads revenue over every view, including views that showed no ad. That makes RPM lower than CPM. A $12 CPM with 60% monetized playbacks and a 55% creator share works out to an RPM of about $3.96.",
    },
    {
      question: "How much of the ad revenue does YouTube keep?",
      answer:
        "On long-form videos the published split is 55% to the creator and 45% to YouTube. Shorts work differently: ad revenue from the Shorts feed is pooled, part of it covers music licensing, the pool is divided by each channel's share of engaged views, and creators keep 45% of what is allocated to them. Split details can change, so confirm them on YouTube Help. The RPM shown in Studio already reflects the split.",
    },
    {
      question: "How much do YouTube Shorts pay?",
      answer:
        "Shorts typically pay a few cents per 1,000 views, so 100,000 Shorts views might earn a few dollars where a long-form video with the same views could earn hundreds. The amount depends on audience country, how much licensed music your Shorts use and the size of the shared pool. Once you have Studio data, switch to My Shorts RPM: your own figure is far more accurate than any preset.",
    },
    {
      question: "What are the YouTube Partner Program requirements?",
      answer:
        "As of September 29, 2026, the ad-revenue tier needs 1,000 subscribers plus either 4,000 public watch hours in 12 months or 10 million public Shorts views in 90 days. A fan-funding tier starts at 500 subscribers. YouTube has announced higher thresholds from February 1, 2027 (8,000 watch hours or 20 million Shorts views for new applicants), so check YouTube Help for the current wording before you plan around a date.",
    },
    {
      question: "How many views do I need to make $1,000 a month?",
      answer:
        "Divide $1,000 by your RPM and multiply by 1,000. At a $4 RPM you need 250,000 views a month, about 8,200 a day. At an $18 finance RPM it is about 55,600 views a month, and at a $1.50 entertainment RPM it is about 667,000. The views-needed section under the results does this for your settings and shows low, typical and high cases. You must also be in the Partner Program to earn ad revenue.",
    },
    {
      question: "Why is my real RPM different from the estimate?",
      answer:
        "The presets are planning ranges built from public figures, not your data. Real RPM depends on your exact audience mix, video length (longer videos can carry more ad slots), which advertisers are bidding, the season, the share of viewers who use ad blockers or watch with Premium, and whether your content is advertiser-friendly. Once you have Studio data, use the My RPM option for the most accurate estimate.",
    },
  ],
};
