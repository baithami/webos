# PROGRESS.md — WebOS Build Tracker

> Claude Code reads this file at the start of every session to restore context.
> Update this file at the end of every session before closing.

---

## Current Status

**Active Layer:** Layer 2 — Window Manager  
**Overall Progress:** 1 of 6 layers complete  
**Last Session:** 2026-06-05 — Layer 1 scaffolded and completed  
**Next Action:** Build the Window component (drag, resize, traffic lights, focus/z-index, minimize-to-dock) and wire dock launch → open window

---

## Layer Completion

| Layer | Name | Status | Completed |
|---|---|---|---|
| 1 | Shell & Desktop | 🟢 Complete | 2026-06-05 |
| 2 | Window Manager | 🔴 Not started | — |
| 3 | Virtual File System | 🔴 Not started | — |
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

- [ ] Window component with drag (mouse + touch)
- [ ] Window resize (8-handle)
- [ ] Traffic light buttons (close / minimize / fullscreen)
- [ ] Z-index / focus management
- [ ] Minimize-to-dock animation
- [ ] Window stacking state in Zustand
- [ ] `npm run build` passes clean

## Layer 3 — Virtual File System

- [ ] In-memory FS tree structure defined
- [ ] localStorage persistence via Zustand persist
- [ ] CRUD operations (create, read, update, delete, rename, move)
- [ ] File type detection
- [ ] Optional: API route for server-side persistence
- [ ] `npm run build` passes clean

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
| 2026-06-05 | Scaffolded Next.js 14 (TS+Tailwind) manually; installed Framer Motion, Zustand, lucide-react; bumped Next to patched 14.2.35. Built full design system (globals.css tokens, glass, shadows, Z-scale, animation variants, accent list). Desktop canvas + wallpaper layer (4 gradient-fallback options). Menu bar (Apple logo, app menus, live clock, status icons). Dock with cursor-proximity magnification + launch bounce + running-indicator slots. Desktop right-click context menu (wallpaper submenu, theme toggle). Mobile degradation overlay (<768px). `npm run build` clean; prod server smoke-tested 200. | Layer 2 — Window Manager |
