/**
 * Pure permission-mode logic for the Chmod Calculator.
 * No React, no DOM: everything here is a plain function so it can be tested
 * on its own. The symbolic-mode engine follows GNU coreutils chmod.
 */

export type FileKind = "file" | "dir";
export type ClassKey = "owner" | "group" | "others";
export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string; incomplete?: boolean };

export const SETUID = 0o4000;
export const SETGID = 0o2000;
export const STICKY = 0o1000;
export const MODE_MASK = 0o7777;

export const CLASSES = [
  { key: "owner", letter: "u", label: "Owner", sub: "user", shift: 6 },
  { key: "group", letter: "g", label: "Group", sub: "group", shift: 3 },
  { key: "others", letter: "o", label: "Others", sub: "everyone else", shift: 0 },
] as const satisfies readonly { key: ClassKey; letter: string; label: string; sub: string; shift: number }[];

export const PERMS = [
  { key: "read", letter: "r", label: "Read", value: 4 },
  { key: "write", letter: "w", label: "Write", value: 2 },
  { key: "execute", letter: "x", label: "Execute", value: 1 },
] as const;

export const SPECIAL_BITS = [
  { flag: SETUID, key: "setuid", label: "Setuid", octal: "4000", hint: "Run the program as its owner" },
  { flag: SETGID, key: "setgid", label: "Setgid", octal: "2000", hint: "Run as its group, or make a folder's new files inherit the group" },
  { flag: STICKY, key: "sticky", label: "Sticky", octal: "1000", hint: "In a shared folder, only owners can delete their own files" },
] as const;

/* ------------------------------------------------------------------ */
/* Bit helpers                                                         */
/* ------------------------------------------------------------------ */

const shiftOf = (c: ClassKey) => CLASSES.find((x) => x.key === c)!.shift;

/** The 0-7 digit (r=4, w=2, x=1) for one class. */
export function classBits(mode: number, c: ClassKey): number {
  return (mode >> shiftOf(c)) & 7;
}

export function withClassBit(mode: number, c: ClassKey, value: number, on: boolean): number {
  const bit = value << shiftOf(c);
  return on ? (mode | bit) & MODE_MASK : mode & ~bit & MODE_MASK;
}

export function withFlag(mode: number, flag: number, on: boolean): number {
  return on ? (mode | flag) & MODE_MASK : mode & ~flag & MODE_MASK;
}

/** Octal string: three digits, or four when a special bit is set (755, 4755). */
export function formatOctal(mode: number): string {
  const m = mode & MODE_MASK;
  return m.toString(8).padStart(m > 0o777 ? 4 : 3, "0");
}

/** The nine-character rwx string as shown by `ls -l` (s/S, t/T for special bits). */
export function toSymbolic(mode: number): string {
  const m = mode & MODE_MASK;
  const triple = (bits: number, special: boolean, sLower: string, sUpper: string) => {
    const x = bits & 1;
    return (bits & 4 ? "r" : "-") + (bits & 2 ? "w" : "-") + (special ? (x ? sLower : sUpper) : x ? "x" : "-");
  };
  return (
    triple((m >> 6) & 7, !!(m & SETUID), "s", "S") +
    triple((m >> 3) & 7, !!(m & SETGID), "s", "S") +
    triple(m & 7, !!(m & STICKY), "t", "T")
  );
}

/** A full `ls -l` style prefix, e.g. "drwxr-xr-x". */
export function lsString(mode: number, kind: FileKind): string {
  return (kind === "dir" ? "d" : "-") + toSymbolic(mode);
}

/** True when "others" can write. */
export const isWorldWritable = (mode: number) => (mode & 0o002) !== 0;

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

/** Parse an octal mode of one to four significant digits ("755", "0644", "4755"). */
export function parseOctal(raw: string): ParseResult<number> {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Enter an octal mode such as 755.", incomplete: true };
  if (!/^[0-7]+$/.test(text)) {
    return { ok: false, error: /^[0-9]+$/.test(text) ? "Octal digits only run from 0 to 7." : "Use octal digits 0-7, for example 755 or 4755." };
  }
  const significant = text.replace(/^0+/, "");
  if (significant.length > 4) return { ok: false, error: "A mode has at most four octal digits (special bits plus owner, group, others)." };
  return { ok: true, value: significant ? parseInt(significant, 8) : 0 };
}

