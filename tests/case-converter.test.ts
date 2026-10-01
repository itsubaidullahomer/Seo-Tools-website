import { test } from "node:test";
import assert from "node:assert/strict";
import { convertCase, getStats, splitIdentifierWords, type ModeId, type TitleStyle } from "../src/tools/case-converter/logic";

const title = (s: string, titleStyle: TitleStyle = "ap", keepAcronyms = true) => convertCase(s, "title", { titleStyle, keepAcronyms });
const sentence = (s: string, keepAcronyms = true) => convertCase(s, "sentence", { titleStyle: "ap", keepAcronyms });
const code = (s: string, mode: ModeId) => convertCase(s, mode, { titleStyle: "ap", keepAcronyms: true });

test("article: worked title case example in every style", () => {
  const input = "a beginner's guide to working with the API through node.js";
  assert.equal(title(input, "ap"), "A Beginner's Guide to Working With the API Through Node.js");
  assert.equal(title(input, "apa"), "A Beginner's Guide to Working With the API Through Node.js");
  assert.equal(title(input, "chicago"), "A Beginner's Guide to Working with the API Through Node.js");
  assert.equal(title(input, "mla"), "A Beginner's Guide to Working with the API through Node.js");
  assert.equal(title(input, "all"), "A Beginner's Guide To Working With The API Through Node.js");
});

test("article: style table – up/off, four-letter and long prepositions, as/if, Yet/So", () => {
  assert.equal(title("turn off the lights", "ap"), "Turn Off the Lights");
  assert.equal(title("turn off the lights", "apa"), "Turn off the Lights");
  assert.equal(title("look up the word", "chicago"), "Look Up the Word");
  assert.equal(title("look up the word", "mla"), "Look Up the Word");
  assert.equal(title("go into the wild", "ap"), "Go Into the Wild");
  assert.equal(title("go into the wild", "apa"), "Go Into the Wild");
  assert.equal(title("go into the wild", "chicago"), "Go into the Wild");
  assert.equal(title("go into the wild", "mla"), "Go into the Wild");
  assert.equal(title("walk through the door", "chicago"), "Walk Through the Door");
  assert.equal(title("walk through the door", "mla"), "Walk through the Door");
  assert.equal(title("fight as if it matters", "ap"), "Fight as if It Matters");
  assert.equal(title("fight as if it matters", "chicago"), "Fight as If It Matters");
  assert.equal(title("fight as if it matters", "mla"), "Fight as If It Matters");
  assert.equal(title("rain or shine yet so", "chicago"), "Rain or Shine Yet So");
  assert.equal(title("rain yet shine", "ap"), "Rain yet Shine");
  assert.equal(title("rain yet shine", "mla"), "Rain yet Shine");
  assert.equal(title("self-esteem matters"), "Self-Esteem Matters");
});

test("article: short verbs, first and last words, Capitalized Case is not title case", () => {
  assert.equal(title("is it the end"), "Is It the End");
  assert.equal(title("to be or not to be"), "To Be or Not to Be");
  assert.equal(title("what are you waiting for?"), "What Are You Waiting For?");
  assert.equal(title("the art of the deal"), "The Art of the Deal");
  assert.equal(convertCase("the art of the deal", "capitalized", { titleStyle: "ap", keepAcronyms: true }), "The Art Of The Deal");
});

test("article: subtitles and abbreviations in titles", () => {
  assert.equal(title("batman vs. the joker"), "Batman vs. the Joker");
  assert.equal(title("mr. and mrs. smith"), "Mr. and Mrs. Smith");
  assert.equal(title("dr. smith goes to washington. the sequel"), "Dr. Smith Goes to Washington. The Sequel");
  assert.equal(title("what is love: a guide"), "What Is Love: A Guide");
  assert.equal(title("war and peace - the sequel"), "War and Peace - The Sequel");
});

test("article: words that only look like prepositions", () => {
  assert.equal(title("the past is never dead"), "The Past Is Never Dead");
  assert.equal(title("the in crowd"), "The In Crowd");
  assert.equal(title("some like it hot"), "Some Like It Hot");
  assert.equal(title("cities like paris", "chicago"), "Cities like Paris");
  assert.equal(title("cities like paris", "mla"), "Cities like Paris");
});

