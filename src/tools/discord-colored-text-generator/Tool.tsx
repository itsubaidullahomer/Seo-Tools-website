"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Bold, Download, Eraser, RotateCcw, TextSelect, Trash2, Underline, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Button, CopyButton, Select, Stat, StatGrid, Tabs, Textarea, ToolActions, ToolPanel, ToolSection } from "@/components/ui";
import { cn, downloadText, formatNumber } from "@/lib/utils";
import {
  EMPTY_DOC,
  FENCE_OVERHEAD,
  LIMIT_EXTENDED,
  LIMIT_STANDARD,
  MAX_TEXT_LENGTH,
  applyEdit,
  applyPatch,
  buildMessage,
  buildSegments,
  clearRange,
  normalizeDoc,
  segmentStyle,
  selectionInfo,
  snapRange,
  toCodeString,
  toVisible,
  type Doc,
  type StylePatch,
} from "./logic";
import { PALETTES, THEMES, findLowContrast, swatchHex, type PaletteId, type Swatch, type ThemeId } from "./palette";
import { EXAMPLES } from "./examples";

type OutputView = "discord" | "readable" | "code";

interface Prefs {
  theme: ThemeId;
  palette: PaletteId;
  view: OutputView;
}

const DEFAULT_PREFS: Prefs = { theme: "dark", palette: "classic", view: "discord" };

/** Stored preferences may be missing or hand-edited; rebuild them field by field. */
function normalizePrefs(raw: unknown): Prefs {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    theme: r.theme === "light" || r.theme === "dark" ? r.theme : DEFAULT_PREFS.theme,
    palette: r.palette === "classic" || r.palette === "matched" ? r.palette : DEFAULT_PREFS.palette,
    view: r.view === "discord" || r.view === "readable" || r.view === "code" ? r.view : DEFAULT_PREFS.view,
  };
}

interface Notice {
  variant: "info" | "success";
  text: string;
}

function plural(n: number, one: string, many: string): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}

