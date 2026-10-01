"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LineRow, Segment } from "./logic";

/** Unchanged lines shown around each change; longer unchanged stretches are collapsed. */
const CONTEXT = 3;

export const changeAnchorId = (n: number) => `tc-change-${n}`;

const delCls = "rounded-[3px] bg-danger/20 text-fg no-underline";
const insCls = "rounded-[3px] bg-success/25 text-fg no-underline";

function SegmentText({ segments, side }: { segments: Segment[]; side: "left" | "right" }) {
  return (
    <>
      {segments.map((s, i) => {
        if (s.op === "equal") return <Fragment key={i}>{side === "left" ? s.left : s.right}</Fragment>;
        if (s.ignored) return <Fragment key={i}>{s.text}</Fragment>;
        if (s.op === "removed")
          return (
            <del key={i} className={delCls}>
              {s.text}
            </del>
          );
        return (
          <ins key={i} className={insCls}>
            {s.text}
          </ins>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------- line mode

type DisplayItem = { kind: "row"; row: LineRow; index: number } | { kind: "gap"; id: number; from: number; to: number };

/** Turns rows into what is shown: changes plus a little context, with long unchanged runs folded. */
export function foldRows(rows: LineRow[], expanded: ReadonlySet<number>, showAll: boolean): DisplayItem[] {
  if (showAll) return rows.map((row, index) => ({ kind: "row", row, index }));
  const out: DisplayItem[] = [];
  let k = 0;
  while (k < rows.length) {
    const isQuiet = (r: LineRow) => r.type === "equal" || r.type === "ignored";
    if (!isQuiet(rows[k])) {
      out.push({ kind: "row", row: rows[k], index: k });
      k++;
      continue;
    }
    let end = k;
    while (end < rows.length && isQuiet(rows[end])) end++;
    const keepStart = k === 0 ? 0 : CONTEXT;
    const keepEnd = end === rows.length ? 0 : CONTEXT;
    const hidden = end - k - keepStart - keepEnd;
    if (hidden >= 2 && !expanded.has(k)) {
      for (let x = k; x < k + keepStart; x++) out.push({ kind: "row", row: rows[x], index: x });
      out.push({ kind: "gap", id: k, from: k + keepStart, to: end - keepEnd });
      for (let x = end - keepEnd; x < end; x++) out.push({ kind: "row", row: rows[x], index: x });
    } else {
      for (let x = k; x < end; x++) out.push({ kind: "row", row: rows[x], index: x });
    }
    k = end;
  }
  return out;
}

function firstOfChange(rows: LineRow[], index: number) {
  const c = rows[index].change;
  return c !== undefined && (index === 0 || rows[index - 1].change !== c);
}

const numCls = "select-none px-2 text-right font-mono text-[11px] leading-6 text-muted tabular-nums";
const textCls = "min-w-0 whitespace-pre-wrap break-words px-2 font-mono text-[13px] leading-6 [overflow-wrap:anywhere]";

function GapButton({ count, onExpand, wide }: { count: number; onExpand: () => void; wide: number }) {
  return (
    <div style={{ gridColumn: `1 / span ${wide}` }} className="border-y border-dashed border-border bg-surface-2/60">
      <button type="button" onClick={onExpand} className="w-full px-3 py-1.5 text-left font-mono text-[11px] text-muted hover:text-fg">
        ⋯ Show {count.toLocaleString("en-US")} unchanged {count === 1 ? "line" : "lines"}
      </button>
    </div>
  );
}

function IgnoredLabel() {
  return (
    <span className="ml-2 align-middle font-sans text-[10px] uppercase tracking-wide text-muted" title="These lines differ only in case or whitespace, which you chose to ignore.">
      ignored difference
    </span>
  );
}

function srLabel(row: LineRow, side: "left" | "right") {
  if (row.type === "changed") return side === "left" ? "Changed from: " : "Changed to: ";
  if (row.type === "removed") return "Removed: ";
  if (row.type === "added") return "Added: ";
  return "";
}

export function SplitLines({
  rows,
  items,
  current,
  onExpand,
}: {
  rows: LineRow[];
  items: DisplayItem[];
  current: number;
  onExpand: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-surface">
      <div className="label-mono col-span-2 border-b border-border bg-surface-2 px-3 py-1.5">Original</div>
      <div className="label-mono col-span-2 border-b border-l border-border bg-surface-2 px-3 py-1.5">Changed</div>
      {items.map((it) => {
        if (it.kind === "gap") return <GapButton key={`g${it.id}`} wide={4} count={it.to - it.from} onExpand={() => onExpand(it.id)} />;
        const { row, index } = it;
        const isCurrent = row.change !== undefined && row.change === current;
        const anchor = firstOfChange(rows, index) ? changeAnchorId(row.change!) : undefined;
        const leftBg = row.type === "removed" || row.type === "changed" ? "bg-danger-soft" : !row.left ? "bg-surface-2/70" : row.type === "ignored" ? "opacity-60" : "";
        const rightBg = row.type === "added" || row.type === "changed" ? "bg-success-soft" : !row.right ? "bg-surface-2/70" : row.type === "ignored" ? "opacity-60" : "";
        const ring = isCurrent ? "shadow-[inset_3px_0_0_var(--primary)]" : "";
        return (
          <Fragment key={index}>
            <div id={anchor} tabIndex={anchor ? -1 : undefined} className={cn(numCls, leftBg, ring, "scroll-mt-32 outline-none")}>
              {row.left?.no ?? ""}
            </div>
            <div className={cn(textCls, leftBg)}>
              {row.left && (
                <>
                  <span className="sr-only">{srLabel(row, "left")}</span>
                  {row.left.segments ? <SegmentText segments={row.left.segments} side="left" /> : row.left.text || "\u00a0"}
                </>
              )}
            </div>
            <div className={cn(numCls, "border-l border-border", rightBg)}>{row.right?.no ?? ""}</div>
            <div className={cn(textCls, rightBg)}>
              {row.right && (
                <>
                  <span className="sr-only">{srLabel(row, "right")}</span>
                  {row.right.segments ? <SegmentText segments={row.right.segments} side="right" /> : row.right.text || "\u00a0"}
                </>
              )}
              {row.normalized && <IgnoredLabel />}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

export function InlineLines({
  rows,
  items,
  current,
  onExpand,
}: {
  rows: LineRow[];
  items: DisplayItem[];
  current: number;
  onExpand: (id: number) => void;
}) {
  const line = (key: string, oldNo: ReactNode, newNo: ReactNode, sign: string, body: ReactNode, cls: string, anchor?: string, ring?: string) => (
    <Fragment key={key}>
      <div id={anchor} tabIndex={anchor ? -1 : undefined} className={cn(numCls, cls, ring, "scroll-mt-32 outline-none")}>
        {oldNo}
      </div>
      <div className={cn(numCls, cls)}>{newNo}</div>
      <div className={cn(textCls, cls, "flex gap-2")}>
        <span aria-hidden className="w-3 shrink-0 select-none text-muted">
          {sign}
        </span>
        <span className="min-w-0">{body}</span>
      </div>
    </Fragment>
  );
  return (
    <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((it) => {
        if (it.kind === "gap") return <GapButton key={`g${it.id}`} wide={3} count={it.to - it.from} onExpand={() => onExpand(it.id)} />;
        const { row, index } = it;
        const anchor = firstOfChange(rows, index) ? changeAnchorId(row.change!) : undefined;
        const ring = row.change !== undefined && row.change === current ? "shadow-[inset_3px_0_0_var(--primary)]" : "";
        const del = (r: LineRow) => (
          <>
            <span className="sr-only">{srLabel(r, "left")}</span>
            {r.left!.segments ? <SegmentText segments={r.left!.segments} side="left" /> : r.left!.text || "\u00a0"}
          </>
        );
        const ins = (r: LineRow) => (
          <>
            <span className="sr-only">{srLabel(r, "right")}</span>
            {r.right!.segments ? <SegmentText segments={r.right!.segments} side="right" /> : r.right!.text || "\u00a0"}
          </>
        );
        if (row.type === "equal")
          return line(
            `r${index}`,
            row.left!.no,
            row.right!.no,
            "",
            <>
              {row.right!.text || "\u00a0"}
              {row.normalized && <IgnoredLabel />}
            </>,
            "",
          );
        if (row.type === "ignored") return line(`r${index}`, row.left?.no ?? "", row.right?.no ?? "", "", (row.left ?? row.right)!.text || "\u00a0", "opacity-60");
        if (row.type === "removed") return line(`r${index}`, row.left!.no, "", "−", del(row), "bg-danger-soft", anchor, ring);
        if (row.type === "added") return line(`r${index}`, "", row.right!.no, "+", ins(row), "bg-success-soft", anchor, ring);
        return (
          <Fragment key={`r${index}`}>
            {line(`r${index}a`, row.left!.no, "", "−", del(row), "bg-danger-soft", anchor, ring)}
            {line(`r${index}b`, "", row.right!.no, "+", ins(row), "bg-success-soft", undefined, ring)}
          </Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- word / character mode

/** Shortens a long unchanged stretch to its first and last lines (or characters). */
function foldEqual(text: string, position: "first" | "middle" | "last"): { head: string; tail: string; hiddenLines: number; hiddenChars: number } | null {
  const lines = text.split("\n");
  const keepHead = position === "first" ? 0 : CONTEXT;
  const keepTail = position === "last" ? 0 : CONTEXT;
  if (lines.length - keepHead - keepTail > 4) {
    const head = lines.slice(0, keepHead).join("\n") + (keepHead ? "\n" : "");
    const tail = (keepTail ? "\n" : "") + lines.slice(lines.length - keepTail).join("\n");
    return { head, tail, hiddenLines: lines.length - keepHead - keepTail, hiddenChars: 0 };
  }
  if (text.length > 1200) {
    const chars = Array.from(text);
    const h = position === "first" ? 0 : 300;
    const t = position === "last" ? 0 : 300;
    if (chars.length - h - t > 300) return { head: chars.slice(0, h).join(""), tail: chars.slice(chars.length - t).join(""), hiddenLines: 0, hiddenChars: chars.length - h - t };
  }
  return null;
}

function FoldedEqual({ text, position, open, onOpen }: { text: string; position: "first" | "middle" | "last"; open: boolean; onOpen: () => void }) {
  const f = open ? null : foldEqual(text, position);
  if (!f) return <>{text}</>;
  return (
    <>
      {f.head}
      <button type="button" onClick={onOpen} className="mx-1 rounded border border-dashed border-border-strong px-1.5 font-sans text-[11px] text-muted hover:text-fg">
        ⋯ {f.hiddenLines ? `${f.hiddenLines.toLocaleString("en-US")} unchanged lines` : `${f.hiddenChars.toLocaleString("en-US")} unchanged characters`}
      </button>
      {f.tail}
    </>
  );
}

export function TokenView({
  segments,
  changeStarts,
  view,
  current,
  expanded,
  showAll,
  onExpand,
}: {
  segments: Segment[];
  changeStarts: number[];
  view: "split" | "inline";
  current: number;
  expanded: ReadonlySet<number>;
  showAll: boolean;
  onExpand: (id: number) => void;
}) {
  const startIndex = new Map(changeStarts.map((segIdx, n) => [segIdx, n]));
  // Which change each segment belongs to, for the "current change" outline.
  const changeOf: (number | undefined)[] = [];
  let active: number | undefined;
  segments.forEach((s, i) => {
    if (startIndex.has(i)) active = startIndex.get(i);
    else if (s.op === "equal") active = undefined;
    changeOf[i] = s.op === "equal" || s.ignored ? undefined : active;
  });
  const pos = (i: number): "first" | "middle" | "last" => (i === 0 ? "first" : i === segments.length - 1 ? "last" : "middle");
  const outline = (i: number) => (changeOf[i] !== undefined && changeOf[i] === current ? "outline outline-2 outline-offset-1 outline-primary" : "");

  const render = (side: "left" | "right" | "inline") =>
    segments.map((s, i) => {
      const anchorN = startIndex.get(i);
      const anchorId = anchorN !== undefined && (side === "inline" || side === "left") ? changeAnchorId(anchorN) : undefined;
      const anchor = anchorId ? <span id={anchorId} tabIndex={-1} className="scroll-mt-32 outline-none" /> : null;
      if (s.op === "equal") {
        const text = side === "left" ? s.left : s.right;
        return (
          <Fragment key={i}>
            {showAll ? text : <FoldedEqual text={text} position={pos(i)} open={expanded.has(i)} onOpen={() => onExpand(i)} />}
          </Fragment>
        );
      }
      if (s.ignored) {
        // Inline view shows the changed text's version of an ignored whitespace difference.
        if ((s.op === "removed" && side !== "left") || (s.op === "added" && side === "left")) return null;
        return <Fragment key={i}>{s.text}</Fragment>;
      }
      if (s.op === "removed") {
        if (side === "right") return <span key={i} aria-hidden className="mx-px inline-block h-[1.1em] w-[2px] translate-y-[2px] bg-danger/60" />;
        return (
          <Fragment key={i}>
            {anchor}
            <del className={cn(delCls, outline(i))}>
              <span className="sr-only">[removed: </span>
              {s.text}
              <span className="sr-only">]</span>
            </del>
          </Fragment>
        );
      }
      if (side === "left") {
        return (
          <Fragment key={i}>
            {anchor}
            <span aria-hidden className="mx-px inline-block h-[1.1em] w-[2px] translate-y-[2px] bg-success/70" />
          </Fragment>
        );
      }
      return (
        <Fragment key={i}>
          {anchor}
          <ins className={cn(insCls, outline(i))}>
            <span className="sr-only">[added: </span>
            {s.text}
            <span className="sr-only">]</span>
          </ins>
        </Fragment>
      );
    });

  const box = "min-w-0 whitespace-pre-wrap break-words rounded-xl border border-border bg-surface p-4 font-mono text-[13px] leading-6 [overflow-wrap:anywhere]";
  if (view === "inline") return <div className={box}>{render("inline")}</div>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <div className="label-mono mb-1.5">Original</div>
        <div className={box}>{render("left")}</div>
      </div>
      <div>
        <div className="label-mono mb-1.5">Changed</div>
        <div className={box}>{render("right")}</div>
      </div>
    </div>
  );
}