test("article: apostrophes, hyphens, particles and trailing commas", () => {
  assert.equal(title("don't stop"), "Don't Stop");
  assert.equal(title("state-of-the-art"), "State-of-the-Art");
  assert.equal(title("mother-in-law"), "Mother-in-Law");
  assert.equal(title("sold out"), "Sold Out");
  assert.equal(title("turn down the lights"), "Turn Down the Lights");
  assert.equal(title("the man in, the man out"), "The Man In, the Man Out");
});

test("article: code cases split at humps and normalise acronyms", () => {
  assert.deepEqual(splitIdentifierWords("getHTTPResponse code"), ["get", "HTTP", "Response", "code"]);
  assert.equal(code("getHTTPResponse code", "camel"), "getHttpResponseCode");
  assert.equal(code("getHTTPResponse code", "snake"), "get_http_response_code");
  assert.equal(code("getHTTPResponse code", "constant"), "GET_HTTP_RESPONSE_CODE");
  assert.equal(code("userIDs", "snake"), "user_ids");
  assert.equal(code("URLs", "snake"), "urls");
  assert.equal(code("don't stop", "camel"), "dontStop");
  assert.equal(code("html5 parser", "camel"), "html5Parser");
  assert.equal(code("first_name", "camel"), "firstName");
  assert.equal(code("user name", "pascal"), "UserName");
  assert.equal(code("user name", "kebab"), "user-name");
  assert.equal(code("user name", "dot"), "user.name");
  assert.equal(code("first name\nlast name\n\nemail", "camel"), "firstName\nlastName\n\nemail");
});

test("article/FAQ: sentence boundaries, abbreviations, initials, decimals, etc.", () => {
  assert.equal(
    sentence("then i'm happy. dr. smith said e.g. this. it costs 3.5 today... and more. we use etc. next"),
    "Then I'm happy. Dr. smith said e.g. this. It costs 3.5 today... and more. We use etc. Next",
  );
  // No new sentence starts after a single initial, and initials keep their capitals (the surname is a proper noun the tool cannot detect).
  assert.equal(sentence("by J. K. Rowling"), "By J. K. rowling");
  assert.equal(sentence("by J. K. Rowling", false), "By j. k. rowling");
  assert.equal(sentence("we met at 5 p.m. then left. Ph.D. holders"), "We met at 5 p.m. then left. Ph.D. holders");
  assert.equal(sentence('he said "stop." then left'), 'He said "stop." Then left');
  assert.equal(sentence("1. first item\n2) second\na. third"), "1. First item\n2) Second\na. Third");
  assert.equal(sentence("i'll go, i've been, i'd say, i am"), "I'll go, I've been, I'd say, I am");
});

test("FAQ: acronyms and mixed-case words survive; shouting is converted", () => {
  assert.equal(sentence("NASA and HTML5 love the iPhone, JavaScript and McDonald's"), "NASA and HTML5 love the iPhone, JavaScript and McDonald's");
  assert.equal(sentence("NASA and HTML5 love the iPhone", false), "Nasa and html5 love the iphone");
  assert.equal(sentence("HELLO WORLD FROM NASA"), "Hello world from nasa");
  assert.equal(sentence("NASA"), "NASA");
});

test("simple cases, Unicode upper-casing and preserved line breaks", () => {
  const o = { titleStyle: "ap" as const, keepAcronyms: true };
  assert.equal(convertCase("straße", "upper", o), "STRASSE");
  assert.equal(convertCase("ONE\n\nTWO three", "lower", o), "one\n\ntwo three");
  assert.equal(convertCase("Hello World", "alternating", o), "hElLo WoRlD");
  assert.equal(convertCase("Hello World", "inverse", o), "hELLO wORLD");
  assert.equal(sentence("line one\n\n  line two"), "Line one\n\n  Line two");
});

test("counters", () => {
  assert.deepEqual(getStats("Hello world\n\nSecond para"), { characters: 24, charactersNoSpaces: 20, words: 4, lines: 3, paragraphs: 2 });
  assert.deepEqual(getStats(""), { characters: 0, charactersNoSpaces: 0, words: 0, lines: 0, paragraphs: 0 });
});
