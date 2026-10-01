"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type DragEvent } from "react";
import { ArrowDown, ArrowLeftRight, ArrowUp, Download, FileUp, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Button, Checkbox, Tabs, Textarea, ToolPanel } from "@/components/ui";
import { cn } from "@/lib/utils";
import { compareTexts, describeStats, looksBinary, makePatch, splitLines, type CompareOptions, type CompareResult, type Granularity } from "./logic";
import type { WorkerJob, WorkerRequest } from "./compare.worker";
import { changeAnchorId, foldRows, InlineLines, SplitLines, TokenView } from "./views";

/** Above this combined size, comparisons run when you press Compare instead of on every keystroke. */
const AUTO_COMPARE_CHARS = 200_000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const EXAMPLE_LEFT = "Meeting notes – 3 March\nAttendees: Ana, Ben, Chloe\nBudget approved: $4,500\nNext review in two weeks.\n";
const EXAMPLE_RIGHT = "Meeting notes – 3 March\nAttendees: Ana, Ben, Chloe, Dev\nBudget approved: $5,000\nNext review in two weeks.\nAction: Dev to book the venue.\n";

type View = "auto" | "split" | "inline";
interface Settings {
  granularity: Granularity;
  view: View;
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
}
const DEFAULT_SETTINGS: Settings = { granularity: "line", view: "auto", ignoreCase: false, ignoreWhitespace: false };

interface Done {
  result: CompareResult;
  left: string;
  right: string;
  options: CompareOptions;
}

// Narrow screens default to the inline view; read via useSyncExternalStore so hydration stays consistent.
const NARROW = "(max-width: 767px)";
function useIsNarrow() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(NARROW);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

function createWorker(): Worker | null {
  try {
    return new Worker(new URL("./compare.worker.ts", import.meta.url), { type: "module" });
  } catch {
    return null;
  }
}

function countLabel(text: string) {
  const lines = splitLines(text).length;
  return `${text.length.toLocaleString("en-US")} chars · ${lines.toLocaleString("en-US")} ${lines === 1 ? "line" : "lines"}`;
}

