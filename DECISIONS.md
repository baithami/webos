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

## [2026-06-05] Decision: One window per app (window id === appId) in v1
**Choice:** The window manager runs a single window instance per app; the window's id is the appId.
**Reason:** Collapses dock running-indicators, focus, and "click dock to restore/focus" into trivial lookups. Most v1 built-in apps are single-window by nature.
**Trade-off:** No multiple Finder/TextEdit windows. Multi-window is explicitly a v2 concern.
**Deferred:** Yes — revisit if a Layer 4 app genuinely needs concurrent windows.

## [2026-06-05] Decision: Stacking via an `order` array, not a z-counter
**Choice:** Window store keeps `order: string[]` (bottom→top). Render assigns `zIndex = Z.window + index`; focusing moves the id to the end of `order`.
**Reason:** Z stays bounded by the number of open windows (never collides with dock=500 / menubar=600), and "active window" is simply the topmost non-minimized id. Avoids the unbounded-counter drift of incrementing z on every focus.
**Trade-off:** Every focus rewrites the array (O(n)); negligible at realistic window counts.
**Deferred:** No

## [2026-06-05] Decision: Manual pointer-event drag/resize instead of Framer Motion drag
**Choice:** Drag (from titlebar) and the 8 resize handles use native pointer events with `setPointerCapture`, writing bounds to the store on each move. Framer Motion is reserved for open/close/minimize transforms only.
**Reason:** Positioning via `left/top` (layout) keeps the transform channel free for Framer's scale/translate minimize+open animations, so the two never fight. Pointer events give unified mouse+touch and precise 8-direction resize with fixed-opposite-edge math and min-size clamps.
**Trade-off:** More hand-written interaction code than `drag` props; in exchange, no transform/layout conflicts and full control over snapping.
**Deferred:** No

## [2026-06-05] Decision: Edge snapping + fullscreen semantics
**Choice:** On drag-end, the pointer position triggers snapping — top edge → maximize to work area, left/right edge → half. Fullscreen (green light / double-click titlebar) is a separate state that saves `restoreBounds` and fills the area below the 28px menu bar; resize handles hide while fullscreen.
**Reason:** Satisfies ROADMAP "snap to screen edges on drag" while keeping the macOS fullscreen toggle distinct from transient snapping.
**Trade-off:** Snapping sets bounds without persisting a "snapped" state, so a snapped window is just a normal positioned window (no auto-unsnap on next drag — matches expectation).
**Deferred:** No

## [2026-06-05] Decision: App-body registry placeholder seam (AppContent)
**Choice:** `AppContent` resolves an appId to a component from a `CONTENT` map that is empty in Layer 2, falling back to a styled placeholder. Layer 4 populates the map.
**Reason:** Lets the window manager be built and verified end-to-end now, with a clean single insertion point for real apps later — no Window changes needed in Layer 4.
**Trade-off:** None.
**Deferred:** No

## [2026-06-05] Decision: Normalized flat NodeMap for the file system
**Choice:** The FS tree is stored as a flat `Record<id, FSNode>` with `parentId` pointers rather than a nested children tree. Pure helpers in `src/lib/fs.ts` derive children/paths; the store only mutates the map.
**Reason:** Move/rename/delete become localized map edits (no deep tree rewriting), descendant/cycle checks are simple parent walks, and persisting/diffing a flat object is trivial. Keeping reads as pure helpers makes them unit-testable without React.
**Trade-off:** Listing a folder's children is an O(n) scan of the map; negligible at this scale and avoidable later with an index if needed.
**Deferred:** No

## [2026-06-05] Decision: Fixed seed timestamps; runtime ids via crypto.randomUUID
**Choice:** Seed nodes use a constant timestamp; only user-created nodes call `Date.now()`. New ids use `crypto.randomUUID()` with a Math.random fallback.
**Reason:** A constant seed timestamp keeps the initial store identical on server and client (no hydration drift), while runtime mutations are browser-only so real timestamps/uuids are safe there.
**Trade-off:** Seed file "created" dates are not the user's real first-run time; immaterial for a simulation.
**Deferred:** No

