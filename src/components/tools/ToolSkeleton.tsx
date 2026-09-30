/**
 * Placeholder rendered while a tool's JavaScript chunk loads. Tall enough to
 * approximate a typical tool so content below doesn't jump (CLS) when it mounts.
 */
export function ToolSkeleton() {
  return (
    <div className="flex min-h-[440px] flex-col gap-5 rounded-xl border border-border-strong bg-surface p-4 sm:p-5" aria-busy="true" aria-label="Loading tool">
      <div className="skeleton h-3.5 w-24 rounded" />
      <div className="skeleton h-40 w-full rounded-lg" />
      <div className="flex gap-2">
        <div className="skeleton h-9 w-24 rounded-lg" />
        <div className="skeleton h-9 w-24 rounded-lg" />
      </div>
      <div className="skeleton h-28 w-full rounded-lg" />
    </div>
  );
}
