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

*v1 COMPLETE — 2026-06-05. All six layers shipped. Future decisions (post-v1) appended below.*

## [2026-06-05] Decision: Desktop icons (system drive + Desktop folder contents)
**Choice:** A `DesktopIcons` layer renders a "WebOS HD" drive plus the live contents of the Desktop FS folder, top-right. Double-click opens (folders via a new `openFolder` intent that navigates Finder; files via the default-app intent). Added `pendingFolder`/`openFolder`/`consumeFolder` to the app-intent bus.
**Reason:** Matches macOS (drive on desktop + items from ~/Desktop) and makes the Desktop folder useful. Driven entirely by the existing FS store so it stays in sync.
**Trade-off:** Single top-right column (no free-form icon positioning); fine for v1.
**Deferred:** No

## [2026-06-05] Decision: Server-side MEDIA library backed by a real on-disk folder
**Choice:** Uploaded photos are stored as REAL FILES in a project folder (`./media`, override `WEBOS_MEDIA_DIR`), not embedded in the FS tree. New API routes: `GET/POST /api/media` (list/upload) and `GET/DELETE /api/media/[name]` (serve/remove). Images are downscaled client-side (≤2560px JPEG) before upload; filenames are sanitized + de-duplicated. The Settings → Wallpaper picker lists the folder, uploads to it, sets any image as wallpaper (`wallpaperId` = the `/api/media/<name>` URL), and can delete.
**Reason:** The user wants photos that (a) persist server-side, (b) are available cross-device through the tunnel, and (c) live in a folder they can manage by hand (drop files in / delete). A real media directory satisfies all three; the app re-lists it on open + Refresh so disk-side changes show up. This is simpler and more transparent than moving the whole virtual FS to the server.
**Trade-off:** Only photos/media are server-side. The rest of the virtual FS (folders, text files) and the wallpaper *selection* (`useSystemStore`) remain in per-browser localStorage — so the selected wallpaper does not auto-sync across devices, though the photo library does. The `/api/media` endpoints are unauthenticated (consistent with the client-only PIN); there is a 15 MB/file cap, image-only filter, and path-traversal guard. Superseded the earlier short-lived localStorage data-URL upload approach (reverted the Finder upload button to avoid the ~5MB quota problem).
**Deferred:** Full server-side sync of the FS tree + settings (true whole-account cross-device) remains a possible follow-up.

## [2026-06-06] Decision: Whole file system + settings sync server-side (cross-device)
**Choice:** Removed Zustand `persist`/localStorage from `useFileSystemStore` and `useSystemStore`. State now lives in `WEBOS_DATA_DIR/state.json` (`{ nodes, settings }`) via `GET/PUT /api/state`. A `StateSync` client component loads it on boot, debounce-saves (700ms) any change, and on first run adopts the browser's old localStorage (one-time migration) before the server takes over. `useFileSystemStore` starts empty with a `hydrated` flag.
**Reason:** Completes the cross-device persistence the user asked for — the file system, text files, and the wallpaper *selection*/theme/accent now follow the user to any device through the tunnel, matching what the media library already did for photos. The boot/login screens (~couple seconds) mask the load, so there's no settings flash.
**Trade-off:** Server is now the source of truth, so changes don't persist while the server is down (the app still works from memory and retries on the next change). Concurrency is last-write-wins — two devices editing simultaneously can clobber (fine for a single user; a real-time/merge layer would be a follow-up). `/api/state` is unauthenticated like the other endpoints. This supersedes the Layer 3 "FS in localStorage" decision and delivers the deferred "Server-side FS" v2 ROADMAP item.
**Deferred:** Multi-device conflict resolution / live sync; server-enforced auth.

