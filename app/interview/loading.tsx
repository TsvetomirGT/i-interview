export default function InterviewLoading() {
  return (
    <div className="h-[calc(100vh-var(--header-height))] flex flex-col overflow-hidden bg-[var(--background)]">
      {/* Header skeleton */}
      <div className="shrink-0 border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 w-40 rounded-full bg-[var(--muted)] animate-pulse" />
          <div className="h-2.5 w-24 rounded-full bg-[var(--muted)] animate-pulse" />
        </div>
        <div className="h-5 w-20 rounded-full bg-[var(--muted)] animate-pulse" />
      </div>

      {/* Messages area skeleton */}
      <div className="flex-1 px-4 py-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--muted)] animate-pulse shrink-0" />
          <div className="h-14 w-3/4 rounded-2xl bg-[var(--muted)] animate-pulse" />
        </div>
      </div>

      {/* Input skeleton */}
      <div className="shrink-0 border-t border-[var(--border)] px-4 py-3">
        <div className="h-10 w-full rounded-xl bg-[var(--muted)] animate-pulse" />
      </div>
    </div>
  )
}
