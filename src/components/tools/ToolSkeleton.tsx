/** Placeholder rendered while a tool's JavaScript chunk loads. Same height class as a typical tool to avoid layout shift. */
export function ToolSkeleton() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6" aria-busy="true" aria-label="Loading tool">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-32 w-full rounded-lg" />
      <div className="flex gap-2">
        <div className="skeleton h-10 w-24 rounded-lg" />
        <div className="skeleton h-10 w-24 rounded-lg" />
      </div>
      <div className="skeleton h-24 w-full rounded-lg" />
    </div>
  );
}