## [2026-06-08] Decision: SQL Detective game apps — Phase 1 (UI shells only)
**Choice:** Added four new apps (`inbox`, `casefile`, `sql-terminal`, `detective-notes`) under a new `src/components/apps/sqldetective/` namespace, registered in `apps.ts` (APPS array, all `pinned`) and `AppContent.tsx` (dynamic-import CONTENT record) following the exact existing patterns. Static case content (briefing text, table schemas, case list) lives in a single shared `sqldetective/data.ts` so the three apps that reference it (Inbox, CaseFile, SqlTerminal) can't drift. SQL execution, hints, submission, and game state are intentionally stubbed: Ctrl+Enter in the terminal flips status to ERROR and prints "SQL execution not yet implemented"; HINT/SUBMIT show `alert()` placeholders.
**Reason:** The brief is to add the game's surface area to the running OS without touching the shell, window system, or any existing app/store. Centralizing the case data avoids duplicating the ~20-line briefing and three schemas across Inbox/CaseFile/SqlTerminal.
**Trade-off:** No real SQL engine, no per-case parameterization (everything is hardcoded to Case #0001), and the Inbox right panel always shows Case #0001's briefing since it's the only OPEN case. These are deferred to a later phase.
**Deferred:** Yes — SQL execution engine, real multi-case data, game/progress state, and unlocking logic.

## [2026-06-08] Decision: CodeMirror 6 for the SQL editor
**Choice:** Installed `@codemirror/{state,view,lang-sql,theme-one-dark,commands}` (6.x) and mounted an EditorView imperatively in `SqlTerminal.tsx` via a `useRef` + `useEffect` (create-once, destroy-on-unmount). The Ctrl/Cmd+Enter run handler is registered as a high-priority `keymap.of([...])` entry ahead of `defaultKeymap`, and calls the latest run stub through a ref so the keymap closure never goes stale.
**Reason:** CodeMirror 6 is the modern, tree-shakeable editor with first-class SQL syntax highlighting (`lang-sql`) and a matching dark theme (`oneDark`) that fits the phosphor-terminal aesthetic. The ref-based run handler keeps the editor a create-once instance (no re-init churn on state changes).
**Trade-off:** Adds 5 dependencies (npm audit flags pre-existing advisories in the wider tree, unrelated to these). The editor is uncontrolled — query text isn't mirrored into React state yet, which is fine until execution is wired and we need to read the doc (`viewRef.current.state.doc`).
**Deferred:** Reading the editor contents on run/submit lands with the execution phase.

## [2026-06-08] Note: Phase-1 verification was compile-time, not in-browser
**Observation:** Verified via `tsc --noEmit` (clean) and a clean Next.js dev compile — the earlier `Module not found` for the sqldetective imports cleared once the files existed, confirming webpack resolves the full dynamic-import module graph (including the CodeMirror chunks). A real click-through (open each app, switch CaseFile tabs, type in the editor, Ctrl+Enter stub, notes persistence on refresh) was not run: no Chromium/Playwright/puppeteer is available on this host (consistent with the v1 console-verification note above).
**Action:** Recommend a manual or Playwright click-through on a host with a browser to confirm runtime behavior and zero console errors.
**Deferred:** Yes — in-browser runtime confirmation.

## [2026-06-08] Decision: SQL Detective Phase 2 — in-browser SQLite via sql.js (WASM)
**Choice:** Wired up a real SQL engine using `sql.js` (SQLite compiled to WebAssembly) running entirely client-side — no backend, no `.db` files. Each case is a TypeScript module (`src/lib/sqldetective/cases/caseNNN.ts`) carrying its own `dbSetupSQL` (CREATE TABLE + INSERT), schema description, briefing, and a `solution.validate(rows)` predicate + 3 progressive hints. `queryEngine.ts` lazily `initSql()`s once (loading the WASM from `/sql-wasm.wasm`), builds a fresh in-memory DB per case from the seed SQL, and runs player queries through `executeQuery()`. Game progression (active case, completed cases, hints used, XP) lives in a new persisted Zustand store `useCaseStore` (localStorage key `sql-detective-game-state`); lock state cascades (case N unlocks when case N-1 is completed). SqlTerminal, Inbox, and CaseFile were rewired to read live case data from the store.
**Reason:** Matches the brief's SQL Case Files-style architecture: zero backend, perfectly reproducible databases, and adding a case is just writing a SQL string. Keeping OS window state in `useWindowStore` and game state in a separate `useCaseStore` keeps the game self-contained and avoids touching any existing store.
**Trade-off:** The full SQLite WASM (~660 KB) loads on first terminal open. Answer validation is heuristic (`validate()` checks for the suspect by name/id rather than enforcing an exact query shape), so creative-but-correct queries pass and some over-broad queries could too — acceptable for a teaching game. Progress is per-browser (localStorage), not synced server-side like the rest of the OS FS.
**Deferred:** Server-side sync of game progress; stricter answer validation; query history navigation in the editor.

## [2026-06-08] Decision: serve sql.js WASM from /public via a postinstall copy
**Choice:** A `scripts/copy-sqljs-wasm.js` copies `node_modules/sql.js/dist/sql-wasm.wasm` to `public/sql-wasm.wasm`, wired as an npm `postinstall` step (and run manually once). `queryEngine.initSql()` points sql.js at it via `locateFile: () => '/sql-wasm.wasm'`. `next.config.js` gained a `webpack` override that stubs `fs`/`path`/`crypto` to `false` for the client bundle (sql.js's UMD build references them but they're unused in the browser). The existing `build:standalone` script already copies `public/` next to the standalone server, so the WASM ships with production builds.
**Reason:** Next 14 App Router has no zero-config way to emit a dependency's WASM as a fetchable asset; copying to `public/` is the simplest robust path and keeps the WASM at a stable URL. The webpack fallbacks prevent "Module not found: fs" client build errors.
**Trade-off:** The copy must run after every fresh `npm install` (handled by postinstall) and the file is git-ignored-by-default under public if patterns change — verify it exists before deploy. Changing `next.config.js` requires a dev-server restart (done).
**Deferred:** No.

## [2026-06-08] Note: Phase 2 verified headless (game logic) + compile; UI not browser-tested
**Observation:** `tsc --noEmit` and `next lint` are clean. The game logic was verified headless via `scripts/verify-cases.js`: it transpiles each case module with the TypeScript API, builds the DB in sql.js under Node (same WASM binary the browser uses), runs the intended solution query, and asserts `validate()` accepts the solution AND rejects a wrong answer — all three cases PASS. The friendly-error translation was exercised too: `SELCT`→"Did you mean SELECT?", `employes`→"Did you mean 'employees'?", `floor=4`→Dave/Tom/Jim, `flooor`→"Did you mean 'floor'?". The WASM serves at `/sql-wasm.wasm` (HTTP 200). NOT verified: the React/CodeMirror rendering, the in-browser WASM load path, and localStorage persistence across a real refresh — no Chromium/Playwright on this host (same limitation as the v1 console note).
**Action:** Run the Step-9 click-through on a host with a browser to confirm the UI and persistence.
**Deferred:** Yes — in-browser UI confirmation.

## [2026-06-08] Note: lint rules-of-hooks vs. the `useHint` store action
**Observation:** `useCaseStore`'s action is named `useHint` (per the v3 spec's store API). Calling it inside the non-component helper `handleHint` tripped `react-hooks/rules-of-hooks`, which treats any `use*` identifier as a Hook.
**Action:** Kept the store API name `useHint` but bound it to a locally-renamed const `revealHint` in SqlTerminal so the lint rule no longer misfires. No behavior change.
**Deferred:** No.

