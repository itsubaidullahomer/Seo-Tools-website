import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_OPTIONS,
  articleRegExp,
  compareCodePoints,
  firstNumber,
  normalizeOptions,
  parseName,
  shuffled,
  sortList,
  sortText,
  splitItems,
  suggestSeparator,
  type Options,
} from "../src/tools/alphabetical-order/logic";

const opts = (p: Partial<Options> = {}): Options => ({ ...DEFAULT_OPTIONS, ...p });
const sorted = (lines: string[], p: Partial<Options> = {}) => sortList(lines.join("\n"), opts(p)).items;

const EIGHT = ["Zebra", "apple", "Élan", "banana", "item10", "Cherry", "item2", "item1"];

test("article: one eight-line list sorted three ways", () => {
  assert.deepEqual(sorted(EIGHT, { caseMode: "code" }), ["Cherry", "Zebra", "apple", "banana", "item1", "item10", "item2", "Élan"]);
  assert.deepEqual(sorted(EIGHT, { natural: false }), ["apple", "banana", "Cherry", "Élan", "item1", "item10", "item2", "Zebra"]);
  assert.deepEqual(sorted(EIGHT), ["apple", "banana", "Cherry", "Élan", "item1", "item2", "item10", "Zebra"]);
});

test("article: character classes – punctuation, symbols, digits, Latin, other scripts", () => {
  const out = sorted(["中", "é", "10", "$", "#h", "α", "b", "_u", "9", "A", "я", "(p", "1", "-d"]);
  const cls = (s: string) => (/^[_\-(#]/.test(s) ? 0 : s === "$" ? 1 : /^\d/.test(s) ? 2 : /^[A-Za-zé]/.test(s) ? 3 : 4);
  const classes = out.map(cls);
  assert.deepEqual(classes, [...classes].sort((a, b) => a - b));
  assert.deepEqual(out.filter((s) => /^\d/.test(s)), ["1", "9", "10"]);
});

test("leading spaces never decide the order (sort text is trimmed even with Trim off)", () => {
  assert.deepEqual(sortList(" zed\napple", opts({ trim: false })).items, ["apple", " zed"]);
});

test("article: natural order treats 1.10 like a version; Numbers mode compares values", () => {
  assert.deepEqual(sorted(["1.10", "1.5", "1.9"]), ["1.5", "1.9", "1.10"]);
  assert.deepEqual(sorted(["1.10", "1.5", "1.9"], { sortBy: "number" }), ["1.10", "1.5", "1.9"]);
});

test("article: language rules table", () => {
  assert.deepEqual(sorted(["zebra", "a", "ö", "ä", "å"], { locale: "sv" }), ["a", "zebra", "å", "ä", "ö"]);
  assert.deepEqual(sorted(["b", "ä", "a"], { locale: "de" }), ["a", "ä", "b"]);
  assert.deepEqual(sorted(["o", "ñu", "nz", "nube", "n"], { locale: "es" }), ["n", "nube", "nz", "ñu", "o"]);
  assert.deepEqual(sorted(["å", "ø", "æ", "z"], { locale: "da" }), ["z", "æ", "ø", "å"]);
  assert.deepEqual(sorted(["aa", "å", "z", "b"], { locale: "da" }), ["b", "z", "å", "aa"]);
  assert.deepEqual(sorted(["å", "ø", "æ", "z"], { locale: "nb" }), ["z", "æ", "ø", "å"]);
  assert.deepEqual(sorted(["ż", "z", "ó", "o", "ł", "l"], { locale: "pl" }), ["l", "ł", "o", "ó", "z", "ż"]);
  assert.deepEqual(sorted(["İ", "i", "I", "ı", "d", "ç", "c"], { locale: "tr" }), ["c", "ç", "d", "ı", "I", "i", "İ"]);
});

test("article: word by word versus letter by letter", () => {
  const places = ["New York", "Newark", "New Haven", "Newport"];
  assert.deepEqual(sorted(places), ["New Haven", "New York", "Newark", "Newport"]);
  assert.deepEqual(sorted(places, { letterByLetter: true }), ["Newark", "New Haven", "Newport", "New York"]);
  assert.deepEqual(sorted(["Smithe", "Smith-Jones"]), ["Smith-Jones", "Smithe"]);
  assert.deepEqual(sorted(["Smith-Jones", "Smithe"], { letterByLetter: true }), ["Smithe", "Smith-Jones"]);
});

test("article: leading articles counted and ignored", () => {
  const titles = ["The Hobbit", "Dune", "A Tale of Two Cities", "The Great Gatsby", "An Inspector Calls", "Animal Farm"];
  assert.deepEqual(sorted(titles), ["A Tale of Two Cities", "An Inspector Calls", "Animal Farm", "Dune", "The Great Gatsby", "The Hobbit"]);
  assert.deepEqual(sorted(titles, { ignoreArticles: true }), ["Animal Farm", "Dune", "The Great Gatsby", "The Hobbit", "An Inspector Calls", "A Tale of Two Cities"]);
});

test("article: custom articles, apostrophe contractions, and an article alone is kept", () => {
  const re = articleRegExp("le, la, les, der, die, das, l'");
  const o = opts({ ignoreArticles: true });
  assert.equal(sortText("L'Étranger", o, re), "Étranger");
  assert.equal(sortText("La Peste", o, re), "Peste");
  assert.equal(sortText("Le", o, re), "Le");
  assert.equal(sortText("The", opts({ ignoreArticles: true }), articleRegExp("the, a, an")), "The");
});

test("article: File Mc as Mac", () => {
  const names = ["McCoy", "MacArthur", "Macdonald", "Maclean"];
  assert.deepEqual(sorted(names), ["MacArthur", "Macdonald", "Maclean", "McCoy"]);
  assert.deepEqual(sorted(names, { macMc: true }), ["MacArthur", "McCoy", "Macdonald", "Maclean"]);
});

test("article: sorting by last name and the 'How each name was read' table", () => {
  const people = ["Ada Lovelace", "Grace Hopper", "Dr. Martin Luther King Jr.", "Ludwig van Beethoven", "Alan Turing", "Maya Angelou", "Curie, Marie"];
  const r = sortList(people.join("\n"), opts({ sortBy: "last" }));
  assert.deepEqual(r.items, ["Maya Angelou", "Curie, Marie", "Grace Hopper", "Dr. Martin Luther King Jr.", "Ada Lovelace", "Alan Turing", "Ludwig van Beethoven"]);
  assert.deepEqual(
    r.keyRows.map((k) => k.key),
    ["Angelou, Maya", "Hopper, Grace", "King, Martin Luther", "Lovelace, Ada", "Turing, Alan", "van Beethoven, Ludwig"],
  );
  // Prefix option off: Beethoven files under B.
  assert.equal(sorted(people, { sortBy: "last", keepPrefixes: false })[1], "Ludwig van Beethoven");
  assert.deepEqual(parseName("Beethoven, Ludwig van"), { family: "Beethoven", given: "Ludwig van" });
  assert.deepEqual(parseName("Wang Fang"), { family: "Fang", given: "Wang" });
  assert.deepEqual(parseName("Wang, Fang"), { family: "Wang", given: "Fang" });
  assert.deepEqual(parseName("John Smith, PhD"), { family: "Smith", given: "John" });
});

test("article: nothing precedes something for surnames", () => {
  const list = ["Smithson, Bob", "Smithe, Al", "Smith-Jones, Kim", "Smith, Zoe", "Smith, Anna"];
  assert.deepEqual(sorted(list, { sortBy: "last" }), ["Smith, Anna", "Smith, Zoe", "Smith-Jones, Kim", "Smithe, Al", "Smithson, Bob"]);
});

test("capitals: apple before Apple by default; ignore mode keeps typed order; upperFirst flips", () => {
  assert.deepEqual(sorted(["Apple", "apple"]), ["apple", "Apple"]);
  assert.deepEqual(sorted(["Apple", "apple"], { caseMode: "ignore" }), ["Apple", "apple"]);
  assert.deepEqual(sorted(["apple", "Apple"], { caseMode: "upperFirst" }), ["Apple", "apple"]);
  assert.deepEqual(sorted(["apple", "Banana"]), ["apple", "Banana"]);
});

test("Z to A reverses the alphabetical order", () => {
  assert.deepEqual(sorted(["b", "c", "a"], { direction: "desc" }), ["c", "b", "a"]);
});

test("FAQ: Numbers mode – thousands commas, negatives, no-number lines last", () => {
  const lines = ["Invoice 1,250.50", "Invoice 98", "Refund -15", "Invoice 7.25", "Notes (no number here)", "Invoice 1,000"];
  const r = sortList(lines.join("\n"), opts({ sortBy: "number" }));
  assert.deepEqual(r.items, ["Refund -15", "Invoice 7.25", "Invoice 98", "Invoice 1,000", "Invoice 1,250.50", "Notes (no number here)"]);
  assert.equal(r.withoutNumber, 1);
  assert.equal(firstNumber("Room-12"), 12);
  assert.equal(firstNumber("$-5"), -5);
  assert.equal(firstNumber("1,250.50"), 1250.5);
});

test("length mode counts visible characters", () => {
  assert.deepEqual(sorted(["ccc", "a", "bb"], { sortBy: "length" }), ["a", "bb", "ccc"]);
  assert.deepEqual(sorted(["ccc", "a", "bb"], { sortBy: "length", direction: "desc" }), ["ccc", "bb", "a"]);
});

test("remove duplicates ignores capitals and reports counts", () => {
  const r = sortList("b\napple\nApple\n\nb", opts({ removeDuplicates: true }));
  assert.deepEqual(r.items, ["apple", "b"]);
  assert.equal(r.itemsIn, 5);
  assert.equal(r.emptyRemoved, 1);
  assert.equal(r.duplicatesRemoved, 2);
});

test("invisible characters and bullets are ignored in sort text", () => {
  assert.equal(sortText("​zebra", opts(), null), "zebra");
  assert.equal(sortText("1. The Hobbit", opts({ ignoreBullets: true, ignoreArticles: true }), articleRegExp("the, a, an")), "Hobbit");
  assert.equal(sortText("\"Quoted", opts({ ignorePunctuation: true }), null), "Quoted");
});

test("separators: comma lists keep their style, output can change to new lines", () => {
  assert.equal(sortList("b, a, c", opts({ inputSep: "comma" })).output, "a, b, c");
  assert.equal(sortList("b,a,c", opts({ inputSep: "comma", outputSep: "newline" })).output, "a\nb\nc");
  assert.deepEqual(splitItems("a\nb\n", "newline"), ["a", "b"]);
  assert.deepEqual(splitItems("a|b", "custom", "|"), ["a", "b"]);
  assert.deepEqual(splitItems("a\tb", "custom", "\\t"), ["a", "b"]);
  assert.equal(suggestSeparator("a, b, c", "newline"), "comma");
  assert.equal(suggestSeparator("Curie, Marie", "newline"), null);
});

test("Unicode order is code-point (UTF-8 byte) order", () => {
  assert.ok(compareCodePoints("Z", "a") < 0);
  assert.ok(compareCodePoints("～", "😀") < 0); // U+FF5E before U+1F600
});

test("random shuffle is a deterministic permutation for a seed; reverse flips input", () => {
  const list = Array.from({ length: 50 }, (_, i) => i);
  const a = shuffled(list, [9, 8, 7, 6]);
  assert.deepEqual(a, shuffled(list, [9, 8, 7, 6]));
  assert.deepEqual([...a].sort((x, y) => x - y), list);
  assert.notDeepEqual(a, list);
  assert.deepEqual(sorted(["x", "a", "m"], { sortBy: "reverse" }), ["m", "a", "x"]);
});

test("stored options are repaired", () => {
  assert.deepEqual(normalizeOptions({ sortBy: "bogus", natural: "yes", locale: "xx" }), DEFAULT_OPTIONS);
});
