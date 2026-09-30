import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { BoardLayout, KeyDef } from "./layouts";

export type KeyState = "untested" | "tested" | "pressed" | "chatter" | "skipped";

const BG: Record<KeyState, string> = {
  untested: "bg-surface",
  tested: "bg-success-soft",
  pressed: "bg-primary",
  chatter: "bg-danger-soft",
  skipped: "bg-transparent",
};
const TEXT: Record<KeyState, string> = {
  untested: "text-fg-secondary",
  tested: "text-fg",
  pressed: "text-primary-fg",
  chatter: "text-danger",
  skipped: "text-muted",
};
const EDGE: Record<KeyState, string> = {
  untested: "border-border-strong",
  tested: "border-success/50",
  pressed: "border-primary",
  chatter: "border-danger/60",
  skipped: "border-border border-dashed",
};
const EDGE_BG: Record<KeyState, string> = {
  untested: "bg-border-strong",
  tested: "bg-success/50",
  pressed: "bg-primary",
  chatter: "bg-danger/60",
  skipped: "bg-border",
};
const MARKER: Partial<Record<KeyState, string>> = { tested: "✓", chatter: "!" };

/** Inverted-L outline of the ISO Enter key inside its 1.5u x 2u box. */
const ISO_ENTER_CLIP = "polygon(0 0, 100% 0, 100% 100%, 16.667% 100%, 16.667% 50%, 0 50%)";

/** Swatch classes reused by the legend so it always matches the keys. */
export function swatchClass(state: KeyState): string {
  return cn("inline-block h-4 w-6 rounded-[4px] border", BG[state], EDGE[state]);
}

interface KeyCapProps {
  def: KeyDef;
  label: string;
  state: KeyState;
  layout: BoardLayout;
}

function KeyCap({ def, label, state, layout }: KeyCapProps) {
  const style: CSSProperties = {
    left: `${(def.x / layout.width) * 100}%`,
    top: `${(def.y / layout.height) * 100}%`,
    width: `${(def.w / layout.width) * 100}%`,
    height: `${(def.h / layout.height) * 100}%`,
    padding: "calc(var(--u) * 0.045)",
    // Long names on narrow caps (Control, Backspace on a 1u key ...) shrink instead of clipping.
    fontSize: `clamp(5px, calc(var(--u) * ${label.length >= 7 && def.w < 1.5 ? 0.22 : 0.29}), 22px)`,
  };
  const marker = MARKER[state];
  const markerEl = marker ? (
    <span aria-hidden className="absolute right-[0.3em] top-[0.15em] text-[0.7em] leading-none">
      {marker}
    </span>
  ) : null;

  return (
    <div className="absolute" style={style} data-code={def.code} data-state={state} title={def.code}>
      {def.shape === "iso-enter" ? (
        <div className={cn("relative h-full w-full", TEXT[state])} style={{ clipPath: ISO_ENTER_CLIP }}>
          <div className={cn("absolute inset-0", EDGE_BG[state])} />
          <div className={cn("absolute inset-[1px]", BG[state])} style={{ clipPath: ISO_ENTER_CLIP }} />
          <div className="absolute inset-x-0 top-0 flex h-1/2 items-center justify-center font-medium leading-none">{label}</div>
          {markerEl}
        </div>
      ) : (
        <div
          className={cn(
            "relative flex h-full w-full items-center justify-center overflow-hidden rounded-[0.35em] border font-medium leading-none whitespace-nowrap transition-[background-color,border-color,color,transform] duration-75",
            BG[state],
            TEXT[state],
            EDGE[state],
            state === "pressed" ? "translate-y-[0.08em]" : "shadow-[inset_0_-0.12em_0_var(--border)]",
            state === "skipped" && "opacity-60 shadow-none",
          )}
        >
          {label}
          {markerEl}
        </div>
      )}
    </div>
  );
}

export interface KeyboardViewProps {
  layout: BoardLayout;
  labels: Record<string, string>;
  held: ReadonlySet<string>;
  seen: Record<string, string>;
  chatter: ReadonlySet<string>;
  skipped: Record<string, true>;
  fullscreen: boolean;
}

/**
 * The keyboard drawing. Keys are absolutely positioned in percentages of one
 * aspect-ratio box, so the height is fixed for a given width and pressing keys
 * can never shift the page.
 */
export function KeyboardView({ layout, labels, held, seen, chatter, skipped, fullscreen }: KeyboardViewProps) {
  const stateOf = (code: string): KeyState => {
    if (held.has(code)) return "pressed";
    if (chatter.has(code)) return "chatter";
    if (seen[code] !== undefined) return "tested";
    if (skipped[code]) return "skipped";
    return "untested";
  };
  const container = {
    containerType: "inline-size",
    aspectRatio: `${layout.width} / ${layout.height}`,
    minWidth: layout.width * 12,
    maxWidth: fullscreen ? undefined : layout.width * 64,
    ["--u" as string]: `calc(100cqw / ${layout.width})`,
  } as CSSProperties;

  return (
    <div className="scroll-thin overflow-x-auto">
      <div className="relative mx-auto" style={container} data-testid="keyboard">
        {layout.keys.map((def) => (
          <KeyCap key={def.code} def={def} label={labels[def.code] ?? def.label} state={stateOf(def.code)} layout={layout} />
        ))}
      </div>
    </div>
  );
}