## [2026-06-08] Resolved: SQL Detective verified in-browser via Playwright
**Choice:** Added Playwright (`@playwright/test`) with `playwright.config.ts` (reuses the running :3000 dev server) and `e2e/sqldetective.spec.ts` — an end-to-end click-through of the real OS: boot → PIN 0000 → dock → Inbox (asserts 3 cases, 2 locked) → SQL Terminal → friendly-error paths (`SELCT`, `employes`) → `WHERE floor = 4` results → reveal a hint → submit Dave Kowalski → CASE CLOSED → reload + re-login → Case 1 CLOSED and Case 2 unlocked; plus a wrong-answer rejection test. `npm run test:e2e` runs it. Both tests pass against real Chromium.
**Reason:** Resolves the in-browser confirmation that the two Phase-1/Phase-2 verification notes left deferred ("no Chromium on this host"). The OS libs were installed manually (the host needed `playwright install-deps`, which requires root). This now exercises the React/CodeMirror rendering, the real in-browser WASM load, and localStorage persistence across an actual refresh — none of which the headless Node checks covered.
**Notes:** Selectors target the dock `aria-label`, windows by `role="dialog"` name, Inbox case rows by button role, and SQL results by `cell` role (names also echo in the editor, so text-only matches are ambiguous). The one-time game-state wipe is gated by a sessionStorage sentinel so a mid-test reload keeps the persisted completion. Supersedes the "Phase-1/Phase-2 verification was compile-time/headless only" notes above for the parts now covered.
**Deferred:** No.

