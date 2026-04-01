# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server (Turbopack, hot reload)
npm run build    # Production build (Turbopack by default)
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured yet.

## Architecture

This is a **Next.js 16.2.1** App Router project with React 19.2, TypeScript (strict), and Tailwind CSS v4.

- `app/` — App Router: `layout.tsx` (root layout), `page.tsx` (home route `/`), `globals.css` (Tailwind globals)
- `public/` — Static assets
- Path alias: `@/` maps to the project root

## Next.js 16 Breaking Changes

**Always read `node_modules/next/dist/docs/` before implementing features.** Key breaking changes from prior versions:

### Async Request APIs (fully synchronous access removed)
`cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` must all be awaited:
```tsx
// Correct in v16
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  const query = await props.searchParams
}
```
Run `npx next typegen` to generate `PageProps`, `LayoutProps`, `RouteContext` type helpers.

### `middleware` renamed to `proxy`
- File: `middleware.ts` → `proxy.ts`
- Export: `export function proxy(request: Request) {}`
- The `edge` runtime is NOT supported in `proxy` (runs `nodejs` only). Keep `middleware.ts` if you need `edge`.
- Config flag `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`

### Turbopack is default
`next dev` and `next build` use Turbopack. Custom `webpack` config in `next.config.ts` will cause build failures. Use `--webpack` flag to opt out, or migrate to Turbopack config:
```ts
// next.config.ts — turbopack is top-level (not experimental.turbopack)
const nextConfig: NextConfig = { turbopack: { /* options */ } }
```
Sass `~` prefix imports not supported; use bare module paths instead.

### PPR renamed
`experimental.ppr` removed. Use `cacheComponents: true` in `next.config.ts` instead.

### Caching APIs stabilized
`unstable_cacheLife` / `unstable_cacheTag` → `cacheLife` / `cacheTag` (drop `unstable_` prefix).
New APIs: `updateTag` (read-your-writes), `refresh` (refresh client router from Server Action).

### `next/image` with query strings
Local images with query strings require `images.localPatterns.search` config.

### Other
- Node.js 20.9+ required; TypeScript 5.1+ required
- React Compiler is stable (`reactCompiler: true` in config, not enabled by default)
- `opengraph-image` / `sitemap` generating functions now receive `params` and `id` as Promises
