import { useId } from "react";
import { cn } from "@/lib/utils";
import type { ButtonId, WheelDir } from "./logic";

export type PartState = "idle" | "down" | "tested";

interface Props {
  state: Record<ButtonId, PartState>;
  /** Direction the wheel is turning right now (clears itself shortly after the last event). */
  flash: WheelDir | null;
  /** Directions that have been scrolled at least once. */
  scrolled: { up: boolean; down: boolean };
  label: string;
  className?: string;
}

const PART: Record<PartState, string> = {
  idle: "fill-surface stroke-border-strong",
  tested: "fill-success-soft stroke-success",
  down: "fill-primary stroke-primary",
};

const LABEL: Record<PartState, string> = {
  idle: "fill-fg-secondary",
  tested: "fill-fg",
  down: "fill-primary-fg",
};

/**
 * Top-down drawing of a five-button mouse. Every part reads its colour from the
 * semantic tokens, so it follows light and dark mode. Orange means held right
 * now, green means the browser has registered that button at least once.
 */
export function MouseDiagram({ state, flash, scrolled, label, className }: Props) {
  const clipId = `mouse-body-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const body =
    "M120 20 C90 20 60 40 60 120 L60 200 C60 260 90 285 120 285 C150 285 180 260 180 200 L180 120 C180 40 150 20 120 20 Z";

  const arrow = (dir: "up" | "down") => {
    if (flash === dir) return "fill-primary";
    return scrolled[dir] ? "fill-success" : "fill-muted";
  };

  return (
    <svg viewBox="0 0 300 300" role="img" aria-label={label} className={cn("pointer-events-none select-none", className)}>
      <defs>
        <clipPath id={clipId}>
          <path d={body} />
        </clipPath>
      </defs>
      <g transform="translate(52 0)">
        {/* Shell */}
        <path d={body} className="fill-surface-2" />

        {/* Left and right buttons, clipped to the shell so the outline stays clean */}
        <g clipPath={`url(#${clipId})`} strokeWidth={2}>
          <rect data-part="button-0" data-state={state[0]} x={58} y={18} width={52} height={100} className={cn("transition-colors", PART[state[0]])} />
          <rect data-part="button-2" data-state={state[2]} x={130} y={18} width={52} height={100} className={cn("transition-colors", PART[state[2]])} />
        </g>
        <path d={body} fill="none" strokeWidth={2.5} className="stroke-border-strong" />

        {/* Button labels */}
        <text x={85} y={92} textAnchor="middle" fontSize={11} fontWeight={600} letterSpacing={1} className={LABEL[state[0]]}>
          LEFT
        </text>
        <text x={155} y={92} textAnchor="middle" fontSize={11} fontWeight={600} letterSpacing={1} className={LABEL[state[2]]}>
          RIGHT
        </text>

        {/* Scroll wheel (also the middle button) */}
        <rect
          data-part="button-1"
          data-state={state[1]}
          x={112}
          y={46}
          width={16}
          height={52}
          rx={8}
          strokeWidth={2}
          className={cn("transition-colors", PART[state[1]])}
        />
        {[58, 66, 74, 82].map((y) => (
          <line
            key={y}
            x1={115}
            x2={125}
            y1={y + (flash === "down" ? 2 : flash === "up" ? -2 : 0)}
            y2={y + (flash === "down" ? 2 : flash === "up" ? -2 : 0)}
            strokeWidth={1.5}
            className={state[1] === "down" ? "stroke-primary-fg" : "stroke-muted"}
          />
        ))}
        <polygon data-part="scroll-up" points="120,28 113,40 127,40" className={cn("transition-colors", arrow("up"))} />
        <polygon data-part="scroll-down" points="120,116 113,104 127,104" className={cn("transition-colors", arrow("down"))} />
        <line x1={129} x2={196} y1={72} y2={72} strokeWidth={1} strokeDasharray="3 3" className="stroke-border-strong" />
        <text x={200} y={76} fontSize={11} className="fill-fg-secondary">
          Middle
        </text>

        {/* Side buttons on the left flank (thumb side of a right-handed mouse) */}
        <rect
          data-part="button-4"
          data-state={state[4]}
          x={50}
          y={126}
          width={14}
          height={28}
          rx={4}
          strokeWidth={2}
          className={cn("transition-colors", PART[state[4]])}
        />
        <rect
          data-part="button-3"
          data-state={state[3]}
          x={50}
          y={160}
          width={14}
          height={28}
          rx={4}
          strokeWidth={2}
          className={cn("transition-colors", PART[state[3]])}
        />
        <text x={44} y={144} textAnchor="end" fontSize={11} className="fill-fg-secondary">
          Forward
        </text>
        <text x={44} y={178} textAnchor="end" fontSize={11} className="fill-fg-secondary">
          Back
        </text>
      </g>
    </svg>
  );
}
