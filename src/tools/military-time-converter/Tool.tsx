"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Tabs, ToolPanel } from "@/components/ui";
import { describeNow } from "./logic";
import { BulkPanel } from "./BulkPanel";
import { ChartPanel } from "./ChartPanel";
import { ConvertPanel } from "./ConvertPanel";
import { ZonesPanel } from "./ZonesPanel";
import { DEFAULTS, normalizeSettings, type Settings, type Tab } from "./settings";

const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: "convert", label: "Converter" },
  { value: "bulk", label: "List / timesheet" },
  { value: "chart", label: "Chart & print" },
  { value: "zones", label: "Zulu & zones" },
];

/** The current minute as a whole number, or null while server-rendering and hydrating. */
function subscribeToClock(callback: () => void): () => void {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}
const getMinute = (): number | null => Math.floor(Date.now() / 60_000);
const getServerMinute = (): number | null => null;

export default function MilitaryTimeConverter() {
  const [stored, setStored] = usePersistentState<Settings>("military-time-converter:v1", DEFAULTS);
  const s = useMemo(() => normalizeSettings(stored), [stored]);
  const update = useCallback((patch: Partial<Settings>) => setStored((prev) => ({ ...normalizeSettings(prev), ...patch })), [setStored]);

  // The clock is only read on the client, after hydration, so the prerendered page stays fixed.
  const minute = useSyncExternalStore(subscribeToClock, getMinute, getServerMinute);
  const now = useMemo(() => (minute === null ? null : describeNow(minute)), [minute]);

  return (
    <ToolPanel>
      <Tabs label="Converter mode" value={s.tab} onChange={(tab) => update({ tab })} options={TAB_OPTIONS} className="self-start flex-wrap gap-0.5" />
      <div role="tabpanel" aria-label={TAB_OPTIONS.find((t) => t.value === s.tab)?.label}>
        {s.tab === "convert" && <ConvertPanel s={s} update={update} now={now} />}
        {s.tab === "bulk" && <BulkPanel s={s} update={update} />}
        {s.tab === "chart" && <ChartPanel s={s} update={update} now={now} />}
        {s.tab === "zones" && <ZonesPanel s={s} update={update} now={now} />}
      </div>
      <p className="text-xs text-muted">
        Everything is calculated in your browser and nothing you type is sent anywhere. Military time is a way of writing the time, not a legal or safety standard: for medical, aviation
        or payroll records, follow your organization&apos;s own rules.
      </p>
    </ToolPanel>
  );
}