const SYMBOLIC_SLOTS: readonly { ok: string }[] = [
  { ok: "r-" },
  { ok: "w-" },
  { ok: "xsS-" },
  { ok: "r-" },
  { ok: "w-" },
  { ok: "xsS-" },
  { ok: "r-" },
  { ok: "w-" },
  { ok: "xtT-" },
];

/**
 * Parse the `ls -l` permission string. Accepts nine characters (rwxr-xr-x) or
 * ten with a leading file-type character (-rwxr-xr-x, drwxr-xr-x).
 */
export function parseSymbolic(raw: string): ParseResult<{ mode: number; kind?: FileKind }> {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Enter nine characters such as rwxr-xr-x.", incomplete: true };
  if (/[=+,]/.test(text)) {
    return {
      ok: false,
      error: "That looks like a chmod expression. Try it in the “Try a symbolic change” box below, or type nine characters such as rwxr-xr-x here.",
    };
  }
  let body = text;
  let kind: FileKind | undefined;
  if (text.length === 10) {
    const t = text[0];
    if (t === "-") kind = "file";
    else if (t === "d") kind = "dir";
    else if (!"lcbps".includes(t)) return { ok: false, error: `“${t}” is not a file type. Use - for a file or d for a directory.` };
    else return { ok: false, error: "Only regular files (-) and directories (d) have editable modes here." };
    body = text.slice(1);
  } else if (text.length > 10) {
    return { ok: false, error: "Too long: a permission string is nine characters (ten with the leading - or d)." };
  }
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (!SYMBOLIC_SLOTS[i].ok.includes(c)) {
      const pos = i + 1;
      const allowed = SYMBOLIC_SLOTS[i].ok.split("").join(", ");
      return { ok: false, error: `Character ${pos} is “${c}”, but that slot only allows ${allowed}.` };
    }
  }
  if (body.length < 9) return { ok: false, error: "Type all nine characters, for example rwxr-xr-x.", incomplete: true };
  let mode = 0;
  for (let cls = 0; cls < 3; cls++) {
    const [r, w, x] = [body[cls * 3], body[cls * 3 + 1], body[cls * 3 + 2]];
    if (r === "r") mode |= 4 << (6 - cls * 3);
    if (w === "w") mode |= 2 << (6 - cls * 3);
    if (x === "x" || x === "s" || x === "t") mode |= 1 << (6 - cls * 3);
    if (x === "s" || x === "S") mode |= cls === 0 ? SETUID : SETGID;
    if (x === "t" || x === "T") mode |= STICKY;
  }
  return { ok: true, value: { mode, kind } };
}

/* ------------------------------------------------------------------ */
/* Plain-English description and warnings                              */
/* ------------------------------------------------------------------ */

const FILE_VERBS = ["read it", "change it", "run it as a program"] as const;
const DIR_VERBS = ["list its contents", "add, rename and delete entries", "enter it and reach files inside"] as const;

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** One sentence describing what a class can do, e.g. "Group can read it and run it as a program." */
export function describeClass(label: string, bits: number, kind: FileKind): string {
  const verbs = kind === "dir" ? DIR_VERBS : FILE_VERBS;
  const list: string[] = [];
  if (bits & 4) list.push(verbs[0]);
  if (bits & 2) list.push(verbs[1]);
  if (bits & 1) list.push(verbs[2]);
  const plural = label === "Others";
  if (!list.length) return `${label} ${plural ? "have" : "has"} no access.`;
  return `${label} can ${joinList(list)}.`;
}

export type FindingLevel = "danger" | "warning" | "info";
export interface Finding {
  level: FindingLevel;
  title: string;
  text: string;
}

