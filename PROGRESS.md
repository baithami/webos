# PROGRESS.md — WebOS Build Tracker

> Claude Code reads this file at the start of every session to restore context.
> Update this file at the end of every session before closing.

---

## Current Status

**Active Layer:** Layer 4 — Built-in Apps  
**Overall Progress:** 3 of 6 layers complete  
**Last Session:** 2026-06-05 — Layer 3 completed  
**Next Action:** Build the built-in apps (Finder, TextEdit, Terminal, Safari, Notes, Settings, Calculator, Clock/Calendar) and register them in AppContent's CONTENT map; wire Finder/TextEdit/Notes to the FS store

---

## Layer Completion

| Layer | Name | Status | Completed |
|---|---|---|---|
| 1 | Shell & Desktop | 🟢 Complete | 2026-06-05 |
| 2 | Window Manager | 🟢 Complete | 2026-06-05 |
| 3 | Virtual File System | 🟢 Complete | 2026-06-05 |
| 4 | Built-in Apps | 🔴 Not started | — |
| 5 | System Features | 🔴 Not started | — |
| 6 | Polish & Performance | 🔴 Not started | — |

Status key: 🔴 Not started · 🟡 In progress · 🟢 Complete

---

## Layer 1 — Shell & Desktop

- [x] Next.js 14 project scaffolded with TypeScript + Tailwind
- [x] Dependencies installed (Framer Motion, Zustand, etc.)
- [x] Full-viewport desktop canvas
- [x] Wallpaper rendering with 4 default options
- [x] Top menu bar (Apple logo, clock, status icons)
- [x] Dock component with pinned apps
- [x] Dock hover magnification
- [x] Right-click context menu on desktop
- [x] `npm run build` passes clean

## Layer 2 — Window Manager

- [x] Window component with drag (mouse + touch)
- [x] Window resize (8-handle)
- [x] Traffic light buttons (close / minimize / fullscreen)
- [x] Z-index / focus management
- [x] Minimize-to-dock animation
- [x] Window stacking state in Zustand
- [x] `npm run build` passes clean

## Layer 3 — Virtual File System

- [x] In-memory FS tree structure defined
- [x] localStorage persistence via Zustand persist
- [x] CRUD operations (create, read, update, delete, rename, move)
- [x] File type detection
- [ ] Optional: API route for server-side persistence — deferred per DECISIONS 2026-06-04 (revisit for cross-device sync)
- [x] `npm run build` passes clean

## Layer 4 — Built-in Apps

- [ ] Finder
- [ ] TextEdit
- [ ] Terminal (with command set)
- [ ] Safari (iframe browser)
- [ ] Notes
- [ ] Settings
- [ ] Calculator
- [ ] Clock / Calendar
- [ ] All apps open/close without errors
- [ ] `npm run build` passes clean

## Layer 5 — System Features

- [ ] Spotlight search (⌘ + Space)
- [ ] Notification center
- [ ] Dark / light mode toggle
- [ ] Accent color picker
- [ ] Login/boot screen
- [ ] Sleep/wake screen
- [ ] `npm run build` passes clean

## Layer 6 — Polish & Performance

- [ ] All animations Framer Motion
- [ ] Frosted glass on all panels
- [ ] Lazy-loaded app components
- [ ] Mobile degradation overlay
- [ ] Zero console errors in production
- [ ] Final `npm run build` clean
- [ ] PM2 deployment verified on Ubuntu 22.04

---

## Session Log

| Date | What was done | Next task |
|---|---|---|
| — | Project not started | Scaffold and Layer 1 |
| 2026-06-05 | Scaffolded Next.js 14 (TS+Tailwind) manually; installed Framer Motion, Zustand, lucide-react; bumped Next to patched 14.2.35. Built full design system (globals.css tokens, glass, shadows, Z-scale, animation variants, accent list). Desktop canvas + wallpaper layer (4 gradient-fallback options). Menu bar (Apple logo, app menus, live clock, status icons). Dock with cursor-proximity magnification + launch bounce + running-indicator slots. Desktop right-click context menu (wallpaper submenu, theme toggle). Mobile degradation overlay (<768px). `npm run build` clean; prod server smoke-tested 200. Committed (a08c945). | Layer 2 — Window Manager |
| 2026-06-05 | Window store (Zustand, single-window-per-app, stacking `order` array, open/close/focus/minimize/restore/fullscreen/setBounds with min-size + menubar clamps). Window component: pointer-event drag from titlebar (mouse+touch), 8-handle resize, traffic lights (hover glyphs, dim when inactive), focus-on-pointerdown, double-click + green-light fullscreen with bounds restore, edge snapping (top→maximize, left/right→half). WindowLayer with AnimatePresence (open/close/minimize variants), z from stacking index. Minimize-to-dock genie transform toward bottom-center. App-content placeholder registry (Layer 4 fills it). Dock wired to openApp/restore/focus with live running indicators. `npm run build` clean; standalone server smoke-tested 200. Committed (0156662). | Layer 3 — Virtual File System |
| 2026-06-05 | Virtual file system. fileTypes.ts: extension→category (text/richtext/image/audio/video/code/pdf/archive/unknown) with labels + lucide icons + defaultApp. fs.ts: normalized flat NodeMap model, ROOT_ID, seed home tree (Desktop/Documents/Downloads/Pictures/Music/Movies + sample files, fixed seed timestamps for SSR determinism), pure helpers (getChildren, sortNodes folders-first, getPath, pathString, getByPath with ./.. , isDescendant, dedupeName, collectSubtree, nodeCategory). useFileSystemStore: Zustand + persist (localStorage key webos-filesystem v1), CRUD — createNode/updateContent/rename/deleteNode(recursive)/move(cycle-guarded)/reset, all with sibling name dedupe + root protections. Verified with 23 tsx unit tests (all pass). Optional server API route deferred per seed decision. `npm run build` clean. | Layer 4 — Built-in Apps |
