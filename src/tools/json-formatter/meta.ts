import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "json-formatter",
  name: "JSON Formatter & Validator",
  title: "JSON Formatter & Validator – Beautify, Minify & Fix JSON",
  description:
    "JSON formatter and validator: beautify or minify JSON, get errors with exact line and column, and auto-fix trailing commas, quotes and comments. Free, private.",
  shortDescription: "Format, validate and minify JSON with exact error lines, one-click fixes for common mistakes and lossless output.",
  category: "developer",
  keywords: [
    "json formatter",
    "json validator",
    "json beautifier",
    "format json online",
    "json pretty print",
    "json minify",
    "validate json",
    "json syntax checker",
    "json viewer",
    "json parser online",
  ],
  aliases: ["json lint", "jsonlint", "pretty json", "json checker", "json beautify", "json escape", "json unescape"],
  icon: "braces",
  featured: true,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["remove-line-breaks", "case-converter", "character-counter", "password-generator"],
  faq: [
    {
      question: "How do I find the error in my JSON?",
      answer:
        "Paste the JSON into the formatter. If it is invalid, the red panel shows the exact line and column, a plain-English description such as “Trailing comma after the last property”, and the surrounding lines with the problem marked by a caret. Click “Go to error” to put the cursor on that spot in the input. Only the first error is reported, because everything after it depends on how that mistake is read.",
    },
    {
      question: "Why is a trailing comma invalid in JSON?",
      answer:
        "The JSON grammar (RFC 8259) defines arrays and objects as values separated by commas, with nothing allowed between the last value and the closing bracket. JavaScript and Python accept a trailing comma, which is why it slips into hand-edited files, but strict JSON parsers reject it – Chrome reports “Expected double-quoted property name”. Delete the comma, or use “Fix common issues” to remove every trailing comma at once.",
    },
    {
      question: "Can JSON contain comments?",
      answer:
        "No. Standard JSON has no comment syntax, so // and /* */ make a document invalid. Some tools accept relaxed variants: VS Code reads settings.json as “JSON with Comments” (JSONC), and JSON5 allows comments, single quotes and trailing commas. If a commented file must be read by a strict parser, “Fix common issues” strips the comments. To keep a note inside real JSON, add an ordinary field such as \"_comment\".",
    },
    {
      question: "What does “Fix common issues” change, and is it safe?",
      answer:
        "It only repairs mistakes with one sensible reading: it removes comments and trailing or doubled commas, converts single and curly quotes to double quotes, quotes bare property names, turns Python’s True, False and None into JSON literals, inserts commas missing between values and escapes raw line breaks inside strings. NaN and Infinity become null, as JSON.stringify does. Every change is listed with its line number, and “Undo fix” restores your text.",
    },
    {
      question: "Does formatting change my data?",
      answer:
        "No – only the whitespace between tokens changes. Unlike tools that run JSON.parse and JSON.stringify, this formatter keeps every number and string exactly as written, so 12345678901234567890 is not rounded, 1.50 stays 1.50 and \\u00e9 keeps its escape. Key order is preserved unless you switch on “Sort keys A–Z”. Duplicate keys are kept and flagged, because most parsers silently keep only the last one.",
    },
    {
      question: "Should I indent JSON with 2 spaces, 4 spaces or tabs?",
      answer:
        "Match the project you are working in. Two spaces is what JSON.stringify(value, null, 2), Prettier and most JavaScript projects use; Python’s json.tool defaults to four; tabs give the smallest pretty-printed file. On a real package-lock.json listing 649 packages we measured 263 KB minified, 311 KB with tabs, 341 KB with two spaces and 402 KB with four spaces.",
    },
    {
      question: "When should I minify JSON?",
      answer:
        "Minify when only a machine will read the data: API responses, JSON embedded in HTML, values stored in databases or localStorage, and files shipped to browsers. Minifying removes every space and line break outside strings. If your server already compresses responses with gzip, the saving is small – under 5 percent in our package-lock.json test – so keep pretty-printed JSON in version control where readable diffs matter more.",
    },
    {
      question: "Is my JSON uploaded, and how large a file can I format?",
      answer:
        "Nothing is uploaded. Parsing, validation and formatting run in your browser, so API keys, customer records and internal configuration never leave your device. You can open files up to 25 MB, and documents of a few megabytes format in a second or two on a typical laptop. For bigger files or automated pipelines, a command-line tool such as jq or python -m json.tool is the better choice.",
    },
  ],
};
