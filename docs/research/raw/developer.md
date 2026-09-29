# Developer / code tools — raw keyword research notes

Researcher role: senior SEO keyword researcher (free-online-tools sites). Category: **Developer / code tools**. Date of research: **2026-09-29**.

---

## 0. Read this first: how the evidence was gathered and what it is worth

**Environment constraints hit during this run (important for anyone re-using these numbers):**

- The session's `WebSearch` budget (200 calls) was already exhausted by sibling researchers before this category started. Every `WebSearch` call returned "budget exhausted". No live Google/Bing SERP or snippet data could be pulled for this category.
- `WebFetch`/`curl` go through an egress proxy that **blocked every SEO-data and search-engine domain tried**: ahrefs.com, semrush.com, similarweb.com, moz.com, spyfu.com, keywordtool.io, seranking.com, backlinko.com, explodingtopics.com, wordstream.com, hypestat.com, statshow.com, trends.google.com, google.com (search + suggestqueries autocomplete), bing.com, duckduckgo (html + lite), brave, startpage, yandex, reddit.com/old.reddit.com, news.ycombinator.com, hn.algolia.com, medium.com, dev.to, indiehackers.com, producthunt.com, stackoverflow.com, api.stackexchange.com, wikipedia.org, developer.mozilla.org, support.google.com (AdSense policy pages), developers.google.com (spam policies), web.archive.org, r.jina.ai, tranco-list.eu, downloads.majestic.com, radar.cloudflare.com, plausible.io, data.jsdelivr.com, api.npmjs.org, api.github.com (403), and **every competitor tool site** (jsonformatter.org, codebeautify.org, freeformatter.com, it-tools.tech, 10015.io, smallseotools.com, prepostseo.com, tinywow.com, *.github.io).
- **What WAS reachable:** github.com (HTML pages, repo issue lists, topic pages, `git clone`), raw.githubusercontent.com, registry.npmjs.org, pypi.org, nodejs.org, and the **Cisco Umbrella Top-1M domain list** (s3-us-west-1.amazonaws.com/umbrella-static/top-1m.csv.zip, current file as of 2026-09-29).
- Because of this, the research below leans on: (a) **Umbrella DNS popularity ranks** of ~150 competitor domains as a hard, current proxy for competitor traffic/authority, calibrated against Semrush visit figures that the sibling SEO/text researchers captured earlier in this project from search snippets; (b) full **tool inventories and per-tool `keywords` arrays** extracted from cloned open-source tool sites (it-tools 40.7k stars, sharevb/it-tools fork with +388 extra tools, OmniTools, DevToys, jaywcjlove/tools, transform.tools, tiny-helpers.dev's 708-entry directory) — these are real search-term variants developers use; (c) GitHub topic repository counts and it-tools "new tool" issue requests as developer-demand signals; (d) npm registry checks for browser-side libraries (feasibility); (e) labelled **estimates** of monthly search volume built from my knowledge of Ahrefs/Semrush figures for these keywords (which are stable, mature queries) triangulated with (a)-(c).
- **Every volume below is a RANGE and is labelled with its source tag.** None is a live Ahrefs/Semrush lookup from this session. Content writers should treat the volumes as ordering/prioritisation signals, not as exact figures, and re-verify the top 10 in Keyword Planner/Ahrefs once the team has tool access.

Source tags used in this file:

| Tag | Meaning |
|---|---|
| **[U]** | Cisco Umbrella Top-1M DNS rank (list downloaded 2026-09-29). Lower = more DNS queries from Umbrella-protected networks (enterprise/dev-heavy; consumer sites are under-represented). Used for competitor strength, not for search volume. |
| **[S]** | Figures captured by sibling researchers in this project (`seo.md`, `text-writing.md`) from Semrush/Ahrefs/Similarweb snippets, e.g. diffchecker.com 1.97M visits/mo (Semrush, Jan 2026). |
| **[K]** | Keyword/variant evidence from cloned tool-site source code (it-tools `keywords` arrays, OmniTools `meta.ts` keywords, tiny-helpers tags/descriptions) and GitHub demand signals. |
| **[E]** | Estimate: my knowledge of Ahrefs/Semrush global-English volumes for these mature developer queries (training data through mid-2026), adjusted with [U]/[K]. Confidence: medium for head terms (these are very stable queries), lower for long-tail. |

---

## 1. Fetch / search log (everything attempted, in order)

| # | Action | Target | Result |
|---|---|---|---|
| 1-6 | WebSearch | "json formatter" volume; most searched dev tools 2026; base64 volume; regex tester volume; epoch converter volume; jsonformatter.org similarweb | **All refused: session WebSearch budget exhausted (200/200)** |
| 7 | curl | Google autocomplete (suggestqueries) x10 seeds | Proxy 403 |
| 8-13 | WebFetch | 10015.io/tools, it-tools.tech, codebeautify.org, freeformatter.com, jsonformatter.org, html.duckduckgo.com | Egress blocked |
| 14 | WebFetch | bing.com search | Blocked |
| 15 | WebFetch | raw.githubusercontent.com CorentinTh/it-tools README | OK (no tool list in README) |
| 16 | WebFetch | raw tiny-helpers README | OK — project closed to new submissions because of "AI slop" submissions; 30+ contributors |
| 17-21 | WebFetch | hn.algolia.com, reddit search JSON, ahrefs blog, semrush blog, similarweb top sites | Blocked |
| 22 | WebFetch | raw it-tools `src/tools/index.ts` | OK — full category/tool registry (see §3.1) |
| 23-24 | WebFetch | api.github.com repo + contents | 403 (unauthenticated rate limit); `gh` CLI not installed |
| 25 | WebFetch | raw DevToys README | OK — 30 default tools list (§3.4) |
| 26 | WebFetch | raw OmniTools README | OK (categories only; full list later from clone) |
| 27-31 | WebFetch | old.reddit, HN, hypestat, statshow, Google Trends | Blocked |
| 32 | curl | api.npmjs.org download counts x20 | Proxy 403 |
| 33 | Bash | grep sibling research files for dev-tool mentions and sources | OK — see §6 cross-category overlaps and [S] figures |
| 34 | WebFetch | raw transform.tools `utils/routes.tsx` | OK — 64 converters (§3.5) |
| 35 | WebFetch | github.com/stefanjudis/tiny-helpers/tree/master/helpers | OK (partial list; full list from clone) |
| 36 | WebFetch | github.com/CorentinTh/it-tools | OK — **40.7k stars, 5.5k forks** |
| 37-38 | WebFetch | support.google.com/adsense/answer/48182, developers.google.com spam policies | Blocked (policy notes therefore come from sibling notes + knowledge, §7) |
| 39 | WebFetch | registry.npmjs.org/sql-formatter/latest | OK (15.9.0) |
| 40-49 | WebFetch | jsdelivr stats, moz, backlinko, explodingtopics, wordstream, keywordtool.io, seranking, spyfu, ahrefstop, adstimate | Blocked |
| 50 | git clone | CorentinTh/it-tools, stefanjudis/tiny-helpers, sharevb/it-tools, jaywcjlove/tools, iib0011/omni-tools | **All cloned OK** |
| 51 | curl | registry.npmjs.org x44 libraries | OK — see §5 feasibility table |
| 52 | WebFetch | github.com/search?q=json+formatter (repos, by stars) | OK — prettier 52.3k, jsoncrack.com 44.5k, biome 25.9k, jsoneditor 12.3k |
| 53 | WebFetch | github.com/topics/developer-tools, /online-tools, /json-formatter | OK — see §4 |
| 54 | WebFetch | github.com/AykutSarac/jsoncrack.com | OK — 44.5k stars; features: format/validate JSON-YAML-CSV, converters, JSON Schema, jq/JSONPath, TypeScript/Go/Kotlin/Rust codegen |
| 55 | Bash | Extract it-tools 86 tools + keywords; sharevb fork 388 extra tools + keywords; tiny-helpers 708 helpers by tag; OmniTools 126 tools + keywords; jaywcjlove 32 tools | OK — §3 |
| 56 | curl | Cisco Umbrella top-1m.csv.zip | **OK (12.9 MB)** — §2 |
| 57 | curl | tranco-list.eu, majestic million, api.stackexchange, lite.duckduckgo, google.com, radar.cloudflare, brave, startpage, yandex, gist, codeload, crossref, cloudflare.com, MDN | All blocked / 403; pypi.org and nodejs.org OK |
| 58-59 | WebFetch | raw bradtraversy/design-resources-for-developers, marcelscruz/dev-resources | OK but no dev-utility lists of use |
| 60 | WebFetch | it-tools issues sorted by reactions (3 query variants, 2 pages) | OK — §4.3 |
| 61 | WebFetch | DevToys issues sorted by reactions | OK (no tool-request label; top issue is Flatpak packaging) |
| 62 | WebFetch | github.com/search repos: "keyword search volume dataset", "developer tools" "search volume" | 0 results |
| 63 | curl | github.com/topics/* x86 | curl to github.com is intercepted by proxy (only WebFetch reaches github.com) |
| 64 | WebFetch | github.com/topics: jwt, base64, regex, cron, uuid, sql-formatter, diff, markdown-to-html, timestamp, minifier, json-formatter, hash | OK — §4.1 |
| 65 | curl | jaywcjlove.github.io, emn178.github.io, gchq.github.io, plausible.io/it-tools.tech, competitor sitemap.xml files | Blocked |
| 66 | Bash | Umbrella re-lookup with `www.` variants for ~160 domains | OK — §2 |

Total distinct research actions: 66 (0 successful WebSearch, ~45 successful fetches/clones/dataset pulls).

---

## 2. Competitor strength: Cisco Umbrella Top-1M DNS ranks (2026-09-29)

Umbrella ranks domains by DNS query volume across Cisco Umbrella users (enterprise/education heavy). It is **not** search volume, but for developer tools it is an excellent relative-authority proxy: the domains that rank ~150k-250k here are the ones that own page 1 for the head terms in this category.

### 2.1 Calibration against sibling-captured Semrush visit figures [S]

| Domain | Umbrella rank [U] | Semrush visits/mo [S] | Note |
|---|---|---|---|
| freeconvert.com | 84,486 | ~8M | consumer + dev |
| wordcounter.net | 170,357 | 14.19M (Mar 2026) | consumer/student — Umbrella under-ranks consumer sites |
| diffchecker.com | 182,053 | 1.97M (Jan 2026) | developer-skewed |
| lingojam.com | 186,036 | Similarweb global ~8k | consumer |
| text-compare.com | 233,908 | 1.1M (Mar) | |
| convertcase.net | 238,040 | 5.02M (May) | consumer/student |
| smallseotools.com | 386,948 | ~3M (Aug 2026) | |
| seoptimer.com | 434,750 | 815K (Aug) | |
| prepostseo.com | 950,845 | 441K | |
| textfixer.com | not listed | 867K (Jun 2026) | proves "not listed" does NOT mean tiny for consumer-skewed sites |

Rule of thumb derived: for developer-skewed domains, Umbrella rank ~180-210k ≈ 1.5-4M visits/mo; ~300-450k ≈ 0.5-1.5M; ~600-800k ≈ 150-500K; unlisted ≈ probably <300K (or consumer-skewed).

### 2.2 Developer-tool domains (best of bare/`www.` host)

| Niche | Domain | Umbrella rank [U] | Reading |
|---|---|---|---|
| JSON | jsonformatter.org | **192,323** | Category leader; ~2-4M visits/mo class. Owns "json formatter", "json validator", "xml formatter", "yaml validator" |
| JSON | codebeautify.org | 318,386 | Broad tool farm (JSON, XML, SQL, CSS, HTML, converters, encoders) |
| JSON | jsonlint.com | 400,797 | "json validator"/"json lint" |
| JSON | jsoneditoronline.org | 389,342 | "json editor" |
| JSON | jsonviewer.stack.hu | 475,765 | legacy "json viewer" |
| JSON | jsonformatter.curiousconcept.com | 523,860 | legacy |
| JSON | jsoncrack.com, jsonpath.com, jsonpathfinder.com, json-generator.com, jsonschema.net, quicktype.io, transform.tools, jsonutils.com, json2table.com | not listed | Long-tail JSON tools run on domains far weaker than jsonformatter.org — **opportunity zone** (JSONPath, JSON→TypeScript, JSON Schema, mock JSON) |
| Regex | regex101.com | **193,668** | Dominant; "regex101" is a brand query |
| Regex | regexr.com | 811,851 | |
| Regex | regexper.com, ihateregex.io, regextester.com, regexpal.com, pythex.org, rubular.com, regexlearn.com, regexone.com | not listed | pattern-library and per-language testers sit on weak domains |
| Time | epochconverter.com | **198,710** | Dominant for "epoch converter"/"unix timestamp" |
| Time | unixtimestamp.com | 446,442 | |
| Time | currentmillis.com | 484,160 | |
| Time | timeanddate.com | 19,462 | consumer time zone giant (avoid "time zone converter") |
| Time | timestamp-converter.com, epoch101.com, unixtime.org, epochconvert.com | not listed | |
| Base64 | base64decode.org | 358,388 (www: 363,636) | leader for "base64 decode" |
| Base64 | base64encode.org | 635,925 | |
| Base64 | base64.guru | 677,417 | |
| JWT | jwt.io | **205,591** | Auth0/Okta property; "jwt.io" brand query dominates |
| JWT | jwt.ms | 629,355 | Microsoft |
| JWT | jwt.is, token.dev | not listed | |
| UUID | uuidgenerator.net | 663,630 | leader is only mid-strength → **UUID is winnable** |
| UUID | guidgenerator.com | 714,246 | |
| UUID | uuidtools.com, onlineuuidgenerator.com | not listed | |
| Diff | diffchecker.com | 182,053 | strong (1.97M visits [S]) |
| Diff | text-compare.com | 233,908 | |
| Cron | crontab.guru | 630,699 | The "leader" is only mid-strength; crontab-generator.org, cronmaker.com, cron.help, crontab.cronhub.io not listed → **cron is winnable** |
| Cron | cronitor.io | 259,803 | owns crontab.guru; SaaS |
| Hash | md5hashgenerator.com, emn178.github.io, passwordsgenerator.net, md5.cz, onlinemd5.com, sha256algorithm.com, hashgenerator.de | not listed | **No strong specialist domain in hash generators** — page 1 is thin tool pages + codebeautify/miniwebtool |
| Hash | miniwebtool.com | 443,454 | generalist calculators incl. hash/bcrypt |
| URL | urlencoder.org, urldecoder.org, urlencoder.io | not listed | leaders are weak domains; meyerweb.com 791,615; w3schools 27,259 (reference page ranks) |
| Minify | toptal.com | 273,174 | toptal.com/developers/ hosts css/js minifier, gitignore.io, html/css/js beautifiers — strong host |
| Minify | minifier.org, cssminifier.com, jscompress.com, beautifier.io, javascript-minifier.com, unminify.com, dirtymarkup.com, cleancss.com, cssportal.com | not listed | rest of SERP is weak → medium competition |
| SQL | sqlformat.org, poorsql.com, sql-format.com, dpriver.com | not listed | **No strong specialist** → SQL formatter is winnable (codebeautify/freeformatter/sqlformat share page 1) |
| Markdown | stackedit.io 725,479; markdownlivepreview.com 591,523; dillinger.io, markdowntohtml.com not listed | | medium-low |
| Misc | rapidtables.com | **136,866** | Owns number-base and unit conversions (binary/hex/decimal), HTML tables, colour codes — strong |
| Misc | browserling.com | 284,409 | owns onlinetools.com/onlinejsontools/onlinetexttools family (onlinetools.com 891,988) |
| Misc | freeformatter.com | not listed | surprisingly weak DNS presence despite ranking for many formatter terms |
| Misc | whatismybrowser.com | 579,215 | "what is my user agent" |
| Misc | gchq.github.io (CyberChef) | 691,385 | |
| Misc | dcode.fr | 872,744 | cipher/encoding |
| Misc | color-hex.com 242,295; htmlcolorcodes.com 297,272 | | colour converters (design category) |
| Misc | jsonplaceholder.typicode.com | 18,259 | mock API (dev traffic proxy: developers hit it programmatically) |
| Misc | webhook.site 173,434; mockapi.io 321,783; mailtrap.io 464,391 | | |
| Newcomers | it-tools.tech, 10015.io, boringdevtools.com, kappakit.com, easydev.tools, 1000freetools.com, toolbox-kit.com | not listed | Even the 40.7k-star it-tools.tech is not in Umbrella top 1M → generic "all-in-one dev toolbox" homepages do not earn DNS/organic traffic by themselves; individual tool pages with content do |
| Reference | github.com 1,759; stackoverflow.com 25,597; w3schools.com 27,259; codepen.io 55,384; npmjs.com 70,888; replit.com 75,296; developer.mozilla.org 87,979; postman.com 20,414 | | |
| Big generalists (other categories) | ilovepdf 16,702; calculator.net 36,391; omnicalculator 78,292; freeconvert 84,486; qr-code-generator.com 100,520; iloveimg 113,026; coolors.co 155,461; tinywow 432,706; duplichecker 367,054 | | |

**Takeaway:** In this category the only "brand-tier" SERP owners are jsonformatter.org, regex101.com, epochconverter.com, jwt.io, diffchecker.com, rapidtables.com and toptal.com (plus reference sites MDN/W3Schools for informational variants). Everything else — SQL formatting, hashing/HMAC/bcrypt, cron, UUID, chmod, htpasswd, JSONPath, JSON→TypeScript/Schema, YAML tooling, HTML entities, string escaping, mock data, markdown converters, docker-run→compose — is contested by mid/weak domains and is realistic for a new domain within 6-12 months if the pages carry genuinely useful content.

---

## 3. Competitor tool inventories (from cloned source / fetched READMEs)

### 3.1 it-tools.tech (CorentinTh/it-tools, 40.7k stars, GPLv3) — 86 tools, with their `keywords` arrays [K]

Crypto: token-generator (token, random, string, alphanumeric, symbols, password), hash-text (hash, digest, MD5, SHA1, SHA256, SHA224, SHA512, SHA384, SHA3, RIPEMD160), bcrypt (bcrypt, hash, compare, password, salt, round), uuid-generator (uuid, v4, random, id, v1, v3, v5, nil), ulid-generator, encryption (AES, TripleDES, Rabbit, RC4), bip39-generator, hmac-generator (hmac, MD5, SHA1, SHA256...), rsa-key-pair-generator (rsa, public, private, ssh, pem), password-strength-analyser (crack time, entropy, md5/sha/bcrypt/argon2), pdf-signature-checker.
Converter: date-time-converter (date, time, iso, utc, timezone), integer-base-converter (decimal, hexadecimal, binary, octal, base64), roman-numeral-converter, base64-string-converter (atob, btoa), base64-file-converter (upload, image, file), color-converter, case-converter (camelCase, snake_case, kebab/param, pascal, constant, dot, header, sentence), text-to-nato-alphabet, text-to-binary (encode, decode, ascii), text-to-unicode, yaml-to-json, yaml-to-toml, json-to-yaml, json-to-toml, list-converter, toml-to-json, toml-to-yaml, xml-to-json, json-to-xml, markdown-to-html (markdown, html, converter, pdf).
Web: url-encoder (url, encode, decode, percent, %20), html-entities (escape, unescape, special characters), url-parser (protocol, origin, params, port), device-information, basic-auth-generator (username, password, base64, authorization header), meta-tag-generator (og), otp-code-generator (TOTP, HMAC, MFA), mime-types (extension, content type), jwt-parser (jwt, decode, typ, alg, iss, sub, aud, exp, nbf, iat, jti), keycode-info (javascript keycodes, event.which), slugify-string, html-wysiwyg-editor, user-agent-parser (browser, engine, os, cpu, device), http-status-codes, json-diff (compare, difference), safelink-decoder (outlook).
Images: qr-code-generator, wifi-qr-code-generator, svg-placeholder-generator, camera-recorder.
Development: git-memo, random-port-generator, crontab-generator (crontab, cronjob, cron, schedule, parse, expression), json-viewer (/json-prettify: viewer, prettify, format), json-minify, json-to-csv, sql-prettify (sql, prettify, beautify + dialects: BigQuery, DB2, Hive, MariaDB, MySQL, N1QL, PL/SQL, PostgreSQL, Redshift, Spark, T-SQL), chmod-calculator (chmod, file permission, recursive, octal), docker-run-to-docker-compose-converter, xml-formatter, yaml-viewer, email-normalizer, regex-tester (regex, tester, expression), regex-memo (cheatsheet).
Network: ipv4-subnet-calculator (subnet, mask, cidr, netmask, broadcast), ipv4-address-converter, ipv4-range-expander, mac-address-lookup, mac-address-generator, ipv6-ula-generator.
Math/Measurement/Text/Data: math-evaluator, eta-calculator, percentage-calculator, chronometer, temperature-converter, benchmark-builder, lorem-ipsum-generator, text-statistics, emoji-picker, string-obfuscator, text-diff, numeronym-generator, ascii-text-drawer, phone-parser-and-formatter, iban-validator.

### 3.2 sharevb/it-tools fork — 388 additional tools (what the community wanted beyond the core) [K]

Developer-relevant additions (selected; full list in the cloned repo at `sharevb_it-tools/src/tools`): argon2-hash, crc-calculator, file-hasher, htpasswd-generator (htpasswd, htaccess, bcrypt), jwt-generator (encode/sign), csr-generator, x509-certificate-generator, ssl-cert-converter (pem/der/p12/jks), certificate-key-parser, cron-expression-builder, cron-alarm, css-js-prettify-minify, css-prettifier, html-minifier, html-prettifier, javascript-prettifier, javascript-obfuscator, js-unobfuscator (unminify, webpack unpack), sql-minifier, sql-parameters, json-editor (validator, repair), json-linter, json-escaper (escape/unescape), json-flatten-nestify, json-merger, json-patch, json-query, json-size-analyzer, json-sort-master, json-string-converter, json-to-csharp/go/java/javascript/php/python/ts/typescript/protobuf/msgpack/env/sql-ddl/sql-insert/schema (mysql, mongoose, bigquery, clickhouse), jq-tester, jsonpath-memo, xpath-tester, xslt-tester, xml-linter, toml-linter, yaml-flatten-nestify, yaml-merger, csv-to-json, csv-to-data (excel/xlsx/sql/json/yaml/markdown/tsv/xml), excel-to-data, html-to-data, markdown-to-data, json-to-data, html-to-markdown, markdown-table-generator, markdown-table-prettifier, markdown-toc-generator, markdown-editor/preview/cheatsheet/diff, markdown-to-docx, markdown-to-text, markdown-format-converter (slack/discord/jira/github), epub-to-markdown, gitignore-generator, gitattributes-generator, dockerfile-label-generator, docker-compose-* converters (to k8s, to env, validator, to quadlets), env-variables-converter, properties-converter (spring, ini), database-connection-string-builder, database-table-generator, curl-converter (curl to code), curl-generator, api-tester, websocket-tester, har-sanitizer, cookies-parser, url-builder, url-cleaner (utm/fbclid), utm-url-generator, punycode-converter, hex-converter, base64-hex-converter, floating-point-converter, binary-calculator (bitwise), middle-endian-converter, uuid-converter (guid, sql), nanoid-generator, snowflake-id-extractor, mongo-objectid-converter, timezone-converter, week-number-converter, duration-calculator (ISO 8601), days-calculator, calendar-converter, unicode-search, text-to-unicode-names, charset-detector, string-escaper, quote-converter, tab-to-spaces, shell-formatter/linearizer, sed-command-generator, nmap-command-builder, tcpdump-generator, rsync-generator, iptables/ufw/firewalld generators, wireguard-config-generator, nginx-formatter, logrotate-generator, fstab-generator, chmod-memo, ipv6-subnet-calculator, ip-range-to-cidr, cidr-in-cidr, visual-subnet-calculator, dns-query, dns-propagation-tester, spf/dkim/dmarc/bimi/ptr DNS generators, dmarc-report-analyzer, gpt-token-encoder/estimator, json-to-toon/toon-to-json (2026 LLM format), pack-files-for-ai, ai-prompt-splitter, rem-px-converter, css-units-converter, css-xpath-converter, css-selectors-memo, aspect-ratio-calculator, keyboard-tester, keycode info, color-contrast-checker (wcag), favicon-generator, image-to-css, svg-previewer, potrace, ocr-image, luhn-validator, credit-card-checker, gtin/isbn/vat/iban validators, password/passphrase/diceware/pin generators, zxcvbn, i-and-l-checker, 
**exclude-list items present in this fork that we must NOT copy:** torrent-to-magnet, multi-link-downloader, docker-image-downloader (server), translator (API), remove-background (ML model), currency-converter (API), ip-geo-location / my-ip / ping / tcp-udp-port-tester (server), online-wiktionary (API).

### 3.3 OmniTools (iib0011/omni-tools) — 126 tools [K]
Dev-relevant: JSON (escape-json, json-comparison, json-to-csv, json-to-xml, minify, prettify, sort, stringify, validateJson), XML (beautifier, validator), CSV (change separator, rows↔columns, csv-to-json/tsv/xml/yaml, find incomplete records, insert/swap columns, transpose, tsv-to-json), String (base64, url-encode/url-decode, url-editor, unicode escape, rot13, slug-generator, hidden-character-detector, password-generator, text-compare, statistics), Time (convert-unix-to-date, **crontab-guru clone** (keywords: crontab, cron, schedule, guru, expression, parser, explain), **discord-timestamp**, time-between-dates, seconds↔time, leap years), Number (byte-converter, random-port-generator, number-to-words, random number). Rest is image/video/audio/PDF.

### 3.4 DevToys 2.0 (desktop, 30 default tools) — the canonical "what developers want offline" list
Converters: JSON<>YAML, Date, Number bases. Encoders/Decoders: HTML, URL, Base64, GZip, JWT, QR Code. Formatters: JSON, SQL, XML. Generators: Hash & Checksum, Lorem Ipsum, Password. Graphics: colour-blindness simulator, PNG/JPEG compressor. Testers: JSONPath, RegEx, XML (XSD). Text: Markdown preview, Text comparer (diff), text analyzer/utilities.

### 3.5 transform.tools (ritz078/transform) — 64 converters
SVG→JSX/React Native, HTML→JSX/Pug, JSON→PropTypes/Flow/GraphQL/**TypeScript**/MobX/io-ts/**Rust Serde**/Mongoose/BigQuery/**MySQL**/Scala/**Go struct**/Go BSON/**YAML**/JSDoc/**Kotlin**/**Java**/**JSON Schema**/TOML/**Zod**; JSON Schema→TypeScript/OpenAPI/Protobuf/Zod; CSS→JS objects/template literal/**Tailwind**; JS object→JSON/TypeScript; GraphQL→TS/Flow/Java/resolvers/introspection/schema AST/fragment matcher/components/TS-MongoDB; JSON-LD ops; TypeScript→Flow/.d.ts/JSON Schema/JS/Zod; Flow→TS/JS; XML→JSON; YAML→JSON/TOML; Markdown→HTML; TOML→JSON/YAML; Cadence→Go.

### 3.6 jaywcjlove/tools (Web Tools) — 32 tools
Base64 encoder/decoder, CSS formatter/minify, HTML escape/unescape, HTML formatter/minify, HTML→Markdown, Markdown→HTML, Hash, Image→Base64, JS beautifier/uglify, JS obfuscator, JSON format, JSON/XML, JSON/YAML, JSON/ini, JWT decoder, TOML→JSON, URL encoder/decoder, text case, password, QR, SVG optimizer, EXIF viewer, code-to-image, GitHub badges, PDF→image, CSS easing, Chinese-specific tools.

### 3.7 tiny-helpers.dev directory — 708 curated helpers, count per tag/keyword (crowdedness proxy) [K]
Tags: CSS 126, Misc 88, Images 70, Color 68, SVG 63, Fonts 36, Icons 35, Performance 30, JavaScript 29, Accessibility 27, Security 26, **JSON 24**, HTML 20, Tool Collections 19, Site analyzers 16, Code 16, Data transformation 16, Email 16, Network 14, Animations 14, Unicode 13, APIs 13, Diagrams 12, **Regular Expressions 12**, SEO 10, npm 9, SysAdmin 9, Command line 9, **Time 8**, ASCII 8, **Mock Data 8**, **Markdown 8**, PDF 7, Database 5, TypeScript 5, XML 4, YAML 2, URL 2.
Keyword matches in names/descriptions: json 36, diff 19, mock 17, unicode 14, url 13, markdown 10, ascii 10, encode 9, base64 7, regex 7, hex 7, jwt 5, hash 5, minif 5, table 5, sql 4, csv 4, xml 4, password 4, cron 2, yaml 2, **uuid 1, timestamp/epoch 1, chmod 1, gitignore 1, user agent 1, http status 1, binary 1, htpasswd 0, mime 0, bcrypt 0, hmac 0**.
Named single-purpose competitors worth knowing: Regexper, Regex-Vis, RegExr, regex.help, iHateRegex; JWT.IS, jwt.io debugger; Hashler, authgear password-hash generator, report-uri CSP hash; crontab.guru, EpochPilot (timestamps + timezones + cron); Diff Text, difftext.com; TableConvert, Table to Markdown, tabletomarkdown.com; Dillinger, readme.so, heckyesmarkdown/urltomarkdown/MarkdownDown (URL→markdown = server-light); JSON Generator, Mockaroo, generatedata, ts-faker, 1000freetools mock-data-generator (120+ fields), SQLable; Sort JSON, Pretty-Print JSON, formatjson.com, webtoolz.dev, Alchemize, Big File Tools; YAML Checker, YAMLine, XMLable, XMLComparator, ValidateHTML; Chmod Calculator (chmod-calculator.com); gitignore.io; httpstatuses.com; ua-tracer; bitcalc (hex/binary/bitwise); cryptii, Base64 Image Viewer, pr.gg/base64; Boring dev tools, KappaKit, EasyDev Tools, ToolBox-kit (135+ tools) — many 2025-26 "all-in-one" newcomers, none with DNS presence.

---

## 4. Developer-demand signals from GitHub (reachable)

### 4.1 GitHub topic repository counts (fetched 2026-09-29)
jwt 38,664 · regex 7,020 · cron 4,578 · hash 4,044 · diff 2,984 · uuid 2,575 · base64 2,331 · markdown-to-html 1,037 · timestamp 908 · json-formatter 393 · minifier 293 · sql-formatter 64. (Interest proxy only; jwt is inflated by auth libraries.)

### 4.2 Star counts of open-source online tools (2026-09-29)
it-tools 40.7k · jsoncrack.com 44.5k · prettier 52.3k · biome 25.9k · jsoneditor 12.3k · DevToys (desktop) large · sharevb/it-tools fork with 388 extra tools shows sustained appetite for niche dev utilities.

### 4.3 it-tools "new tool" requests by reactions (page 1-2)
Regex evaluator (implemented), IPv6 calculator, SSH key pair generation (Ed25519), byte conversion tool, DNS/SSL/webpage network tools, TLS certificate (x509/PEM) decoder, Docker Compose↔docker run (implemented), Markdown table generator, resistor calculator, Mermaid viewer/exporter, SSL certificate format conversion, DNS record generators (SPF/DKIM/DMARC/BIMI), ASCII art generator, password generator, extract inner text from HTML, barcode generator (implemented). → Certificate/PEM decoding, markdown table generator, byte converter and SSH keygen are under-served needs.

---

## 5. Feasibility: browser-side libraries confirmed on registry.npmjs.org (2026-09-29)

| Tool | Library (version seen) | Notes |
|---|---|---|
| JSON format/validate/minify/repair | native `JSON` + jsonrepair 3.15.0, json5 2.2.3, ajv 8.20.0 (schema) | trivial; add error line/col highlighting |
| SQL formatter | sql-formatter 15.9.0 | 15+ dialects, pure JS |
| YAML | js-yaml 5.4.2 / yaml 2.9.1 | |
| TOML | @iarna/toml 2.2.5 | |
| XML | fast-xml-parser 5.11.2, xml-formatter 3.7.0, @xmldom/xmldom 0.9.12, native DOMParser | |
| CSV | papaparse 5.7.0 (web workers) | JSON↔CSV; SheetJS (xlsx) for Excel |
| Cron | cronstrue 3.27.0 (to English), cron-parser 5.10.1 (next runs) | |
| Markdown | marked 18.0.14 (MD→HTML), turndown 7.2.4 (HTML→MD) | sanitize with DOMPurify |
| JWT | jose 6.2.12 (decode + HS/RS verify in browser) | never send token anywhere |
| bcrypt | bcryptjs 3.0.3 | cost ≤12 in browser; use worker |
| Argon2 | argon2-browser (wasm) | optional |
| Hashes | hash-wasm 4.12.0 (MD5, SHA-1/2/3, BLAKE, CRC32, HMAC), spark-md5 3.0.2; WebCrypto for SHA-256/384/512 + HMAC | MD5 needs lib (WebCrypto has none) |
| UUID/ULID/nanoid | uuid 14.0.2 (v1,v3,v4,v5,v6,v7), ulid 3.0.2, nanoid 6.0.1; `crypto.randomUUID()` native | v7 is a fresh long-tail |
| Regex | native `RegExp` (JS flavour); for PCRE/Python flavour use a wasm build (optional) | |
| Diff | diff 9.0.0 (+ diff2html for side-by-side) | |
| Minify/beautify | terser 5.51.2 (JS, works in browser via bundle), csso 5.0.5 (CSS), js-beautify 2.0.3 (HTML/CSS/JS beautify), html-minifier-terser 7.2.0, @minify-html/wasm 0.18.1, prettier 3.9.9 standalone + plugins | |
| Mock data | @faker-js/faker 10.6.0 (import locale subset, ~1-2 MB) | keep "test data" framing |
| JSONPath | jsonpath-plus 11.1.0 | |
| User agent | ua-parser-js 2.0.10 | |
| MIME | mime-db 1.54.0 | |
| OTP | otpauth 9.5.2 | |
| Subnet/IP | ipaddr.js 2.5.0 | |
| Dates | dayjs 1.11.23, luxon 3.7.2, date-fns-tz 3.2.0; native Intl | |
| QR | qrcode 1.5.4 | (design/misc category) |
| Zip | jszip 3.10.2 | |
| Sizes | pretty-bytes 7.2.0 | |
| curl→code | curlconverter (npm; browser build ~ large) | roadmap |
| docker run→compose | composerize (npm) | client-side |
| JSON→TypeScript | json-to-ts / quicktype-core (large) | client-side |

Everything in the candidate table below is client-side unless marked. Server-light items (fetch a URL/DNS) are roadmap-only per project rules.

---

## 6. Overlaps with sibling categories (dedupe before building)

- `text-writing.md` already claims: **Text Compare / Diff Checker** (`text-compare`, 150k-300k est.), Case Converter, Lorem Ipsum, Remove duplicate lines/line breaks/extra spaces, Comma separator, Find & replace, Word→HTML, ASCII art, Morse code, Reverse text, Slug generator, Email/URL extractor. → In the developer category I only propose the **developer variants**: JSON Diff, code-case converter (camelCase/snake_case), and I list "Diff checker" as a cross-link, not a second page.
- `seo.md` already claims: URL Slug Generator, UTM builder/remover, .htaccess redirect generator, Schema/JSON-LD generator + validator, robots.txt, sitemap, meta tags. → I exclude htaccess redirects and JSON-LD here; `htpasswd` (not claimed) stays with developer tools.
- Colour converters (HEX/RGB/HSL), QR code, px↔rem belong to a Design/CSS category; noted but not scored here.
- "Password generator" is unclaimed by siblings; included here with an honest high-competition flag.

---

## 7. Google Search / AdSense policy state relevant to this category (Sept 2026)

Direct policy pages (support.google.com/adsense, developers.google.com/search) were egress-blocked; the following combines the sibling researchers' verified notes (`text-writing.md` §6, `seo.md` §4) with standing policy knowledge.

- **"Low Value Content" is the dominant AdSense rejection reason in 2025-26**, and guides explicitly cite "a calculator or converter tool that simply shows the tool interface without explaining how it works" as the failing pattern [S]. Each developer tool page therefore needs: what the format/algorithm is, how the tool works, worked examples, edge cases, code snippets in 3-4 languages, FAQ. The project's 1000+ words rule is the minimum; 1,500+ is safer for head terms.
- **Google spam policies — scaled content abuse / site reputation abuse / expired domain abuse (March 2024, enforced through the Aug 2025 spam update and the March 2026 core update)** [S]. Implication for dev tools: do NOT programmatically spin hundreds of near-identical pages ("json to X" for 60 languages, "cron every N minutes" for every N, "chmod NNN" for all 512 modes). Build one strong page per tool plus a **hand-written handful** of high-volume sub-pages (e.g. chmod 777/755/644/600; cron every 5 minutes / hourly / daily at midnight / weekly; regex for email/phone/URL/password; gitignore for Node/Python/Java/Unity).
- **Nothing in the recommended list touches AdSense prohibited content.** Specific risk notes:
  - Hash tools: offer hashing only. Do **not** build "MD5 decrypt / hash cracker / rainbow lookup" or "JWT secret brute-forcer" (jwt-online-cracker exists on GitHub) — security-circumvention framing is an AdSense "hacking/cracking" prohibited-content risk and attracts abusive traffic. Password-strength estimation is fine.
  - Mock data: name it "Test / Mock Data Generator". Avoid "fake ID", "fake credit card generator", "fake address for verification" framing (AdSense flags fake-document/fraud-adjacent content). A Luhn *validator* is fine; a "credit card number generator" page is medium risk — skip.
  - JWT decoder: process entirely client-side and say so (privacy trust signal; also avoids storing tokens).
  - Base64/URL/HTML decoders: none. (Do not add "unblock/proxy/bypass" utilities.)
  - JS obfuscator/de-obfuscator: legal and common (toptal, de4js), low risk; de-obfuscator pages should be framed as debugging, not malware analysis.
  - Torrent→magnet, link downloaders, IP geolocation, "my IP" (needs 3rd-party API), translators (API) — present in the sharevb fork; **exclude** (ToS / feasibility).
  - HTTP status code and MIME reference pages are pure informational content — fine, but they compete with MDN/Wikipedia.
- CPC context: developer/IT queries monetise well in US/UK (hosting, cloud, security, SaaS ads). Sysadmin-leaning tools (htpasswd, chmod, cron, subnet calculator, SSL/PEM decoder) skew to US enterprise audiences (Umbrella evidence) and typically out-earn student-heavy conversions (binary↔decimal).

---

## 8. Candidate table (developer category) — 40 candidates

Volume = estimated global English monthly searches for the primary keyword cluster (range + source tag). Competition: L/M/H (who owns page 1 today, from [U] + knowledge). Feasibility: CS = client-side. Priority 1-10 (10 = must launch with).

| # | Tool | Slug | Primary keyword | Est. monthly searches | Source | Comp. | Feas. | AdSense | Priority |
|---|---|---|---|---|---|---|---|---|---|
| 1 | JSON Formatter & Validator (beautify, minify, tree view, repair) | json-formatter | json formatter | 400k-700k cluster ("json formatter" 250k-400k, "json validator" 100k-150k, "json viewer" 100k-150k, "json beautifier" 50k-100k) | [E]; jsonformatter.org rank 192k [U] | H | CS | none | 9 (hub; expect slow ranking) |
| 2 | JSON Minifier / Compressor | json-minify | json minify | 15k-30k ("minify json", "json compressor", "compress json") | [E]+[K] | M | CS | none | 6 (tab of #1 + own URL) |
| 3 | JSON to CSV / Excel | json-to-csv | json to csv | 50k-100k ("json to csv" 40k-70k, "json to excel" 20k-40k, "json to csv converter") | [E]; leaders convertcsv/konklone/data.page not in Umbrella | M | CS (papaparse, SheetJS) | none | 8 |
| 4 | CSV to JSON (+ Excel/TSV to JSON) | csv-to-json | csv to json | 60k-120k ("csv to json" 50k-90k, "excel to json" 20k-40k, "tsv to json") | [E]; csvjson.com/convertcsv unlisted [U] | M | CS | none | 8 |
| 5 | YAML ⇄ JSON Converter | yaml-to-json | yaml to json | 40k-80k ("yaml to json" 20k-40k, "json to yaml" 20k-40k, "yaml converter") | [E]+[K] (it-tools, transform.tools, DevToys all ship it) | M | CS (js-yaml) | none | 8 |
| 6 | YAML Validator & Formatter (lint) | yaml-validator | yaml validator | 30k-60k ("yaml validator" 20k-30k, "yaml lint"/"yamllint" 15k-30k, "yaml checker", "yaml formatter") | [E]; yamllint.com/yamlchecker.com unlisted [U] | M-L | CS | none | 7 |
| 7 | XML Formatter / Beautifier & Validator | xml-formatter | xml formatter | 40k-80k ("xml formatter" 30k-50k, "xml beautifier", "xml validator" 20k-40k, "pretty print xml") | [E]; jsonformatter.org + freeformatter own SERP | M | CS | none | 7 |
| 8 | XML ⇄ JSON Converter | xml-to-json | xml to json | 40k-80k ("xml to json" 30k-50k, "json to xml" 15k-30k) | [E]+[K] | M | CS (fast-xml-parser) | none | 7 |
| 9 | HTML Formatter / Beautifier (+ minifier tab) | html-formatter | html formatter | 40k-80k ("html formatter" 30k-50k, "html beautifier" 10k-20k, "html minifier" 10k-20k, "html prettifier") | [E]; freeformatter/codebeautify/htmlformatter.com (all unlisted [U]) | M | CS (js-beautify, html-minifier-terser) | none | 7 |
| 10 | CSS Minifier & Beautifier | css-minifier | css minifier | 40k-80k ("css minifier" 30k-50k, "css beautifier"/"css formatter" 15k-30k, "minify css", "unminify css") | [E]; toptal (273k [U]) strongest, rest weak | M | CS (csso, js-beautify) | none | 7 |
| 11 | JavaScript Minifier & Beautifier (unminify) | javascript-minifier | javascript minifier | 50k-100k ("js minifier"/"javascript minifier" 25k-40k, "js beautifier"/"javascript beautifier" 25k-40k, "unminify js" 10k-20k, "uglify js online") | [E]; beautifier.io/jscompress unlisted, toptal strong | M | CS (terser, js-beautify) | none | 6 |
| 12 | SQL Formatter / Beautifier (15 dialects) | sql-formatter | sql formatter | 50k-90k ("sql formatter" 40k-60k, "sql beautifier" 5k-10k, "format sql online", "sql query formatter", "sql minifier") | [E]; **no specialist domain in Umbrella** (sqlformat.org, poorsql, dpriver unlisted) | M-L | CS (sql-formatter 15.9) | none | 8 |
| 13 | Base64 Encode / Decode (text + file) | base64-decode | base64 decode | 300k-500k cluster ("base64 decode" 150k-250k, "base64 encode" 100k-150k, "base64 converter", "base64 to text", "decode base64 online") | [E]; base64decode.org 358k [U] | H | CS (atob/btoa + TextEncoder for UTF-8) | none | 7 (topical must-have) |
| 14 | Image to Base64 / Base64 to Image | image-to-base64 | image to base64 | 60k-120k ("image to base64" 40k-70k, "base64 to image" 30k-50k, "png to base64", "base64 image decoder", "svg to base64") | [E]; leaders base64-image.de, codebeautify, elmah.io (weak-mid) | M | CS (FileReader, Canvas) | none | 7 |
| 15 | URL Encoder / Decoder (+ URL parser) | url-encode-decode | url decoder | 100k-180k ("url decode"/"url decoder" 50k-80k, "url encode"/"url encoder" 50k-80k, "percent encoding", "url parser" 5k-10k) | [E]; urlencoder.org/urldecoder.org unlisted [U]; w3schools reference page ranks | M | CS (encodeURIComponent) | none | 7 |
| 16 | HTML Entity Encoder / Decoder (escape/unescape) | html-entity-encoder | html entity decoder | 30k-60k ("html decoder"/"html decode" 15k-25k, "html encoder"/"html escape" 10k-20k, "html entities converter", "html entity list" informational) | [E]+[K] | M-L | CS | none | 7 |
| 17 | JWT Decoder (client-side, verify HS/RS signature) | jwt-decoder | jwt decoder | 80k-150k ("jwt decoder" 40k-70k, "jwt decode online", "decode jwt token", "jwt parser", "jwt viewer", "jwt debugger"; brand "jwt.io" 300k+ excluded) | [E]; jwt.io 205k [U] dominates, jwt.ms 629k, others unlisted | M-H | CS (jose) | none (state tokens never leave browser) | 8 |
| 18 | UUID / GUID Generator (v4, v7, v1, bulk, ULID, NanoID) | uuid-generator | uuid generator | 120k-220k cluster ("uuid generator" 60k-100k, "guid generator" 40k-70k, "random uuid", "uuid v4 generator", "uuid v7 generator" rising, "bulk uuid generator", "ulid generator") | [E]; uuidgenerator.net only 664k [U] → weak leader | M-L | CS (crypto.randomUUID, uuid 14) | none | 8 |
| 19 | Regex Tester & Debugger (+ pattern library pages) | regex-tester | regex tester | 120k-200k tool cluster ("regex tester" 50k-90k, "regex tester online", "javascript regex tester", "python regex tester", "regex generator" 10k-20k, "regex checker"); pattern pages "regex for email" 20k-40k, "phone number regex" 15k-30k, "url regex" 10k-20k, "regex cheat sheet" 40k-80k | [E]; regex101 194k [U] + regexr; pattern pages held by weak sites/SO | H (tester) / M-L (pattern pages) | CS (native RegExp; flavour notes) | none | 8 |
| 20 | Cron Expression Generator & Explainer (+ schedule pages) | cron-expression-generator | cron expression generator | 80k-150k cluster ("cron expression generator" 10k-20k, "crontab generator" 10k-20k, "cron generator", "cron expression" 40k-70k informational, "cron every 5 minutes" 5k-10k, "cron every hour", "cron every day at midnight", "quartz cron generator", "aws cron expression", "spring cron expression"; brand "crontab guru" 100k+ excluded) | [E]+[K]; crontab.guru only 631k [U] | M | CS (cronstrue, cron-parser) | none | 8 |
| 21 | Hash Generator (MD5, SHA-1, SHA-256, SHA-512, SHA-3, CRC32; text + file) | hash-generator | md5 hash generator | 150k-300k cluster ("md5 generator"/"md5 hash generator" 40k-70k, "sha256 generator"/"sha256 hash generator" 30k-50k, "sha256 online", "sha1 generator" 10k-20k, "sha512", "hash generator" 10k-20k, "file hash checker"/"checksum calculator" 10k-20k, "crc32") | [E]; no specialist domain in Umbrella top 1M | M-L | CS (WebCrypto + hash-wasm) | none (no "decrypt/crack") | 8 |
| 22 | HMAC Generator (SHA-256/512/MD5) | hmac-generator | hmac generator | 8k-20k ("hmac generator", "hmac sha256 online", "hmac sha256 generator", "hmac calculator", "hmac sha1") | [E]+[K] (it-tools ships it; freeformatter/devglan weak) | L | CS (WebCrypto) | none | 7 |
| 23 | Bcrypt Hash Generator & Verifier | bcrypt-generator | bcrypt generator | 30k-60k ("bcrypt generator" 15k-30k, "bcrypt hash generator", "bcrypt online", "bcrypt checker"/"verify bcrypt", "bcrypt cost", "argon2 online" 2k-5k) | [E]; bcrypt-generator.com/bcrypt.online unlisted [U] | M-L | CS (bcryptjs in worker) | none | 7 |
| 24 | Unix Timestamp / Epoch Converter (+ Discord timestamp) | unix-timestamp-converter | epoch converter | 300k-500k cluster ("epoch converter" 150k-250k, "unix timestamp" 100k-200k, "timestamp converter" 40k-70k, "unix time converter", "epoch time", "unix timestamp to date", "current unix timestamp", "milliseconds to date", "iso 8601 converter"; "discord timestamp generator" 30k-60k separate page) | [E]; epochconverter.com 199k [U], unixtimestamp.com 446k | H (head) / L-M (discord timestamp, ISO 8601) | CS (Intl, dayjs) | none | 8 |
| 25 | Number Base Converter (binary ⇄ decimal ⇄ hex ⇄ octal) | number-base-converter | binary to decimal | 600k-1M cluster ("binary to decimal" 200k-300k, "decimal to binary" 150k-250k, "hex to decimal" 100k-150k, "decimal to hex" 60k-100k, "hex to binary", "binary to hex", "octal converter", "base converter") | [E]; rapidtables.com 137k [U] + calculator.net own SERP; student-heavy, low CPC | H | CS | none | 6 |
| 26 | Text ⇄ Binary / Hex / ASCII / Unicode Converter | text-to-binary | binary translator | 400k-700k cluster ("binary translator" 250k-400k, "text to binary" 40k-80k, "binary to text" 40k-80k, "hex to text" 20k-40k, "text to hex", "hex to ascii" 20k-40k, "ascii to text", "unicode converter" 10k-20k, "text to unicode") | [E]; convertbinary.com, rapidtables, browserling | M-H | CS (TextEncoder) | none | 6 |
| 27 | String Escape / Unescape (JSON, JavaScript, HTML, SQL, CSV, XML) | string-escape | json escape | 25k-50k cluster ("json escape"/"escape json string" 10k-20k, "json unescape", "javascript escape string", "unescape string online", "string escaper", "sql escape") | [E]+[K] (it-tools fork json-escaper, string-escaper; freeformatter) | L-M | CS | none | 7 |
| 28 | chmod Calculator (+ 777/755/644/600 explainer pages) | chmod-calculator | chmod calculator | 30k-60k tool + 150k-300k informational ("chmod calculator" 20k-40k, "linux permissions calculator", "chmod 777" 60k-100k, "chmod 755" 50k-80k, "chmod 644", "chmod +x", "chmod -R", "chmod permissions") | [E]+[K]; chmod-calculator.com unlisted [U]; informational held by SO/linuxize | L-M (tool) / M (explainers) | CS | none | 8 |
| 29 | .gitignore Generator (+ Node/Python/Java/Unity templates) | gitignore-generator | gitignore generator | 60k-120k cluster ("gitignore generator" 10k-20k, "gitignore.io" brand, "python gitignore" 20k-40k, "node gitignore" 10k-20k, "unity gitignore" 10k-20k, "visual studio gitignore", "java gitignore", "gitignore template", "how to create gitignore") | [E]; toptal.com/developers/gitignore (273k [U]) + github/gitignore repo | M | CS (bundle github/gitignore templates) | none | 6 |
| 30 | Mock / Test Data Generator (JSON, CSV, SQL insert) | mock-data-generator | mock data generator | 40k-80k cluster ("mock data generator" 10k-20k, "fake data generator" 10k-20k, "test data generator" 10k-20k, "random json generator"/"json generator" 10k-20k, "dummy data generator", "csv test data") | [E]; mockaroo/json-generator/generatedata unlisted [U] | M | CS (@faker-js/faker) | low (keep "test data"; no fake IDs/cards) | 7 |
| 31 | JSONPath Tester / JSON Path Finder (+ jq-style filter) | jsonpath-tester | jsonpath online | 15k-30k ("jsonpath online", "json path finder" 5k-10k, "jsonpath evaluator", "jsonpath tester", "json query online", "jq playground" 5k-10k) | [E]+[K]; jsonpath.com/jsonpathfinder.com unlisted | L-M | CS (jsonpath-plus) | none | 7 |
| 32 | HTML Table Generator (+ CSV/JSON → HTML table, Markdown table) | html-table-generator | html table generator | 40k-80k cluster ("html table generator" 20k-40k, "table generator" 20k-40k shared with LaTeX/markdown, "csv to html table" 5k-10k, "json to html table" 5k-10k) | [E]; tablesgenerator.com dominant, rapidtables, quackit | M | CS | none | 7 |
| 33 | Markdown Table Generator | markdown-table-generator | markdown table generator | 20k-40k ("markdown table generator" 15k-30k, "markdown table", "csv to markdown table", "excel to markdown", "markdown table formatter") | [E]+[K] (top it-tools request #542) | M-L | CS | none | 7 |
| 34 | Markdown to HTML Converter (+ live preview) | markdown-to-html | markdown to html | 30k-60k ("markdown to html" 20k-40k, "markdown converter", "markdown preview online" 10k-20k, "markdown editor online" 20k-40k shared) | [E]; markdowntohtml.com unlisted, dillinger/stackedit mid | M-L | CS (marked + DOMPurify) | none | 7 |
| 35 | HTML to Markdown Converter | html-to-markdown | html to markdown | 15k-35k ("html to markdown" 10k-25k, "convert html to markdown", "html to md", "html to markdown converter online") | [E]+[K] | L-M | CS (turndown) | none | 7 |
| 36 | htpasswd Generator (bcrypt/APR1-MD5/SHA) | htpasswd-generator | htpasswd generator | 10k-25k ("htpasswd generator" 8k-15k, "htpasswd online", "htaccess password generator", "nginx basic auth password generator", "basic auth header generator" 3k-8k) | [E]+[K] (sharevb fork, hostingcanada, htaccesstools weak) | L | CS (bcryptjs, MD5-APR1 impl) | none | 7 |
| 37 | User Agent Parser / What Is My User Agent | user-agent-parser | what is my user agent | 120k-200k ("what is my user agent" 80k-150k, "my user agent", "user agent parser" 5k-10k, "user agent lookup", "user agent string checker") | [E]; whatismybrowser.com 579k [U], whatsmyua.info | M-H | CS (navigator.userAgent + ua-parser-js) | none | 6 |
| 38 | JSON to TypeScript / Go / Kotlin + JSON Schema generator | json-to-typescript | json to typescript | 30k-60k cluster ("json to typescript" 10k-20k, "json to ts interface", "json schema generator" 10k-20k, "json to go struct" 5k-10k, "json to kotlin", "json to java class", "json to c#", "json to zod") | [E]+[K] (transform.tools, quicktype, jsoncrack all unlisted [U]) | M-L | CS (json-to-ts / quicktype-core) | none | 6 |
| 39 | Docker run → Docker Compose Converter | docker-run-to-docker-compose | docker run to docker compose | 8k-15k ("docker run to docker compose", "composerize", "docker compose generator", "docker compose converter") | [E]+[K] (implemented in it-tools after top request) | L | CS (composerize) | none | 6 |
| 40 | IPv4 / CIDR Subnet Calculator | subnet-calculator | subnet calculator | 150k-250k ("subnet calculator" 100k-150k, "ip calculator", "cidr calculator" 20k-40k, "subnet mask calculator" 20k-40k, "ipv6 subnet calculator" 5k-10k) | [E]+[K]; calculator.net 36k [U], solarwinds, site24x7, jodies.de | M-H | CS (ipaddr.js) | none | 6 |

Also assessed, lower priority or fold-ins (kept for topical completeness / roadmap):

| Tool | Primary keyword | Est. | Source | Comp. | Feas. | AdSense | Priority / decision |
|---|---|---|---|---|---|---|---|
| JSON Diff / Compare two JSON | json diff | 15k-30k ("json diff", "json compare", "compare two json files") | [E]+[K] | M-L | CS (diff + sorted keys) | none | 6 — developer variant; generic diff belongs to text category |
| Password Generator (random, passphrase) | password generator | 800k-1.5M | [E]; LastPass/1Password/Bitwarden/Norton dominate | H | CS | none | 5 (internal-link utility; do not expect rank) |
| Random String / API Key / Secret Generator | random string generator | 40k-80k ("random string generator" 30k-50k, "secret key generator" 5k-10k, "api key generator", "django secret key") | [E]+[K] | M | CS | none | 6 |
| Code Case Converter (camelCase ⇄ snake_case ⇄ kebab ⇄ PascalCase) | camelcase to snake case | 10k-20k cluster ("snake case converter", "camel case converter", "kebab case converter") | [E]+[K] | L | CS | none | 6 (flag overlap with text category "case converter") |
| CSV to SQL Insert / JSON to SQL | csv to sql | 15k-30k ("csv to sql" 10k-20k, "json to sql", "sql insert generator") | [E]+[K] | M-L | CS | none | 6 |
| MIME Type Lookup (extension ⇄ MIME) | mime type list | 30k-60k informational; tool intent 3k-8k | [E]; MDN/IANA own | H (info) / L (tool) | CS (mime-db) | none | 4 |
| HTTP Status Code Lookup / reference | http status codes | 150k-300k informational | [E]; MDN/Wikipedia/Cloudflare | H | CS (static) | none | 4 (content asset; per-code pages later) |
| Lorem Ipsum JSON / placeholder JSON | dummy json | 10k-20k | [E]; jsonplaceholder.typicode.com 18k [U] | M | CS | none | fold into #30 |
| Colour Code Converter (HEX/RGB/HSL) | hex to rgb | 300k-500k cluster | [E]; rapidtables, w3schools, Google widget | H | CS | none | belongs to Design category |
| cURL to Code Converter | curl converter | 10k-20k ("curl to python", "curl to javascript", "curl converter") | [E]+[K] | L-M | CS (curlconverter, large) | none | 5 roadmap |
| TLS/X.509 Certificate & PEM Decoder, CSR generator | ssl certificate decoder | 10k-20k ("certificate decoder", "pem decoder", "csr decoder", "csr generator" 10k-20k) | [E]+[K] (top it-tools request) | M (SSL vendors: sslshopper, digicert) | CS (WebCrypto/pkijs) | none | 5 roadmap |
| SSH Key Pair / RSA key generator (in browser) | rsa key generator | 10k-20k ("ssh key generator online", "rsa key generator") | [E]+[K] | M | CS (WebCrypto) | low (state keys generated locally) | 5 roadmap |
| Byte / Data Size Converter (KB↔MB↔GiB) | bytes to mb | 100k-200k | [E]; Google widget, rapidtables | H | CS | none | 4 (unit-converter category) |
| DNS Lookup (A/MX/TXT via DNS-over-HTTPS), SSL checker, HTTP header checker, redirect checker | dns lookup | 100k-200k | [E]; mxtoolbox, dnschecker, nslookup.io | M-H | server-light / free public DoH API | none | roadmap |
| Meta tag / Open Graph checker of URL, "check meta tags" | (owned by SEO category) | | | | server-light | | not here |
| MD5 decrypt / hash cracker, JWT brute-forcer | md5 decrypt (100k+) | | | | | **high (hacking/cracking policy)** | **EXCLUDED** |
| Torrent→magnet, link downloaders, proxies | | | | | | **high** | **EXCLUDED** |
| IP geolocation / what is my IP | what is my ip (huge) | | Google widget | H | needs 3rd-party API | none | **EXCLUDED at launch (infeasible client-only)** |
| Credit card number generator | | | | | | medium (fraud-adjacent) | **EXCLUDED** (Luhn validator is fine) |

---

## 9. Per-tool long-tail phrases and "People Also Ask"-style questions (for content writers)

These come from the it-tools/OmniTools keyword arrays [K], competitor page titles seen in the tiny-helpers directory, and my knowledge of the SERP for each query [E]. Live PAA boxes could not be fetched this session; validate the top few in a browser before writing.

### 9.1 JSON Formatter & Validator
- Long tail: json formatter online · json beautifier · json pretty print · json validator · json lint / jsonlint · json viewer · json parser online · format json online · json checker · validate json online · json tree viewer · json editor online · json minify / minify json · json fixer / fix invalid json · json syntax checker · json to string / stringify json · sort json keys · json formatter chrome extension · json formatter vscode · json compare.
- PAA: How do I format JSON online? · How do I validate JSON? · What does "Unexpected token" / "Expecting 'STRING'" mean in JSON? · Why does JSON not allow trailing commas or single quotes? · What is the difference between JSON and JSON5/JSONC? · How do I pretty print JSON in Python / JavaScript / VS Code / Notepad++ / jq? · Is my data safe in an online JSON formatter? (answer: processed locally) · What is the maximum size of a JSON file? · How do I minify JSON? · How do I convert a JSON string to an object?

### 9.2 JSON ⇄ CSV / Excel
- Long tail: json to csv converter · convert json to csv online · json to excel · json array to csv · nested json to csv · flatten json · csv to json converter · csv to json array · csv to json online · excel to json · tsv to json · json to csv python / pandas / javascript (informational) · csv to json with headers · json lines (ndjson) to csv.
- PAA: How do I convert JSON to CSV in Excel? · How do you handle nested JSON when converting to CSV? · Does CSV support arrays? · How do I open a JSON file in Excel (Power Query)? · How do I convert CSV to JSON in Python/JavaScript? · Why are my CSV numbers losing leading zeros? · What delimiter should I use (comma, semicolon, tab)? · How do I keep UTF-8 characters in CSV for Excel (BOM)?

### 9.3 YAML ⇄ JSON, YAML Validator
- Long tail: yaml to json converter · json to yaml converter · yaml validator online · yaml lint · yaml checker · yaml formatter · yaml parser online · yaml syntax checker · docker compose yaml validator · kubernetes yaml validator · github actions yaml validator · yaml to toml · json to yaml python.
- PAA: Is YAML a superset of JSON? · Why does my YAML say "mapping values are not allowed here"? · Tabs vs spaces in YAML? · How do I write multiline strings in YAML (| vs >)? · How do I validate a docker-compose.yml / Kubernetes manifest? · What is YAML 1.2 vs 1.1 (the "Norway problem", yes/no booleans)? · How do I convert YAML to JSON in Python/JavaScript/yq?

### 9.4 XML Formatter, XML ⇄ JSON
- Long tail: xml formatter online · xml beautifier · pretty print xml · xml validator · xml viewer · xml minifier · xml to json converter · json to xml · xml parser online · xml syntax checker · xsd validator (XML schema) · xpath tester · xml to csv.
- PAA: How do I format XML in Notepad++/VS Code? · What is well-formed vs valid XML? · How are XML attributes represented in JSON? · How do I convert XML to JSON in Python/JavaScript/Java? · Why does XML to JSON lose ordering or produce arrays inconsistently? · What is CDATA? · How do I validate XML against an XSD?

### 9.5 HTML / CSS / JavaScript Formatter & Minifier
- Long tail: html formatter online · html beautifier · html prettifier · clean html code · html minifier · minify html · css minifier · minify css online · css beautifier / css formatter / unminify css · css compressor · javascript minifier · minify js online · js beautifier / javascript beautifier / unminify js · uglify js online · js obfuscator · prettier online / prettier playground · format code online.
- PAA: Does minifying CSS/JS improve page speed / Core Web Vitals? · What is the difference between minify and uglify/obfuscate? · How do I unminify JavaScript? · Will minifying break my code? (ASI, license comments) · How do I auto-format HTML in VS Code? · What is Prettier vs ESLint? · Should I minify HTML? · How do I compress CSS for WordPress?

### 9.6 SQL Formatter
- Long tail: sql formatter online · sql beautifier · format sql query online · sql pretty print · sql query formatter · mysql formatter · postgresql formatter · t-sql formatter / sql server formatter · oracle pl/sql formatter · bigquery sql formatter · snowflake sql formatter · sql minifier · sql formatter vscode · sql formatter python (sqlparse) · sql indentation style.
- PAA: How do I format a SQL query? · Should SQL keywords be uppercase? · What is the difference between formatting for MySQL vs PostgreSQL vs T-SQL? · How do I format SQL in SSMS / DBeaver / DataGrip / VS Code? · Does formatting change query performance? (no) · How do I format SQL inside a Python/Java string? · What is the leading-comma style?

### 9.7 Base64 Encode / Decode, Image to Base64
- Long tail: base64 decode online · base64 encode online · base64 converter · base64 to text · text to base64 · base64 to image · image to base64 · png to base64 · jpg to base64 · svg to base64 · base64 to pdf · base64 to file / file to base64 · base64 url safe · base64 decode utf-8 · base64 image in html/css (data URI) · base64 in javascript (atob/btoa) · base64 in python · base64 in powershell / linux command line.
- PAA: Is Base64 encryption? (no) · Why does Base64 end with "="? · How much bigger is Base64 than the original (~33%)? · How do I decode Base64 in JavaScript/Python/Java/PowerShell/Linux? · How do I embed a Base64 image in HTML/CSS? · What is URL-safe Base64? · Why does my Base64 decode produce garbage (UTF-8 vs Latin-1)? · What is the maximum size for a data URI?

### 9.8 URL Encode / Decode
- Long tail: url decoder online · url encoder · url encode online · percent encoding · encode url javascript (encodeURIComponent vs encodeURI) · url decode python (urllib.parse) · url encode space %20 vs + · url parser / parse query string · query string builder · unicode url encoding · double url encoding.
- PAA: What is URL encoding / percent-encoding? · Why is a space %20 and sometimes +? · Which characters must be encoded in a URL? · encodeURI vs encodeURIComponent? · How do I decode a URL in Python/Java/PHP/C#? · What is punycode? · Why does my URL have %25 (double encoding)?

### 9.9 HTML Entity Encoder / Decoder
- Long tail: html entity decoder · html decode online · html encoder · html escape · html unescape · html special characters converter · &amp; &lt; &gt; &quot; meaning · html entity list / html symbols · html escape javascript / python (html.escape) · htmlspecialchars online · xml escape.
- PAA: What are HTML entities? · When should I escape HTML? (XSS) · What is the difference between &nbsp; and a space? · How do I display < and > in HTML? · Named vs numeric entities? · How do I decode HTML entities in JavaScript/Python/PHP? · What is &#39; vs &apos;?

### 9.10 JWT Decoder
- Long tail: jwt decoder online · decode jwt token · jwt decode · jwt parser · jwt viewer · jwt debugger · jwt verify online · jwt signature verification · jwt expiration checker (exp) · jwt generator / jwt encoder (HS256) · jwt to json · jwt claims explained (iss, sub, aud, exp, nbf, iat, jti) · jwt decode python (pyjwt) / javascript (jwt-decode) / java · jwt vs session · jwt.io alternative.
- PAA: Is a JWT encrypted? (no, signed; JWE is encrypted) · Can anyone decode a JWT? · How do I check if a JWT is expired? · Is it safe to paste a JWT into an online decoder? (only if client-side) · What is the difference between HS256 and RS256? · What are the three parts of a JWT? · How do I verify a JWT signature? · Where should I store a JWT (localStorage vs cookie)?

### 9.11 UUID / GUID Generator
- Long tail: uuid generator online · guid generator · random uuid · uuid v4 generator · uuid v7 generator · uuid v1 · uuid v5 namespace · bulk uuid generator / generate 100 uuids · uuid to guid · uuid without dashes · uppercase guid · nil uuid · ulid generator · nanoid generator · uuid generator javascript (crypto.randomUUID) / python (uuid4) / java / c# (Guid.NewGuid) / sql (gen_random_uuid, NEWID) · uuid validator · uuid vs guid.
- PAA: What is a UUID/GUID? · Are UUIDs really unique (collision probability)? · What is the difference between UUID v4 and v7? · Should I use UUID as a primary key? · UUID vs auto-increment ID? · How do I generate a UUID in Python/JavaScript/Java/Postgres/MySQL/Excel? · What is a ULID? · Is a GUID the same as a UUID?

### 9.12 Regex Tester (+ pattern pages)
- Long tail: regex tester online · regex tester javascript / python / java / php / golang / .net · regex checker · regex validator · regex generator · regex builder · regex debugger · regex replace online · regex match online · regex cheat sheet · regex for email · regex for phone number · regex for url · regex for password (8 chars, uppercase, number, special) · regex for date (yyyy-mm-dd) · regex for ip address · regex for numbers only · regex for whitespace · regex lookahead / lookbehind · regex flags (g, i, m, s, u) · regex101 alternative.
- PAA: How do I test a regex? · What does \d \w \s \b mean? · What is a greedy vs lazy quantifier? · How do I match an email/phone/URL with regex? · How do I use capture groups and backreferences? · What is the difference between JavaScript and PCRE/Python regex? · How do I match across multiple lines? · Why is my regex slow (catastrophic backtracking)?

### 9.13 Cron Expression Generator
- Long tail: cron expression generator · crontab generator · cron generator · cron expression builder · cron expression explained / cron expression parser · crontab guru alternative · cron every minute · cron every 5 minutes · cron every 10/15/30 minutes · cron every hour · cron every day at midnight · cron every monday · cron every first of month · cron every weekday at 9am · quartz cron expression generator · spring cron expression · aws eventbridge cron / rate expression · kubernetes cronjob schedule · github actions schedule cron · jenkins cron syntax · crontab examples · cron next run time.
- PAA: How do I read a cron expression (5 fields vs 6 with seconds)? · What is the difference between Unix cron and Quartz/Spring cron? · How do I run a cron job every 5 minutes / every Sunday? · Does cron use UTC or local time? · What does */5 mean? · How do I edit crontab (crontab -e)? · Why is my cron job not running? · How do I set cron in GitHub Actions / AWS Lambda / Kubernetes?

### 9.14 Hash Generator, HMAC, Bcrypt
- Long tail: md5 hash generator · md5 online · sha256 hash generator · sha256 online · sha1 hash generator · sha512 generator · sha3 · hash generator online · file hash calculator / checksum calculator · sha256 checksum verify (iso download) · crc32 calculator · hash text online · hmac generator · hmac sha256 online · hmac sha256 generator · bcrypt generator · bcrypt hash online · bcrypt verify / bcrypt checker · bcrypt cost factor / rounds · argon2 online · password hash generator · md5 vs sha256 · sha256 in python/javascript/java/c#/powershell (Get-FileHash) / linux (sha256sum).
- PAA: Can MD5 be decrypted? (no; one-way) · Is MD5 still safe? (not for security) · What is the difference between MD5, SHA-1 and SHA-256? · How do I verify a file checksum on Windows/Mac/Linux? · What is a salt? · What is HMAC and how is it different from a hash? · What bcrypt cost should I use in 2026? · bcrypt vs argon2 vs scrypt? · Why does bcrypt give a different hash each time?

### 9.15 Unix Timestamp / Epoch Converter (+ Discord timestamps)
- Long tail: epoch converter · unix timestamp converter · timestamp to date · date to timestamp · unix time converter · current unix timestamp / unix time now · epoch time now · milliseconds to date · unix timestamp to date excel · timestamp converter python / javascript / sql / java · iso 8601 converter · utc converter · epoch to human readable · discord timestamp generator · discord timestamp format (<t:...:R>) · timestamp in milliseconds vs seconds · year 2038 problem.
- PAA: What is Unix epoch time? · Why does Unix time start in 1970? · How do I convert a timestamp to a date in Excel / Google Sheets / Python / JavaScript / SQL? · Is Unix time in UTC? · What is the year 2038 problem? · Seconds vs milliseconds — how do I tell? · How do I get the current Unix timestamp in bash/Python/JS? · How do I make a Discord timestamp?

### 9.16 Number Base / Binary / Hex / ASCII Converters
- Long tail: binary to decimal · decimal to binary · hex to decimal · decimal to hex · binary to hex · hex to binary · octal converter · base converter · binary translator · text to binary · binary to text · binary code translator · hex to text · text to hex · hex to ascii · ascii to hex · ascii to text · text to ascii · ascii table · unicode converter · text to unicode · unicode to text · utf-8 encoder · bitwise calculator · two's complement calculator · float to hex (IEEE 754).
- PAA: How do I convert binary to decimal by hand? · How do I read binary code? · What is hexadecimal used for? · What is the difference between ASCII and Unicode / UTF-8? · How many bits in a byte? · How do computers store negative numbers (two's complement)? · How do I convert hex to decimal in Excel/Python/JavaScript?

### 9.17 chmod Calculator
- Long tail: chmod calculator · linux permissions calculator · file permission calculator · chmod 777 · chmod 755 · chmod 644 · chmod 600 · chmod 700 · chmod 664 · chmod +x · chmod -R recursive · chmod octal · chmod symbolic vs numeric · rwx permissions · chmod for wordpress files/folders · chmod sticky bit / setuid / setgid · chmod calculator umask · chown vs chmod.
- PAA: What does chmod 777 mean and why is it dangerous? · chmod 755 vs 644 — which for files and folders? · How do I make a file executable (chmod +x)? · What do r, w, x mean? · How do I calculate chmod numbers? · What are the correct WordPress/Laravel file permissions? · How do I change permissions recursively? · What is umask?

### 9.18 .gitignore Generator
- Long tail: gitignore generator · gitignore.io · gitignore template · python gitignore · node gitignore / node_modules gitignore · unity gitignore · visual studio gitignore · java gitignore · react / next.js gitignore · android gitignore · macos .DS_Store gitignore · global gitignore · gitignore syntax / patterns · gitignore not working · gitignore vs .gitattributes.
- PAA: How do I create a .gitignore file? · Why is .gitignore not ignoring my files (already tracked)? · How do I ignore a folder / all files of a type / everything except? · Should I commit package-lock.json / .env / .idea? · What is a global gitignore? · How do I untrack a file already committed (git rm --cached)?

### 9.19 Mock / Test Data Generator
- Long tail: mock data generator · fake data generator · test data generator · random json generator · json data generator · dummy data generator · sample csv data · random user data · random name / email / address generator for testing · sql insert test data · faker online · mockaroo alternative · generate 1000 rows csv.
- PAA: What is mock data vs test data vs synthetic data? · How do I generate test data for SQL/Postgres? · How do I create fake JSON for API testing? · What is Faker.js / Python Faker? · Is it legal to use fake personal data in testing? (yes, synthetic) · How do I generate a large CSV for load testing?

### 9.20 JSONPath Tester
- Long tail: jsonpath online · jsonpath tester · jsonpath evaluator · json path finder · jsonpath syntax / cheat sheet · jsonpath examples · jsonpath filter expression · jq online / jq playground · jsonpath vs jq · jsonpath python / java (Jayway) / javascript · postman jsonpath.
- PAA: What is JSONPath? · How do I write a JSONPath filter (?(@.price > 10))? · JSONPath vs XPath? · How do I get the path to a key in a large JSON? · How do I use JSONPath in Postman / Kubernetes (kubectl -o jsonpath) / Ansible? · What is RFC 9535?

### 9.21 HTML / Markdown Table Generators
- Long tail: html table generator · table generator · html table maker · html table code · responsive html table generator · csv to html table · json to html table · excel to html table · markdown table generator · markdown table · markdown table formatter / prettifier · csv to markdown table · excel to markdown · markdown table alignment · latex table generator (adjacent).
- PAA: How do I create a table in HTML? · How do I make an HTML table responsive? · How do I add borders/striped rows to an HTML table with CSS? · How do I make a table in Markdown / GitHub README? · How do I align columns in a Markdown table? · Can I merge cells in Markdown? (no) · How do I convert Excel to a Markdown table?

### 9.22 Markdown ⇄ HTML
- Long tail: markdown to html · markdown to html converter · markdown converter · markdown preview online · online markdown editor · markdown viewer · html to markdown · convert html to markdown · html to md · markdown to pdf (roadmap) · markdown to docx · markdown cheat sheet · github flavored markdown · markdown to plain text · readme generator.
- PAA: What is Markdown? · How do I convert Markdown to HTML in Python (markdown, mistune) / JavaScript (marked, markdown-it)? · What is GitHub Flavored Markdown? · How do I add a table / image / link / code block in Markdown? · How do I convert HTML to Markdown (turndown, pandoc)? · Is Markdown safe to render (XSS, sanitize)?

### 9.23 htpasswd Generator
- Long tail: htpasswd generator · htpasswd online · .htpasswd file generator · htaccess password protect directory · htpasswd bcrypt · htpasswd md5 (apr1) · htpasswd nginx · nginx basic auth · basic auth header generator (Authorization: Basic base64) · htpasswd command · htpasswd -c · apache password protect folder.
- PAA: How do I password protect a directory with .htaccess? · What is .htpasswd? · Which htpasswd algorithm should I use (bcrypt vs MD5 vs SHA)? · How do I create htpasswd on Windows / without apache tools? · How do I set up basic auth in Nginx? · Is basic auth secure? (only over HTTPS)

### 9.24 User Agent Parser
- Long tail: what is my user agent · my user agent · user agent string · user agent parser · user agent lookup · user agent checker · user agent list (chrome, safari, googlebot) · user agent switcher · detect browser from user agent · user agent javascript (navigator.userAgent) · user agent client hints · googlebot user agent.
- PAA: What is a user agent? · How do I find my user agent? · How do I change my user agent in Chrome/Firefox? · Why does Chrome's user agent say Mozilla and Safari? · What is User-Agent reduction / Client Hints? · What is Googlebot's user agent string?

### 9.25 String Escape, JSON→TypeScript, Docker run→Compose, Subnet Calculator, HMAC/bcrypt (see above)
- String escape: json escape · escape json string · json unescape · javascript escape string · escape quotes in json · unescape string online · string escaper · sql escape single quote · escape html in javascript · csv escape quotes · regex escape / escape special characters regex. PAA: How do I escape double quotes in JSON? · How do I escape a backslash? · What is the difference between escaping and encoding? · How do I unescape \n and é?
- JSON→TypeScript: json to typescript interface · json to ts · json to typescript type · json schema generator · json to json schema · json schema validator · json to go struct · json to kotlin data class · json to java pojo · json to c# class · json to python dataclass / pydantic · json to zod · quicktype alternative. PAA: How do I generate a TypeScript interface from JSON? · interface vs type? · How do I validate JSON against a schema (ajv)? · What is JSON Schema draft 2020-12?
- Docker run→compose: docker run to docker compose · composerize · docker compose generator · docker compose from docker run · docker run command to yaml · docker compose vs docker run · docker compose to docker run. PAA: How do I convert a docker run command to docker-compose.yml? · What is the compose file version? · How do I map ports/volumes/env in compose?
- Subnet calculator: subnet calculator · ip subnet calculator · cidr calculator · subnet mask calculator · ipv4 calculator · ipv6 subnet calculator · /24 subnet · how many hosts in a /26 · cidr to ip range · ip range to cidr · vlsm calculator · wildcard mask calculator. PAA: What is CIDR notation? · How many usable hosts in /24, /25, /26, /27? · What is a subnet mask? · How do I calculate the broadcast address? · What is the difference between network and host bits? · What is a wildcard mask (Cisco ACL)?

---

## 10. Launch recommendation for this category (summary)

**Launch with (priority ≥ 7):** JSON Formatter/Validator hub (9), JSON→CSV (8), CSV→JSON (8), YAML⇄JSON (8), SQL Formatter (8), JWT Decoder (8), UUID Generator incl. v7/ULID (8), Regex Tester + 4-6 hand-written pattern pages (8), Cron Generator/Explainer + 5-6 hand-written schedule pages (8), Hash Generator MD5/SHA (8), Unix Timestamp/Epoch Converter + Discord timestamp page (8), chmod Calculator + 777/755/644/600 pages (8), YAML Validator (7), XML Formatter (7), XML⇄JSON (7), HTML Formatter/Minifier (7), CSS Minifier/Beautifier (7), Base64 (7), Image→Base64 (7), URL Encode/Decode (7), HTML Entities (7), HMAC (7), Bcrypt (7), String Escape (7), Mock Data Generator (7), JSONPath Tester (7), HTML Table Generator (7), Markdown Table Generator (7), Markdown→HTML (7), HTML→Markdown (7), htpasswd Generator (7).

**Second wave (priority 6):** JS Minifier/Beautifier, JSON Minifier page, Number Base Converter cluster, Text⇄Binary/Hex/ASCII, .gitignore Generator + templates, User Agent Parser, JSON→TypeScript/Schema, Docker run→Compose, Subnet Calculator, JSON Diff, Random String/Secret Generator, Code Case Converter, CSV→SQL.

**Roadmap / server-light or heavy libs:** cURL converter, X.509/PEM decoder + CSR generator, SSH key generator, DNS lookup via DoH, SSL/header/redirect checkers, MIME and HTTP status reference pages.

**Excluded:** MD5 decrypt/hash cracking, JWT brute-force, torrent/magnet, downloaders, proxies, IP geolocation ("my IP") at launch, credit-card number generators, API-dependent translators/currency.

**Biggest opportunities for a zero-authority domain (low competition × real volume):** SQL formatter, hash/HMAC/bcrypt cluster, cron generator + schedule pages, UUID (v7 angle), chmod + permission explainers, htpasswd, JSONPath, string escape, YAML validator, JSON→TypeScript/Schema, docker-run→compose, Discord timestamp generator, markdown/HTML table generators. Head terms (json formatter, base64, epoch converter, regex tester, jwt decoder, binary converters) are needed for topical completeness and internal linking but should not be the pages the 6-month traffic forecast depends on.

Cloned source for further mining (scratchpad, not committed): `/tmp/claude-0/-home-user-Seo-Tools-website/d1b12931-2ae1-528f-9c0a-b8cc84ee8f92/scratchpad/{CorentinTh_it-tools,sharevb_it-tools,stefanjudis_tiny-helpers,iib0011_omni-tools,jaywcjlove_tools,umbrella.zip}`.
