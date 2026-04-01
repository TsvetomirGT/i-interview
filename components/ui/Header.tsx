'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function Header() {
  const [dark, setDark] = useState(false)

  // Initialise from localStorage (or system preference) after mount
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored === 'dark' || (stored === null && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--background)]">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2 font-bold text-lg text-[var(--foreground)] hover:opacity-80 transition-opacity"
      >
        <span className="w-3 h-3 rounded-full bg-[var(--bubble-user-bg)]" aria-hidden />
        i-interview
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center font-medium rounded-xl transition-all bg-[var(--bubble-user-bg)] text-[var(--bubble-user-fg)] hover:opacity-90 active:scale-[0.98] text-base px-5 py-2.5 min-w-[120px]"
        >
          New Interview
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          {dark ? (
            /* Sun icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            /* Moon icon */
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
