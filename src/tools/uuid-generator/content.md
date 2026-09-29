## What this UUID generator does

This UUID generator creates identifiers in the formats developers actually ask for: version 4 (random), version 7 (time-ordered), version 1, versions 5 and 3 (name-based), version 6, the nil and max UUIDs, plus ULID and NanoID. Pick a type, choose how many you need (up to 10,000 at once), and copy the result as plain lines, a comma-separated list, a quoted SQL list or a JSON array. Everything is made in your browser with its secure random number generator, so nothing is uploaded and generated IDs are never stored.

A second tab, **Decode & validate**, works in the other direction. Paste any UUID, GUID or ULID and it reports whether the value is well formed, which version and variant it uses, and, for versions 1, 6, 7 and ULIDs, the exact timestamp hidden inside. Paste a whole list and it checks every line.

A UUID (universally unique identifier) and a GUID (globally unique identifier) are the same 128-bit value; "GUID" is Microsoft's name. Both are written as 32 hexadecimal digits in an 8-4-4-4-12 pattern, defined by RFC 9562, which replaced RFC 4122 in 2024 and added versions 6, 7 and 8.

## How to use the generator

1. **Pick an ID type** from the chips: v4 · random, v7 · time-ordered, v1 · timestamp, v5 · SHA-1 name, v3 · MD5 name, v6 · sortable v1, Nil, Max, ULID or NanoID.
2. **Set how many.** Type a whole number from 1 to 10,000 into *How many*. NanoID also shows *Length* (1 to 128) and *Alphabet*. For v5 and v3 there is no count: choose a *Namespace* (DNS, URL, OID, X.500 or your own UUID) and type one name per line under *Names*. Each line becomes one UUID.
3. **Choose the format.** *Uppercase*, *No dashes* and *{Braces}* change how each UUID is written. *Layout* wraps the list as one per line, comma separated, a single-quoted list for SQL `IN (...)`, a double-quoted list for CSV or code, or a JSON array.
4. **Press Generate new** (or *Generate* for v5 and v3). Changing the type or count regenerates automatically, while changing only the format switches restyles the same IDs.
5. **Copy all** puts the output on your clipboard, **Download** saves a `.txt` or `.json` file, and **Decode first** opens the first ID in the Decode & validate tab.

## What each version means

| Version | Where uniqueness comes from | Sorts by time? | Typical use |
| --- | --- | --- | --- |
| v1 | 60-bit timestamp (100 ns ticks since 1582-10-15), clock sequence, 48-bit node | Not as written | Legacy systems; MySQL's `UUID()` |
| v3 | MD5 of a namespace UUID and a name | No | Matching an existing v3 scheme |
| v4 | 122 random bits | No | The default GUID |
| v5 | SHA-1 of a namespace UUID and a name | No | Stable IDs derived from names |
| v6 | The v1 timestamp reordered, most significant bits first | Yes | Systems already built on v1 |
| v7 | 48-bit Unix millisecond timestamp plus 74 random bits | Yes | Database primary keys |
| v8 | Whatever the generator defines | Up to you | Vendor-specific layouts |
| Nil / Max | All bits 0 / all bits 1 | n/a | Placeholder and sentinel values |

Every standard UUID carries a 4-bit version and a 2-bit variant (binary `10`). That is why the first digit of the third group shows the version and the first digit of the fourth group is always 8, 9, a or b.

## How the IDs are built

**Version 4.** The tool calls `crypto.randomUUID()` when the browser offers it and falls back to `crypto.getRandomValues()`. Six of the 128 bits are fixed for version and variant, leaving 122 random bits.

**Version 7.** The first 48 bits are the current time in Unix milliseconds. Take `017F22E2-79B0-7CC3-98C4-DC0C0C07398F`, the version 7 test vector in RFC 9562. Its first 12 hex digits, `017F22E279B0`, equal 1,645,557,742,000 milliseconds, which is 2022-02-22 19:22:22 UTC. The `7` starting the third group is the version, and the `9` starting the fourth carries the variant bits. The other 74 bits are random. Within one millisecond this tool treats them as a counter that grows by a random amount, so every UUID in a batch is strictly greater than the one before it, and the output shows a "strictly increasing" badge.

**Versions 1 and 6.** The timestamp counts 100-nanosecond ticks from 15 October 1582. Classic v1 generators put the machine's MAC address in the node field, which leaks hardware identity. This tool uses a random node with the multicast bit set, RFC 9562's marker for a node that is not a real network address.

**Versions 5 and 3.** These are deterministic. For v5 the tool computes SHA-1 over the 16 namespace bytes followed by the UTF-8 name, keeps 128 bits and overwrites the version and variant bits. With the DNS namespace `6ba7b810-9dad-11d1-80b4-00c04fd430c8` and the name `www.example.com`, v5 gives `2ed6657d-e927-568b-95e1-2665a8aea6a2` and v3 gives `5df41881-3aed-3515-88a7-2f4a814cf09e`. Any compliant library agrees, for example Python's `uuid.uuid5(uuid.NAMESPACE_DNS, "www.example.com")`.

**ULID and NanoID.** A ULID is a 48-bit millisecond timestamp plus 80 random bits, written as 26 Crockford Base32 characters (digits and letters without I, L, O and U). NanoID is not a UUID: each character is drawn from an alphabet by rejection sampling, so every symbol is equally likely. Strength is length × log2(alphabet size), so the default 21 characters from 64 symbols give 126 bits, while 21 digits give only about 70.

