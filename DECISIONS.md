# DECISIONS.md — WebOS Architectural Decision Log

> Claude Code appends to this file whenever an architectural, library, or design decision is made.
> Read this fully at the start of every session before touching any code.

---

## Format

```
## [YYYY-MM-DD] Decision: [Short title]
**Choice:** What was decided
**Reason:** Why this path was taken
**Trade-off:** What was given up
**Deferred:** Yes/No — if yes, what triggers revisiting
```

---

## Seed Decisions (Pre-build, set by project owner)

## [2026-06-04] Decision: Framework — Next.js 14 App Router
**Choice:** Next.js 14 with App Router (not Pages Router)  
**Reason:** App Router supports React Server Components, better code splitting, and aligns with current Next.js best practices  
**Trade-off:** Slightly steeper learning curve for mixing client/server components; all interactive OS components must be explicitly marked `"use client"`  
**Deferred:** No

## [2026-06-04] Decision: State management — Zustand
**Choice:** Zustand for all global state (window manager, file system, settings, notifications)  
**Reason:** Minimal boilerplate, works cleanly with React 18, supports persist middleware out of the box, no context hell  
**Trade-off:** Not as structured as Redux — requires discipline in slice design  
**Deferred:** No

## [2026-06-04] Decision: Animation library — Framer Motion
**Choice:** Framer Motion for all window animations, dock effects, and transitions  
**Reason:** Best-in-class React animation library; handles drag, layout animations, and gesture detection natively  
**Trade-off:** Bundle size (~50kb gzipped); acceptable given this is a desktop app, not a landing page  
**Deferred:** No

## [2026-06-04] Decision: Virtual file system storage — localStorage + Zustand persist
**Choice:** Virtual FS tree stored in Zustand, persisted to localStorage  
**Reason:** Zero server dependency for core FS operations; fast, synchronous reads  
**Trade-off:** Limited to ~5MB per origin; not sharable across devices  
**Deferred:** Server-side persistence via API route is an optional Layer 3 extension — revisit if user needs cross-device sync

## [2026-06-04] Decision: Styling approach — Tailwind + CSS variables
**Choice:** Tailwind for layout/spacing; CSS custom properties in globals.css for all theme tokens (colors, blur, shadow)  
**Reason:** Tailwind handles utility classes efficiently; CSS variables allow runtime theme switching (dark/light/accent) without class toggling on every element  
**Trade-off:** Two systems to maintain; developers must know which to reach for  
**Deferred:** No

## [2026-06-04] Decision: Mobile strategy — degradation overlay
**Choice:** Show a "Best viewed on desktop" overlay for viewports < 768px instead of building a responsive mobile layout  
**Reason:** A desktop OS UX is fundamentally incompatible with mobile touch at this stage; building a separate mobile skin is out of scope for v1  
**Trade-off:** No mobile access  
**Deferred:** Yes — mobile touch window manager could be Layer 7 in v2

## [2026-06-04] Decision: Deployment target — PM2 on Ubuntu 22.04
**Choice:** Run as a Next.js standalone server via PM2, exposed through Nginx + Cloudflare Tunnel  
**Reason:** Matches existing server infrastructure  
**Trade-off:** Requires `output: 'standalone'` in next.config.js  
**Deferred:** No

---

## [2026-06-05] Decision: Manual scaffold instead of create-next-app
**Choice:** Hand-authored package.json, tsconfig, next.config.js, tailwind/postcss configs rather than running `create-next-app`
**Reason:** The project directory already held the six planning docs; `create-next-app` refuses non-empty directories and runs interactively. Manual scaffold gives exact control over pinned versions and matches DEPLOYMENT.md's `output: 'standalone'` requirement out of the gate.
**Trade-off:** Must maintain config files by hand; no scaffold-provided boilerplate.
**Deferred:** No

## [2026-06-05] Decision: Pin Next.js to patched 14.2.35
**Choice:** Use `next@^14.2.35` (latest 14.2.x) instead of 14.2.5
**Reason:** 14.2.5 carries a published security advisory. 14.2.35 patches it while staying on the Next.js 14 line mandated by the 2026-06-04 framework decision.
**Trade-off:** A few transitive-dep audit advisories remain that only clear by jumping to Next 16 (a breaking major). Accepted: they are build-tooling deps, not runtime exposure for a client-side OS simulation, and Next 14 is a fixed decision.
**Deferred:** Yes — revisit the Next 16 upgrade only if v1 scope expands to require it.

## [2026-06-05] Decision: src/ directory + path alias, App Router layout
**Choice:** All source under `src/` with `@/*` → `src/*` alias. Structure: `src/app` (routes), `src/components/desktop`, `src/lib` (constants/animations/wallpapers/apps), `src/store` (Zustand).
**Reason:** Keeps config files at root uncluttered; the alias avoids brittle relative imports as the tree deepens across layers.
**Trade-off:** None significant.
**Deferred:** No

## [2026-06-05] Decision: Theme/accent applied via DOM attributes + CSS variables at runtime
**Choice:** Desktop sets `data-theme` on `<html>` and writes `--color-accent`/`--color-accent-hover` as inline CSS variables in an effect, driven by the persisted Zustand store.
**Reason:** Matches the STYLE_GUIDE.md token model — runtime theme/accent switching with zero per-element class churn.
**Trade-off:** Requires a mount guard (render a plain background until `mounted`) to avoid hydration mismatch between SSR defaults and client localStorage.
**Deferred:** No

## [2026-06-05] Decision: Dock magnification via Framer Motion motion values
**Choice:** Dock tracks cursor x in a `useMotionValue`; each DockItem derives its size from cursor-to-center distance through `useTransform` + `useSpring` (base 48px → 80px peak, 140px influence radius).
**Reason:** Per-frame springed sizing gives the authentic macOS fisheye without React re-renders on mouse move.
**Trade-off:** Each tile reads `getBoundingClientRect` in the transform; fine for ~8 tiles, revisit if the dock ever holds dozens.
**Deferred:** No

## [2026-06-05] Decision: Gradient-fallback wallpapers; mobile overlay landed early
**Choice:** Each wallpaper ships a CSS-gradient fallback (per STYLE_GUIDE.md) that renders if the /public image is missing (img onError hides the tag). The <768px degradation overlay (a Layer 6 item) was also built now since Desktop already composes it.
**Reason:** Desktop always renders something even before real wallpaper assets are dropped in; pulling the trivial overlay forward avoids a second pass over Desktop.tsx.
**Trade-off:** Overlay is minimal and will be hardened in Layer 6.
**Deferred:** No

## [2026-06-05] Note: `next start` vs standalone output
**Observation:** With `output: 'standalone'`, `next start` works but warns; the optimized production command is `node .next/standalone/server.js` (with `public/` and `.next/static` copied alongside). DEPLOYMENT.md (owner-authored) currently uses `npm start`/`next start`, which functions for the PM2 setup.
**Action:** Left DEPLOYMENT.md unchanged; flagging here so the deploy step can switch to the standalone server entrypoint if the optimized bundle is wanted.
**Deferred:** Yes — reconcile when Layer 6 deployment verification runs.

---

*All future decisions appended below by Claude Code during build sessions.*
