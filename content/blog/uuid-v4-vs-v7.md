---
title: "UUID v4 vs v7: Which Should You Use?"
description: "UUID v7 sorts by time and suits database primary keys; UUID v4 is fully random and reveals nothing. Compare bit layouts, index effects and when to pick each."
date: "2026-09-30"
updated: "2026-09-30"
tags: [uuid, database, primary-key, rfc-9562, identifiers]
relatedTools: [uuid-generator, password-generator, remove-duplicate-lines]
---

Use UUID v7 for new database primary keys that stay inside your system, and UUID v4 for identifiers that must reveal nothing about when they were created. Both are 128-bit values that fit the same `uuid` column. The difference is that v7, defined in RFC 9562 (2024), starts with a millisecond timestamp, so new rows sort after old ones, while v4 is almost entirely random and lands anywhere in an index.

*Last reviewed September 30, 2026.*

## Quick answer

- **Choose v7** for primary keys that rows receive continuously and nobody outside your system sees.
- **Choose v4** when the ID appears in URLs or emails and its creation time is sensitive, or when the device making it may have a wrong clock.
- **Choose neither** for secrets; a UUID is an identifier, not a token.
- **Keep existing v4 keys** unless you have measured a problem. Both versions can share one column.

## What is inside each version, bit by bit

Every UUID has 128 bits, written as 32 hex digits. Six bits are fixed in all versions: four for the version and two for the variant. What fills the other 122 bits is where v4 and v7 part ways.

A v4 fills all 122 with random data. This one was generated for this guide with `crypto.randomUUID()`:

```
d019936d-5d91-466c-abcc-f5732f6bd540
```

The first digit of the third group is `4`, the version. The first digit of the fourth group is `a`, binary `1010`: the top two bits (`10`) are the variant and the other two are random. Nothing in the value says when it was made.

A v7 spends its first 48 bits on a Unix timestamp in milliseconds. Here is the layout, using the v7 test vector from RFC 9562 (Appendix A.6):

| Field | Bits | Digits in `017f22e2-79b0-7cc3-98c4-dc0c0c07398f` | Meaning |
| --- | --- | --- | --- |
| unix_ts_ms | 48 | `017f22e279b0` | milliseconds since 1970-01-01 UTC |
| version | 4 | `7` | version 7 |
| rand_a | 12 | `cc3` | random, or a counter |
| variant | 2 | first two bits of `9` (`1001`) | binary `10` |
| rand_b | 62 | last two bits of `9`, then `8c4dc0c0c07398f` | random, or a counter |

To read the timestamp, convert `017f22e279b0` from hex: 1,645,557,742,000 milliseconds. Dividing by 1,000 gives 1,645,557,742 seconds after 1970-01-01, which is 2022-02-22 19:22:22 UTC (the RFC lists it as 2:22:22 PM at UTC-5). In JavaScript: `new Date(parseInt(uuid.replace(/-/g, "").slice(0, 12), 16))`. The Decode tab of the [UUID Generator](/tools/uuid-generator) does this for any pasted value.

The 74 bits after version and variant are a ceiling on randomness. RFC 9562 section 6.2 lets a generator spend some on a counter or sub-millisecond precision, and PostgreSQL's documentation describes its `uuidv7()` as a millisecond timestamp, a sub-millisecond timestamp and random bits. The 48-bit timestamp lasts 2^48 milliseconds, about 8,919 years after 1970, until the year 10889.

## Side-by-side comparison

| Property | UUID v4 | UUID v7 |
| --- | --- | --- |
| Random bits | 122 | Up to 74 |
| Timestamp | None | 48-bit Unix milliseconds |
| Sorts by creation time | No | Yes as bytes; roughly across machines |
| Index inserts | Scattered | Clustered at the newest end |
| Reveals creation time | No | Yes, to the millisecond |
| Duplicates possible between | Any two IDs | IDs from the same millisecond |

## Why v7 is easier on a database index

A primary key index is a sorted structure split into pages. A v4 insert lands on a random page, so a busy table keeps touching pages spread across the whole index. If the index is larger than memory, many must be read from disk first, and full pages split. A v7 insert goes to the newest page and leaves older pages alone.

To put figures on it, a Node.js script written for this guide simulated only the leaf level of a B-tree with 200 entries per page. It built an index of 1,000,000 keys, inserted 1,000 more and counted the distinct leaf pages touched. Three runs gave:

| Key type | Pages after 1,000,000 keys | Average page fill | Pages touched by 1,000 inserts |
| --- | --- | --- | --- |
| v4 random | about 7,200 to 7,350 | 68% to 69% | about 935 (921 to 950) |
| v7, strictly ascending | 5,000 | 100% | 5 |
| v7, 20 IDs per millisecond in random order | about 9,500 | about 52% | 10 to 11 |

The v4 fill matches the roughly 69% (ln 2) that classic B-tree analysis predicts for random inserts. The last row is the caveat: without a counter to order IDs within a millisecond, this model splits pages more often and fills them about halfway. In a fourth run, a variant that splits the newest page unevenly, leaving it about 90% full, lifted that row to 90.5% fill and 6.5 pages touched.

This models one layer of one structure and is not a database benchmark. It ignores internal pages, caching, logging and locking, and a small index that fits in memory may show little gap. Measure your own workload before migrating. Clustering has a flip side too: all concurrent writers target the newest page, and range-sharded databases can send every new write to one shard.

## What v7 costs you

