/** Client-only helpers for the "recently used tools" list (stored in localStorage on the visitor's device). */
const KEY = "tj:recent-tools";
const MAX = 8;

export function readRecentTools(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecentTool(slug: string): void {
  try {
    const next = [slug, ...readRecentTools().filter((s) => s !== slug)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}
