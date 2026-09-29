"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, RefreshCw, Search, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Input, ResultBox, Select, Tabs, Textarea, Toggle, ToolActions, ToolPanel, ToolSection } from "@/components/ui";
import { cn, downloadText } from "@/lib/utils";
import {
  LAYOUTS,
  MAX_COUNT,
  MAX_NANOID_LENGTH,
  NAMESPACES,
  NANOID_ALPHABETS,
  browserEnv,
  decodeId,
  formatBatch,
  generateBatch,
  isStrictlyIncreasing,
  isUuidFamily,
  parseCount,
  parseId,
  parseNames,
  representations,
  tokenize,
  type Decoded,
  type GenRequest,
  type IdType,
  type Layout,
  type NamespaceKey,
  type NanoAlphabet,
  type ParsedId,
} from "./uuid";

// ---------------------------------------------------------------------------
// Types shown as chips
// ---------------------------------------------------------------------------

const TYPES: { value: IdType; label: string; noun: string; blurb: string }[] = [
  {
    value: "v4",
    label: "v4 · random",
    noun: "UUID",
    blurb: "122 random bits from the browser's secure random generator (crypto.randomUUID). This is the usual GUID and the safe default when you only need a unique ID.",
  },
  {
    value: "v7",
    label: "v7 · time-ordered",
    noun: "UUID",
    blurb: "A 48-bit Unix millisecond timestamp followed by 74 random bits. Newer IDs sort after older ones, which suits database primary keys. Strictly increasing within a batch.",
  },
  {
    value: "v1",
    label: "v1 · timestamp",
    noun: "UUID",
    blurb: "A 60-bit timestamp (100 ns ticks since 1582-10-15), a clock sequence and a node. The node here is random with the multicast bit set, never your network card's MAC address.",
  },
  {
    value: "v5",
    label: "v5 · SHA-1 name",
    noun: "UUID",
    blurb: "A SHA-1 hash of a namespace UUID and a name. Deterministic: the same namespace and name always give the same UUID. One UUID per line of names.",
  },
  {
    value: "v3",
    label: "v3 · MD5 name",
    noun: "UUID",
    blurb: "The same idea as v5 but with MD5. Use it only to match an existing v3 system; choose v5 for anything new.",
  },
  {
    value: "v6",
    label: "v6 · sortable v1",
    noun: "UUID",
    blurb: "Version 1's timestamp reordered so the values sort by time. Mostly useful for systems that already use v1; new projects usually prefer v7.",
  },
  { value: "nil", label: "Nil", noun: "UUID", blurb: "All 128 bits zero. A placeholder that means no value. It is a fixed constant, so there is exactly one." },
  { value: "max", label: "Max", noun: "UUID", blurb: "All 128 bits one. RFC 9562 defines it as a sentinel upper bound. It is a fixed constant, so there is exactly one." },
  {
    value: "ulid",
    label: "ULID",
    noun: "ULID",
    blurb: "26 Crockford Base32 characters: a 48-bit millisecond timestamp plus 80 random bits. Sortable, URL-safe and case-insensitive. Strictly increasing within a batch. Not a UUID, but it fits in the same 128 bits.",
  },
  {
    value: "nanoid",
    label: "NanoID",
    noun: "ID",
    blurb: "A short random string in a URL-safe alphabet, drawn without modulo bias. The default 21 characters from 64 symbols carry about 126 bits, close to a v4 UUID. Not a UUID.",
  },
];

const NANO_ALPHABET_OPTIONS: { value: NanoAlphabet; label: string }[] = [
  { value: "url", label: "URL-safe (A-Z a-z 0-9 _ -)" },
  { value: "alnum", label: "Letters and digits" },
  { value: "lower", label: "Lowercase and digits" },
  { value: "hex", label: "Hexadecimal (0-9 a-f)" },
  { value: "digits", label: "Digits only" },
];

const NAMESPACE_OPTIONS: { value: NamespaceKey; label: string }[] = [
  ...(Object.keys(NAMESPACES) as (keyof typeof NAMESPACES)[]).map((k) => ({ value: k, label: NAMESPACES[k].label })),
  { value: "custom", label: "Custom namespace UUID" },
];

// ---------------------------------------------------------------------------
// Remembered state. Settings live in localStorage; drafts in sessionStorage.
// Generated IDs are never stored.
// ---------------------------------------------------------------------------

type Mode = "generate" | "decode";

