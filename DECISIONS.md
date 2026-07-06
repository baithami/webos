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

## [2026-06-09] Decision: Windows 95 reskin + Start Menu / Taskbar (replaces macOS dock + menu bar)
**Choice:** Applied a full Win95 visual skin to the shell. globals.css `:root` swapped to Win95 gray/navy tokens + `.win95-*` utility classes (raised/sunken bevels, buttons, titlebar, taskbar, menu items); removed `[data-theme=light]`, blur/`backdrop-filter`, and the window/dock/menubar shadows. Window.tsx chrome rebuilt: `win95-raised` frame (no radius/shadow), blue-gradient `win95-titlebar` (gray when inactive), title left-aligned, and a new `Win95TitleButtons.tsx` (_, □, ✕). New `Taskbar.tsx` (Start button + Start Menu + one button per window + system tray + `TaskbarClock.tsx`), `StartMenu.tsx`. `useUIStore` gained `startMenuOpen`/`toggleStartMenu` (and it's threaded through the other toggles + `closeAllPopovers`). `useWindowStore` `MENUBAR_H` 28→0 and spawn/fullscreen now reserve the 34px bottom taskbar. Deleted `Dock.tsx`, `DockItem.tsx`, `MenuBar.tsx`, `TrafficLights.tsx`. Did not touch the game app components, queryEngine, useCaseStore, or cases.
**Reason:** Implements the v1 Win95 reskin brief, turning the macOS clone into "CrimeOS".
**Deviations (spec was written for a detective-only repo; this repo is a full macOS clone):**
- App ids corrected to the real registry (`sql-terminal`, `detective-notes`); the spec's `aria`/ARIA app does not exist and was dropped.
- **Start Menu lists ALL apps** (user decision), with Windows-flavored labels: Finder→Files, Safari→Browser, TextEdit→Notepad, Terminal→MS-DOS Prompt, Settings→Control Panel (others kept). Real app ids preserved underneath.
- **`.glass` was redefined** as a solid Win95 raised panel rather than deleted. 14 components (Spotlight, ControlCenter, NotificationCenter, several apps, DesktopContextMenu) use it; deleting the class would have made them transparent. Redefining satisfies the "no blur/frosted glass" intent while reskinning every consumer in one move. Kept `--color-close` (red) since several apps use it for destructive actions.
- **System overlays preserved via the taskbar tray** (user decision): MenuBar is gone, but SystemLayer still renders Spotlight/Control Center/Notifications, so the tray exposes Search/Sliders/Bell buttons wired to the existing `useUIStore` toggles.
- **The v4 dock unread badge was re-homed** to the taskbar tray (`data-testid="taskbar-unread-inbox"`, always-visible mail+count, click opens Inbox) plus a red bubble on the Start Menu's Inbox item, since the Dock is deleted. e2e updated accordingly (Start-Menu launching + new testid).
**Trade-off:** `Clock.tsx` (old menu-bar clock) is now unused but left in place. Desktop.tsx still writes `--color-accent` from the user's stored accent, so hover/selection tints may not be exact Win95 navy — cosmetic. Control Center / Notification popovers still anchor where the menu bar used to be (top-right); functional but positioned for the old shell.
**Verification:** `tsc --noEmit` + `next lint` clean. Playwright e2e (3/3) updated and green: boot → Start button → Start-Menu launch → taskbar tray unread badge (1 → cleared → back to 1 after solve+reload) → email flow + accusation + desktop folder + persistence. Captured screenshots of the desktop and the open Start Menu over an app window to confirm the look.
**Deferred:** Re-anchoring Control Center/Notifications to the tray; removing the now-unused Clock.tsx and the dead light-theme toggle in Settings.

## [2026-06-09] Decision: Win95 Finder + window content-well refinement (styling only)
**Choice:** Made the remaining macOS-looking pieces authentically Win95, per the v1 Finder-refinement brief. `finder/chrome.tsx`: Sidebar → flat gray with `#000080` active rows and inline-SVG house/folder glyphs (all Lucide imports dropped); Toolbar → flat gray with a sunken bottom rule, Win95 `< > / Icons / List / Details / New Folder` bevel buttons and double-rule dividers; `FinderContextMenu` → square raised gray popup with hard shadow (no `.glass`/radius), Delete in red. `finder/shared.tsx`: `FileIcon` rebuilt as inline SVG (classic yellow folder, white folded-corner page with a category color stripe); removed the now-unused `CATEGORY_COLOR`/`categoryColor` and the `categoryMeta`/`FileCategory` imports; RenameInput → sunken white Win95 field. `finder/views.tsx`: icon/list/column selection is now flat `#000080` with white text and `#c8c8c8` hover; IconView + ListView wells are white with a sunken border; ListView header is the navy title-bar blue. `window/Window.tsx`: app body gets a 4px-margin sunken inner border, **excluding `sql-terminal`** (the spec's `'sqlterminal'` id was corrected to the real `'sql-terminal'`). No logic touched; game app components, queryEngine, useCaseStore, and cases untouched.
**Reason:** Completes the Win95 conversion for Finder and gives every window a defined content well.
**Trade-off / observation:** `DesktopContextMenu.tsx` is still macOS-styled (rounded, and it still offers a now-defunct "Switch to Light Mode") — it's out of scope for this Finder-only pass, flagged for a follow-up. The unused old menu-bar `Clock.tsx` likewise remains.
**Verification:** `tsc --noEmit` + `next lint` clean; Playwright e2e 3/3 green (the content-well border applies to the detective app windows too, with no selector/behavior regression). Captured screenshots of the Finder icon view, list view, and the file context menu confirming yellow folders, the blue selection/header, the sunken wells, and the square gray menu.
**Deferred:** Win95-ifying DesktopContextMenu; removing the dead light-mode toggle and unused Clock.tsx.

## [2026-06-10] Decision: SQL Detective — Win95 polish pass + data reset (My Computer, app reskins, JPD login/boot)
**Choice:** Four targeted tasks per the v1 polish brief, all styling/data — no game logic touched (SqlTerminal, Inbox, CaseFile, DetectiveNotes, queryEngine, useCaseStore, cases untouched).
(1) **My Computer desktop icon** — `DesktopIcons.tsx`: label `WebOS HD` → `My Computer`; `DriveGlyph` rebuilt as an inline-SVG Win95 monitor (navy screen) + tower; dropped the unused `HardDrive` Lucide import. Kept the white/text-shadow label styling.
(2) **Win95 app reskins** (inline styles, flat `#c0c0c0` toolbars, `.win95-btn` bevel pattern, Lucide icons → text/symbol labels):
  - `TextEdit.tsx` — 32px gray toolbar (New / Open ▾ / Save / divider / Rich / B I U), white Courier editor surface; `TBtn`→`W95AppBtn`; dropped `FilePlus FolderOpen Save Bold Italic Underline Type` + unused `pathString`.
  - `Safari.tsx` — gray toolbar with `< > ↻` + sunken address bar + Go; Win95 favorites start page (globe-glyph links); `NavBtn`→`BrowserBtn`; dropped `ChevronLeft ChevronRight RotateCw Search Lock`; outer container now inline-styled.
  - `Photos.tsx` — gray toolbar (Library / count / ↻ Refresh / + Add Photos), gray grid, flat-bordered thumbnails; added `PhotosBtn`; dropped `Upload RefreshCw`.
  - `Messages.tsx` — chrome only: gray 240px sidebar, sunken search, flat conversation rows (navy active / `#c8c8c8` hover), navy avatars, gray header (name only), gray composer (sunken input + Send button); dropped all six Lucide icons + removed compose/call/info buttons.
(3) **Wipe all user data** — new `POST /api/reset` (reseeds `state.json` to `seedFileSystem()`); deleted `data/state.json`; added a one-time `localStorage.clear()` in `StateSync.tsx` gated by a `webos-v2-reset-done` flag.
(4) **JPD login + boot** — `BootScreen.tsx` rewritten: black screen, inline-SVG JPD police-shield badge, green-on-black typed boot sequence, chunky navy Win95 progress bar (2800ms); dropped `Apple` + framer-motion. `LoginScreen.tsx` rewritten: teal desktop + Win95 gray logon dialog (titlebar shield, JPD badge, read-only `Detective` username, password=PIN field, OK/Cancel, error + PIN hint); dropped `motion`, `Delete`, `getWallpaper`, `useSystemStore`, the PIN-pad.
**Reason:** Implements the v1 polish brief — finishes the macOS→Win95/"CrimeOS" conversion for the four remaining consumer apps + the desktop drive icon, and rethemes the cold-start (boot + logon) as the Jacksonville PD municipal system. The data wipe gives every deployment a clean seed after the reskin.
**Deviation:** The brief said to keep the Messages bubbles "as they are — the blue/gray contrast is fine." In this repo that was false: after the earlier Win95 reskin, incoming bubbles used `--color-sidebar-active` (`#000080` navy) with `--color-text-primary` (black) → illegible dark-on-dark. Fixed the incoming bubble to a light gray (`#e4e4e4`) with black text (outgoing kept blue/white), honoring the brief's stated intent of a readable "gray" incoming bubble.
**Verification:** `tsc --noEmit` clean. Verified in-browser via the Windows-side Chrome extension against the LAN host (`http://10.0.0.174:3000`, not localhost — the extension runs on a different machine): JPD logon dialog (teal + gray + badge + OK), login with PIN `0000`, desktop "My Computer" monitor+tower icon, and the reset (only seed `Read Me.txt` on the desktop). Opened and screenshot-confirmed all four reskins — TextEdit, Messages (incl. the bubble fix), Photos, Safari. Boot screen renders the same JPD badge SVG but elapses faster (2.8s) than the navigate→screenshot round-trip, so it was not captured live.
**Deferred:** None.

## [2026-06-10] Decision: SQL Terminal window chrome fix + desktop rubber-band selection
**Choice:** Two fixes per the v1 brief; no game internals touched (SqlTerminal/Inbox/CaseFile/DetectiveNotes interiors, queryEngine, useCaseStore, cases untouched).
(1) **SQL Terminal window chrome** — `window/Window.tsx`: the app-body wrapper previously excluded the terminal via `win.appId === 'sql-terminal' ? {} : {…sunken border…}`, but the terminal branch had *no* background, so the gray frame bled around the dark content. Replaced with a `DARK_APPS` set (`{'sql-terminal'}`) → `isDark` gets `{ background: '#0a0f0a' }` (edge-to-edge, no margin); every other app keeps the 4px margin + sunken Win95 border. Also added `data-window="true"` to the window `motion.div`.
(2) **Desktop rubber-band (marquee) selection** — `desktop/Desktop.tsx`: added `SelectionBox` state + `onPointerDown/Move/Up` on `<main>`; renders a dashed-navy translucent rect (`#000080`, `rgba(0,0,128,0.08)`, z 9998, ≥3px). Passes the box to `DesktopIcons` (`desktop/DesktopIcons.tsx`), which gives every icon a ref and an `isInSelection` overlap test (`rectsOverlap`, container-local coords via a `containerRef` on the full-bleed `inset-0` layer) — overlapping icons render their existing selected state. `desktop/Wallpaper.tsx`: tagged the root `data-wallpaper` and set the `<img>` `draggable={false}` (native image drag would otherwise hijack a marquee started over the wallpaper).
**Deviations from the brief:**
- **App-id corrected:** the brief guessed `'sqlterminal'`/`'sqlTerminal'`; the real registered id (AppContent.tsx / apps.ts) is `'sql-terminal'`. Used that.
- **Dark background value:** used `#0a0f0a` (the SqlTerminal root's actual `bg-[#0a0f0a]`) instead of the brief's `#0a0e0a`, so the fill is truly seamless if any sub-pixel gap exists.
- **Did NOT mark Inbox/CaseFile/DetectiveNotes (or a non-existent `aria`) as dark.** The brief speculated they might have dark backgrounds; they actually all use `var(--color-window-bg)` (light Win95 gray), so they correctly keep the sunken border. Only `sql-terminal` is dark.
- **Marquee guard is inclusion-based, not the brief's exclusion list.** The brief started a marquee unless the press hit `[data-desktop-icon], [data-window], .win95-taskbar`. But the Start Menu (and Spotlight/Control Center/Notifications/desktop context menu) render under `<main>` *outside* `.win95-taskbar` — so the exclusion guard would start a marquee and `setPointerCapture(main)` on a menu-item press, stealing the click (observed: Start-menu items stopped launching). Switched to: start only when the press lands on `<main>` itself or within `[data-wallpaper]`. This is why `data-wallpaper` was added; `data-window` is kept as a requested semantic hook though the final guard no longer needs it.
**Verification:** `tsc --noEmit` + targeted `next lint` clean. In-browser at 10.0.0.174:3000 (the LAN host — see browser-verify-lan-ip): screenshot-confirmed (a) SQL Terminal dark content filling the body edge-to-edge with no gray bleed, (b) Finder still showing the 4px sunken border, (c) the marquee drawing a dashed navy rect that highlights all three overlapping desktop icons and clears on pointer-up. NOTE: the Claude-in-Chrome extension could not deliver real pointer clicks this session (instrumented listeners recorded zero pointerdown/up/click events from `left_click` — an environmental cross-LAN input issue), so the marquee and the app-launch path were exercised via synthetic PointerEvents and programmatic `.click()` (which fires the real React handlers). The Start-menu toggle and `sql-terminal` launch were both confirmed working through the real `launch()`/`openApp()` path this way.
**Deferred:** None.

## [2026-06-11] Decision: SQL Terminal full Win95 light mode
**Choice:** Pure visual reskin of the SQL Terminal per the v1 brief; game internals untouched (`queryEngine.ts`, `useCaseStore.ts`, `answer.ts`, `cases/` unchanged).
(1) **CodeMirror theme** — new `sqldetective/win95Theme.ts` exporting `win95LightTheme` (`EditorView.theme(..., { dark: false })`: white page, black text/caret, `#f0f0f0` gutter, `#f5f5ff` active line, navy selection, Win95-bevel tooltips) and `win95SqlSyntax` (`HighlightStyle`: bold-navy keywords/bools/null, purple identifiers, `#a31515` strings, `#098658` numbers, green italic comments). `SqlTerminal.tsx` drops `oneDark` + the inline dark `EditorView.theme` and adds both extensions. Added `@codemirror/language` + `@lezer/highlight` to package.json as direct deps (previously transitive only).
(2) **Chrome bars** — header (gray, 13px bold Courier, Win95 `[SCHEMA ▼]` button), query toolbar (30px gray, `#444` label, Win95 `▶ RUN`), RESULTS label bar (gray, 2px top / 1px bottom `#808080` rules), footer (gray, Win95 HINT/SUBMIT buttons, `#444` READY → `#cc0000` on ERROR). A shared `win95Btn` class string does the raised bevel with `active:` border-flip via Tailwind arbitrary properties; root div sets `'Courier New', monospace` once and everything inherits.
(3) **Results well** — white with sunken inset border; `>` prompt prefixes navy on black text; "empty" outcome gray italic; query errors render in the brief's semantic box (`#fff8f0` bg, `#c04000` border, ⚠ prefix, gray collapsible raw error); result tables get a navy `#000080` header row (white bold text, `#4040a0` column rules) over alternating white/`#f0f0f8` rows with `#dde8ff` hover.
(4) **Hint callout** — cream `#fffff0`, `#808080` border, `💡 HINT [n/3]:` navy bold prefix. The n comes from a new read-only subscription to `useCaseStore.hintsUsed` (no store changes).
(5) **Success modal** — the old inline "✓ CASE CLOSED" strip is now a real Win95 dialog (overlay `rgba(0,0,0,.5)`, 320px gray box, 3px bevel + `4px 4px 0 #000` shadow, gradient `CRIMEDB` titlebar in Arial, navy CASE CLOSED heading, OK button that clears `submitResult`). Wrong-answer stays an inline strip, restyled `#cc0000`-on-gray with ⚠.
(6) **Window chrome** — `window/Window.tsx`: removed the `DARK_APPS` mechanism entirely (not just the `'sql-terminal'` entry) since the set would have been empty — per the previous session's finding, Inbox/CaseFile/DetectiveNotes are already light, and the brief's `aria` app doesn't exist. The terminal now gets the standard 4px margin + sunken border like every other app.
**Deviations:** (a) Brief's Step 7 assumed a success *modal* already existed; reality was an inline strip — upgraded it to the specified Win95 dialog (presentation-only; same `submitResult` state). (b) Accusation bar (not in the brief) was restyled to match: navy prompt, sunken white input, Win95 CONFIRM. (c) Schema side panel (also not in the brief) restyled to gray Win95 panel with navy heading. (d) `[SCHEMA]`/RUN buttons use shared `win95Btn` Tailwind classes instead of repeated inline CSS — same rendered values as the brief.
**Verification:** `tsc --noEmit` + `next lint` clean. In-browser at 10.0.0.174:3000: screenshot-confirmed white editor with navy/purple/green/dark-red syntax, gray chrome bars + Win95 buttons, navy-header results table with alternating rows, semantic error box (`SELEC * FORM` → "Did you mean FROM?"), cream `HINT [1/3]` callout, accusation bar + red wrong-answer strip ("Alice Chen"), and the Win95 CASE CLOSED dialog ("Dave Kowalski", +100 XP, OK dismisses). Window sunken border now frames the terminal. Game logic confirmed unchanged end-to-end (query run, friendly error, hints, accusation, case completion + tray badge). NOTE: clicking the logon password field with real pointer input triggers a password-manager extension popup on the remote Chrome that blocks debugger-based MCP tools ("Cannot access a chrome-extension:// URL"); recovered via a fresh MCP tab + JS-driven login.
**Deferred:** None.

## [2026-06-11] Decision: Audit & hardening pass (audit prompt v2) — harness, read-only guard, error-flow repair
**Choice:** Implemented per the v2 audit brief: Phase 1 harness, the four pre-approved fixes, one trivial Phase-3 fix, and the report deliverables (AUDIT-REPORT.md, DOC-DRIFT.md). Zero visual changes to SqlTerminal/win95Theme (the sanctioned REBUILD DB button reuses the existing `win95Btn` class); case content, window-manager core, and all component files untouched/undeleted.
(1) **Harness** — `scripts/verify-cases.js` rewritten into the full playability suite (seed SQL, two-way schema honesty via sqlite_master + PRAGMA table_info, solution paths with red herrings pinned, hint identifier truthfulness, accusation accept/reject loops over all seed names, concept-ladder sequences, Fix 1–3 guard-rail batteries); `verify:cases` npm script added. Hint-identifier extraction is deliberately conservative (snake_case tokens + the word before "table") — under-extraction is safe, over-extraction would false-fail.
(2) **Fix 1 (P0) read-only guard** — `queryEngine.ts` rejects mutating statements pre-execution (`errorKind: 'semantic'`, themed message). **Deviation from the brief's letter:** a strict SELECT/WITH *allowlist* would swallow typo'd keywords (SELCT → "read-only" instead of "Did you mean SELECT?", breaking the brief's own Fix-3 test (b)). Used a *blocklist* of every SQLite keyword that can mutate the DB or its handle (INSERT/UPDATE/DELETE/REPLACE/DROP/CREATE/ALTER/TRUNCATE/ATTACH/DETACH/PRAGMA/VACUUM/REINDEX/ANALYZE/BEGIN/COMMIT/END/ROLLBACK/SAVEPOINT/RELEASE) — equivalent safety (anything else either reads or fails to parse in SQLite, leaving the DB untouched) while preserving the typo heuristics. First-keyword detection skips leading whitespace and -- / block comments, so `/* sneaky */ DROP …` is still blocked. Trailing single semicolon stripped first. REBUILD DB button: a `rebuildNonce` state re-triggers the existing build effect (same cancelled-flag race guard; editor content survives, outcome/hint/accusation state resets — including `hasRunSuccess`, so SUBMIT re-disables until the next successful run, which is intended).
(3) **Fix 2 multi-statement policy** — quote-aware ('' escapes), comment-aware semicolon scanner; >1 statement returns the catalog message verbatim. `SELECT 1;` and `SELECT 1; -- comment` still run.
(4) **Fix 3 friendlyError** — raw SQLite patterns (no such table/column, ambiguous, datatype mismatch) now matched first; typo heuristics (FORM/SELCT/WERE/missing-FROM/unclosed quote/paren) run only as fallback and against string-literal-stripped SQL, killing the `WERE`-inside-a-literal false positive. **Addition beyond the brief:** the reorder itself created a new trap — `SELECT name, floor WHERE floor = 4` raises raw "no such column: name", which would now preempt the missing-FROM heuristic with a misleading message; the no-such-column branch reroutes to the missing-FROM message when the named column exists in the schema and the query has no FROM. Heuristics also now match case-insensitively (FORM was previously uppercase-only).
(5) **Fix 4** — `node-sql-parser` removed (zero imports). Pre-execution parser layer dropped in favor of post-hoc SQLite error translation — SQLite is the single source of truth for validity; node-sql-parser's dialect mismatches would reject valid SQLite queries.
(6) **Phase-3 trivial fix: DetectiveNotes per-case keying** — was hardcoded to `detective-notes-case-001` (one shared pad for all cases, P1 cross-case bleed). Now keyed `detective-notes-<activeCaseId>` (backward compatible — the old literal equals the new template for case-001); pending debounced saves carry the key they were typed under and flush on case switch/unmount, so a fast switch can't write case-1 text into case-2's pad. Header/footer stamps derive from the active case.
(7) **Fix ordering deviation:** the brief says run the gates after each fix; Fixes 1–3 all live in the same `executeQuery`/`friendlyError` flow, so they were implemented as one coherent edit and gated together (harness + tsc + build), then Fix 4 gated separately. The harness's pre-fix baseline run captured the P0 live (`DROP TABLE employees` → "Query ran successfully", table gone).
**Verification:** `npm run verify:cases` ALL CHECKS PASSED (1 intentional WARN = case-002 LIKE concept gap, F-09, content frozen this pass); `tsc --noEmit` clean; `next build` clean. Browser smoke at 10.0.0.174:3000 (full Case-1 path incl. blocked DROP, multi-statement rejection, REBUILD DB, CASE CLOSED, Case-2 unlock badge; old-shape localStorage migration; desktop-icon dedupe with wiped flags; per-case notes switch). NOTE: the long-running dev server white-screened after `npm uninstall` rewrote node_modules under it — restarted (`npm run dev`, log at /tmp/next-dev.log); not a code issue.
**Deferred:** All P2 report-only items (F-07…F-14 in AUDIT-REPORT.md), proposed order at the bottom of the report.

## [2026-06-11] Decision: Inbox Win95 restyle (audit F-10 follow-up)
**Choice:** Visual-only restyle of `src/components/apps/sqldetective/Inbox.tsx` per the v1 Inbox restyle brief — clears audit finding F-10. No logic, store, case, or query-engine changes (`useCaseStore`, `cases/`, `queryEngine.ts` untouched; the only edits are className/style on existing markup).
(1) **Selected email row** — was `bg-[var(--color-sidebar-active)]` (`#000080` navy) under text that stayed `--color-text-primary` (black) → black-on-navy, illegible. Now `bg-[#404040]` dark gray with every text element (sender, time, subject, preview, CLOSED badge) switched to white via a `selected ? 'text-white' : …` conditional. Unselected hover changed from `hover:bg-white/5` (invisible on light gray) to `hover:bg-[#d8d8d8]`. Avatar circle and unread dot left as-is per brief.
(2) **CLASSIFICATION badge** — was amber-on-brown (`bg-[#3a2c0e]`/`text-[#e0b020]`); now navy `#000080` + white `'Courier New'` bold with a Win95 sunken inset border (`borderColor: #808080 #ffffff #ffffff #808080`), matching the SQL Terminal's results-table header.
(3) **Action buttons** — "Open Case File" / "Open SQL Terminal" were rounded macOS pills (one outlined-blue, one solid-blue). Replaced with the shared globals `.win95-btn` class (gray fill, raised bevel that flips sunken on `:active`, square corners, Arial 12px) rather than re-implementing the brief's inline styles — `:active` press-flip can't be done with inline `style` (inline border-color out-prioritizes Tailwind `active:` classes), and `.win95-btn` already encodes the exact Win95 behavior the brief described, keeping the buttons consistent with the rest of the OS chrome. Primary (SQL Terminal) gets `font-bold`.
(4) **Left-pane header** — "Dispatch Inbox" / "Municipal Database Division" now explicit gray `#c0c0c0` block with a `2px solid #808080` bottom border, Arial 14px bold black title + 11px `#444444` subtitle; removed the now-redundant standalone `h-px` divider.
**Deviation:** brief said only to recolor the selected row's text; I also fixed the unselected `✓ CLOSED` badge from `#6bffb8` (light mint, illegible on light gray — the other half of F-10) to `#006600` dark green. White when selected, per brief.
**Verification:** `tsc --noEmit` + `next lint` clean. In-browser at 10.0.0.174:3000: screenshot-confirmed the selected Case #0002 row (dark gray, all text white), Case #0001's readable green CLOSED badge, the navy sunken classification badge, the two flat Win95 buttons, and the gray bold header. Confirmed logic intact — "Open Case File" still opens the Case File window (`[data-window]` shows Inbox | Case File).
**Deferred:** Remaining audit P2s (F-07/08/11/12/13/14).

## [2026-06-11] Decision: CaseFile Win95 restyle + desktop briefing files
**Choice:** Two tasks from the v1 CaseFile brief. No logic in the off-limits files (`queryEngine.ts`, `useCaseStore.ts`, `cases/`) touched; case data read-only.
(1) **CaseFile restyle (clears audit F-11)** — `CaseFile.tsx` rewritten: Win95 tab bar (active tab raised/bold/connected via `borderColor: #ffffff #808080 transparent #ffffff` + `marginBottom: -2` over the container's 2px bottom rule; inactive `#a0a0a0`). BRIEFING is now a clean printed-report panel (white bg, black `'Courier New'`, sunken inset border, `whiteSpace: pre-wrap`). SCHEMA header is black bold mono on gray; each table renders as a white Win95 panel with a navy `#000080` header row (white table name), black column names + gray uppercase type labels, `#e8e8ff` row hover, zero rounded corners. Dropped the old phosphor-green constants, the `glass` tab bar, and the briefing's "government document" paper texture + red CASE stamp in favor of the brief's plain printed look.
(2) **Desktop briefing files** — new `createCaseBriefingFile(gameCase)` in `desktopIcon.ts`: `createNode('desktop', 'CASE-0001.txt', 'file', gameCase.briefing)`. `.txt` → fileTypes category `text` → `defaultApp: 'textedit'`, so double-click opens the briefing in TextEdit. Called from `Inbox.handleRowClick` (after setActiveCase) and a `CaseFile` `useEffect` keyed on `activeCase` + a `desktopReady` selector (`Boolean(nodes['desktop'])`) so a case already active on first load still seeds once the FS hydrates from the server. Idempotent via a name-existence check against the desktop's children (mirrors the existing folder-seeding guard) — no new store flag, so `useCaseStore` stays untouched.
**Deviations:** (a) **Filename = 4-digit `CASE-0001.txt`.** The brief's code snippet produced 3-digit `CASE-001.txt` but its prose/paths said `CASE-0001.txt`; chose 4-digit padding to match the app's `caseNumber` (`#0001`) and the existing "Case #0001 — …" desktop folder. (b) Briefing text is read live from `gameCase.briefing` (never hardcoded), per the brief. (c) File is seeded directly on the Desktop (`parentId: 'desktop'`) alongside the existing empty per-case folder, exactly as the brief specified, rather than inside that folder.
**Verification:** `tsc --noEmit` + `next lint` clean. In-browser at 10.0.0.174:3000: screenshot-confirmed the white/black-mono BRIEFING tab with Win95 tabs, the SCHEMA tab's three navy-header cards (employees / break_room_log / muffin_inventory) all fully legible with no rounded corners and working hover, the seeded `CASE-0001.txt` desktop icon, and double-clicking it opening TextEdit with the exact Case #0001 briefing text. Only one icon present → idempotency guard confirmed.
**Deferred:** Remaining audit P2s (F-07/08/12/13/14).

## [2026-06-11] Decision: CaseFile schema-label legibility + briefing files moved into case folders
**Choice:** Two follow-up tweaks on the SQL Detective CaseFile work; no off-limits files touched.
(1) **Schema text → black.** The BRIEFING report was already pure `#000000` on white (verified live). The only faint text left in the Case File window was the schema column *type* labels (INTEGER/TEXT) at `#808080`; changed to `#000000` in `CaseFile.tsx`. All 15 labels now compute `rgb(0,0,0)`; column names + types are solidly legible (size/uppercase still separate them visually). Note: if the briefing ever looks cream/dark rather than black, that's a stale cached build of the pre-restyle version — the current code is white-page/black-mono.
(2) **Briefing .txt now lives inside the case's folder, not loose on the desktop.** `desktopIcon.ts`: extracted a `caseFolderName()` helper (shared with `createCaseDesktopIcon`) and a `ensureCaseFolder()` that finds-or-creates the case's desktop folder and returns its id. `createCaseBriefingFile()` now writes `CASE-0001.txt` into that folder (`createNode(folderId, …)`) instead of onto `'desktop'`. Idempotency is now three-way: already-in-folder → no-op; a stray copy left directly on the desktop by the previous build → `move()`d into the folder (one-time migration, no duplicate, content preserved); otherwise create fresh. Still seeded from both `Inbox.handleRowClick` and the `CaseFile` mount effect; folder is auto-created if a case is active before its Inbox row was ever clicked.
**Verification:** `tsc --noEmit` + `next lint` clean. In-browser at 10.0.0.174:3000 on a profile that already had the loose `CASE-0001.txt` from the prior build: clicking Case #0001 in the Inbox ran the migration — the desktop icon list dropped `CASE-0001.txt`, and opening the "Case #0001 — The Missing Muffin" folder in Finder showed `CASE-0001.txt` inside it. Schema type labels confirmed `rgb(0,0,0)` via computed style (15/15) and by screenshot.
**Deferred:** Remaining audit P2s (F-07/08/12/13/14).

## [2026-06-19] Decision: Supabase auth (magic link) + cross-device persistence
**Choice:** Layered Supabase on top of the existing localStorage game for **auth + remote persistence only**. New files: `src/lib/supabase/client.ts`, `src/lib/supabase/AuthContext.tsx`, `src/lib/gameState.ts`, `src/components/system/AuthScreen/index.tsx`, `src/components/system/GameSync.tsx`, `src/components/system/Providers.tsx`, `supabase/schema.sql`, `.env.example`. Deps `@supabase/supabase-js @supabase/ssr`. **Did NOT touch** `queryEngine.ts`, `cases/`, `SqlTerminal.tsx` (the "CaseTerminal"), or any CSS/theme — sql.js and all game logic are unchanged.
**Reason:** The brief asked for magic-link login, a CrimeOS-styled login screen, and progress/XP/notes/settings that sync across devices, with localStorage as the offline fallback.

**Reality vs. brief (the brief described an idealized tree that doesn't exist here):**
- **No `gameState.ts` existed.** Game state lives in `useCaseStore` (zustand `persist` -> localStorage `sql-detective-game-state`); per-case notes were loose `detective-notes-<caseId>` keys; FS/system settings already sync via `/api/state`. I created `gameState.ts` as a real persistence adapter that reads/writes those *same* keys (guest/offline) and mirrors to Supabase when logged in — so nothing else had to change its data shape.
- **GameState extended, not narrowed.** The brief's interface dropped `hintsUsed`/`openedCases`/`desktopIconsCreated`, which the live game depends on. Dropping them would silently lose progression on sync, so I kept them in both `GameState` and the schema (`hints_used jsonb`, `opened_cases text[]`, `desktop_icons_created text[]`). `settings.{crtFilter,soundEnabled}` are carried per the brief even though no UI consumes them yet (no CRT filter exists).
- **Login-screen naming collision.** A `LoginScreen.tsx` already exists (the Win95 PIN lock). The new account-auth screen is `AuthScreen/index.tsx` to avoid an ambiguous `./LoginScreen` import. It reuses the PIN dialog's exact Win95 styling (teal #008080, gray beveled chrome, navy title bar, JPD badge) with title "CRIMEOS — OFFICER AUTHENTICATION" and decorative window controls.

**Integration (no game-logic edits):** `useCaseStore` keeps all its logic + persist (offline cache); I added only a `hydrate()` action. `GameSync` (mounted beside `StateSync` in the authenticated Desktop tree) hydrates the store from Supabase on login and debounce-pushes progression changes back. `DetectiveNotes` now persists via `gameState.saveNote/loadNote` (Supabase when logged in, localStorage otherwise) instead of writing localStorage directly — the only "swap reads/writes" edit allowed by the brief. A "Sign Out" entry appears in the Start menu only when logged in.

**Deviations (all to make it actually work):**
1. **Schema ordering bug fixed.** The brief enabled RLS *before* `create table`, so on a fresh project `alter table if exists ... enable row level security` was a silent no-op and RLS never turned on. Reordered: create tables -> enable RLS -> (drop+)create policies. Added `drop policy if exists` so the file is re-runnable.
2. **Guest-mode resilience.** `isSupabaseConfigured()` gates every network call and `createClient()` falls back to a syntactically-valid dummy URL, so the app still boots and plays offline when the human hasn't wired a Supabase project (env still placeholders). The `AuthScreen` is shown only when configured **and** logged out; it also offers "Continue as Guest" so a configured install can never hard-brick play. When unconfigured, the app skips straight to the existing boot/PIN flow.
3. **`loadState()` is async.** The brief wrote `loadState(): GameState`, impossible with a remote fetch; it returns `Promise<GameState>`. `saveState`/`updateState` stay fire-and-forget (`void`) per the brief.
4. **Migration merges instead of blind-overwrites.** `migrateLocalStorageToSupabase()` unions completed/opened/icons and takes max(xp)/union(notes) against any existing remote row, so logging in on a second device that also had guest play can't regress cloud state. Clears migrated local keys afterward.
5. **`.env.local` appended (not committed; gitignored); `.env.example` committed** with empty values.

**Verification:** `tsc --noEmit` + `next lint` clean; full `next build` succeeds (static gen of `/` passes). In-browser at 10.0.0.174:3000 (had to restart the stale Jun-11 dev server — its HMR state was serving a blank page; fresh server fine):
- **Guest mode (shipping default, placeholder env):** boot -> PIN (0000) -> full Win95 desktop with prior case progress intact; AuthScreen correctly skipped; Start menu lists all apps with **no** Sign Out; Detective Notes typed-probe round-tripped to `detective-notes-case-001` via `gameState.saveNote` (match confirmed), then cleared.
- **Configured mode (temporarily forced `isSupabaseConfigured` true via HMR, then reverted):** AuthScreen renders pixel-correct to the CrimeOS aesthetic; empty-email shows "⚠ Please enter a valid email address."; "Continue as Guest" advances to the PIN/boot flow.
**Deferred:** Real magic-link round-trip + cross-device sync require the human to create a Supabase project, set the two env vars, and run `supabase/schema.sql` (it's documentation, run manually per the brief). Wiring `settings.{crtFilter,soundEnabled}` to actual UI is future work (no such UI exists yet).

## [2026-06-19] Verification: Supabase wired to a live project + full E2E sync test
**Project:** `rbwoslgshalbfbgvfpyw` (JPD org). `.env.local` populated with the real URL + anon key (gitignored, not committed). `supabase/schema.sql` applied via the dashboard SQL editor ("Success. No rows returned").
**Verified live (2026-06-19):**
- Tables `user_progress` + `user_notes` exist; RLS enforced — anon SELECT returns `[]`, anon INSERT rejected `42501`/401.
- Authenticated round-trip (real session token): upsert→readback of all columns incl. `hints_used` jsonb + `*_cases` text[] arrays → 201/200, exact data.
- **App E2E:** logged a test user in through the app's own supabase client → AuthScreen cleared → boot→PIN→desktop; **GameSync hydrated the store from Supabase** (xp 100 / active case-002 / completed [case-001] = the seeded row); Start menu showed "Sign Out <email>"; typing in Detective Notes synced to `user_notes` (confirmed via REST read-back). Data written by REST appeared in the app, and data written in the app appeared in the DB — cross-device persistence confirmed both directions.
**Method note:** to automate without an email click, I temporarily disabled "Confirm email" in Auth settings and briefly exposed the supabase client on `window.__sb`; **both reverted** afterward (Confirm email re-enabled → "Successfully updated settings"; `client.ts` hook removed; tsc+lint clean).
**Leftover test data (safe to delete):** auth users `crimeos-test-001@hiswed.com` and `crimeos-e2e@hiswed.com` (+ the latter's progress/notes rows). Delete from Auth → Users if desired (cascades remove their rows). Real magic-link login for real users works via the AuthScreen; the dev LAN origin may need adding to Auth → URL Configuration redirect allowlist for production/other devices.

## [2026-06-19] Fix: magic-link login bounced back to login screen → switch PKCE → implicit flow
**Symptom:** clicking the email magic link redirected to the app (`http://10.0.0.174:3000`) but landed back on the AuthScreen — no session. Diagnosis in-browser: only the `sb-<ref>-auth-token-code-verifier` cookie existed, no auth-token cookie → the PKCE code exchange never completed.
**Root cause:** `@supabase/ssr`'s `createBrowserClient` defaults to the **PKCE flow + cookie storage**, which needs (a) the link opened in the exact browser that requested it (to have the code verifier) and (b) a server-side `/auth/callback` route handler to call `exchangeCodeForSession`. This is a pure client-side SPA with **no server route and no server-side session reads**, so PKCE can't complete reliably.
**Fix:** `src/lib/supabase/client.ts` now uses `@supabase/supabase-js` `createClient` with `auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }`. Implicit flow returns the session tokens in the redirect URL fragment and establishes the session entirely client-side via `detectSessionInUrl` — no verifier, no server callback route. `@supabase/ssr` is no longer imported (kept as a dep; harmless). Everything else (AuthContext, gameState, GameSync) unchanged — same `supabase`/`isSupabaseConfigured` exports. tsc + lint clean; app loads cleanly on the implicit client.
**Note:** flow type is fixed at send time, so any magic link sent before this change (PKCE `?code=` link) is dead — a fresh link must be requested. Live re-test was blocked by Supabase's built-in email **rate limit** (exhausted by test-user signups earlier); resets hourly, or remove via custom SMTP.

## [2026-06-21] Per-account profiles (full isolation) + removed PIN step
**Context:** After wiring magic-link auth, a freshly signed-in email inherited the browser's guest/test progress, and the OS PIN (0000) still gated every login. User wanted: each email = its own fresh profile; only that account's own play persists; no PIN.

**Changes:**
1. **No guest→account migration.** Removed `migrateLocalStorageToSupabase()` and its call in `AuthContext`. A new email now starts from `DEFAULT_STATE`; only that account's play is saved (GameSync). Guest progress stays in localStorage and never folds into an account.
2. **Notes isolation.** `gameState.loadNote()` now treats the account as authoritative when logged in — returns the stored note or '' (never the browser's localStorage note), falling back to the local cache only on a Supabase query error. Stops a previous user's/guest's notes bleeding into a fresh account.
3. **Per-account filesystem + settings.** `data/state.json` (single global) → `data/state-<key>.json` keyed by Supabase user id, or `state-guest.json` when logged out. `storage.ts` `readState(key)`/`writeState(key, state)` sanitize the key (uuid/'guest' only — no path traversal). `/api/state` and `/api/reset` take `?key=`. `StateSync` reads the key from `useAuth().user?.id ?? 'guest'`, reloads on account change, and — crucially — a real account that has no server state yet **seeds a fresh desktop** (`seedFileSystem()` + default theme/wallpaper) instead of adopting this browser's localStorage, so nothing bleeds across profiles. Only the 'guest' key still adopts the old per-browser localStorage once. The old global `state.json` is now orphaned (harmless).
4. **Removed PIN.** `useSessionStore.finishBoot` and `wake` now go to `'active'` instead of `'locked'`, so boot/wake land straight on the desktop. The magic-link AuthScreen is the only gate. (`'locked'` phase + the PIN `LoginScreen.tsx` remain in the tree but are no longer entered.)
5. **One-time reset of the already-polluted `hi@hiswed.com` account** (the earlier migration had merged test progress in): reset its `user_progress` to defaults + cleared `user_notes` via REST using the user's own session (UPDATE only — RLS has no DELETE policy), then cleared the browser's `sql-detective-*`/`detective-notes-*` cache.

**Switched client lib earlier (same session):** `client.ts` uses `@supabase/supabase-js` `createClient` with implicit flow (not `@supabase/ssr`/PKCE) so magic links log in client-side without a server callback route.

**Verification:** tsc + lint + full `next build` clean. Live (10.0.0.174:3000, logged in as hi@hiswed.com): boots straight to desktop (no PIN), fresh profile (xp 0, no completed cases), fresh desktop (My Computer / Case #0001 / Read Me — Case #0002 gone), and `data/state-216d01c8….json` written with the seeded FS. Dev server restarted after the prod build (build clobbers `.next`).
**Caveat surfaced to user:** a fresh account gets the app DEFAULT wallpaper/theme (dark gradient), not the shared teal — customizations now persist per-account.

## [2026-06-21] JPD branding: default wallpaper + email sender name
- **Default wallpaper = JPD badge.** Promoted the existing `media/mnKzt.jpg` (teal "Jacksonville Police" pixel badge) to a committed asset `public/wallpapers/jpd-hq.jpg`, added a `WALLPAPERS` preset `jpd-hq`, and set `DEFAULT_WALLPAPER_ID = 'jpd-hq'` so every new account/guest gets it. Also updated the one existing account state file (`data/state-<uid>.json`) `settings.wallpaperId` → `jpd-hq` so the current user sees it. Verified live: desktop renders the teal JPD wallpaper.
- **Email sender "JPD".** Changed Supabase Custom SMTP "Sender name" CRIMEOS → JPD (Mailgun/baitham.com unchanged). Password field is blank-on-load by design; saving kept the stored password — confirmed by a `/auth/v1/otp` send returning HTTP 200 (would 500 if SMTP auth were broken).
**Verification:** tsc + lint clean.

## [2026-06-23] QoL: copy from SQL Terminal results
**Request:** be able to copy/paste from the SQL Terminal results section.
**Root cause:** `globals.css` sets `body { user-select: none }` (standard for a desktop shell — prevents accidental selection while dragging), which also blocked selecting results text.
**Change (SqlTerminal.tsx only — no engine/case logic touched):**
- Results scroll container now opts back into selection (`select-text` + inline `userSelect/WebkitUserSelect: 'text'`), overriding the global rule locally so the rest of the OS still can't be text-selected. Users can now drag-select cells and Ctrl/Cmd+C.
- Added a **⧉ COPY** button in the RESULTS header (shown on a successful query) that copies the full result set as TSV (header row + rows, tab-separated) with a brief "✓ COPIED" confirmation.
- **Insecure-origin aware:** the app is served over plain http on a LAN IP where `navigator.clipboard` is unavailable, so copy falls back to a hidden-textarea `document.execCommand('copy')`. (If the app later moves behind https — e.g. a Cloudflare tunnel — the `navigator.clipboard` path is used automatically.)
**Verification:** tsc + lint clean. In-browser at 10.0.0.174:3000: ran a query, results render with the COPY button; confirmed text selection now returns content (`getSelection`), and `execCommand('copy')` returns `true` on a real (trusted) click — both copy paths work on the insecure origin.

## [2026-06-23] QoL: per-cell copy + public tunnel auth config
**Cell-level copy (SqlTerminal.tsx):** clicking a results cell now selects just that cell (navy highlight, one at a time) and copies its single value; the header button became **⧉ COPY ROW** (disabled until a cell is selected) and copies the selected cell's whole row as TSV. Manual drag-highlight + Ctrl/Cmd+C still works (cell onClick skips when a text selection exists). Generic `copyText()` helper uses navigator.clipboard on secure origins (https tunnel) and the execCommand fallback on plain-http LAN. Verified: 1 cell highlights on click, COPY ROW enables.
**Public tunnel (Supabase Auth):** for serving via the Cloudflare tunnel `test.hiswed.com → http://10.0.0.174:3000`, set Supabase Auth Site URL = `https://test.hiswed.com` and added `https://test.hiswed.com/**` to the redirect allowlist (kept `http://10.0.0.174:3000` for local). App is host-agnostic (emailRedirectTo uses window.location.origin; /api/state relative). NOTE: `https://test.hiswed.com` returns Cloudflare Error 1033 — `cloudflared` is NOT on this machine (datadev/10.0.0.174 runs only the dev server); it lives on the user's separate Proxmox host and must be started there. Dev server confirmed up + reachable at http://10.0.0.174:3000 (HTTP 200, bound 0.0.0.0).

## [2026-06-23] Tunnel 1033 resolved: DNS pointed at the wrong tunnel
After cloudflared was started (proxtest tunnel Healthy on host 10.0.0.130), `https://test.hiswed.com` still 1033'd. Root cause found in Cloudflare DNS: the `test` CNAME pointed to the **second-brain** tunnel (`293e3aa0-…cfargotunnel.com`) — which is **Down** — even though the test.hiswed.com → http://10.0.0.174:3000 ingress lives in **proxtest** (`23e30b36-…`, Healthy). Fix: edited the `test.hiswed.com` DNS record's CNAME target to `23e30b36-2a89-4a73-820f-c5067397a4ba.cfargotunnel.com` (proxtest). After ~30s propagation, `https://test.hiswed.com` serves the app (HTTP 200; AuthScreen renders). NOTE: this is a DEV server over the tunnel — for a stable public deployment, serve a production build (`npm run build && npm run start`, or pm2 via ecosystem.config.js).

## [2026-06-25] Feature: Supervisor Console app (CrimeOS)
Added one new app — a beige government machine cabinet with a recessed CRT face-screen (ADA-from-Outer-Worlds: "tiny face, giant box") that plays a scripted per-case intro (auto-pops on first case open) and re-serves the case's hints on demand. No protected/core file edited.

- **Separate dialogue registry, NOT on GameCase.** All supervisor content lives in a new `src/lib/sqldetective/supervisors.ts` keyed by case id (one recurring supervisor, Sgt. Dolores Vane / portraitId "vane" / PRECINCT CH-04). The case data model (`types.ts`, `caseNNN.ts`) and all verified core files stay byte-for-byte untouched. Cases without an entry get an "AWAITING ASSIGNMENT" idle screen.
- **Hints reuse the existing system.** REQUEST HINT calls `useCaseStore.nextHint()` + `useHint()` (same actions SqlTerminal uses), so the console and terminal share one hint counter; the console only wraps the returned text in a line with escalating expr (hint 1→neutral, 2→stern, 3→suspicious) and shows "NO MORE HINTS" once `hintsUsed >= 2`.
- **Auto-pop = Option A.** `Inbox.handleRowClick` gets ONE guarded line — `if (firstOpen) useWindowStore.getState().openApp('supervisor')` (Inbox already imports useWindowStore). All dialogue logic stays in the console: on mount / activeCaseId change it enqueues the case's intro once per session (tracked in a module-level `Set`, not a store). Chose A over B for the "it pops up" UX; Inbox only learns "open the window".
- **Placeholder face strategy.** `USE_PLACEHOLDER_FACE = true` (documented one-liner to flip it). The FaceScreen renders a green-on-dark CRT placeholder — eyes that blink while idle and a mouth-bar that toggles with the closed/open talk state — so the talk animation is visibly working with no art. When flipped false it loads `public/supervisors/<portraitId>/<expr>_<open|closed>.png` and falls back to the placeholder on `onError`. Created `public/supervisors/.gitkeep` (with the asset path convention) so the directory exists.
- **`pinned: false`.** `pinned` only feeds the macOS dock (`PINNED_APPS`), which isn't rendered in the Win95 shell (the taskbar shows running windows + a hardcoded Start menu). So pinning would do nothing visible. Summon path is **Spotlight** (it searches the APPS registry by name → `openApp('supervisor')`) plus the auto-pop and the running-window taskbar button. StartMenu/Taskbar were left untouched (outside the allowed diff).
- **A11y:** respects `prefers-reduced-motion` — disables flicker, mouth-cycle, blink, and per-char typing (shows full line instantly). No audio (v1).

**Verification:** `tsc --noEmit` + `next lint` clean. Diff touches only the allowed set (SupervisorConsole.tsx, supervisors.ts, apps.ts, AppContent.tsx, Inbox.tsx, public/supervisors/.gitkeep, DECISIONS.md) — no protected file.
