import { createElement } from "react";
import { getIcon, type IconName } from "@/lib/icons";

/** Renders an icon from the curated set by name. Decorative by default (aria-hidden). */
export function Icon({ name, className, label }: { name?: IconName; className?: string; label?: string }) {
  return createElement(getIcon(name), label ? { className, role: "img", "aria-label": label } : { className, "aria-hidden": true });
}
