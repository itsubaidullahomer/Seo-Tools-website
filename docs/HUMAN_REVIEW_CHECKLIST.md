# Claims to verify before launch

The guides and tool pages were fact-checked by AI reviewers, but many primary sources (Google, NIST, RFCs, YouTube, MDN) were blocked in the build environment, so those reviewers could only use search summaries. Each item below is a claim they could not confirm against the original source. Open the source, confirm or correct the wording in the file named, and tick the box. Where a claim was uncertain, the page already uses hedged, date-stamped wording, so nothing here is presented as certain.

Every guide is published under your name, so read each one at least once and change anything that does not sound right to you.

## content/blog/chmod-755-vs-644.md

- [ ] The PHP 644 claim (OS never executes .php under PHP-FPM and mod_php; CGI is the exception) is from general knowledge and was not tested. Confirm against PHP and web-server docs.
- [ ] Tests were run only on Linux with GNU coreutils 9.4. macOS and BSD behavior is untested, and the guide scopes its claims to Linux.
- [ ] The exact OpenSSH warning text and mode check were read from current master source through a summarizing fetch. Skim the ssh(1) man page or authfile.c once if you want a literal quote.
- [ ] The guide's test-run passages are in passive voice, as the writer chose, because Ubaidullah did not run them. If you would rather not imply a run, reword them to 'the commands behave as follows'.
- [ ] date and updated are quoted strings, matching the other guides. This differs from the spec's unquoted form but is required by blog.ts and the validator.

## content/blog/hourly-to-annual-salary.md

- [ ] Open the OPM fact sheet 'Computing Hourly Rates of Pay Using the 2087-Hour Divisor' and confirm the 2,087 divisor, the 80-hour biweekly rule and the coverage wording. It was blocked here and confirmed only through search snippets.
- [ ] Check the DOL earnings-threshold page for the $684 a week ($35,568 a year) standard salary level, and confirm it is still current at publication. It is date-stamped as of September 2026.
- [ ] Confirm the employee Social Security 6.2% and Medicare 1.45% rates on the IRS or SSA sites. They are hedged 'as of this writing' and the article points readers to those agencies.
- [ ] Confirm the 1938/1939/1940 FLSA overtime history against a primary source such as the Department of Labor or a CRS report. It is currently attributed only to 'standard histories of the law'.
- [ ] The 'some states add daily overtime' claim is general knowledge and was not checked this session. It is hedged with 'some'.

## content/blog/how-long-should-a-password-be.md

- [ ] Read SP 800-63B-4 section 3.1.1.2 and confirm the exact verb for periodic password changes (SHOULD NOT vs SHALL NOT). Search snippets conflicted and the guide avoids naming the verb.
- [ ] Confirm the Rev 4 Unicode and space acceptance wording (SHOULD accept) and the guidance on security questions and hints. These came from secondary summaries.
- [ ] Confirm Rev 3 (2017) minimum of 8 characters and its 'SHOULD NOT' wording on composition rules and expiry. This rests on memory and search snippets.
- [ ] Confirm the EFF long word list size (7,776 words, five dice per word) on eff.org.
- [ ] Check the OWASP Password Storage Cheat Sheet exists under that exact name and currently recommends Argon2id.
- [ ] The text says the 100 billion guesses/s rate is an assumption, which it is. Decide whether you are comfortable with that figure as the illustration.

## content/blog/how-many-words-is-a-speech.md

- [ ] Open the Brysbaert 2019 paper (Journal of Memory and Language, DOI 10.1016/j.jml.2019.104047) and confirm 238 / 260 / 183 wpm and the 190-study count.
- [ ] Open help.acx.com and confirm the current words-per-finished-hour figure (9,300) and its wording.
- [ ] Confirm the 120-160 wpm conversational range against a source you are comfortable citing. The guide hedges it as commonly quoted, and no primary source was opened.
- [ ] Sanity-check the planning assumptions (3-4 s per slide change, 10+ s for a chart, silence-share cases) if you want to present them as more than rules of thumb.

## content/blog/how-much-do-youtubers-make.md

- [ ] Open YouTube Help 'YouTube Partner Program overview and eligibility' and confirm the 1,000 subscribers / 4,000 hours / 10M Shorts views tier, the Shorts-feed exclusion, and the 500-subscriber fan-funding tier (only sourced from the repo tool article).
- [ ] Confirm the Feb 1, 2027 change (8,000 hours / 20M Shorts views, new applicants only) against YouTube's own announcement; blog.youtube and support.google.com were blocked by the egress proxy here, so it is verified only via search summaries.
- [ ] Confirm the 55% long-form creator share wording in YouTube Help and the manual mid-roll length requirement (about 8 minutes).
- [ ] Confirm the AdSense payment threshold (about $100) and the 'previous month's finalized earnings' timing in AdSense Help.
- [ ] Confirm the tax-withholding sentence (US-viewer revenue, country and treaty dependent) against YouTube's tax information pages.
- [ ] Body is 1,889 words by whitespace split, only 11 under the 1,900 cap; any added text must be offset by cuts. Re-review the platform facts quarterly.

## content/blog/invisible-characters-explained.md