## [2026-06-05] Decision: Sibling name de-duplication on create/rename/move
**Choice:** Any operation that places a node in a folder runs `dedupeName`, turning collisions into "name 2", "name 3" (extension-aware: "report 2.txt").
**Reason:** Mirrors Finder behavior and guarantees unique sibling names so path resolution stays unambiguous, without throwing errors at the user mid-action (matches the "never block, choose pragmatic path" directive).
**Trade-off:** Silent rename rather than a conflict prompt; acceptable and macOS-like.
**Deferred:** No

## [2026-06-05] Decision: Server-side FS persistence API route stays deferred
**Choice:** Did not build the optional Layer 3 API route; FS persists to localStorage via Zustand persist only (store key `webos-filesystem`, version 1).
**Reason:** The 2026-06-04 seed decision marks server persistence as an optional extension triggered only by a cross-device-sync need, which v1 does not have. The persist `version` field is in place so a future migration to server storage has a hook.
**Trade-off:** FS is per-browser, ~5MB cap, not shared across devices — already accepted in the seed decision.
**Deferred:** Yes — revisit for cross-device sync (also a v2 ROADMAP item).

## [2026-06-05] Decision: Apps own their layout; Window body is a bare flex child
**Choice:** Removed the imposed `p-4 overflow-auto` from the Window body; each app fills `h-full w-full` and manages its own padding/scroll/chrome.
**Reason:** Apps like Finder (sidebar + toolbar), Terminal (own scroll), and Calculator (edge-to-edge keypad) need full-bleed control; a one-size window padding fought every one of them.
**Trade-off:** Each app must remember to pad itself; the placeholder absorbed the old padding.
**Deferred:** No

## [2026-06-05] Decision: Cross-app file opening via a tiny intent bus
**Choice:** `useAppIntent` records a pending fileId per target appId and calls `openApp`; the target app consumes it in an effect. Finder/Terminal "open" route through it to TextEdit.
**Reason:** With one window per app, there's no per-window argument channel. A minimal intent store is far simpler than threading params through the window store and keeps apps decoupled.
**Trade-off:** Only one pending file per app at a time (fine for single-window v1).
**Deferred:** No

## [2026-06-05] Decision: Notes and Terminal are thin views over the FS store
**Choice:** Notes stores each note as a .txt in a lazily-created "Notes" folder (title derived from first line, no file rename on edit). Terminal mutates the FS via the same store actions Finder uses.
**Reason:** One source of truth — a note created in Notes is visible in Finder and `cat`-able in Terminal. Avoids a parallel data store and showcases the FS.
**Trade-off:** Notes titles aren't independently editable from content; acceptable and macOS-Notes-like.
**Deferred:** No

## [2026-06-05] Decision: TextEdit rich mode uses contentEditable + execCommand
**Choice:** Rich text (.rtf/.html) edits a contentEditable surface with `document.execCommand` for bold/italic/underline, storing HTML in the node content; plain mode is a textarea.
**Reason:** Pragmatic, dependency-free rich editing sufficient for v1. `execCommand` is deprecated but universally supported and adequate for a simulation.
**Trade-off:** No structured rich model; HTML stored verbatim. A real editor (Lexical/ProseMirror) would be a v2 upgrade.
**Deferred:** Yes — revisit if rich editing needs to be robust.

## [2026-06-05] Decision: Safari tracks its own visited stack
**Choice:** Browser keeps an internal visited-URL stack for back/forward and resets the iframe `src`; it does not read cross-origin iframe history. Non-URL input falls back to a Google search. A start page shows shortcut tiles.
**Reason:** Cross-origin frame history/navigation is unobservable from the parent, so an internal stack is the only reliable model. Sandbox attributes are set on the iframe.
**Trade-off:** Back/forward reflect our navigations, not in-page link clicks inside the frame; many sites refuse framing (noted on the start page).
**Deferred:** No

## [2026-06-05] Decision: Session is not persisted — PIN on every load
**Choice:** `useSessionStore` starts at `booting` on every page load and requires the PIN to reach `active`; it is intentionally not persisted. Sleep → asleep; waking returns to the lock screen (not straight to active).
**Reason:** Matches a cold-boot/lock-screen mental model and keeps the boot + login screens demonstrable on every visit, which is the point of the feature. Waking to lock mirrors macOS "require password after sleep".
**Trade-off:** Users re-enter the PIN each visit; acceptable for a showcase OS (the PIN hint is shown on the lock screen).
**Deferred:** No