## Version 4 versus version 7 as database keys

A primary key index is a sorted tree. With random v4 keys every insert lands on a random leaf page. Suppose an index has 100,000 leaf pages (an illustrative figure). Inserting 1,000 rows touches about 100,000 × (1 − (1 − 1/100,000)^1,000) ≈ 995 different pages, so nearly every insert reads a page that may not be in memory, and full pages split in the middle. With v7 keys all 1,000 rows land on the right edge of the index. If a page holds around 200 entries, that is roughly 5 pages, and older pages are never touched again.

That is why v7 is usually the better choice for a new table, and why PostgreSQL 18 added a built-in `uuidv7()`. The trade-off is privacy: anyone who decodes a v7 value learns when the row was created. For public account IDs, expose v4 and keep the v7 or integer key internal.

## Which ID type should you choose?

- **A new database table: v7.** It is a standard UUID, so every uuid column, driver and validator accepts it, and it inserts in time order.
- **An ID that appears in public URLs, or whose creation time must stay private: v4.** It carries no information beyond its randomness.
- **The same input must always produce the same ID: v5.** Use v3 only to match data that already uses it.
- **A shorter string for people to copy: ULID (26 characters) or NanoID (21 by default).** Neither is a UUID, so a native `uuid` column will not accept them as text. A ULID does hold exactly 128 bits, and the Decode tab shows the UUID form of any ULID.
- **Existing v1 data, or MySQL's `UUID()` output, that you want to sort by time: v6.** It is the same timestamp and node with the fields reordered.
- **A placeholder or an upper bound for a range query: Nil or Max.**

## How likely is a collision?

The chance that at least one pair among n random v4 UUIDs collides is 1 − e^(−n² ÷ (2 × 2^122)), which for small n is simply n² ÷ (2 × 2^122). The table uses that formula.

| UUIDs generated | Chance of at least one duplicate |
| --- | --- |
| 1 billion (10^9) | about 9.4 × 10^-20 |
| 103 trillion | about 1 in a billion |
| 10^18 | about 9% |
| 2.7 × 10^18 | 50% |

Reaching 2.7 × 10^18 would take roughly 85 years at one billion UUIDs per second. Real duplicates come from a broken random source or a copied value, not from chance.

## Code snippets

```javascript
crypto.randomUUID(); // v4; for v7 use a library such as "uuid"
```

```python
import uuid
str(uuid.uuid4())   # v4
str(uuid.uuid7())   # v7, Python 3.14 and later
```

```java
java.util.UUID.randomUUID().toString(); // v4; use a library for v7
```

```csharp
Guid.NewGuid();         // v4
Guid.CreateVersion7();  // .NET 9 and later
```

```go
id := uuid.New()          // github.com/google/uuid, v4
id7, err := uuid.NewV7()  // v7
```

```sql
-- PostgreSQL
SELECT gen_random_uuid();   -- v4 (built in since 13)
SELECT uuidv7();            -- v7 (PostgreSQL 18 and later)

-- MySQL: UUID() returns a version 1 value
SELECT UUID_TO_BIN(UUID(), 1);        -- BINARY(16), timestamp fields swapped
SELECT BIN_TO_UUID(id, 1) FROM users; -- read back with the same swap flag

-- SQL Server
SELECT NEWID();
```

## Tips and common mistakes

- **Store UUIDs in a native `uuid` column or `BINARY(16)`,** not `CHAR(36)`. Text keys are more than twice as large and slower to compare.
- **Compare case-insensitively,** but keep one consistent case if you sort v7 values as text.
- **Do not treat a UUID as a secret.** RFC 9562 advises against using UUIDs as security capabilities. For tokens and keys use the [password generator](/tools/password-generator) or a dedicated random token.
- **Watch GUID byte order.** .NET's `Guid.ToByteArray()` stores the first three groups little-endian, and SQL Server orders `uniqueidentifier` values by their last six bytes first, so v7 does not sort by time there. The Decode tab shows the .NET byte order.
- **Use v5 for stable IDs,** such as hashing a URL with a fixed namespace so re-imports are idempotent. Never use it to hide a value: anyone who can guess the name can recompute the UUID.
- **Reshape lists as needed.** [Remove line breaks](/tools/remove-line-breaks) turns a column of IDs into one line, and the [JSON formatter](/tools/json-formatter) checks a JSON array before you paste it into a fixture.

## Privacy and limitations

IDs are generated and decoded entirely in your browser. Nothing is sent to a server, and generated IDs are never saved. Only your option choices are remembered in this browser, and the names and decode box last for the current tab only.

- A batch holds at most 10,000 IDs or names.
- v7 and ULID ordering is guaranteed within one batch. Across machines it depends on their clocks, and this tool trusts your device's clock for every timestamp.
- v5 uses the browser's SubtleCrypto, available on HTTPS pages and localhost. If it is missing, the tool says so.
- The validator checks structure, not whether an ID exists anywhere, and it cannot tell a genuine v4 from any other 128 random-looking bits.

This tool is independent and not affiliated with Microsoft, PostgreSQL, MySQL, or the ULID and NanoID projects; product names appear only to describe compatibility.
