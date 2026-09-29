/** Tiny event bus so any button can open the command palette without prop drilling. */
export const OPEN_PALETTE_EVENT = "tj:open-command-palette";

export function openCommandPalette(): void {
  window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT));
}