/** Notes and security warnings for a mode, aware of whether it targets a file or a directory. */
export function analyzeMode(mode: number, kind: FileKind): Finding[] {
  const m = mode & MODE_MASK;
  const out: Finding[] = [];
  const perm = m & 0o777;
  const octal = formatOctal(m);
  const noun = kind === "dir" ? "directory" : "file";
  const sticky = !!(m & STICKY);

  if (isWorldWritable(m)) {
    if (kind === "dir" && sticky) {
      out.push({
        level: "info",
        title: "World-writable, but the sticky bit limits the damage",
        text: "Anyone can create files here, yet only a file's owner, the directory's owner or root can delete or rename them. This is how /tmp works (1777).",
      });
    } else {
      out.push({
        level: "danger",
        title: `${octal} lets every user on the system change this ${noun}`,
        text:
          kind === "dir"
            ? "Any local account, and any compromised service, can create, replace and delete files in it. Making a folder world-writable is almost never the real fix for a permission error: correct the owner or group with chown/chgrp, or use 775 with a shared group. Never apply it recursively to a web root."
            : "Any local account, and any compromised service, can overwrite it, including scripts and configuration that other users or cron jobs run. If something only works with 777 or 666, the real problem is ownership: correct it with chown or chgrp and use 644, 664 or 755 instead.",
      });
    }
  }

  if (m & SETUID) {
    if (kind === "dir") {
      out.push({ level: "info", title: "Setuid has no effect on directories", text: "Linux ignores the setuid bit on directories. It only matters on executable files." });
    } else if (perm & 0o022) {
      out.push({
        level: "danger",
        title: "Setuid file that group or others can modify",
        text: "Whoever can edit a setuid program can make it run their code with the owner's privileges, which is root when root owns it. Remove write access for group and others, or drop the setuid bit.",
      });
    } else if (!(perm & 0o100)) {
      out.push({ level: "warning", title: "Setuid without owner execute (shown as S)", text: "The bit does nothing unless the owner can also execute the file. That combination is almost always a mistake." });
    } else {
      out.push({
        level: "warning",
        title: "Setuid runs the program with its owner's privileges",
        text: "Only use it on audited binaries. Linux ignores setuid on shell scripts and other interpreted scripts, so it will not make a script run as its owner.",
      });
    }
  }

  if (m & SETGID) {
    if (kind === "dir") {
      out.push({
        level: "info",
        title: "Setgid directory: new items inherit its group",
        text: "Files and subfolders created inside get this directory's group instead of the creator's primary group, and new subfolders get setgid too. It is the standard setup for shared project folders (2775).",
      });
    } else if (!(perm & 0o010)) {
      out.push({ level: "warning", title: "Setgid without group execute (shown as S)", text: "On a regular file the bit is only meaningful together with group execute. Check that this is what you intended." });
    } else {
      out.push({ level: "info", title: "Setgid file runs with its group's privileges", text: "The program runs with the file's group instead of the caller's group. Keep it for audited binaries, like setuid." });
    }
  }

  if (sticky && !(kind === "dir" && isWorldWritable(m))) {
    out.push(
      kind === "dir"
        ? {
            level: "info",
            title: "Sticky directory: only owners can delete their own files",
            text: "In a directory that several users can write to, the sticky bit stops them from deleting or renaming each other's files. It normally goes on world- or group-writable shared folders.",
          }
        : { level: "info", title: "Sticky bit on a file does nothing useful", text: "Modern Linux ignores the sticky bit on regular files. It is meaningful on directories (for example 1777 for /tmp)." },
    );
  }

  if (kind === "dir") {
    const missingX = CLASSES.filter((c) => {
      const b = classBits(m, c.key);
      return b & 6 && !(b & 1);
    });
    if (missingX.length) {
      out.push({
        level: "warning",
        title: `${joinList(missingX.map((c) => c.label))} can read or write here without execute`,
        text: "On a directory, execute means permission to enter it and reach anything inside by name. Without it, read and write are close to useless: ls may list names but opening the files fails. Directories nearly always need x whenever they have r.",
      });
    }
    const onlyX = CLASSES.filter((c) => {
      const b = classBits(m, c.key);
      return b & 1 && !(b & 4);
    });
    if (onlyX.length && !missingX.length) {
      out.push({
        level: "info",
        title: `${joinList(onlyX.map((c) => c.label))} can enter but not list`,
        text: "Execute without read lets someone open a file whose exact name they already know, but not see what the directory contains. It is a deliberate trick for private folders inside a shared path.",
      });
    }
  } else {
    const execNoRead = CLASSES.filter((c) => {
      const b = classBits(m, c.key);
      return b & 1 && !(b & 4);
    });
    if (execNoRead.length) {
      out.push({
        level: "info",
        title: `${joinList(execNoRead.map((c) => c.label))} can execute but not read`,
        text: "A compiled binary runs without read access, but a script does not: its interpreter must read the file to run it. If this is a script, add r.",
      });
    }
  }

  if (perm === 0) {
    out.push({ level: "info", title: "Nobody has any access", text: "Only root, which bypasses permission checks, can use it. The owner can still change the mode back with chmod." });
  } else {
    const o = (perm >> 6) & 7;
    const g = (perm >> 3) & 7;
    const w = perm & 7;
    if ((g | w) & ~o) {
      out.push({
        level: "info",
        title: "The owner has fewer permissions than group or others",
        text: "That is unusual. The owner can always chmod the item back, but it is worth checking that you did not swap the digits.",
      });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Command building                                                    */
/* ------------------------------------------------------------------ */

const SAFE_PATH = /^[A-Za-z0-9_@%+=:,./*?-]+$/;

const quoteSingle = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

/** Quote one shell word (used for the mode expression): left bare when it is plainly safe. */
export function quoteWord(word: string): string {
  return SAFE_PATH.test(word) && !word.startsWith("-") ? word : quoteSingle(word);
}

/**
 * Turn what a person typed into a path that is safe to paste into a shell.
 * A leading ~/ stays unquoted so the shell still expands it, * and ? are left
 * alone as wildcards, and anything else unusual is single-quoted.
 */
export function quotePath(raw: string): string {
  const p = raw.replace(/[\r\n]+/g, " ").trim();
  if (!p) return "filename";
  if (p === "~") return "~";
  if (p.startsWith("~/")) {
    const rest = p.slice(2);
    if (!rest) return "~/";
    return SAFE_PATH.test(rest) ? `~/${rest.startsWith("-") ? "./" : ""}${rest}` : `~/${quoteSingle(rest)}`;
  }
  if (SAFE_PATH.test(p)) return p.startsWith("-") ? `./${p}` : p;
  return quoteSingle(p);
}

/** Letters for a symbolic `=` clause, e.g. rwxs. */
function classLetters(bits: number, special: string): string {
  return (bits & 4 ? "r" : "") + (bits & 2 ? "w" : "") + (bits & 1 ? "x" : "") + special;
}

/** Exact symbolic form of a mode, e.g. "u=rwx,g=rx,o=rx" or "u=rwxs,g=rx,o=rx". */
export function toSymbolicClauses(mode: number): string {
  const m = mode & MODE_MASK;
  return [
    `u=${classLetters((m >> 6) & 7, m & SETUID ? "s" : "")}`,
    `g=${classLetters((m >> 3) & 7, m & SETGID ? "s" : "")}`,
    `o=${classLetters(m & 7, m & STICKY ? "t" : "")}`,
  ].join(",");
}

export interface CommandLine {
  id: string;
  label: string;
  command: string;
  note?: string;
}

const withSudo = (cmd: string, sudo: boolean) => (sudo ? `sudo ${cmd}` : cmd);

/** Commands for one file or directory. */
export function singleCommands(mode: number, rawPath: string, sudo: boolean, kind: FileKind): CommandLine[] {
  const path = quotePath(rawPath);
  const m = mode & MODE_MASK;
  const lines: CommandLine[] = [
    { id: "numeric", label: "Numeric (octal)", command: withSudo(`chmod ${formatOctal(m)} ${path}`, sudo) },
    {
      id: "symbolic",
      label: "Symbolic (exact)",
      command: withSudo(`chmod ${toSymbolicClauses(m)} ${path}`, sudo),
      note:
        kind === "dir" && !(m & (SETUID | SETGID))
          ? "GNU chmod keeps a directory's existing setgid and setuid bits unless you name them. To clear setgid, add g-s."
          : undefined,
    },
    { id: "verify", label: "Check the result", command: `ls -ld ${path}`, note: "The first column should read " + lsString(m, kind) + "." },
  ];
  return lines;
}

/** Directory mode that keeps read/write as given and adds execute wherever read is set. */
export function autoDirMode(mode: number): number {
  const m = mode & MODE_MASK;
  const perm = m & 0o777;
  return (m & 0o7000) | perm | ((perm & 0o444) >> 2);
}

/** File mode: the same permissions with every execute bit and special bit stripped. */
export function autoFileMode(mode: number): number {
  return mode & 0o666;
}

/** Commands that treat directories and files differently across a whole tree. */
export function recursiveCommands(dirMode: number, fileMode: number, rawPath: string, sudo: boolean, sameMode: number): CommandLine[] {
  const path = quotePath(rawPath);
  const d = formatOctal(dirMode);
  const f = formatOctal(fileMode);
  const lines: CommandLine[] = [
    {
      id: "find-dirs",
      label: `Directories only (${d})`,
      command: withSudo(`find ${path} -type d -exec chmod ${d} {} +`, sudo),
    },
    {
      id: "find-files",
      label: `Files only (${f})`,
      command: withSudo(`find ${path} -type f -exec chmod ${f} {} +`, sudo),
    },
  ];
  const hasSpecial = !!(dirMode & 0o7000);
  if (!hasSpecial && fileMode === (dirMode & 0o666)) {
    const letters = (bits: number) => (bits & 4 ? "r" : "") + (bits & 2 ? "w" : "") + (bits & 1 ? "X" : "");
    const clauses = `u=${letters((dirMode >> 6) & 7)},g=${letters((dirMode >> 3) & 7)},o=${letters(dirMode & 7)}`;
    lines.push({
      id: "capital-x",
      label: "One command with capital X",
      command: withSudo(`chmod -R ${clauses} ${path}`, sudo),
      note: `Directories get ${d} and plain files get ${f}. Files that already have an execute bit stay executable, which the find version strips.`,
    });
  }
  lines.push({
    id: "recursive-same",
    label: `Same mode for everything (${formatOctal(sameMode)})`,
    command: withSudo(`chmod -R ${formatOctal(sameMode)} ${path}`, sudo),
    note: "Applies one mode to files and directories alike. That gives every file execute permission (or leaves directories unusable), so it is rarely what you want.",
  });
  return lines;
}

/* ------------------------------------------------------------------ */
/* GNU-compatible symbolic and numeric mode application                */
/* ------------------------------------------------------------------ */

interface Change {
  op: "+" | "-" | "=";
  /** Bits the clause explicitly targets (0 when no who letters were given). */
  affected: number;
  /** Bits named by the letters, used to decide which special bits a directory keeps. */
  mentioned: number;
  /** Permission bits to apply (already spread across u, g and o). */
  value: number;
  copyFrom?: "u" | "g" | "o";
  xIfAnyX: boolean;
}

const WHO_BITS: Record<string, number> = { u: 0o4700, g: 0o2070, o: 0o1007, a: 0o7777 };
const LETTER_BITS: Record<string, number> = { r: 0o444, w: 0o222, x: 0o111, X: 0, s: 0o6000, t: 0o1000 };

function parseClause(clause: string): ParseResult<Change[]> {
  if (!clause) return { ok: false, error: "Empty clause: remove the extra comma." };
  let i = 0;
  let affected = 0;
  while (i < clause.length && "ugoa".includes(clause[i])) affected |= WHO_BITS[clause[i++]];
  if (i >= clause.length) return { ok: false, error: "Add an operator after the who letters: + to add, - to remove or = to set." };
  const changes: Change[] = [];
  while (i < clause.length) {
    const op = clause[i];
    if (op !== "+" && op !== "-" && op !== "=") {
      return { ok: false, error: `Unexpected “${op}”. Expected +, - or = here, with permission letters r, w, x, X, s or t after it.` };
    }
    i++;
    const change: Change = { op, affected, mentioned: 0, value: 0, xIfAnyX: false };
    if (i < clause.length && "ugo".includes(clause[i])) {
      change.copyFrom = clause[i] as "u" | "g" | "o";
      i++;
      if (i < clause.length && !"+-=".includes(clause[i])) {
        return { ok: false, error: `After copying from “${change.copyFrom}”, the next character must be +, - or =, not “${clause[i]}”.` };
      }
    } else {
      while (i < clause.length && !"+-=".includes(clause[i])) {
        const ch = clause[i];
        if (!(ch in LETTER_BITS)) {
          return { ok: false, error: `“${ch}” is not a permission letter. Use r, w, x, X, s or t (or u, g, o to copy).` };
        }
        if (ch === "X") change.xIfAnyX = true;
        else change.value |= LETTER_BITS[ch];
        i++;
      }
    }
    change.mentioned = (affected ? affected & change.value : change.value) & MODE_MASK;
    changes.push(change);
  }
  return { ok: true, value: changes };
}

/** Parse a symbolic mode ("u+x,g-w") into an ordered list of changes. */
export function parseSymbolicExpression(expr: string): ParseResult<Change[]> {
  const text = expr.trim();
  if (!text) return { ok: false, error: "Enter a mode such as +x or u=rw,go=r.", incomplete: true };
  const all: Change[] = [];
  for (const clause of text.split(",")) {
    const r = parseClause(clause);
    if (!r.ok) return r;
    all.push(...r.value);
  }
  return { ok: true, value: all };
}

/** True when at least one clause has no u/g/o/a letters, so the umask affects the result. */
export function expressionUsesUmask(expr: string): boolean {
  const text = expr.trim();
  if (/^[0-7]+$/.test(text)) return false;
  const parsed = parseSymbolicExpression(text);
  return parsed.ok && parsed.value.some((c) => c.affected === 0);
}

/**
 * Apply a symbolic mode to an existing mode the way GNU chmod does: with no
 * who letters the umask is honored, X only adds execute to directories or to
 * items that already have an execute bit, and directories keep their setuid
 * and setgid bits unless the clause names them.
 */
export function applySymbolic(start: number, isDir: boolean, umask: number, expr: string): ParseResult<number> {
  const parsed = parseSymbolicExpression(expr);
  if (!parsed.ok) return parsed;
  let mode = start & MODE_MASK;
  for (const c of parsed.value) {
    const omit = (isDir ? SETUID | SETGID : 0) & ~c.mentioned;
    let value = c.value;
    if (c.copyFrom) {
      const src = c.copyFrom === "u" ? 0o700 : c.copyFrom === "g" ? 0o070 : 0o007;
      const bits = src & mode;
      value = (bits & 0o444 ? 0o444 : 0) | (bits & 0o222 ? 0o222 : 0) | (bits & 0o111 ? 0o111 : 0);
    }
    if (c.xIfAnyX && (mode & 0o111 || isDir)) value |= 0o111;
    value &= (c.affected ? c.affected : ~umask) & ~omit & MODE_MASK;
    if (c.op === "=") {
      const preserved = (c.affected ? ~c.affected : 0) | omit;
      mode = ((mode & preserved) | value) & MODE_MASK;
    } else if (c.op === "+") {
      mode |= value;
    } else {
      mode &= ~value;
    }
  }
  return { ok: true, value: mode & MODE_MASK };
}

/**
 * Apply anything `chmod` accepts as MODE: a symbolic expression or an octal
 * number. A numeric mode of up to four digits leaves a directory's setuid and
 * setgid bits alone; five or more digits replace them.
 */
export function applyChmodMode(start: number, isDir: boolean, umask: number, raw: string): ParseResult<number> {
  const text = raw.trim();
  if (/^[0-7]+$/.test(text)) {
    const significant = text.replace(/^0+/, "");
    if (significant.length > 4) return { ok: false, error: "A numeric mode has at most four significant digits." };
    const n = significant ? parseInt(significant, 8) : 0;
    const keep = isDir && text.length <= 4 ? start & (SETUID | SETGID) : 0;
    return { ok: true, value: (n | keep) & MODE_MASK };
  }
  if (/^[0-9]+$/.test(text)) return { ok: false, error: "Octal digits only run from 0 to 7." };
  return applySymbolic(start, isDir, umask, text);
}

/* ------------------------------------------------------------------ */
/* umask                                                               */
/* ------------------------------------------------------------------ */

/** Parse a umask of one to four octal digits, at most 777. */
export function parseUmask(raw: string): ParseResult<number> {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Enter a umask such as 022.", incomplete: true };
  if (!/^[0-7]+$/.test(text)) return { ok: false, error: "A umask uses octal digits 0-7, for example 022." };
  const n = parseInt(text, 8);
  if (n > 0o777) return { ok: false, error: "A umask is at most 777 (0777)." };
  return { ok: true, value: n };
}

/** Mode a new file gets: files start from 666, never from 777. */
export const newFileMode = (umask: number) => 0o666 & ~umask & 0o777;
/** Mode a new directory gets: directories start from 777. */
export const newDirMode = (umask: number) => 0o777 & ~umask & 0o777;
/**
 * The umask that best reproduces a mode: new directories get the mode with execute
 * added wherever read is set, and new files get the same bits without execute.
 */
export const umaskFor = (mode: number) => ~autoDirMode(mode & 0o777) & 0o777;

/* ------------------------------------------------------------------ */
/* Reference data: common modes and presets                            */
/* ------------------------------------------------------------------ */

export interface CommonMode {
  mode: number;
  use: string;
}

/** Rows of the common-modes table. Octal, symbolic and warnings are computed, not typed. */
export const COMMON_MODES: readonly CommonMode[] = [
  { mode: 0o777, use: "Everyone can read, write and run. Avoid: it is a security hole, not a fix." },
  { mode: 0o775, use: "Shared folders where a team group needs to write." },
  { mode: 0o755, use: "Directories, scripts and public programs: only the owner can change them." },
  { mode: 0o750, use: "Programs or folders for the owner and one group only." },
  { mode: 0o700, use: "Private directories such as ~/.ssh." },
  { mode: 0o664, use: "Files a team group can edit." },
  { mode: 0o644, use: "Ordinary files: web pages, images, configuration." },
  { mode: 0o640, use: "Config with secrets that a service group must read." },
  { mode: 0o600, use: "Private files: SSH private keys, credentials." },
  { mode: 0o444, use: "Read-only for everyone." },
  { mode: 0o400, use: "Owner can read, nobody can write: keys and locked-down configs." },
  { mode: 0o1777, use: "Shared temp folders such as /tmp: anyone can add, only owners can delete." },
  { mode: 0o2775, use: "Team folder where new files inherit the group." },
  { mode: 0o4755, use: "Setuid program that runs as its owner. Audit before using." },
];

export interface Preset {
  id: string;
  label: string;
  kind: FileKind;
  mode: number;
  path: string;
  note: string;
}

export const PRESETS: readonly Preset[] = [
  {
    id: "wordpress",
    label: "WordPress site",
    kind: "dir",
    mode: 0o755,
    path: "/var/www/html",
    note: "WordPress baseline: directories 755, files 644. If uploads or updates fail, fix the owner (chown to the user PHP runs as) instead of loosening modes to 777.",
  },
  {
    id: "wp-config",
    label: "wp-config.php",
    kind: "file",
    mode: 0o640,
    path: "wp-config.php",
    note: "Holds database credentials, so keep it private. 640 or 600 are common; 440 and 400 are stricter. Whatever you pick, the user PHP runs as must still be able to read it.",
  },
  {
    id: "laravel",
    label: "Laravel storage",
    kind: "dir",
    mode: 0o775,
    path: "storage",
    note: "storage and bootstrap/cache must be writable by the web server user. 775 for directories and 664 for files with the web server's group owning the tree is the usual setup. Run the commands again for bootstrap/cache.",
  },
  {
    id: "ssh-key",
    label: "SSH private key",
    kind: "file",
    mode: 0o600,
    path: "~/.ssh/id_ed25519",
    note: "OpenSSH refuses to use a private key that group or others can read (“UNPROTECTED PRIVATE KEY FILE”). 600, or 400, is required.",
  },
  {
    id: "ssh-dir",
    label: "~/.ssh folder",
    kind: "dir",
    mode: 0o700,
    path: "~/.ssh",
    note: "700 for the folder and 600 for files inside. Public keys (.pub) may be 644. sshd ignores authorized_keys if the folder, the file or your home directory is writable by group or others.",
  },
  {
    id: "script",
    label: "Executable script",
    kind: "file",
    mode: 0o755,
    path: "script.sh",
    note: "755 lets everyone run the script while only the owner can edit it. Use 700 if only you should run it.",
  },
  {
    id: "shared",
    label: "Shared team folder",
    kind: "dir",
    mode: 0o2775,
    path: "/srv/project",
    note: "Setgid (2) makes new files inherit the folder's group, and 775 lets that group write. Put team members in the group with usermod -aG.",
  },
  {
    id: "tmp",
    label: "Shared temp folder",
    kind: "dir",
    mode: 0o1777,
    path: "/srv/shared/tmp",
    note: "The sticky bit (1) lets anyone create files but only the owner can delete or rename them, exactly like /tmp.",
  },
];