function SwatchRow({
  label,
  kind,
  swatches,
  activeCode,
  onPick,
  onClear,
}: {
  label: string;
  kind: "Text" | "Background";
  swatches: Swatch[];
  /** Code shared by the whole selection, 0 for none, -1 for mixed. */
  activeCode: number;
  onPick: (code: number) => void;
  onClear: () => void;
}) {
  const ring = "ring-2 ring-primary ring-offset-2 ring-offset-surface";
  return (
    <div className="flex flex-col gap-2">
      <p className="label-mono">{label}</p>
      <div className="grid grid-cols-5 gap-x-2 gap-y-2.5 sm:grid-cols-9">
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onClear}
            aria-label={`${kind} color: none (default)`}
            aria-pressed={activeCode === 0}
            title={`${kind} color: none (default)`}
            className={cn("flex h-9 w-full items-center justify-center rounded-md border border-border-strong bg-surface text-muted hover:bg-surface-2", activeCode === 0 && ring)}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <span className="font-mono text-[10px] text-muted">none</span>
        </div>
        {swatches.map((s) => (
          <div key={s.code} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => onPick(s.code)}
              aria-label={`${kind} color: ${s.name} (code ${s.code})`}
              aria-pressed={activeCode === s.code}
              title={`${s.name} (code ${s.code})`}
              style={{ backgroundColor: s.hex }}
              className={cn("h-9 w-full rounded-md border border-border-strong transition-transform hover:scale-105", activeCode === s.code && ring)}
            />
            <span className="font-mono text-[10px] text-muted">{s.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DiscordColoredTextGenerator() {
  // The draft lives in this tab's session storage; display preferences persist on this device.
  const [storedDoc, setStoredDoc] = usePersistentState<Doc>("discord-colored-text-generator:doc", EMPTY_DOC);
  const [storedPrefs, setStoredPrefs] = usePersistentState<Prefs>("discord-colored-text-generator:prefs", DEFAULT_PREFS, { storage: "local" });
  const doc = useMemo(() => normalizeDoc(storedDoc), [storedDoc]);
  const prefs = useMemo(() => normalizePrefs(storedPrefs), [storedPrefs]);

  const [sel, setSel] = useState({ start: 0, end: 0 });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [hint, setHint] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const caretRef = useRef<number | null>(null);

  // After pasted ANSI text is converted, the browser's caret jumps to the end: put it back.
  useEffect(() => {
    const ta = taRef.current;
    if (caretRef.current !== null && ta) {
      const c = Math.min(caretRef.current, ta.value.length);
      ta.setSelectionRange(c, c);
      caretRef.current = null;
    }
  }, [doc]);

  const length = doc.text.length;
  const [selStart, selEnd] = snapRange(doc.text, sel.start, sel.end);
  const info = useMemo(() => selectionInfo(doc.spans, length, selStart, selEnd), [doc.spans, length, selStart, selEnd]);

  const palette = PALETTES[prefs.palette];
  const theme = THEMES[prefs.theme];

  const { message, rendered } = useMemo(() => buildMessage(doc.text, doc.spans), [doc]);
  const readable = useMemo(() => toVisible(message), [message]);
  const codeString = useMemo(() => toCodeString(message), [message]);
  const segments = useMemo(() => buildSegments(doc.text, doc.spans), [doc]);
  const lowContrast = useMemo(() => findLowContrast(doc.text, doc.spans, prefs.palette, prefs.theme), [doc, prefs.palette, prefs.theme]);

  const display = prefs.view === "discord" ? message : prefs.view === "readable" ? readable : codeString;
  const messageLength = message.length;
  const codeOverhead = message ? messageLength - length - FENCE_OVERHEAD - rendered.fenceBreaks : 0;

  const setPrefs = (patch: Partial<Prefs>) => setStoredPrefs({ ...prefs, ...patch });

  /** The range to style: the live textarea selection, or the last one seen if focus moved away. */
  const currentRange = (): [number, number] => {
    const ta = taRef.current;
    let s = sel.start;
    let e = sel.end;
    if (ta && (ta.selectionStart !== ta.selectionEnd || document.activeElement === ta)) {
      s = ta.selectionStart;
      e = ta.selectionEnd;
    }
    return snapRange(doc.text, s, e);
  };

  const commitSpans = (spans: Doc["spans"]) => setStoredDoc({ text: doc.text, spans });

  const style = (patch: StylePatch) => {
    const [s, e] = currentRange();
    if (s >= e) {
      setHint("Select some text in the box first, then pick a color.");
      return;
    }
    setHint("");
    commitSpans(applyPatch(doc.spans, length, s, e, patch));
  };

  const toggleFlag = (flag: "bold" | "underline") => {
    const [s, e] = currentRange();
    if (s >= e) {
      setHint("Select some text in the box first.");
      return;
    }
    setHint("");
    const current = selectionInfo(doc.spans, length, s, e);
    commitSpans(applyPatch(doc.spans, length, s, e, { [flag]: current?.[flag] !== "all" }));
  };

  const clearSelectionStyle = () => {
    const [s, e] = currentRange();
    if (s >= e) {
      setHint("Select some text in the box first.");
      return;
    }
    setHint("");
    commitSpans(clearRange(doc.spans, length, s, e));
  };

  const onTextChange = (ev: ChangeEvent<HTMLTextAreaElement>) => {
    const t = ev.target;
    const res = applyEdit(doc, t.value);
    setStoredDoc(res.doc);
    if (res.caret !== null) {
      caretRef.current = res.caret;
      setSel({ start: res.caret, end: res.caret });
    } else {
      setSel({ start: t.selectionStart, end: t.selectionEnd });
    }
    setHint("");
    if (res.importedSections > 0) {
      setNotice({ variant: "success", text: `Imported ${plural(res.importedSections, "styled section", "styled sections")} from the pasted ANSI text. You can keep editing them.` });
    } else if (res.removedControls > 0) {
      setNotice({ variant: "info", text: `Removed ${plural(res.removedControls, "control character or escape sequence", "control characters or escape sequences")} that cannot be shown in a message.` });
    } else {
      setNotice(null);
    }
  };

  const loadDoc = (next: Doc) => {
    setStoredDoc(next);
    setSel({ start: 0, end: 0 });
    setNotice(null);
    setHint("");
  };

  const selectedCount = selEnd - selStart;
  const tooLong = messageLength > LIMIT_EXTENDED;
  const overStandard = messageLength > LIMIT_STANDARD;

  return (
    <ToolPanel>
      <Alert variant="info" title="Where colored text shows up (checked September 30, 2026)">
        <ul className="list-disc space-y-0.5 pl-4 text-[13px]">
          <li>Desktop app and web browser: colored ansi blocks render (reported since 2022).</li>
          <li>Phones: sources disagree and we could not test one, so send yourself a test message first.</li>
          <li>Colors: the palette was reportedly changed in August 2026, so the preview is approximate. The codes do not change.</li>
        </ul>
      </Alert>

      <div className="flex flex-col gap-3">
        <Textarea
          ref={taRef}
          label="1. Write your text"
          labelAddon={`${formatNumber(length)} characters`}
          value={doc.text}
          onChange={onTextChange}
          onSelect={(ev) => setSel({ start: ev.currentTarget.selectionStart, end: ev.currentTarget.selectionEnd })}
          placeholder="Type or paste your message. You can also paste a colored Discord message to edit it."
          rows={6}
          maxLength={MAX_TEXT_LENGTH}
          autoComplete="off"
          autoCapitalize="off"
        />
        <ToolActions>
          <span className="text-xs text-muted">Try an example:</span>
          {EXAMPLES.map((ex) => (
            <Button key={ex.id} variant="outline" size="sm" onClick={() => loadDoc(ex.doc)}>
              {ex.label}
            </Button>
          ))}
          <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />} onClick={() => loadDoc(EMPTY_DOC)} disabled={!length} className="ml-auto">
            Clear text
          </Button>
        </ToolActions>
        {notice && (
          <Alert variant={notice.variant}>
            <p>{notice.text}</p>
          </Alert>
        )}
        {length >= MAX_TEXT_LENGTH && (
          <Alert variant="warning">
            <p>The editor holds up to {formatNumber(MAX_TEXT_LENGTH)} characters. A Discord message is far shorter, so split long text across several messages.</p>
          </Alert>
        )}
      </div>

      <ToolSection title="2. Select words, then pick a color" description="Drag across text in the box above (or press Select all), then click a color, bold or underline. Use X to remove a color.">
        {/* Keep focus (and the visible selection) in the text box when a toolbar button is pressed. */}
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface-2 p-3 sm:p-4" onMouseDown={(ev) => ev.preventDefault()}>
          <div className="grid gap-4 md:grid-cols-2">
            <SwatchRow label="Text color" kind="Text" swatches={palette.text} activeCode={info ? info.fg : -1} onPick={(code) => style({ fg: code })} onClear={() => style({ fg: null })} />
            <SwatchRow label="Background color" kind="Background" swatches={palette.background} activeCode={info ? info.bg : -1} onPick={(code) => style({ bg: code })} onClear={() => style({ bg: null })} />
          </div>
          <ToolActions>
            <Button variant={info?.bold === "all" ? "primary" : "secondary"} size="sm" aria-pressed={info?.bold === "all"} leftIcon={<Bold className="h-3.5 w-3.5" aria-hidden />} onClick={() => toggleFlag("bold")}>
              Bold
            </Button>
            <Button variant={info?.underline === "all" ? "primary" : "secondary"} size="sm" aria-pressed={info?.underline === "all"} leftIcon={<Underline className="h-3.5 w-3.5" aria-hidden />} onClick={() => toggleFlag("underline")}>
              Underline
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Eraser className="h-3.5 w-3.5" aria-hidden />} onClick={clearSelectionStyle}>
              Clear style
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<TextSelect className="h-3.5 w-3.5" aria-hidden />}
              onClick={() => {
                taRef.current?.focus();
                taRef.current?.select();
              }}
              disabled={!length}
            >
              Select all
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />} onClick={() => commitSpans([])} disabled={!doc.spans.length}>
              Reset all styles
            </Button>
          </ToolActions>
        </div>
        <p role="status" aria-live="polite" className={cn("text-xs", hint ? "font-medium text-danger" : "text-muted")}>
          {hint || (selectedCount > 0 ? `${plural(selectedCount, "character", "characters")} selected.` : "Nothing selected yet.")}
        </p>
      </ToolSection>

      <ToolSection title="3. Preview and copy" description="The preview is an approximation of how an ansi code block looks. Only the escape codes in the message below are sent.">
        <div className="flex flex-wrap items-end gap-3">
          <Tabs label="Preview background" size="sm" value={prefs.theme} onChange={(v) => setPrefs({ theme: v })} options={(Object.keys(THEMES) as ThemeId[]).map((id) => ({ value: id, label: `${THEMES[id].label} preview` }))} />
          <Select
            label="Preview palette"
            selectSize="sm"
            value={prefs.palette}
            onChange={(ev) => setPrefs({ palette: ev.target.value === "matched" ? "matched" : "classic" })}
            options={(Object.keys(PALETTES) as PaletteId[]).map((id) => ({ value: id, label: PALETTES[id].label }))}
            containerClassName="w-full sm:w-auto sm:min-w-0 sm:flex-1 sm:max-w-md"
          />
        </div>

        <pre
          aria-label="Preview of the colored text"
          className="max-h-80 min-h-24 overflow-auto rounded-lg border border-border-strong p-3 font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap"
          style={{ backgroundColor: theme.background, color: theme.foreground }}
        >
          {segments.length === 0 ? (
            <span style={{ opacity: 0.6 }}>Your colored text appears here.</span>
          ) : (
            segments.map((seg, i) => {
              if (!seg.style) return <span key={i}>{seg.text}</span>;
              const st = segmentStyle(seg.style);
              return (
                <span
                  key={i}
                  style={{
                    color: st.fg ? swatchHex(prefs.palette, st.fg) : undefined,
                    backgroundColor: st.bg ? swatchHex(prefs.palette, st.bg) : undefined,
                    fontWeight: st.bold ? 700 : undefined,
                    textDecoration: st.underline ? "underline" : undefined,
                  }}
                >
                  {seg.text}
                </span>
              );
            })
          )}
        </pre>

        {lowContrast && (
          <Alert variant="warning">
            <p>
              {plural(lowContrast.count, "styled section", "styled sections")} (for example “{lowContrast.sample}”) may be hard to read on the {theme.label.toLowerCase()} preview, with a contrast of about {lowContrast.ratio.toFixed(1)}:1. Readers
              can use a different Discord theme, so add a background color or pick a stronger color.
            </p>
          </Alert>
        )}
        {rendered.fenceBreaks > 0 && (
          <Alert variant="info">
            <p>Your text contains three backticks in a row, which would end the code block early. An invisible zero-width space was added inside {plural(rendered.fenceBreaks, "place", "places")} to prevent that.</p>
          </Alert>
        )}

        <Tabs
          label="Output format"
          size="sm"
          value={prefs.view}
          onChange={(v) => setPrefs({ view: v })}
          options={[
            { value: "discord", label: "Paste into Discord" },
            { value: "readable", label: "Readable codes" },
            { value: "code", label: "Code string" },
          ]}
        />
        <div className="overflow-hidden rounded-lg border border-border-strong bg-surface-2">
          <div className="border-b border-border bg-surface px-3 py-1.5">
            <span className="label-mono">{prefs.view === "discord" ? "Message" : prefs.view === "readable" ? "Message with visible escape symbols" : "String for bots and scripts"}</span>
          </div>
          <textarea
            readOnly
            aria-label={prefs.view === "discord" ? "Message to paste into Discord" : prefs.view === "readable" ? "Message with visible escape symbols" : "Code string for bots and scripts"}
            value={display}
            placeholder="Your message appears here once you type some text."
            rows={6}
            spellCheck={false}
            onFocus={prefs.view === "discord" ? (ev) => ev.currentTarget.select() : undefined}
            className="block w-full resize-y bg-transparent px-3 py-2.5 font-mono text-[13px] leading-relaxed text-fg placeholder:text-muted/70 focus:outline-none"
          />
        </div>
        <ToolActions>
          <CopyButton variant="accent" text={prefs.view === "code" ? codeString : message} label={prefs.view === "code" ? "Copy code string" : "Copy message"} disabled={!message} />
          <Button variant="secondary" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadText(message, "discord-colored-text.txt")} disabled={!message}>
            Download .txt
          </Button>
        </ToolActions>
        <p className="text-xs text-muted">
          The escape characters are invisible in a normal text box. Copy always places the real characters on your clipboard. If copying fails, click the box above and press Ctrl+C (Cmd+C on Mac).
        </p>

        {tooLong && (
          <Alert variant="error" title="Too long for one message">
            <p>
              This message is {formatNumber(messageLength)} characters. Discord messages are limited to {formatNumber(LIMIT_STANDARD)} characters, or {formatNumber(LIMIT_EXTENDED)} with Nitro (limits checked September 30, 2026). Split it into several code blocks.
            </p>
          </Alert>
        )}
        {!tooLong && overStandard && (
          <Alert variant="warning" title="Longer than the standard limit">
            <p>
              This message is {formatNumber(messageLength)} characters. Accounts without Nitro can send up to {formatNumber(LIMIT_STANDARD)}, so shorten it or split it into two messages (limits checked September 30, 2026).
            </p>
          </Alert>
        )}

        <StatGrid>
          <Stat label="Message length" value={formatNumber(messageLength)} hint={`of ${formatNumber(LIMIT_STANDARD)} (${formatNumber(LIMIT_EXTENDED)} with Nitro)`} emphasis />
          <Stat label="Codes add" value={`+${formatNumber(codeOverhead)}`} hint="characters of escape codes" />
          <Stat label="Styled sections" value={formatNumber(rendered.runs)} hint="one per color change" />
          <Stat label="Your text" value={formatNumber(length)} hint="characters, before codes" />
        </StatGrid>
      </ToolSection>

      <p className="text-xs text-muted">Independent tool, not affiliated with or endorsed by Discord Inc. Your text stays in this browser tab and is not uploaded.</p>
    </ToolPanel>
  );
}