## [2026-06-08] Decision: SQL Detective — explicit name accusation replaces row-heuristic submission
**Choice:** Replaced the heuristic `solution.validate(rows)` predicate (which inspected the player's last query result and passed if the suspect appeared among the rows) with an explicit accusation. `GameCase.solution` now carries `prompt` (the accusation question), `answer` (canonical suspect name), and optional `accept` aliases. A new `src/lib/sqldetective/answer.ts` provides `normalize()` + `checkAnswer()` — case/whitespace/punctuation-insensitive, with the suspect's last name auto-accepted. In `SqlTerminal`, `[✓] SUBMIT ANSWER` is gated on `hasRunSuccess` (the player must run a successful query first), and clicking it opens an inline accusation bar (prompt + text input + CONFIRM, Enter/Esc supported) that calls `checkAnswer()`. `verify-cases.js` and the Playwright spec were updated to drive the new input.
**Reason:** Resolves the "stricter answer validation" item deferred in the Phase-2 decision. The old check was gameable — `SELECT * FROM employees` returned the suspect and "solved" the case with no detective work. Typing the name is a real, uniform "submit an answer" action for every case while the SQL terminal stays the investigation tool.
**Trade-off:** Free-text matching can still reject an unusual spelling not covered by the last-name rule or `accept` list (none needed for the current three name answers). The query-gating only requires *a* successful query, not the *correct* one — intentional, so creative queries that reach the answer aren't blocked.
**Deferred:** No.

## [2026-06-08] Decision: SQL Detective v4 — cases as emails, desktop case-folders, dock unread badge
**Choice:** Three interlocked UI systems on top of the existing game. (1) **Inbox is now an email client** (`Inbox.tsx` full rewrite, modeled on `Messages.tsx`, `var(--color-*)` tokens): each case is a dispatch email with a "DS" avatar, bold-when-unread sender/subject, ~60-char briefing preview, fixed timestamps, a green unread dot / 🔒 lock / "✓ CLOSED" badge, and a right-pane reader (FROM/TO/SUBJECT/DATE header + amber CLASSIFICATION badge + briefing body + "Open Case File"/"Open SQL Terminal" actions). Locked emails show a "this case is locked" notice instead of the briefing. (2) **Opening a case email drops a desktop folder** named `Case #0001 — The Missing Muffin` via a new helper `src/lib/sqldetective/desktopIcon.ts` → `useFileSystemStore.createNode('desktop', …)`; `DesktopIcons.tsx` renders it automatically (untouched). (3) **Red unread badge on the Inbox dock tile**: `DockItem.tsx` gained an optional `badge` prop (macOS corner bubble), wired in `Dock.tsx` to `useCaseStore.unreadCount()` for `app.id === 'inbox'` only. `useCaseStore` gained `openedCases`, `desktopIconsCreated`, derived `unreadCount()`, and actions `openCase()` / `markDesktopIconCreated()` (all persisted).
**Reason:** Implements the v4 brief — makes case delivery diegetic (you read your assignment as mail), gives each opened case a tangible desktop artifact, and surfaces "new work" with a familiar mail badge. Reusing the FS store means the desktop icon persists cross-device via the existing `/api/state` StateSync with zero new plumbing.
**Trade-off:** The desktop folder opens in Finder (not the detective apps) for now — deferred to a later phase. `desktopIconsCreated` lives in localStorage while the FS persists server-side, so the helper also checks the live desktop contents before creating to avoid deduped duplicates ("… 2") on a wiped-localStorage / populated-server mismatch. The old `difficultyDots` helper in `data.ts` is now unused (left in place).
**Verification:** `tsc --noEmit` + `next lint` clean. Playwright `e2e/sqldetective.spec.ts` updated for the email-client flow and green (3/3): asserts dock badge = 1 on boot, locked-email notice, opening Case 1 clears the badge + creates the desktop folder, and after solve+reload the badge returns to 1 (Case 2 unlocked/unread) with the desktop folder persisted. Browser screenshot via the Windows-side Chrome extension was not possible (it can't reach the WSL host's localhost:3000), but Playwright renders the real UI on the Linux host.
**Deferred:** Desktop case-folder opening the detective apps instead of Finder.
