# UI Refresh: Orange Theme, Global Header, Larger Buttons — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the indigo colour scheme with orange-500, add a sticky global header with brand/nav/theme-toggle, and increase button sizes across the app.

**Architecture:** CSS custom properties in `globals.css` drive the colour system globally — swapping those values propagates orange throughout the app with no per-component colour fixes. A new `Header` client component is mounted once in `app/layout.tsx` and appears on every route. The `Button` component's size tokens are bumped; the raw `Continue` button in `HistorySidebar` is migrated to the `Button` component for consistency.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `app/globals.css` | Orange CSS vars; `html.dark {}` block for manual toggle |
| Modify | `components/ui/Button.tsx` | Larger padding per size |
| Create | `components/ui/Header.tsx` | Brand wordmark + New Interview link + theme toggle |
| Modify | `app/layout.tsx` | Import and render `<Header />` |
| Modify | `app/page.tsx` | Remove inline title block; adjust main padding |
| Modify | `components/interview/HistorySidebar.tsx` | Swap raw `<button>` for `<Button>` in `HistoryCard` |

---

## Task 1: Swap CSS variables to orange and add `html.dark` override block

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace the `:root` custom property values**

Open `app/globals.css`. Replace the existing `:root { … }` block (lines 3–17) with:

```css
:root {
  --background: #ffffff;
  --foreground: #0f0f0f;
  --muted: #f4f4f5;
  --muted-foreground: #71717a;
  --border: #e4e4e7;
  --card: #ffffff;
  --bubble-user-bg: #f97316;
  --bubble-user-fg: #ffffff;
  --bubble-ai-bg: #f4f4f5;
  --bubble-ai-fg: #0f0f0f;
  --feedback-bg: #fff7ed;
  --feedback-border: #fed7aa;
  --feedback-fg: #7c2d12;
}
```

- [ ] **Step 2: Replace the `@media (prefers-color-scheme: dark)` block and add `html.dark` block**

Replace the existing dark-mode media query block (lines 19–35) with both of the following (keep them in this order):

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #09090b;
    --foreground: #fafafa;
    --muted: #18181b;
    --muted-foreground: #a1a1aa;
    --border: #27272a;
    --card: #18181b;
    --bubble-user-bg: #ea580c;
    --bubble-user-fg: #ffffff;
    --bubble-ai-bg: #27272a;
    --bubble-ai-fg: #fafafa;
    --feedback-bg: #431407;
    --feedback-border: #9a3412;
    --feedback-fg: #fed7aa;
  }
}

html.dark {
  --background: #09090b;
  --foreground: #fafafa;
  --muted: #18181b;
  --muted-foreground: #a1a1aa;
  --border: #27272a;
  --card: #18181b;
  --bubble-user-bg: #ea580c;
  --bubble-user-fg: #ffffff;
  --bubble-ai-bg: #27272a;
  --bubble-ai-fg: #fafafa;
  --feedback-bg: #431407;
  --feedback-border: #9a3412;
  --feedback-fg: #fed7aa;
}

html:not(.dark) {
  --background: #ffffff;
  --foreground: #0f0f0f;
  --muted: #f4f4f5;
  --muted-foreground: #71717a;
  --border: #e4e4e7;
  --card: #ffffff;
  --bubble-user-bg: #f97316;
  --bubble-user-fg: #ffffff;
  --bubble-ai-bg: #f4f4f5;
  --bubble-ai-fg: #0f0f0f;
  --feedback-bg: #fff7ed;
  --feedback-border: #fed7aa;
  --feedback-fg: #7c2d12;
}
```

> **Why two extra blocks?** The `html.dark` block lets JavaScript apply dark mode manually. The `html:not(.dark)` block ensures the light vars win over the media query when JS explicitly chooses light mode. The media query still handles the initial load before JS runs.

- [ ] **Step 3: Start dev server and eyeball the colour change**

```bash
npm run dev
```

Open `http://localhost:3000`. Buttons, user chat bubbles, and the mode selector should now appear orange, not indigo.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: swap primary colour to orange-500 with dark-mode override support"
```

---

## Task 2: Increase button sizes in the Button component

**Files:**
- Modify: `components/ui/Button.tsx`

- [ ] **Step 1: Update the `sizes` map**

In `components/ui/Button.tsx`, replace the `sizes` object (currently lines 26–30) with:

```ts
  const sizes = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-5 py-2.5 min-w-[120px]',
    lg: 'text-base px-7 py-3 min-w-[140px]',
  }
