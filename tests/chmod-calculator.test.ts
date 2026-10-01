import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeMode,
  applyChmodMode,
  applySymbolic,
  autoDirMode,
  autoFileMode,
  classBits,
  describeClass,
  expressionUsesUmask,
  formatOctal,
  lsString,
  newDirMode,
  newFileMode,
  parseOctal,
  parseSymbolic,
  parseUmask,
  PRESETS,
  quotePath,
  recursiveCommands,
  singleCommands,
  toSymbolic,
  toSymbolicClauses,
  umaskFor,
  withClassBit,
  withFlag,
  SETGID,
  SETUID,
  STICKY,
} from "../src/tools/chmod-calculator/logic";

const sym = (start: number, expr: string, umask = 0o022, isDir = false) => {
  const r = applySymbolic(start, isDir, umask, expr);
  assert.ok(r.ok, `${expr} should parse`);
  return r.value;
};
const num = (start: number, raw: string, isDir: boolean) => {
  const r = applyChmodMode(start, isDir, 0o022, raw);
  assert.ok(r.ok, `${raw} should parse`);
  return r.value;
};

test("read 4, write 2, execute 1 per class (worked example rwxr-x--- = 750)", () => {
  const p = parseSymbolic("rwxr-x---");
  assert.ok(p.ok);
  assert.equal(formatOctal(p.value.mode), "750");
  assert.equal(classBits(0o750, "owner"), 7);
  assert.equal(classBits(0o750, "group"), 5);
  assert.equal(classBits(0o750, "others"), 0);
  assert.equal(toSymbolic(0o640), "rw-r-----");
});

test("digit / binary / symbolic table", () => {
  const table = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];
  table.forEach((s, d) => {
    assert.equal(toSymbolic(d), "------" + s);
    assert.equal(toSymbolic(d << 6).slice(0, 3), s);
  });
});

test("FAQ: rwxr-xr-x is 755 and rw-r--r-- is 644", () => {
  const a = parseSymbolic("rwxr-xr-x");
  const b = parseSymbolic("rw-r--r--");
  assert.ok(a.ok && b.ok);
  assert.equal(a.value.mode, 0o755);
  assert.equal(b.value.mode, 0o644);
});

test("special bits: 4755 is rwsr-xr-x, 1777 is rwxrwxrwt, capitals without execute", () => {
  assert.equal(toSymbolic(0o4755), "rwsr-xr-x");
  assert.equal(toSymbolic(0o1777), "rwxrwxrwt");
  assert.equal(toSymbolic(0o2775), "rwxrwsr-x");
  assert.equal(toSymbolic(0o4644), "rwSr--r--");
  assert.equal(toSymbolic(0o1776), "rwxrwxrwT");
  assert.equal(formatOctal(0o4755), "4755");
  assert.equal(formatOctal(0o644), "644");
  assert.equal(formatOctal(0o7), "007");
  assert.equal(SETUID | SETGID | STICKY, 0o7000);
  const parsed = parseSymbolic("rwsr-xr-x");
  assert.ok(parsed.ok);
  assert.equal(parsed.value.mode, 0o4755);
  const t = parseSymbolic("drwxrwxrwt");
  assert.ok(t.ok);
  assert.equal(t.value.mode, 0o1777);
  assert.equal(t.value.kind, "dir");
});

test("common-modes table: octal and symbolic agree", () => {
  const rows: [number, string][] = [
    [0o777, "rwxrwxrwx"],
    [0o775, "rwxrwxr-x"],
    [0o755, "rwxr-xr-x"],
    [0o750, "rwxr-x---"],
    [0o700, "rwx------"],
    [0o644, "rw-r--r--"],
    [0o640, "rw-r-----"],
    [0o600, "rw-------"],
    [0o400, "r--------"],
  ];
  for (const [mode, s] of rows) {
    assert.equal(toSymbolic(mode), s);
    const p = parseSymbolic(s);
    assert.ok(p.ok);
    assert.equal(p.value.mode, mode);
  }
});

test("octal input: one to four digits, leading zeros allowed, 8 and 9 rejected", () => {
  assert.deepEqual(parseOctal("644"), { ok: true, value: 0o644 });
  assert.deepEqual(parseOctal("4755"), { ok: true, value: 0o4755 });
  assert.deepEqual(parseOctal("0644"), { ok: true, value: 0o644 });
  assert.deepEqual(parseOctal("7"), { ok: true, value: 0o7 });
  assert.equal(parseOctal("12345").ok, false);
  assert.equal(parseOctal("789").ok, false);
  assert.equal(parseOctal("").ok, false);
});

test("symbolic input: nine chars, or ten with - or d", () => {
  assert.equal(parseSymbolic("rwxr-xr-").ok, false);
  assert.equal(parseSymbolic("lrwxrwxrwx").ok, false);
  assert.equal(parseSymbolic("u+x").ok, false);
  const f = parseSymbolic("-rw-r--r--");
  assert.ok(f.ok);
  assert.equal(f.value.kind, "file");
  assert.equal(f.value.mode, 0o644);
});

test("checkbox helpers", () => {
  assert.equal(withClassBit(0o644, "owner", 1, true), 0o744);
  assert.equal(withClassBit(0o755, "others", 1, false), 0o754);
  assert.equal(withFlag(0o755, SETUID, true), 0o4755);
  assert.equal(withFlag(0o4755, SETUID, false), 0o755);
});

test("article: chmod +x honours the umask, a+x does not", () => {
  assert.equal(sym(0o644, "+x", 0o022), 0o755);
  assert.equal(sym(0o644, "+x", 0o077), 0o744);
  assert.equal(sym(0o644, "a+x", 0o077), 0o755);
  assert.ok(expressionUsesUmask("+x"));
  assert.ok(!expressionUsesUmask("a+x"));
  assert.ok(!expressionUsesUmask("755"));
});

