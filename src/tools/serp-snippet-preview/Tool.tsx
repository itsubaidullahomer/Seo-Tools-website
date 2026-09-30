"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ClipboardEvent } from "react";
import Link from "next/link";
import { Download, ImageDown, Link2, Upload, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Button, CopyButton, Input, Tabs, Textarea, Toggle, ToolActions, ToolPanel, ToolSection } from "@/components/ui";
import { downloadBlob } from "@/lib/utils";
import { LIMITS_REVIEWED, MAX_FIELD_CHARS, type Device } from "./config";
import { MAX_FAVICON_BYTES, fileToFavicon, getCanvasMeasurer, renderPng, type ExportCard } from "./canvas";
import type { FallbackMeasure } from "./measure";
import { CheckList, CompareTable, PixelMeter, SnippetCard } from "./parts";
import { buildChecks, buildLayout, compareRows, parseUrl, type SnippetLayout } from "./snippet";
import {
  AB_EXAMPLE,
  DEFAULT_FIELDS,
  DEFAULT_PREFS,
  EMPTY_FIELDS,
  decodeHash,
  encodeHash,
  extractHeadTags,
  headTags,
  sanitizeFields,
  sanitizePrefs,
  type DeviceView,
  type Fields,
  type Prefs,
} from "./state";