- [ ] Word shortcut Ctrl+Shift+Space and Mac Option+Space for a no-break space: stated from memory, not checked against Microsoft or Apple docs
- [ ] Trojan Source authors, year 2021 and CVE-2021-42574 / CVE-2021-42694: confirmed only via search summaries (trojansource.codes was blocked), check against the paper or NVD
- [ ] Excel formulas =UNICODE(RIGHT(B2,1)) and =TRIM(SUBSTITUTE(B2,UNICHAR(160)," ")) were never run in Excel; UNICODE and UNICHAR need Excel 2013 or later
- [ ] Unicode.org and support.microsoft.com were blocked, so the BOM and TRIM quotes rest on WebSearch summaries
- [ ] U+2060 added in Unicode 3.2 and Latin-1 positions 0xA0/0xAD: from Perl's Unicode data and memory, not release notes
- [ ] Claim that some Windows programs and CSV exports write a UTF-8 BOM and that several compilers/code hosts added hidden-Unicode warnings after 2021: general knowledge, hedged, no named product
- [ ] URL behavior measured in Node 22 only, not in browsers; 'normally gives a 404' is an expectation, not a measurement
- [ ] Body is 1,898 words by the validator's whitespace method, only 2 under the 1,900 cap, so any further edit needs an offsetting cut

## content/blog/meta-description-length.md

- [ ] Open Google Search Central's snippet documentation and confirm the wording: no length limit, truncated as needed to fit the device width, and the meta description used when it describes the page better than the content.
- [ ] Confirm in the same documentation that Google describes generated or programmatic descriptions as acceptable for very large sites (decision-table row).
- [ ] Confirm the John Mueller April 2022 statement that the description is not used for ranking. It comes from the repo's tool article and was not re-checked.
- [ ] Open the Ahrefs and Portent studies (ahrefs.com/blog/meta-description-study, portent.com) to confirm the figures and their dates. Only search summaries were seen.
- [ ] Confirm the December 2017 (about 320 characters) and May 2018 (no fixed length) Google statements against Search Engine Roundtable or Danny Sullivan's original posts.
- [ ] The 920 px and 680 px budgets and the 'nearer 580 px' alternative are unverified estimates. The guide labels them as such.
- [ ] date and updated are quoted strings here, unlike the spec's unquoted form. Make the other guides consistent, or normalize Date objects in blog.ts and validate-tools.ts.

## content/blog/percentage-change-vs-percentage-points.md

- [ ] Confirm the basis-point definition (1 bp = 0.01 percentage point) and the percentage-point definition against a primary source. Candidates: Investor.gov glossary, a statistics textbook, or a central-bank glossary. The proxy blocked investor.gov.
- [ ] Try the Excel and Google Sheets claims: that subtracting two percent-formatted cells displays as a percent, and that the custom format 0.0" pp" works. Neither was tested in an app.
- [ ] The byline is 'By Ubaidullah'. He should read the guide himself, correct anything wrong and add his own knowledge before publishing. The guide makes no claim about avoiding AI detection, and none should be added.

## content/blog/uuid-v4-vs-v7.md

- [ ] RFC 9562: the published year (2024), that it obsoletes RFC 4122, section 6.2 (monotonicity, counters, sub-millisecond precision), the Appendix A.6 v7 test vector, and the section 8 security wording. Read the RFC text directly. The proxy blocked it, so this review relied on snippets.
- [ ] PostgreSQL 18 docs: uuidv7() and the uuidv4() alias, uuid_extract_timestamp() for v1 and v7, and the 'not necessarily exactly the generation time' caveat. Confirm on postgresql.org. This review used secondhand summaries.
- [ ] Native v7 support as of your launch date: Python 3.14 uuid.uuid7(), .NET 9 Guid.CreateVersion7(), MariaDB 11.7 UUID_v7(), and no native v7 in MySQL, Java, JavaScript or SQL Server. Support changes quickly.
- [ ] The 'roughly 69% (ln 2)' average B-tree leaf fill for random inserts comes from classic B-tree analysis and is stated without a named source. Consider citing the original paper, or keep it as a hedged background fact.
- [ ] The InnoDB claim that secondary index entries copy the primary key is standard but not re-verified here. The 8 GB vs 4 GB example depends on it.
- [ ] The leaf-level simulation is the author's own model, not a database benchmark. It is labeled that way in the article. Keep that caveat if the section is edited.

## content/blog/webp-vs-png-vs-jpg.md

- [ ] caniuse.com / MDN WebP support table: Chrome 32, Edge 18, Firefox 65, Safari 14 (September 2020), Safari 14-15.6 partial. Not opened by the writer or reviewer.
- [ ] Google's WebP compression study figures (26% lossless vs PNG, 25-34% lossy vs JPEG at equal SSIM), checked against the repo's tool article and memory only, not against developers.google.com.
- [ ] GIF's 256-colors-per-frame limit, added in the review from general knowledge and not source-checked. It is a long-standing, well-known GIF property.
- [ ] All measurements come from synthetic images, one Chromium build and one sharp build. Ubaidullah should re-run the scratchpad scripts (webp-vs-png-vs-jpg-*.mjs) if he wants to reproduce them, and be comfortable with the 'By Ubaidullah' byline over text that Claude drafted.
- [ ] Safari 'partial' support reasons (macOS version dependence) are not explained in the guide and were not verified.