export default function TextCompare() {
  const [left, setLeft] = usePersistentState("text-compare:left", "");
  const [right, setRight] = usePersistentState("text-compare:right", "");
  const [names, setNames] = usePersistentState("text-compare:names", { left: "", right: "" });
  const [settings, setSettings] = usePersistentState<Settings>("text-compare:settings", DEFAULT_SETTINGS, { storage: "local" });
  const { granularity, ignoreCase, ignoreWhitespace } = settings;
  const narrow = useIsNarrow();
  const view: "split" | "inline" = settings.view === "auto" ? (narrow ? "inline" : "split") : settings.view;

  const [done, setDone] = useState<Done | null>(null);
  const [pending, setPending] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [current, setCurrent] = useState(0);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [showAll, setShowAll] = useState(false);
  const [patchState, setPatchState] = useState<"" | "copied" | "downloaded">("");

  const workerRef = useRef<Worker | null>(null);
  const busyRef = useRef(false);
  const requestId = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputs = { left: useRef<HTMLInputElement>(null), right: useRef<HTMLInputElement>(null) };

  const options = useMemo<CompareOptions>(() => ({ granularity, ignoreCase, ignoreWhitespace }), [granularity, ignoreCase, ignoreWhitespace]);
  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  /** Sends a request to the worker (or runs it here if workers are unavailable). Any running job is cancelled first. */
  const send = useCallback(<T,>(req: WorkerJob, onDone: (data: T) => void) => {
    const id = ++requestId.current;
    if (busyRef.current && workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    workerRef.current ??= createWorker();
    const worker = workerRef.current;
    const finish = (data: T) => {
      if (id !== requestId.current) return;
      busyRef.current = false;
      onDone(data);
    };
    const runHere = () => {
      setTimeout(() => {
        try {
          const r =
            req.type === "compare"
              ? { result: compareTexts(req.left, req.right, req.options) }
              : { patch: makePatch(req.left, req.right, req.leftName, req.rightName) };
          finish(r as T);
        } catch (e) {
          finish({ error: e instanceof Error ? e.message : String(e) } as T);
        }
      }, 0);
    };
    busyRef.current = true;
    if (!worker) return runHere();
    worker.onmessage = (e: MessageEvent<T & { id: number }>) => {
      if (e.data.id === id) finish(e.data);
    };
    worker.onerror = () => {
      // The worker failed to load (e.g. blocked by an extension); fall back to the main thread.
      worker.terminate();
      workerRef.current = null;
      if (id === requestId.current) runHere();
    };
    worker.postMessage({ ...req, id } as WorkerRequest);
  }, []);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
    },
    [],
  );

  const runCompare = useCallback(
    (l: string, r: string, o: CompareOptions) => {
      setPending(true);
      setError("");
      send<{ result?: CompareResult; error?: string }>({ type: "compare", left: l, right: r, options: o }, (data) => {
        setPending(false);
        if (data.error || !data.result) {
          setError(data.error ? `Something went wrong while comparing: ${data.error}` : "Something went wrong while comparing.");
          return;
        }
        setDone({ result: data.result, left: l, right: r, options: o });
        setCurrent(0);
        setExpanded(new Set());
      });
    },
    [send],
  );

  const cancel = () => {
    requestId.current++;
    workerRef.current?.terminate();
    workerRef.current = null;
    busyRef.current = false;
    setPending(false);
  };

  const empty = !left && !right;
  const manual = left.length + right.length > AUTO_COMPARE_CHARS;
  const upToDate = !!done && done.left === left && done.right === right && done.options === options;

  // Compare automatically (debounced) for normal-sized texts.
  useEffect(() => {
    if (empty || manual) return;
    const t = setTimeout(() => runCompare(left, right, options), 250);
    return () => clearTimeout(t);
  }, [left, right, options, empty, manual, runCompare]);

  // Only show the "Comparing…" state if it takes noticeable time.
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setSlow(true), 300);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [pending]);

  const result = !empty && done ? done.result : null;
  const ok = result && result.status === "ok" ? result : null;
  const changeCount = ok?.stats.changes ?? 0;

  const goTo = useCallback(
    (n: number) => {
      if (!changeCount) return;
      const next = (n + changeCount) % changeCount;
      setCurrent(next);
      requestAnimationFrame(() => {
        const el = document.getElementById(changeAnchorId(next));
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        el?.focus({ preventScroll: true });
      });
    },
    [changeCount],
  );

  // N / J = next change, P / K = previous change (when not typing in a field).
  useEffect(() => {
    if (!changeCount) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === "n" || k === "j") {
        e.preventDefault();
        goTo(current + 1);
      } else if (k === "p" || k === "k") {
        e.preventDefault();
        goTo(current - 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [changeCount, current, goTo]);

  useEffect(() => {
    if (!patchState) return;
    const t = setTimeout(() => setPatchState(""), 1800);
    return () => clearTimeout(t);
  }, [patchState]);

  const readFile = async (side: "left" | "right", file: File | undefined) => {
    if (!file) return;
    setFileError("");
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB. Files up to 10 MB can be compared.`);
      return;
    }
    const text = await file.text();
    if (looksBinary(text)) {
      setFileError(`${file.name} looks like a binary file (an image, PDF, Word document or archive), not plain text, so it can't be compared here.`);
      return;
    }
    if (side === "left") setLeft(text);
    else setRight(text);
    setNames((n) => ({ ...n, [side]: file.name }));
  };

  const onDrop = (side: "left" | "right") => (e: DragEvent<HTMLTextAreaElement>) => {
    if (!e.dataTransfer.files.length) return;
    e.preventDefault();
    void readFile(side, e.dataTransfer.files[0]);
  };

  const requestPatch = (then: (patch: string) => void) => {
    if (!done) return;
    send<{ patch?: string; error?: string }>(
      { type: "patch", left: done.left, right: done.right, leftName: names.left || "original.txt", rightName: names.right || "changed.txt" },
      (data) => {
        if (data.patch) then(data.patch);
        else if (data.error) setError(`Couldn't create the patch: ${data.error}`);
      },
    );
  };

  const copyPatch = () =>
    requestPatch(async (patch) => {
      try {
        await navigator.clipboard.writeText(patch);
        setPatchState("copied");
      } catch {
        setError("Your browser blocked clipboard access. Use Download patch instead.");
      }
    });

  const downloadPatch = () =>
    requestPatch((patch) => {
      const url = URL.createObjectURL(new Blob([patch], { type: "text/x-diff" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(names.right || names.left || "changes").replace(/\.[^.]+$/, "") || "changes"}.patch`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setPatchState("downloaded");
    });

  const unit = granularity === "line" ? "Lines" : granularity === "word" ? "Words" : "Characters";
  // With no counted changes there is nothing to fold around, so show the lines (and any "ignored difference" labels).
  const lineItems = ok && ok.granularity === "line" ? foldRows(ok.rows, expanded, showAll || (ok.stats.changes === 0 && ok.rows.length <= 500)) : [];
  const expand = (id: number) => setExpanded((s) => new Set(s).add(id));
  const ignoredOnly = ok && ok.stats.changes === 0 && !ok.identical;

  return (
    <ToolPanel>
      <div className="grid gap-4 md:grid-cols-2">
        {(["left", "right"] as const).map((side) => {
          const value = side === "left" ? left : right;
          const set = side === "left" ? setLeft : setRight;
          return (
            <div key={side} className="min-w-0">
              <Textarea
                label={side === "left" ? "Original text" : "Changed text"}
                labelAddon={value ? countLabel(value) : names[side] || undefined}
                value={value}
                onChange={(e) => {
                  set(e.target.value);
                  if (names[side]) setNames((n) => ({ ...n, [side]: "" }));
                }}
                onDrop={onDrop(side)}
                onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
                placeholder={side === "left" ? "Paste the original version, or drop a text file here…" : "Paste the new version, or drop a text file here…"}
                rows={10}
                mono
                spellCheck={false}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputs[side]}
                  type="file"
                  accept=".txt,.md,.csv,.tsv,.json,.xml,.yaml,.yml,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.h,.cs,.go,.rs,.rb,.php,.sql,.sh,.ini,.conf,.log,.srt,.vtt,text/*"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    void readFile(side, e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <Button size="sm" variant="secondary" onClick={() => fileInputs[side].current?.click()}>
                  <FileUp className="h-3.5 w-3.5" aria-hidden />
                  Open file
                </Button>
                {names[side] && <span className="truncate font-mono text-[11px] text-muted">{names[side]}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {fileError && (
        <Alert variant="error" className="mt-4">
          {fileError}
        </Alert>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <Tabs
          label="Compare by"
          value={granularity}
          onChange={(g) => update({ granularity: g })}
          options={[
            { value: "line", label: "Lines" },
            { value: "word", label: "Words" },
            { value: "char", label: "Characters" },
          ]}
        />
        <Tabs
          label="Layout"
          value={view}
          onChange={(v) => update({ view: v })}
          options={[
            { value: "split", label: "Side by side" },
            { value: "inline", label: "Inline" },
          ]}
        />
        <Checkbox checked={ignoreCase} onChange={(v) => update({ ignoreCase: v })} label="Ignore case" />
        <Checkbox checked={ignoreWhitespace} onChange={(v) => update({ ignoreWhitespace: v })} label="Ignore whitespace" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {manual && (
          <Button onClick={() => runCompare(left, right, options)} disabled={pending || upToDate}>
            Compare
          </Button>
        )}
        <Button
          variant="secondary"
          disabled={empty}
          onClick={() => {
            setLeft(right);
            setRight(left);
            setNames((n) => ({ left: n.right, right: n.left }));
          }}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
          Swap
        </Button>
        <Button
          variant="secondary"
          disabled={empty}
          onClick={() => {
            cancel();
            setLeft("");
            setRight("");
            setNames({ left: "", right: "" });
            setDone(null);
          }}
        >
          Clear
        </Button>
        {empty && (
          <Button
            variant="outline"
            onClick={() => {
              setLeft(EXAMPLE_LEFT);
              setRight(EXAMPLE_RIGHT);
            }}
          >
            Try an example
          </Button>
        )}
      </div>

      <div ref={resultRef} role="region" aria-label="Comparison result" className="mt-6 scroll-mt-28">
        {pending && slow && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
            <span className="flex-1">Comparing… large or very different texts can take a few seconds.</span>
            <Button size="sm" variant="secondary" onClick={cancel}>
              <X className="h-3.5 w-3.5" aria-hidden />
              Cancel
            </Button>
          </div>
        )}
        {manual && !upToDate && !pending && !empty && (
          <Alert variant="info" className="mb-4">
            These texts are large, so they are compared when you press <strong>Compare</strong> rather than as you type.
          </Alert>
        )}
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}
        {result && result.status !== "ok" && (
          <Alert variant="warning" className="mb-4">
            {result.message}
          </Alert>
        )}

        {ok && (
          <>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-border bg-surface-2 px-4 py-3">
              <p className="text-sm" aria-live="polite">
                {ok.identical ? (
                  <strong>The texts are identical.</strong>
                ) : ignoredOnly ? (
                  <strong>
                    No differences once {ignoreCase && ignoreWhitespace ? "case and whitespace are" : ignoreCase ? "case is" : "whitespace is"} ignored.
                  </strong>
                ) : (
                  <>
                    <strong className="tabular-nums">{ok.stats.changes.toLocaleString("en-US")}</strong> {ok.stats.changes === 1 ? "change" : "changes"}
                    <span className="mx-2 text-muted">·</span>
                    <span className="text-danger tabular-nums">−{ok.stats.removed.toLocaleString("en-US")}</span>
                    <span className="mx-1.5 text-muted">/</span>
                    <span className="text-success tabular-nums">+{ok.stats.added.toLocaleString("en-US")}</span> <span className="text-muted">{unit.toLowerCase()}</span>
                    <span className="mx-2 text-muted">·</span>
                    {Math.round(ok.stats.similarity * 100)}% similar
                    <span className="sr-only"> ({describeStats(ok.stats, ok.granularity)})</span>
                  </>
                )}
              </p>
              {changeCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => goTo(current - 1)} aria-label="Previous change (P)">
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                  <span className="min-w-[5.5rem] text-center font-mono text-[12px] tabular-nums text-muted" aria-live="polite">
                    {current + 1} of {changeCount}
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => goTo(current + 1)} aria-label="Next change (N)">
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                  <span className="ml-1 hidden font-mono text-[11px] text-muted sm:inline">keys N / P</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <Button size="sm" variant="secondary" onClick={copyPatch} disabled={ok.identical || pending}>
                  {patchState === "copied" ? "Copied!" : "Copy patch"}
                </Button>
                <Button size="sm" variant="secondary" onClick={downloadPatch} disabled={ok.identical || pending}>
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  {patchState === "downloaded" ? "Downloaded" : "Download patch"}
                </Button>
              </div>
            </div>

            {ok.notes.map((n) => (
              <Alert key={n} variant="info" className="mt-3">
                {n}
              </Alert>
            ))}

            {!ok.identical && (
              <div className={cn("mt-4", pending && "opacity-60 transition-opacity")}>
                <div className="mb-2 flex justify-end">
                  <Checkbox checked={showAll} onChange={setShowAll} label="Show all unchanged text" />
                </div>
                {ok.granularity === "line" ? (
                  view === "split" ? (
                    <SplitLines rows={ok.rows} items={lineItems} current={current} onExpand={expand} />
                  ) : (
                    <InlineLines rows={ok.rows} items={lineItems} current={current} onExpand={expand} />
                  )
                ) : (
                  <TokenView segments={ok.segments} changeStarts={ok.changeStarts} view={view} current={current} expanded={expanded} showAll={showAll} onExpand={expand} />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ToolPanel>
  );
}