const DEVICE_LABEL: Record<Device, string> = { desktop: "Desktop", mobile: "Mobile" };
const DEVICE_TABS: { value: DeviceView; label: string }[] = [
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Mobile" },
  { value: "both", label: "Both" },
];
const THEME_TABS: { value: Prefs["theme"]; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const deserializeFields = (s: string) => sanitizeFields(JSON.parse(s));
const deserializePrefs = (s: string) => sanitizePrefs(JSON.parse(s));
const subscribeNone = () => () => {};
const noMeasurer = (): FallbackMeasure | null => null;

type Layouts = Record<Device, SnippetLayout>;

function buildBoth(title: string, description: string, url: string, siteName: string, date: string, query: string, fallback: FallbackMeasure | null): Layouts {
  const input = { title, description, url, siteName, date, query };
  return { desktop: buildLayout(input, "desktop", fallback), mobile: buildLayout(input, "mobile", fallback) };
}

/** Title and description inputs for one version, with pixel meters. */
function VersionFields({
  versionKey,
  heading,
  ids,
  title,
  description,
  onTitle,
  onDescription,
  onPaste,
  layouts,
}: {
  versionKey: "a" | "b";
  heading?: string;
  ids: { title: string; description: string };
  title: string;
  description: string;
  onTitle: (v: string) => void;
  onDescription: (v: string) => void;
  onPaste: (e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  layouts: Layouts;
}) {
  const d = layouts.desktop;
  return (
    <div className="flex min-w-0 flex-col gap-4" data-testid={`fields-${versionKey}`}>
      {heading && <h3 className="label-mono">{heading}</h3>}
      <div className="flex flex-col gap-2">
        <Input
          label={ids.title}
          labelAddon={`${d.titleChars} chars`}
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          onPaste={onPaste}
          placeholder="Your page title"
          autoComplete="off"
        />
        <PixelMeter id={versionKey} label={`${ids.title} width`} layouts={layouts} kind="title" />
      </div>
      <div className="flex flex-col gap-2">
        <Textarea
          label={ids.description}
          labelAddon={`${d.descriptionChars} chars`}
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          onPaste={onPaste}
          rows={3}
          placeholder="What the page offers, in a sentence or two"
        />
        <PixelMeter
          id={versionKey}
          label={`${ids.description} width`}
          layouts={layouts}
          kind="description"
          note={d.dateWidth > 0 ? `Includes the date prefix, about ${Math.round(d.dateWidth)} px.` : undefined}
        />
      </div>
      {(d.estimated || layouts.mobile.estimated) && (
        <p className="text-[11px] leading-snug text-muted">Emoji and non-Latin characters are measured with your browser&rsquo;s fonts, so their width is less certain.</p>
      )}
    </div>
  );
}

export default function SerpSnippetPreview() {
  const [fields, setFields, fieldsMeta] = usePersistentState<Fields>("serp-snippet-preview:fields", DEFAULT_FIELDS, { deserialize: deserializeFields });
  const [prefs, setPrefs, prefsMeta] = usePersistentState<Prefs>("serp-snippet-preview:prefs", DEFAULT_PREFS, { storage: "local", deserialize: deserializePrefs });
  const fallback = useSyncExternalStore(subscribeNone, getCanvasMeasurer, noMeasurer);

  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<"png" | "image" | null>(null);
  const [faviconError, setFaviconError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const touched = useRef(false);
  const hashApplied = useRef(false);

  const ready = fieldsMeta.restored && prefsMeta.restored;

  // Apply a shared link once, after the saved state has been restored. A link always wins.
  useEffect(() => {
    if (!ready || hashApplied.current) return;
    hashApplied.current = true;
    const decoded = decodeHash(window.location.hash);
    if (!decoded.found) return;
    touched.current = true;
    setFields((prev) => ({ ...prev, ...decoded.fields }));
    setPrefs((prev) => ({ ...prev, ...decoded.prefs }));
  }, [ready, setFields, setPrefs]);

  // Keep the address bar in step with the tool, debounced. The uploaded favicon is never included.
  useEffect(() => {
    if (!ready || !touched.current) return;
    const timer = setTimeout(() => {
      const hash = encodeHash(fields, prefs);
      const url = `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ""}`;
      try {
        window.history.replaceState(window.history.state, "", url);
      } catch {
        /* history can be unavailable in sandboxed frames */
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [fields, prefs, ready]);

  // Status messages disappear on their own.
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 5000);
    return () => clearTimeout(timer);
  }, [status]);

  const patch = useCallback(
    (p: Partial<Fields>) => {
      touched.current = true;
      setFields((prev) => ({ ...prev, ...p }));
    },
    [setFields],
  );
  const patchPrefs = useCallback(
    (p: Partial<Prefs>) => {
      touched.current = true;
      setPrefs((prev) => ({ ...prev, ...p }));
    },
    [setPrefs],
  );

  const { title, description, title2, description2, url, siteName, date, query, favicon } = fields;
  const compare = prefs.compare;

  const layoutsA = useMemo(() => buildBoth(title, description, url, siteName, date, query, fallback), [title, description, url, siteName, date, query, fallback]);
  const layoutsB = useMemo(
    () => (compare ? buildBoth(title2, description2, url, siteName, date, query, fallback) : null),
    [compare, title2, description2, url, siteName, date, query, fallback],
  );
  const checksA = useMemo(() => buildChecks({ title, description, query }, layoutsA, fallback), [title, description, query, layoutsA, fallback]);
  const checksB = useMemo(
    () => (layoutsB ? buildChecks({ title: title2, description: description2, query }, layoutsB, fallback) : null),
    [title2, description2, query, layoutsB, fallback],
  );
  const rows = useMemo(
    () =>
      layoutsB && checksB
        ? compareRows({ input: { title, description, query }, layouts: layoutsA, checks: checksA }, { input: { title: title2, description: description2, query }, layouts: layoutsB, checks: checksB })
        : null,
    [layoutsA, layoutsB, checksA, checksB, title, description, title2, description2, query],
  );

  const urlInfo = parseUrl(url);
  const devices: Device[] = prefs.device === "both" ? ["desktop", "mobile"] : [prefs.device];
  const versions = [
    { key: "a", name: "Version A", layouts: layoutsA },
    ...(layoutsB ? [{ key: "b", name: "Version B", layouts: layoutsB }] : []),
  ];
  const cards = versions.flatMap((v) =>
    devices.map((d) => ({
      id: `${v.key}-${d}`,
      label: compare ? `${v.name} · ${DEVICE_LABEL[d]}` : DEVICE_LABEL[d],
      layout: v.layouts[d],
    })),
  );
  const hasContent = !!(title.trim() || description.trim() || (compare && (title2.trim() || description2.trim())));
  const clipped = [title, description, ...(compare ? [title2, description2] : [])].some((t) => t.length > MAX_FIELD_CHARS);

  const onPasteTags = (target: "a" | "b") => (e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const found = extractHeadTags(e.clipboardData.getData("text"));
    if (!found) return;
    e.preventDefault();
    const p: Partial<Fields> = {};
    if (found.title !== undefined) p[target === "a" ? "title" : "title2"] = found.title;
    if (found.description !== undefined) p[target === "a" ? "description" : "description2"] = found.description;
    patch(p);
  };

  const exportCards = (): ExportCard[] => cards.map((c) => ({ label: c.label, layout: c.layout }));

  const downloadPng = async () => {
    setBusy("png");
    try {
      const blob = await renderPng(exportCards(), { theme: prefs.theme, favicon });
      downloadBlob(blob, "serp-snippet-preview.png");
      setStatus({ kind: "success", text: "PNG downloaded. It carries a small “not a real search result” watermark." });
    } catch (err) {
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "The PNG could not be created." });
    } finally {
      setBusy(null);
    }
  };

  const copyImage = async () => {
    setBusy("image");
    try {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
        throw new Error("This browser cannot copy images to the clipboard. Use Download PNG instead.");
      }
      const blob = await renderPng(exportCards(), { theme: prefs.theme, favicon });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setStatus({ kind: "success", text: "Image copied to the clipboard." });
    } catch (err) {
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "The image could not be copied. Use Download PNG instead." });
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    const hash = encodeHash(fields, prefs);
    const link = `${window.location.origin}${window.location.pathname}${hash ? `#${hash}` : ""}`;
    try {
      await navigator.clipboard.writeText(link);
      setStatus({ kind: "success", text: "Link copied. It holds your text and settings but not an uploaded favicon." });
    } catch {
      setStatus({ kind: "error", text: "The link could not be copied. The address bar already holds it." });
    }
  };

  const onFavicon = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FAVICON_BYTES) {
      setFaviconError("That file is over 2 MB. A favicon is normally a few kilobytes.");
      return;
    }
    try {
      patch({ favicon: await fileToFavicon(file) });
      setFaviconError("");
    } catch {
      setFaviconError("That image could not be read. Try a PNG, JPG, SVG or ICO file.");
    }
  };

  const details = (row: boolean) => (
    <div className={row ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-3 sm:grid-cols-2"}>
      <Input
        label="Page URL"
        containerClassName={row ? "lg:col-span-2" : "sm:col-span-2"}
        value={url}
        onChange={(e) => patch({ url: e.target.value })}
        placeholder="https://www.example.com/blog/post"
        autoComplete="off"
        inputMode="url"
        error={!urlInfo.empty && !urlInfo.valid ? "Enter a full address such as https://www.example.com/page. The preview shows example.com until it is valid." : undefined}
      />
      <Input label="Site name" value={siteName} onChange={(e) => patch({ siteName: e.target.value })} placeholder="Leave empty to use the domain" autoComplete="off" />
      <Input label="Date (optional)" type="date" value={date} onChange={(e) => patch({ date: e.target.value })} hint="Shown before the description." />
      <Input
        label="Search query"
        containerClassName={row ? "lg:col-span-2" : "sm:col-span-2"}
        value={query}
        onChange={(e) => patch({ query: e.target.value })}
        placeholder="e.g. sourdough starter schedule"
        autoComplete="off"
        hint="Matching words in the description are shown in bold."
      />
      <div className={row ? "flex flex-col gap-1.5 lg:col-span-2" : "flex flex-col gap-1.5 sm:col-span-2"}>
        <span className="text-[13px] font-medium text-fg" id="favicon-label">
          Favicon (optional)
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon"
            className="sr-only"
            aria-labelledby="favicon-label"
            data-testid="favicon-input"
            onChange={(e) => {
              void onFavicon(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button variant="secondary" size="sm" leftIcon={<Upload className="h-3.5 w-3.5" aria-hidden />} onClick={() => fileRef.current?.click()}>
            {favicon ? "Replace image" : "Upload image"}
          </Button>
          {favicon && (
            <Button variant="ghost" size="sm" leftIcon={<X className="h-3.5 w-3.5" aria-hidden />} onClick={() => patch({ favicon: "" })}>
              Remove
            </Button>
          )}
          <span className="text-xs text-muted">{favicon ? "Using your image." : "A letter is used until you add one."} It stays on your device.</span>
        </div>
        {faviconError && (
          <p className="text-xs font-medium text-danger" role="alert">
            {faviconError}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <ToolPanel>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <span className="label-mono">Device</span>
          <Tabs<DeviceView> label="Preview device" value={prefs.device} onChange={(device) => patchPrefs({ device })} options={DEVICE_TABS} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="label-mono">Preview theme</span>
          <Tabs<Prefs["theme"]> label="Preview theme" value={prefs.theme} onChange={(theme) => patchPrefs({ theme })} options={THEME_TABS} />
        </div>
        <Toggle
          checked={compare}
          onChange={(v) => {
            if (v && !title2 && !description2) patch({ title2: title, description2: description });
            patchPrefs({ compare: v });
          }}
          label="Compare two versions"
          description="A/B test a rewrite side by side."
          className="pb-1"
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              patch({ ...EMPTY_FIELDS, ...DEFAULT_FIELDS, ...AB_EXAMPLE, favicon });
              patchPrefs({ compare: true });
            }}
          >
            Load A/B example
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              patch({ ...EMPTY_FIELDS });
              setFaviconError("");
            }}
          >
            Clear all
          </Button>
        </div>
      </div>

      {compare ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <VersionFields
              versionKey="a"
              heading="Version A"
              ids={{ title: "Version A title", description: "Version A description" }}
              title={title}
              description={description}
              onTitle={(v) => patch({ title: v })}
              onDescription={(v) => patch({ description: v })}
              onPaste={onPasteTags("a")}
              layouts={layoutsA}
            />
            {layoutsB && (
              <VersionFields
                versionKey="b"
                heading="Version B"
                ids={{ title: "Version B title", description: "Version B description" }}
                title={title2}
                description={description2}
                onTitle={(v) => patch({ title2: v })}
                onDescription={(v) => patch({ description2: v })}
                onPaste={onPasteTags("b")}
                layouts={layoutsB}
              />
            )}
          </div>
          <ToolSection title="Page details" description="Shared by both versions. Nothing is fetched from your site: paste your text, or paste a whole title or meta description tag into a field.">
            {details(true)}
          </ToolSection>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <VersionFields
            versionKey="a"
            ids={{ title: "Page title", description: "Meta description" }}
            title={title}
            description={description}
            onTitle={(v) => patch({ title: v })}
            onDescription={(v) => patch({ description: v })}
            onPaste={onPasteTags("a")}
            layouts={layoutsA}
          />
          <div className="flex min-w-0 flex-col gap-3 lg:border-l lg:border-border lg:pl-6">
            <div>
              <h3 className="label-mono">Page details</h3>
              <p className="mt-1 text-xs text-muted">Nothing is fetched from your site. Paste your text, or paste a whole title or meta description tag into a field.</p>
            </div>
            {details(false)}
          </div>
        </div>
      )}

      {clipped && <Alert variant="warning">Only the first {MAX_FIELD_CHARS.toLocaleString("en-US")} characters of each field are previewed.</Alert>}

      <ToolSection title="Preview" description="Estimated layout drawn from Arial-compatible letter widths. Real results vary by query, device and font.">
        {!hasContent && (
          <Alert variant="info" title="Add a title and description">
            Type or paste them above and the result card updates as you go. Use Load A/B example to see a rewrite next to the original.
          </Alert>
        )}
        <div className="flex flex-wrap items-start gap-4" data-testid="previews">
          {cards.map((c) => (
            <figure key={c.id} className="m-0 min-w-0 max-w-full">
              <figcaption className="label-mono mb-1.5">{c.label}</figcaption>
              <div className="scroll-thin max-w-full overflow-x-auto rounded-xl">
                <SnippetCard id={c.id} layout={c.layout} theme={prefs.theme} favicon={favicon} />
              </div>
            </figure>
          ))}
        </div>
        {devices.includes("desktop") && <p className="text-xs text-muted md:hidden">The desktop card is 640 px wide. Swipe it sideways to see all of it.</p>}
        <ToolActions>
          <Button variant="accent" onClick={downloadPng} loading={busy === "png"} disabled={!hasContent || busy !== null} leftIcon={<Download className="h-4 w-4" aria-hidden />}>
            Download PNG
          </Button>
          <Button variant="secondary" onClick={copyImage} loading={busy === "image"} disabled={!hasContent || busy !== null} leftIcon={<ImageDown className="h-4 w-4" aria-hidden />}>
            Copy image
          </Button>
          <Button variant="outline" onClick={copyLink} leftIcon={<Link2 className="h-4 w-4" aria-hidden />}>
            Copy link
          </Button>
          <CopyButton variant="outline" text={headTags(title, description)} label={compare ? "Copy tags A" : "Copy HTML tags"} disabled={!title.trim() && !description.trim()} />
          {compare && <CopyButton variant="outline" text={headTags(title2, description2)} label="Copy tags B" disabled={!title2.trim() && !description2.trim()} />}
        </ToolActions>
        {status && (
          <Alert variant={status.kind === "success" ? "success" : "error"} className="py-2">
            {status.text}
          </Alert>
        )}
      </ToolSection>

      <ToolSection title="Snippet check" description="Quick checks against the same width budgets as the preview.">
        {compare && checksB ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <h4 className="label-mono">Version A</h4>
              <CheckList checks={checksA} label="Checks for version A" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <h4 className="label-mono">Version B</h4>
              <CheckList checks={checksB} label="Checks for version B" />
            </div>
          </div>
        ) : (
          <CheckList checks={checksA} label="Checks for your snippet" />
        )}
      </ToolSection>

      {rows && (
        <ToolSection title="A/B comparison" description="Estimated pixel widths against each device budget, and how many of your query words each version uses.">
          <CompareTable rows={rows} />
        </ToolSection>
      )}

      <div className="flex flex-col gap-1 border-t border-border pt-4 text-xs leading-relaxed text-muted">
        <p className="font-medium text-fg-secondary">Illustration only. Not affiliated with or endorsed by Google.</p>
        <p>
          Widths are estimates with the same limits as the{" "}
          <Link href="/tools/title-meta-description-length-checker" className="text-primary hover:underline">
            title tag and meta description length checker
          </Link>{" "}
          (reviewed {LIMITS_REVIEWED}): title 600 px desktop and 540 px mobile at 20 px, description 920 px desktop and 680 px mobile at 14 px. Google publishes no fixed numbers, so leave a margin.
        </p>
      </div>
    </ToolPanel>
  );
}
