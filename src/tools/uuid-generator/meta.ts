import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "uuid-generator",
  name: "UUID / GUID Generator (v4, v7, ULID)",
  title: "UUID Generator – v4, v7, v1, v5, ULID, GUID & Bulk",
  description:
    "Free UUID generator for v4, v7, v1, v5, ULID and NanoID. Make up to 10,000 GUIDs at once, format them for SQL or JSON, and decode any UUID's embedded timestamp.",
  shortDescription: "Generate UUID v4, v7, v1, v5, ULID and NanoID in bulk, format them for SQL or JSON, and decode or validate any UUID.",
  category: "developer",
  keywords: [
    "uuid generator",
    "guid generator",
    "uuid v4 generator",
    "uuid v7 generator",
    "bulk uuid generator",
    "ulid generator",
    "uuid validator",
    "random uuid",
    "uuid v5 generator",
    "generate uuid online",
  ],
  aliases: ["guid", "uuid decoder", "nanoid generator", "uuid v1 generator", "uuid without dashes", "uuid to ulid", "generate 100 uuids"],
  icon: "fingerprint",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["password-generator", "json-formatter", "slug-generator", "remove-line-breaks", "remove-duplicate-lines", "case-converter"],
  faq: [
    {
      question: "What is a UUID, and is a GUID the same thing?",
      answer:
        "A UUID (universally unique identifier) is a 128-bit value written as 32 hexadecimal digits in an 8-4-4-4-12 pattern, such as 550e8400-e29b-41d4-a716-446655440000. GUID (globally unique identifier) is Microsoft's name for the same thing. The format is identical, although Microsoft tools such as SQL Server Management Studio and the Windows registry often show GUIDs in uppercase or in braces, and .NET's Guid.ToByteArray() and SQL Server storage put the first three groups in little-endian byte order. The current standard is RFC 9562, which replaced RFC 4122 in 2024.",
    },
    {
      question: "What is the difference between UUID v4 and UUID v7?",
      answer:
        "Both are 128 bits. Version 4 is 122 random bits, so values arrive in no useful order. Version 7 starts with a 48-bit Unix millisecond timestamp and fills the rest with 74 random bits, so newer IDs sort after older ones. Choose v4 when the ID should reveal nothing, and v7 when IDs become database keys, where ordered inserts are faster. Remember that a v7 value exposes its creation time to anyone who reads it.",
    },
    {
      question: "Are UUIDs really unique? Can two of them collide?",
      answer:
        "Collisions are possible in theory and irrelevant in practice. A v4 UUID has 122 random bits, so you would need about 2.7 quintillion (2.7 × 10^18) of them for a 50% chance of one collision, and about 103 trillion for a one-in-a-billion chance. That assumes a strong random source, which is what this page uses. Real-world duplicates almost always come from weak randomness or copied values, not bad luck.",
    },
    {
      question: "Should I use a UUID as a database primary key?",
      answer:
        "Often yes, with one caveat. UUIDs let clients create IDs without asking the database, and they never clash across servers or merged datasets. The cost is size (16 bytes against 8 for a bigint) and, for random v4 keys, scattered index inserts that split pages and waste cache. UUID v7 keeps the benefits and inserts in time order, so it is usually the better key. Store it in a native uuid or BINARY(16) column, not as text.",
    },
    {
      question: "Are the UUIDs made here safe to use, and do you store them?",
      answer:
        "They are generated in your browser with its cryptographically secure random number generator: crypto.randomUUID for v4 and crypto.getRandomValues for the other types. Nothing is sent to a server, and generated IDs are never saved; only your option choices are remembered in this browser. Version 1 values made here use a random node ID instead of your MAC address, so they reveal nothing about your hardware.",
    },
    {
      question: "What is a ULID, and how is it different from a UUID?",
      answer:
        "A ULID is a 128-bit identifier written as 26 Crockford Base32 characters: a 48-bit millisecond timestamp followed by 80 random bits, for example 01ARZ3NDEKTSV4RRFFQ69G5FAV. Like UUID v7 it sorts by creation time, but it is shorter, case-insensitive and URL-safe. It is not a UUID, yet it holds the same number of bits, so it converts to a UUID and back without loss. The Decode & validate tab shows both forms.",
    },
    {
      question: "How do I generate a UUID in JavaScript, Python, Java, C# or SQL?",
      answer:
        "JavaScript: crypto.randomUUID(). Python: str(uuid.uuid4()), or uuid.uuid7() from Python 3.14. Java: UUID.randomUUID(). C#: Guid.NewGuid(), or Guid.CreateVersion7() in .NET 9 and later. PostgreSQL: gen_random_uuid(), plus uuidv7() from version 18. MySQL: UUID() returns a version 1 value, best stored with UUID_TO_BIN(). SQL Server: NEWID(). The article on this page has copy-ready snippets for each.",
    },
    {
      question: "Why does UUID v5 give the same result every time?",
      answer:
        "Versions 3 and 5 are hashes, not random values. UUID v5 runs SHA-1 over a namespace UUID plus a name and keeps 128 bits, so the same namespace and name always produce the same UUID on any machine. That is useful for stable IDs derived from a URL, email address or filename, and for de-duplicating imports. Prefer v5 over v3, which uses MD5. Neither hides secrets, because anyone who can guess the name can recompute the UUID.",
    },
  ],
};