## [2026-06-05] Decision: Dark/light + accent surfaced in a menu-bar Control Center
**Choice:** Built a Control Center popover (theme toggle + accent swatches) in addition to the Settings panel from Layer 4, rather than a new state model.
**Reason:** Layer 5's checklist lists theme toggle + accent picker as system features; both already read/write `useSystemStore`, so the work was a second *surface*, not new state. Quick menu-bar access matches macOS.
**Trade-off:** Two entry points to the same settings; intentional (Control Center = quick, Settings = full).
**Deferred:** No

## [2026-06-05] Decision: Single full-screen click-catcher dismisses all popovers
**Choice:** When any system popover (Spotlight, notifications, Control Center, Apple menu) is open, SystemLayer renders one transparent full-screen catcher at z 750 (below the popovers, above the rest) whose click/right-click closes everything.
**Reason:** One catcher gives consistent outside-click-to-dismiss for every popover without per-component document listeners, and the z-layering keeps popovers interactive while blocking stray clicks elsewhere.
**Trade-off:** While a popover is open the rest of the UI is click-inert (clicking it dismisses first); this is standard popover behavior.
**Deferred:** No

## [2026-06-05] Decision: Per-app code splitting via next/dynamic
**Choice:** AppContent loads each app component through `next/dynamic(..., { ssr: false, loading: AppLoading })` instead of static imports.
**Reason:** Apps are client-only and only needed when opened; splitting them dropped the route's First Load JS from ~66 kB to ~57 kB and gives each app its own on-demand chunk (verified Calculator/Terminal in separate chunks). A spinner covers the brief load.
**Trade-off:** A one-frame loading spinner the first time an app opens; negligible.
**Deferred:** No

## [2026-06-05] Decision: Window position/size stays CSS-transition, not Framer
**Choice:** The "all animations Framer Motion" goal applies to user-facing transitions (window open/close/minimize, Spotlight, notifications, Control Center, Apple menu, dock magnification, boot/login/sleep). Window drag/resize/snap/fullscreen continue to use CSS transitions on left/top/width/height.
**Reason:** Re-confirms the Layer 2 decision — animating layout via Framer would fight the pointer-driven drag/resize that writes those same properties. CSS transitions (disabled mid-interaction) give smooth snap/fullscreen without conflict.
**Trade-off:** Not literally 100% Framer; the exception is deliberate and isolated to window geometry.
**Deferred:** No

## [2026-06-05] Decision: Standalone server is the production entrypoint
**Choice:** Production runs `node .next/standalone/server.js` (via `ecosystem.config.js` / `npm run start:standalone`), with `npm run build:standalone` copying `.next/static` (+ `public`) next to the bundle. DEPLOYMENT.md updated to match; the owner's original `next start` flow is noted as the non-optimized fallback.
**Reason:** Resolves the Layer 1 open item — `output: 'standalone'` makes `next start` non-optimal. The standalone bundle is the intended artifact and was verified to serve HTTP 200.
**Trade-off:** Requires the post-build asset copy (scripted) that plain `next start` wouldn't.
**Deferred:** No

## [2026-06-05] Note: Console-error verification was static, not in-browser
**Observation:** "Zero console errors in production" was checked via TypeScript + ESLint clean build, SSR returning 200 with clean server logs, and a static audit (AnimatePresence keys, list keys, no stray console.*, hydration guarded by the mount gate). A real headless-browser run was attempted with Playwright but Chromium failed to launch — the sandbox lacks OS libraries (libatk-1.0.so.0, …) that need root to install.
**Action:** Recommend running the Playwright console sweep (boot → PIN 0000 → open each app → Spotlight) on the actual Ubuntu 22.04 deploy host, where `npx playwright install-deps` can provision the libs.
**Deferred:** Yes — final in-browser console confirmation on the deploy host.

---

*v1 COMPLETE — 2026-06-05. All six layers shipped. Future decisions (v2) appended below.*