- **The creation time is public.** An account ID reveals the sign-up time to the millisecond, and order IDs show how fast orders arrive.
- **Clocks decide placement.** A server clock that steps backward, or a phone set to the wrong date, produces IDs that are still unique but sort into the wrong part of the index.
- **Order across machines is approximate.** Servers whose clocks differ by a few milliseconds interleave their IDs, so v7 cannot say which event came first.
- **It does not replace a timestamp column.** The embedded time is when the generator made the ID, not when the row committed. PostgreSQL's documentation says the value `uuid_extract_timestamp()` returns is not necessarily exactly the generation time. Keep a real `created_at`.

## How likely is a duplicate?

A v4 has 2^122 (about 5.3 × 10^36) values. The birthday approximation n² ÷ (2 × 2^122) puts one billion IDs at about 9.4 × 10^-20.

A v7 can only collide with an ID from the same millisecond. With all 74 bits random, 1,000 IDs in one millisecond collide with probability 1,000² ÷ (2 × 2^74) ≈ 2.7 × 10^-17. With only 62 random bits it is about 1.1 × 10^-13. Both are negligible next to real causes, such as a broken random generator or one ID inserted twice by a retry. A unique index catches both.

## Compatibility: what generates each version

Support changes quickly. As of September 2026, confirm in each project's current documentation:

- **PostgreSQL:** `gen_random_uuid()` makes v4. Version 18 adds `uuidv7()` and a `uuidv4()` alias, and `uuid_extract_timestamp()` reads v1 and v7.
- **Python 3.14 and later:** `uuid.uuid7()`. **.NET 9 and later:** `Guid.CreateVersion7()`.
- **JavaScript and Java:** `crypto.randomUUID()` and `UUID.randomUUID()` make v4 only, so v7 needs a library.
- **MySQL:** `UUID()` returns version 1, so generate v7 in application code unless your version's manual lists a native function. MariaDB documents a `UUID_v7()` function from 11.7.
- **SQL Server:** `uniqueidentifier` compares its last six bytes first, so v7 values do not sort by time there.

The version never changes the column type: a v7 fits wherever a v4 does. For authoritative wording, read RFC 9562 from the IETF and your database's manual. The [UUID Generator](/tools/uuid-generator) makes test data in either version.

## Which one to use, by scenario

- **New table, IDs never leave the backend:** v7.
- **IDs in public URLs, API responses or share links:** v4. Or keep a v7 or integer key internally and add a random v4 as the public ID, at the price of one more column and unique index.
- **Events, logs and messages read newest first:** v7, plus a real timestamp column.
- **Small or read-mostly tables:** either. The locality gain shrinks when the index fits in memory, so choose on privacy.
- **IDs made in browsers, phones or offline apps:** v4 by default. Client clocks can be wrong, and users can forge timestamps.
- **A large table already on v4, with no measured problem:** keep it. Migrating means rewriting every foreign key and outside reference.
- **Tokens, reset links and API keys:** neither. RFC 9562's Security Considerations section says UUIDs must not be used as security capabilities. Use a random secret of proper length, such as one from the [Password Generator](/tools/password-generator).

## Common mistakes

- **Storing UUIDs as 36-character text.** For 100 million rows, 16 bytes each is 1.6 GB against 3.6 GB as one-byte-per-character text, before index overhead. Engines that cluster rows by primary key, MySQL's InnoDB among them, copy the key into every secondary index entry: with five secondary indexes those key copies alone take 8 GB for 16-byte keys against 4 GB for 8-byte integers. Use the native `uuid` type or `BINARY(16)`.
- **Trusting client timestamps.** A v7 made in a browser can carry any time its owner likes. Generate on the server if placement matters.
- **Treating "hard to guess" as "secure".** Never use a UUID in place of an access check.
- **Sorting with the wrong rules.** Compare bytes, keep one letter case, and remember that .NET's GUID byte layout and SQL Server's comparison order can differ from the text order.
- **Expecting v7 to repair a scattered table.** Old rows stay put; only new rows cluster.
- **Finding duplicates by eye.** Before loading exported IDs, paste the column into [Remove Duplicate Lines](/tools/remove-duplicate-lines) with case ignored and compare the counts.

## Frequently asked questions

### Is UUID v7 better than v4?

For indexed primary keys that stay private, usually yes, because new rows cluster instead of scattering. For public identifiers v4 is better because it reveals nothing.

### Can someone guess the next UUID v7?

The timestamp is predictable if someone knows roughly when a record was created. The rest is random, up to 74 bits, but a generator that uses a counter makes neighbors easier to predict. Either way, do not treat the ID as a secret.

### Do I have to migrate my existing v4 keys?

No. Both are valid UUIDs and can sit in the same column. Only new rows benefit from v7, and rewriting keys touches every foreign key and outside reference, so migrate only after measuring a problem.

### Are v7 collisions more likely than v4 collisions?

Per ID, v7 has fewer random bits, but it can only collide within the same millisecond. By the calculations above, both are negligible. Duplicates in practice come from bad randomness or repeated inserts.

### Should I use a ULID or an auto-increment integer instead?

A ULID follows the same idea as v7, a 48-bit millisecond timestamp plus 80 random bits in 26 text characters, but it is not a UUID. An integer is smaller at 8 bytes, yet it needs central coordination and reveals how many rows exist.

*This guide is independent of the IETF, PostgreSQL, MySQL, Microsoft and the other projects named; none has reviewed or endorsed it.*