test("article examples: u+x, g-w,o-rwx, u=rw,go=r", () => {
  assert.equal(sym(0o644, "u+x"), 0o744);
  assert.equal(sym(0o664, "g-w,o-rwx"), 0o640);
  assert.equal(sym(0o777, "u=rw,go=r"), 0o644);
  assert.equal(toSymbolic(sym(0o000, "u=rw,go=r")), "rw-r--r--");
  // Laravel: ug+rwX on a 644 file and a 755 dir
  assert.equal(sym(0o644, "ug+rwX"), 0o664);
  assert.equal(sym(0o755, "ug+rwX", 0o022, true), 0o775);
  // copy from another class
  assert.equal(sym(0o750, "o=g"), 0o755);
});

test("capital X: directories and already-executable files only", () => {
  const expr = "u=rwX,g=rX,o=rX";
  assert.equal(sym(0o600, expr), 0o644);
  assert.equal(sym(0o700, expr), 0o755);
  assert.equal(sym(0o744, expr), 0o755);
  assert.equal(sym(0o600, expr, 0o022, true), 0o755);
});

test("GNU quirk: numeric modes of up to four digits keep a directory's setgid", () => {
  assert.equal(num(0o2775, "755", true), 0o2755);
  assert.equal(num(0o2775, "0755", true), 0o2755);
  assert.equal(num(0o2775, "00755", true), 0o755);
  assert.equal(num(0o2775, "755", false), 0o755);
  assert.equal(sym(0o2775, "g-s", 0o022, true), 0o775);
  // symbolic = on a directory also keeps setgid unless named
  assert.equal(sym(0o2775, "u=rwx,g=rx,o=rx", 0o022, true), 0o2755);
});

test("umask table and bit-mask (not subtraction) example", () => {
  const rows: [number, number, number][] = [
    [0o022, 0o644, 0o755],
    [0o002, 0o664, 0o775],
    [0o027, 0o640, 0o750],
    [0o077, 0o600, 0o700],
  ];
  for (const [u, f, d] of rows) {
    assert.equal(newFileMode(u), f);
    assert.equal(newDirMode(u), d);
  }
  assert.equal(formatOctal(newFileMode(0o033)), "644");
  assert.equal(umaskFor(0o644), 0o022);
  assert.equal(umaskFor(0o750), 0o027);
  assert.deepEqual(parseUmask("022"), { ok: true, value: 0o022 });
  assert.equal(parseUmask("1000").ok, false);
});

test("recursive helpers: dirs get x wherever r is set, files lose every x", () => {
  assert.equal(autoDirMode(0o644), 0o755);
  assert.equal(autoDirMode(0o640), 0o750);
  assert.equal(autoDirMode(0o2664), 0o2775);
  assert.equal(autoFileMode(0o755), 0o644);
  assert.equal(autoFileMode(0o4755), 0o644);
  const cmds = recursiveCommands(0o755, 0o644, "site", false, 0o755);
  assert.equal(cmds[0].command, "find site -type d -exec chmod 755 {} +");
  assert.equal(cmds[1].command, "find site -type f -exec chmod 644 {} +");
  assert.equal(cmds[2].command, "chmod -R u=rwX,g=rX,o=rX site");
  assert.equal(cmds[3].command, "chmod -R 755 site");
});

test("commands: quoting, ~/ expansion and sudo", () => {
  assert.equal(quotePath("my file.txt"), "'my file.txt'");
  assert.equal(quotePath("~/my notes"), "~/'my notes'");
  assert.equal(quotePath("~/.ssh/id_ed25519"), "~/.ssh/id_ed25519");
  assert.equal(quotePath("-weird"), "./-weird");
  assert.equal(quotePath("it's"), `'it'\\''s'`);
  const c = singleCommands(0o755, "deploy.sh", true, "file");
  assert.equal(c[0].command, "sudo chmod 755 deploy.sh");
  assert.equal(c[1].command, "sudo chmod u=rwx,g=rx,o=rx deploy.sh");
  assert.equal(c[2].command, "ls -ld deploy.sh");
  assert.equal(toSymbolicClauses(0o4755), "u=rwxs,g=rx,o=rx");
  assert.equal(lsString(0o755, "dir"), "drwxr-xr-x");
});

test("descriptions and warnings", () => {
  assert.equal(describeClass("Group", 5, "file"), "Group can read it and run it as a program.");
  assert.equal(describeClass("Others", 0, "file"), "Others have no access.");
  assert.ok(analyzeMode(0o777, "file").some((f) => f.level === "danger"));
  assert.ok(analyzeMode(0o4775, "file").some((f) => f.title.startsWith("Setuid file that group")));
  assert.ok(analyzeMode(0o644, "dir").some((f) => f.title.includes("without execute")));
  assert.ok(!analyzeMode(0o1777, "dir").some((f) => f.level === "danger"));
  assert.ok(analyzeMode(0o711, "dir").some((f) => f.title.includes("can enter but not list")));
});

test("presets named in the article exist with the documented modes", () => {
  const byId = Object.fromEntries(PRESETS.map((p) => [p.id, p.mode]));
  assert.equal(byId.wordpress, 0o755);
  assert.equal(byId["wp-config"], 0o640);
  assert.equal(byId.laravel, 0o775);
  assert.equal(byId["ssh-key"], 0o600);
  assert.equal(byId["ssh-dir"], 0o700);
  assert.equal(byId.script, 0o755);
  assert.equal(byId.shared, 0o2775);
  assert.equal(byId.tmp, 0o1777);
});