```

- [ ] **Step 2: Verify in browser**

With `npm run dev` running, open `http://localhost:3000`. The "Start Interview" button (already `size="lg"`) should be noticeably taller and wider.

- [ ] **Step 3: Commit**

```bash
git add components/ui/Button.tsx
git commit -m "feat: increase button padding for sm/md/lg sizes"
```

---

## Task 3: Create the global Header component

**Files:**
- Create: `components/ui/Header.tsx`

- [ ] **Step 1: Create the file**

Create `components/ui/Header.tsx` with the following content:

```tsx
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
```

- [ ] **Step 2: Check for TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors (or only pre-existing ones unrelated to this file).

- [ ] **Step 3: Commit**

```bash
git add components/ui/Header.tsx
git commit -m "feat: add global Header component with brand, New Interview link, theme toggle"
```

---

## Task 4: Mount Header in root layout and remove inline title from home page

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Add Header to layout**

Replace the full content of `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/ui/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "i-interview — AI Technical Interview Practice",
  description: "Practice technical interviews with an AI interviewer. Upload your job requirements and start.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Remove the inline title block from the home page**

Replace the full content of `app/page.tsx` with:

```tsx
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
```

> **57px** is the header height (`py-3` = 12px top + 12px bottom + ~20px line-height + 1px border ≈ 45px; using 57px as a safe estimate — adjust if the header renders taller). The `lg:top-[57px]` keeps the sidebar sticky below the header.

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000`. You should see:
- Orange sticky header at the top with brand, "New Interview" button, and moon icon
- No duplicate title/icon in the main content area
- Setup form card centred in the right column
- History sidebar on the left

- [ ] **Step 4: Check TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: mount Header in root layout, remove inline title from home page"
```

---

## Task 5: Migrate HistoryCard Continue button to Button component

**Files:**
- Modify: `components/interview/HistorySidebar.tsx`

- [ ] **Step 1: Add Button import**

At the top of `components/interview/HistorySidebar.tsx`, add the import after the existing imports:

```tsx
import { Button } from '@/components/ui/Button'
```

- [ ] **Step 2: Replace the raw Continue button**

Inside `HistoryCard`, find the raw `<button>` for Continue (the block starting `{status === 'in_progress' && (`). Replace it with:

```tsx
      {status === 'in_progress' && (
        <Button
          variant="primary"
          size="md"
          onClick={() => onContinue(entry)}
          className="mt-2 w-full"
        >
          Continue
        </Button>
      )}
```

- [ ] **Step 3: Verify in browser**

With dev server running, start an interview, close it mid-way, return to `/`. The Continue button should now use the same orange styling and larger size as other primary buttons.

- [ ] **Step 4: Commit**

```bash
git add components/interview/HistorySidebar.tsx
git commit -m "feat: use Button component for Continue in HistoryCard"
```

---

## Task 6: End-to-end verification

- [ ] **Step 1: Run a production build**

```bash
npm run build
```

Expected: build succeeds with no TypeScript or lint errors.

- [ ] **Step 2: Smoke-test the full flow**

Start dev server (`npm run dev`) and verify each item:

| Check | Expected |
|---|---|
| Home page header | Orange dot + "i-interview" wordmark, "New Interview" button, moon/sun icon |
| "New Interview" button click | Stays on `/` (already there) or navigates to `/` |
| Theme toggle | Page switches dark/light; refresh preserves the choice |
| Mode selector selected card | Orange border + orange-tinted background |
| Start Interview | Navigates to `/interview` |
| Interview page | Global header appears above the ChatShell header bar |
| User chat bubbles | Orange background |
| Feedback cards (Learn mode) | Orange-tinted background |
| Continue button in history | Orange, larger, consistent with other buttons |
| Mobile (375px viewport) | Header doesn't overflow; buttons are tap-friendly |

- [ ] **Step 3: Final commit if any stragglers**

```bash
git status
# commit any remaining uncommitted changes
```