interface Prefs {
  type: IdType;
  count: string;
  uppercase: boolean;
  noDashes: boolean;
  braces: boolean;
  layout: Layout;
  nanoLength: string;
  nanoAlphabet: NanoAlphabet;
}

interface Draft {
  mode: Mode;
  namespace: NamespaceKey;
  customNs: string;
  names: string;
  decodeText: string;
}

const DEFAULT_PREFS: Prefs = {
  type: "v4",
  count: "5",
  uppercase: false,
  noDashes: false,
  braces: false,
  layout: "lines",
  nanoLength: "21",
  nanoAlphabet: "url",
};

const DEFAULT_DRAFT: Draft = {
  mode: "generate",
  namespace: "dns",
  customNs: "",
  names: "www.example.com",
  decodeText: "",
};

const EXAMPLE_DECODE = ["017F22E2-79B0-7CC3-98C4-DC0C0C07398F", "550e8400-e29b-41d4-a716-446655440000", "01ARZ3NDEKTSV4RRFFQ69G5FAV", "{6BA7B810-9DAD-11D1-80B4-00C04FD430C8}", "not-a-uuid"].join("\n");

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function normalizePrefs(stored: unknown): Prefs {
  const s = asRecord(stored);
  const text = (v: unknown, d: string) => (typeof v === "string" ? v.slice(0, 12) : typeof v === "number" && Number.isFinite(v) ? String(v) : d);
  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
  return {
    type: TYPES.some((t) => t.value === s.type) ? (s.type as IdType) : DEFAULT_PREFS.type,
    count: text(s.count, DEFAULT_PREFS.count),
    uppercase: bool(s.uppercase, DEFAULT_PREFS.uppercase),
    noDashes: bool(s.noDashes, DEFAULT_PREFS.noDashes),
    braces: bool(s.braces, DEFAULT_PREFS.braces),
    layout: LAYOUTS.some((l) => l.value === s.layout) ? (s.layout as Layout) : DEFAULT_PREFS.layout,
    nanoLength: text(s.nanoLength, DEFAULT_PREFS.nanoLength),
    nanoAlphabet: NANO_ALPHABET_OPTIONS.some((o) => o.value === s.nanoAlphabet) ? (s.nanoAlphabet as NanoAlphabet) : DEFAULT_PREFS.nanoAlphabet,
  };
}

function normalizeDraft(stored: unknown): Draft {
  const s = asRecord(stored);
  const str = (v: unknown, d: string, max: number) => (typeof v === "string" ? v.slice(0, max) : d);
  return {
    mode: s.mode === "decode" ? "decode" : "generate",
    namespace: NAMESPACE_OPTIONS.some((o) => o.value === s.namespace) ? (s.namespace as NamespaceKey) : DEFAULT_DRAFT.namespace,
    customNs: str(s.customNs, "", 80),
    names: str(s.names, DEFAULT_DRAFT.names, 1_000_000),
    decodeText: str(s.decodeText, "", 1_000_000),
  };
}

// ---------------------------------------------------------------------------
// Turning the form into a generation request
// ---------------------------------------------------------------------------

type FieldName = "count" | "length" | "namespace" | "names";
type Built = { ok: true; req: GenRequest } | { ok: false; field: FieldName; message: string };

interface BuildInput {
  type: IdType;
  count: string;
  nanoLength: string;
  nanoAlphabet: NanoAlphabet;
  namespace: NamespaceKey;
  customNs: string;
  names: string;
}

function buildRequest(i: BuildInput): Built {
  switch (i.type) {
    case "nil":
    case "max":
      return { ok: true, req: { type: i.type } };
    case "v3":
    case "v5": {
      let namespace: string;
      if (i.namespace === "custom") {
        const p = parseId(i.customNs);
        if (!p.ok || p.value.kind !== "uuid") {
          return { ok: false, field: "namespace", message: i.customNs.trim() === "" ? "Enter the namespace UUID." : p.ok ? "A ULID cannot be a namespace; enter a UUID." : p.reason };
        }
        namespace = p.value.uuid;
      } else {
        namespace = NAMESPACES[i.namespace].uuid;
      }
      const names = parseNames(i.names);
      if (names.length === 0) return { ok: false, field: "names", message: "Add at least one name, one per line." };
      if (names.length > MAX_COUNT) return { ok: false, field: "names", message: `Too many names: ${names.length.toLocaleString("en-US")}. The maximum is ${MAX_COUNT.toLocaleString("en-US")} per batch.` };
      return { ok: true, req: { type: i.type, namespace, names } };
    }
    case "nanoid": {
      const c = parseCount(i.count);
      if (!c.ok) return { ok: false, field: "count", message: c.reason };
      const l = parseCount(i.nanoLength, MAX_NANOID_LENGTH);
      if (!l.ok) return { ok: false, field: "length", message: l.reason.replace(/per batch/, "for the length") };
      return { ok: true, req: { type: "nanoid", count: c.value, length: l.value, alphabet: NANOID_ALPHABETS[i.nanoAlphabet] } };
    }
    default: {
      const c = parseCount(i.count);
      if (!c.ok) return { ok: false, field: "count", message: c.reason };
      return { ok: true, req: { type: i.type, count: c.value } };
    }
  }
}

