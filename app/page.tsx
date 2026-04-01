import { SetupForm } from '@/components/setup/SetupForm'
import { HistorySidebar } from '@/components/interview/HistorySidebar'

export default function Home() {
  return (
    <div className="flex-1 bg-[var(--background)]">
      <div className="flex flex-col lg:flex-row min-h-full">
        {/* Sidebar */}
        <aside className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--border)] p-4 lg:p-6 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:overflow-y-auto">
          <HistorySidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <SetupForm />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
