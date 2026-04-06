# UI Refresh: Orange Theme, Global Header, Larger Buttons

**Date:** 2026-04-01  
**Status:** Approved

## Context

The current UI uses indigo (#6366f1) as its primary color and has no persistent navigation. The home page carries an inline title block that will be redundant once a header is added. Buttons are small and hard to click on mobile. This refresh addresses all three: color, navigation, and button ergonomics.

---

## 1. Color Theme

**Primary color:** `#f97316` (Tailwind orange-500) — warm amber-orange, modern and energetic.

### Changes to `app/globals.css`

| Variable | Before | After |
|---|---|---|
| `--bubble-user-bg` | `#6366f1` (indigo-500) | `#f97316` (orange-500) |
| `--bubble-user-fg` | `#ffffff` | `#ffffff` (unchanged) |
| `--feedback-bg` | `#eff6ff` (blue-50) | `#fff7ed` (orange-50) |
| `--feedback-border` | `#bfdbfe` (blue-200) | `#fed7aa` (orange-200) |
| `--feedback-fg` | `#1e3a5f` (blue-900) | `#7c2d12` (orange-900) |

**Dark mode primary:** `#ea580c` (orange-600) for sufficient contrast on dark backgrounds.

### Other color changes

- `ModeSelector.tsx`: selected card border/bg — `border-blue-500 bg-blue-50` → `border-orange-500 bg-orange-50`

---

## 2. Global Header

**New file:** `components/ui/Header.tsx`  
**Mounted in:** `app/layout.tsx` (renders on every route)

### Layout
```
[ i-interview ]              [ New Interview ]  [ ☾ ]
```

- **Left:** Brand wordmark — orange accent dot + bold "i-interview" text, wrapped in `<Link href="/">`.
- **Right:**
  - `New Interview` — primary orange button, `<Link href="/">` (the setup form lives on `/`)
  - Theme toggle — icon button (sun/moon SVG); on click: toggles `dark` class on `<html>`, persists choice to `localStorage` under key `theme`. Initializes from `localStorage` on mount (or falls back to `prefers-color-scheme`)
- **Styling:** sticky top-0, z-50, white/dark bg, 1px bottom border, `px-6 py-3`, full-width flex row.

### Impact on home page (`app/page.tsx`)

Remove the existing title block:
- The orange icon circle
- The `<h1>i-interview</h1>` heading
- The subheading paragraph

The card and sidebar remain; the page header is now the global `<Header>`.

### Dark mode toggle implementation note

`globals.css` currently uses `@media (prefers-color-scheme: dark)` for dark styles. To support a manual toggle, add `html.dark { }` overrides in `globals.css` that duplicate the dark-mode variable values. The `dark` class on `<html>` takes precedence over the media query. The `Header` component reads and writes this class client-side (`useEffect`).

---

## 3. Button Sizing

**File:** `components/ui/Button.tsx`

| Size | Before | After |
|---|---|---|
| `sm` | `px-3 py-1.5 text-sm` | `px-4 py-2 text-sm` |
| `md` | `px-4 py-2 text-sm` | `px-5 py-2.5 text-base min-w-[120px]` |
| `lg` | `px-6 py-2.5 text-sm` | `px-7 py-3 text-base min-w-[140px]` |

**Call-site updates:**
- `SetupForm.tsx` — "Start Interview" button: ensure size is `lg`
- `HistoryCard` in `HistorySidebar.tsx` — "Continue" button: ensure size is `md`

---

## 4. Files to Modify

| File | Change |
|---|---|
| `app/globals.css` | Swap CSS custom property values for primary + feedback colors |
| `app/layout.tsx` | Import and render `<Header>` above `{children}` |
| `app/page.tsx` | Remove inline title block (icon, h1, subheading) |
| `components/ui/Button.tsx` | Update padding/font-size per size variant |
| `components/ui/Header.tsx` | **New file** — brand wordmark + New Interview button + theme toggle |
| `components/setup/ModeSelector.tsx` | Change selected card colors from blue to orange |
| `components/setup/SetupForm.tsx` | Ensure "Start Interview" uses size `lg` |
| `components/interview/HistorySidebar.tsx` | Ensure "Continue" uses size `md` |

---

## 5. Verification

1. Run `npm run dev` and open `http://localhost:3000`
2. Confirm header appears with orange wordmark, "New Interview" button, and theme toggle
3. Click theme toggle — page should switch dark/light; refresh should persist the choice
4. Click "New Interview" — should navigate to `/` (or stay if already there)
5. On home page: no inline title/icon visible; setup form and history sidebar intact
6. Check all buttons are visibly larger and easy to click on mobile viewport (375px)
7. Start an interview — `/interview` should show global header above the ChatShell header bar
8. Verify orange color on: primary buttons, user chat bubbles, mode selector active card, feedback card background tints
9. Run `npm run build` — no TypeScript or build errors