interface Result {
  request: object;
  type: IdType;
  ids: string[];
  error: string | null;
}

const nf = (n: number) => n.toLocaleString("en-US");

// ---------------------------------------------------------------------------
// Decode / validate panel
// ---------------------------------------------------------------------------

const PARSE_LIMIT = 10_000;
const TABLE_LIMIT = 100;

interface Entry {
  token: string;
  parsed: ReturnType<typeof parseId>;
}

function shortType(d: Decoded): string {
  if (d.kind === "ulid") return "ULID";
  if (d.special) return d.special === "nil" ? "Nil UUID" : "Max UUID";
  return d.version !== null ? `UUID v${d.version}` : "UUID (other variant)";
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="label-mono pt-0.5">{label}</dt>
      <dd className="min-w-0 break-words font-mono text-[13px] text-fg">{children}</dd>
    </>
  );
}

function Details({ value }: { value: ParsedId }) {
  const d = useMemo(() => decodeId(value), [value]);
  const rows = useMemo(() => representations(value), [value]);
  const time = d.time;
  return (
    <div className="flex flex-col gap-4" data-testid="decode-details">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">Valid</Badge>
        <span className="text-sm font-medium text-fg" data-testid="decode-type">
          {d.versionLabel}
        </span>
      </div>

      <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-[max-content_1fr]">
        <Row label="Type">{shortType(d)}</Row>
        <Row label="Variant">{d.variant}</Row>
        {time && (
          <>
            <Row label="Timestamp (UTC)">
              <span data-testid="decode-iso">{time.iso ?? "outside the range a JavaScript date can show"}</span>
              {time.subMsTicks ? <span className="text-muted"> + {time.subMsTicks} × 100 ns</span> : null}
            </Row>
            {time.iso && <Row label="Your local time">{new Date(time.ms).toLocaleString(undefined, { dateStyle: "full", timeStyle: "long" })}</Row>}
            <Row label="Unix time (ms)">{time.ms}</Row>
            {time.rawTicks && <Row label="Raw 60-bit timestamp">{time.rawTicks} ticks of 100 ns since 1582-10-15</Row>}
          </>
        )}
        {d.node && (
          <Row label="Node ID">
            {d.node.hex} <span className="text-muted">{d.node.randomlyGenerated ? "(multicast bit set: a random node, not a real MAC address)" : "(multicast bit clear: may be a real MAC address)"}</span>
          </Row>
        )}
        {d.clockSeq !== undefined && <Row label="Clock sequence">{d.clockSeq}</Row>}
      </dl>

      {d.notes.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-fg-secondary">
          {d.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      <ToolSection title="The same 128 bits in other formats">
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface-2">
          {rows.map((r) => (
            <li key={r.label} className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
              <span className="label-mono sm:w-44 sm:shrink-0">{r.label}</span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-fg">{r.value}</code>
                <CopyButton text={r.value} size="sm" variant="ghost" className="shrink-0" aria-label={`Copy ${r.label}`} />
              </div>
            </li>
          ))}
        </ul>
      </ToolSection>
    </div>
  );
}

function DecodePanel({ text, onText }: { text: string; onText: (t: string) => void }) {
  const [picked, setPicked] = useState(0);
  const { entries, truncated } = useMemo(() => {
    const tokens = tokenize(text);
    return {
      entries: tokens.slice(0, PARSE_LIMIT).map((token): Entry => ({ token, parsed: parseId(token) })),
      truncated: Math.max(0, tokens.length - PARSE_LIMIT),
    };
  }, [text]);

  const valid = entries.filter((e) => e.parsed.ok);
  const active = entries[Math.min(picked, Math.max(entries.length - 1, 0))];
  const validList = valid.map((e) => (e.parsed as { ok: true; value: ParsedId }).value.uuid).join("\n");

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label="UUIDs or ULIDs to check"
        hint="One per line, or separated by commas or spaces. Dashes, braces, urn:uuid: prefixes, quotes and any letter case are accepted."
        mono
        rows={5}
        value={text}
        onChange={(e) => {
          setPicked(0);
          onText(e.target.value);
        }}
        placeholder="017F22E2-79B0-7CC3-98C4-DC0C0C07398F"
        spellCheck={false}
        autoComplete="off"
      />
      <ToolActions>
        <Button
          variant="secondary"
          onClick={() => {
            setPicked(0);
            onText(EXAMPLE_DECODE);
          }}
        >
          Load examples
        </Button>
        <Button
          variant="ghost"
          leftIcon={<X className="h-4 w-4" aria-hidden />}
          disabled={text === ""}
          onClick={() => {
            setPicked(0);
            onText("");
          }}
        >
          Clear
        </Button>
        {valid.length > 1 && <CopyButton text={validList} label={`Copy ${nf(valid.length)} valid (lowercase)`} variant="outline" />}
      </ToolActions>

      {entries.length === 0 && <Alert variant="info">Paste a UUID, GUID or ULID above to see its version, variant, embedded timestamp and other formats. Everything is decoded in your browser.</Alert>}

      {truncated > 0 && (
        <Alert variant="warning" title="Very long list">
          Only the first {nf(PARSE_LIMIT)} values were checked; {nf(truncated)} more were ignored.
        </Alert>
      )}

      {entries.length > 1 && (
        <div className="flex flex-col gap-2" data-testid="decode-table">
          <p className="text-sm text-fg-secondary" aria-live="polite" data-testid="decode-summary">
            <strong className="font-semibold text-fg">{nf(valid.length)}</strong> valid, <strong className="font-semibold text-fg">{nf(entries.length - valid.length)}</strong> not valid of {nf(entries.length)}. Select a row to inspect it.
          </p>
          <div className="scroll-thin max-h-72 overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[32rem] border-collapse text-left text-[13px]">
              <thead className="sticky top-0 bg-surface-2">
                <tr className="border-b border-border">
                  <th scope="col" className="label-mono w-10 px-3 py-2 font-normal">
                    #
                  </th>
                  <th scope="col" className="label-mono px-3 py-2 font-normal">
                    Value
                  </th>
                  <th scope="col" className="label-mono px-3 py-2 font-normal">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, TABLE_LIMIT).map((e, i) => {
                  const isActive = i === Math.min(picked, entries.length - 1);
                  const label = e.parsed.ok ? shortType(decodeId(e.parsed.value)) : e.parsed.reason;
                  return (
                    <tr key={i} className={cn("border-b border-border last:border-b-0", isActive && "bg-primary-soft")}>
                      <td className="px-3 py-1.5 tabular-nums text-muted">{i + 1}</td>
                      <td className="px-3 py-1.5 font-mono">
                        <button type="button" onClick={() => setPicked(i)} aria-pressed={isActive} className="max-w-[18rem] truncate text-left underline-offset-2 hover:underline" title={e.token}>
                          {e.token}
                        </button>
                      </td>
                      <td className={cn("px-3 py-1.5", e.parsed.ok ? "text-success" : "text-danger")}>{label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {entries.length > TABLE_LIMIT && <p className="text-xs text-muted">Showing the first {TABLE_LIMIT} rows. The counts above cover all {nf(entries.length)} values.</p>}
        </div>
      )}

      {active &&
        (active.parsed.ok ? (
          <Details value={active.parsed.value} />
        ) : (
          <Alert variant="error" title={entries.length > 1 ? `Row ${Math.min(picked, entries.length - 1) + 1} is not a valid UUID or ULID` : "Not a valid UUID or ULID"}>
            <span data-testid="decode-error">{active.parsed.reason}</span>
          </Alert>
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function UuidGenerator() {
  const [prefsRaw, setPrefs, prefsMeta] = usePersistentState<Prefs>("uuid-generator:prefs:v1", DEFAULT_PREFS, { storage: "local" });
  const [draftRaw, setDraft, draftMeta] = usePersistentState<Draft>("uuid-generator:draft:v1", DEFAULT_DRAFT);
  const prefs = useMemo(() => normalizePrefs(prefsRaw), [prefsRaw]);
  const draft = useMemo(() => normalizeDraft(draftRaw), [draftRaw]);
  const updatePrefs = (patch: Partial<Prefs>) => setPrefs((p) => ({ ...normalizePrefs(p), ...patch }));
  const updateDraft = (patch: Partial<Draft>) => setDraft((d) => ({ ...normalizeDraft(d), ...patch }));

  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const { type, count, nanoLength, nanoAlphabet } = prefs;
  const { namespace, customNs, names } = draft;
  const built = useMemo(() => buildRequest({ type, count, nanoLength, nanoAlphabet, namespace, customNs, names }), [type, count, nanoLength, nanoAlphabet, namespace, customNs, names]);
  // A new request object is made for every change to what is generated (and for
  // every press of Generate), but not for display-only options like uppercase.
  const request = useMemo(() => (built.ok ? { req: built.req, nonce } : null), [built, nonce]);

  const ready = prefsMeta.restored && draftMeta.restored;
  useEffect(() => {
    if (!ready || !request) return;
    let cancelled = false;
    generateBatch(request.req, browserEnv()).then(
      (ids) => {
        if (!cancelled) setResult({ request, type: request.req.type, ids, error: null });
      },
      (e: unknown) => {
        if (!cancelled) setResult({ request, type: request.req.type, ids: [], error: e instanceof Error ? e.message : "Generation failed." });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [ready, request]);

  const shown = built.ok ? result : null;
  const busy = ready && request !== null && (result === null || result.request !== request);
  const info = TYPES.find((t) => t.value === type) ?? TYPES[0];
  const uuidLike = isUuidFamily(type);

  const output = useMemo(
    () => (shown ? formatBatch(shown.ids, shown.type, { uppercase: prefs.uppercase, noDashes: prefs.noDashes, braces: prefs.braces, layout: prefs.layout }) : ""),
    [shown, prefs.uppercase, prefs.noDashes, prefs.braces, prefs.layout],
  );
  const lineCount = useMemo(() => {
    let n = 1;
    for (let i = 0; i < output.length; i++) if (output.charCodeAt(i) === 10) n++;
    return n;
  }, [output]);
  const ordered = useMemo(() => Boolean(shown && shown.ids.length > 1 && (shown.type === "v7" || shown.type === "v6" || shown.type === "ulid") && isStrictlyIncreasing(shown.ids)), [shown]);

  const errorFor = (name: FieldName) => (!built.ok && built.field === name ? built.message : undefined);
  const generatedCount = shown ? shown.ids.length : 0;
  const isNameBased = type === "v3" || type === "v5";
  const isFixed = type === "nil" || type === "max";
  const shownInfo = shown ? (TYPES.find((t) => t.value === shown.type) ?? info) : info;

  const download = () => {
    const json = prefs.layout === "json";
    downloadText(output, `${shown?.type ?? "ids"}-${generatedCount}.${json ? "json" : "txt"}`, json ? "application/json" : "text/plain;charset=utf-8");
  };

  return (
    <ToolPanel>
      <Tabs<Mode>
        label="Tool mode"
        value={draft.mode}
        onChange={(mode) => updateDraft({ mode })}
        options={[
          { value: "generate", label: "Generate" },
          { value: "decode", label: "Decode & validate" },
        ]}
        className="self-start"
      />

      {draft.mode === "decode" ? (
        <DecodePanel text={draft.decodeText} onText={(decodeText) => updateDraft({ decodeText })} />
      ) : (
        <>
          <section aria-label="ID type" className="flex flex-col gap-2.5">
            <span id="uuid-type-label" className="label-mono">
              ID type
            </span>
            <div role="group" aria-labelledby="uuid-type-label" className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => {
                const active = t.value === type;
                return (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updatePrefs({ type: t.value })}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                      active ? "border-ink bg-ink text-ink-fg shadow-sm" : "border-border-strong bg-surface text-fg hover:bg-surface-2",
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-fg-secondary" data-testid="type-blurb">
              {info.blurb}
            </p>
          </section>

          <section aria-label="Options" className="flex flex-col gap-4">
            {isFixed && <Alert variant="info">{type === "nil" ? "The nil UUID" : "The max UUID"} is a fixed value, so there is nothing to configure.</Alert>}

            {!isFixed && !isNameBased && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="How many"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={prefs.count}
                  onChange={(e) => updatePrefs({ count: e.target.value })}
                  hint={`1 to ${nf(MAX_COUNT)}`}
                  error={errorFor("count")}
                />
                {type === "nanoid" && (
                  <>
                    <Input
                      label="Length"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={prefs.nanoLength}
                      onChange={(e) => updatePrefs({ nanoLength: e.target.value })}
                      hint={`1 to ${MAX_NANOID_LENGTH} characters`}
                      error={errorFor("length")}
                    />
                    <Select label="Alphabet" value={prefs.nanoAlphabet} onChange={(e) => updatePrefs({ nanoAlphabet: e.target.value as NanoAlphabet })} options={NANO_ALPHABET_OPTIONS} />
                  </>
                )}
              </div>
            )}

            {isNameBased && (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select label="Namespace" value={namespace} onChange={(e) => updateDraft({ namespace: e.target.value as NamespaceKey })} options={NAMESPACE_OPTIONS} hint={namespace === "custom" ? undefined : NAMESPACES[namespace].uuid} />
                  {namespace === "custom" && (
                    <Input
                      label="Namespace UUID"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      className="font-mono"
                      value={customNs}
                      onChange={(e) => updateDraft({ customNs: e.target.value })}
                      placeholder="6ba7b810-9dad-11d1-80b4-00c04fd430c8"
                      error={errorFor("namespace")}
                    />
                  )}
                </div>
                <Textarea
                  label="Names"
                  hint="One name per line; each line becomes one UUID. Lines are trimmed and blank lines are skipped."
                  mono
                  rows={4}
                  value={names}
                  onChange={(e) => updateDraft({ names: e.target.value })}
                  placeholder="www.example.com"
                  error={errorFor("names")}
                  spellCheck={false}
                />
              </div>
            )}
          </section>

          <section aria-label="Output format" className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <Toggle checked={prefs.uppercase} onChange={(uppercase) => updatePrefs({ uppercase })} label="Uppercase" disabled={!uuidLike} />
              <Toggle checked={prefs.noDashes} onChange={(noDashes) => updatePrefs({ noDashes })} label="No dashes" disabled={!uuidLike} />
              <Toggle checked={prefs.braces} onChange={(braces) => updatePrefs({ braces })} label="{Braces}" disabled={!uuidLike} />
              <Select label="Layout" selectSize="sm" value={prefs.layout} onChange={(e) => updatePrefs({ layout: e.target.value as Layout })} options={LAYOUTS} containerClassName="sm:-mt-1" />
            </div>
            {!uuidLike && <p className="text-xs text-muted">Case, dashes and braces apply to UUIDs only. {type === "ulid" ? "ULIDs are written in uppercase." : "NanoIDs are case-sensitive, so they are left as generated."} The layout still applies.</p>}
          </section>

          <ToolActions>
            <Button
              variant="accent"
              onClick={() => setNonce((n) => n + 1)}
              disabled={!built.ok}
              loading={busy && type === "v5"}
              leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}
            >
              {isNameBased ? "Generate" : "Generate new"}
            </Button>
            <CopyButton text={output} label="Copy all" variant="primary" disabled={!output} />
            <Button variant="secondary" onClick={download} disabled={!output} leftIcon={<Download className="h-4 w-4" aria-hidden />}>
              Download
            </Button>
            <Button
              variant="ghost"
              disabled={!shown || shown.ids.length === 0 || shown.type === "nanoid"}
              leftIcon={<Search className="h-4 w-4" aria-hidden />}
              onClick={() => shown && updateDraft({ mode: "decode", decodeText: shown.ids[0] })}
            >
              Decode first
            </Button>
          </ToolActions>

          {result?.error && shown && (
            <Alert variant="error" title="Could not generate">
              {result.error}
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <ResultBox
              label="Output"
              value={output}
              rows={Math.min(Math.max(lineCount, 3), 12)}
              mono
              copy={false}
              placeholder={busy ? "Generating…" : "Generated IDs appear here"}
            />
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted" aria-live="polite" data-testid="status">
              {busy && type === "v5" ? (
                <span>Hashing…</span>
              ) : shown && shown.ids.length > 0 ? (
                <span>
                  {nf(generatedCount)} {shownInfo.noun}
                  {generatedCount === 1 ? "" : "s"} · {nf(output.length)} characters
                </span>
              ) : (
                <span>Nothing generated yet.</span>
              )}
              {ordered && <Badge variant="success">strictly increasing</Badge>}
              {shown && shown.type === "v5" && generatedCount > 0 && <span>Deterministic: the same names always give the same UUIDs.</span>}
            </p>
          </div>
        </>
      )}

      <p className="text-xs text-muted">Everything is generated in your browser using its secure random number generator. Nothing is uploaded, and generated IDs are never saved.</p>
    </ToolPanel>
  );
}
