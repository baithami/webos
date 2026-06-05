# ROADMAP.md — WebOS Feature Scope

> This is the single source of truth for what is and isn't in scope.
> Claude Code checks this before making scope decisions.

---

## v1 — Core Build (Current)

### In Scope

**Shell**
- Full-viewport desktop with wallpaper
- macOS-style top menu bar with clock, status icons
- Dock with magnification, running indicators, launch bounce
- Right-click context menu on desktop
- Wallpaper picker (4+ options)

**Window Manager**
- Draggable + resizable windows
- Traffic light buttons (close, minimize, fullscreen) — all functional
- Window stacking and focus management
- Minimize-to-dock with animation
- Snap to screen edges on drag

**Virtual File System**
- In-memory tree persisted to localStorage
- Full CRUD: create, read, update, delete, move, rename
- File type detection by extension

**Built-in Apps**
- Finder (file browser, sidebar, icon/list/column views)
- TextEdit (plain + rich text, save/open)
- Terminal (simulated, custom command set)
- Safari (iframe browser)
- Notes (persistent, FS-backed)
- Settings (appearance, wallpaper, about)
- Calculator (standard + scientific)
- Clock / Calendar (world clock + month view)

**System Features**
- Spotlight search (⌘ + Space)
- Notification center (slide-in panel)
- Dark / light mode system-wide
- Accent color picker
- Login screen (PIN: `0000`)
- Sleep / wake screen

**Performance**
- Lazy-loaded apps via Next.js dynamic()
- Framer Motion for all animations
- Zero build errors
- PM2 deployment ready

---

## Out of Scope for v1

These are explicitly deferred. Do not build them in v1.

- Multi-user accounts
- Real file system access (Node.js `fs` module)
- App Store / plugin system
- iCloud / cloud sync
- AirDrop simulation
- FaceTime / Messages simulation
- Actual web browsing in Safari (beyond iframe)
- iOS/mobile responsive layout
- Screensaver
- Touch Bar simulation
- System audio

---

## v2 — Potential Expansions

Ideas to build on top of a complete v1. Do not implement until v1 Definition of Done is met.

| Feature | Complexity | Notes |
|---|---|---|
| App Store (install/uninstall custom apps) | High | Plugin architecture needed |
| Server-side FS (real persistence via API) | Medium | Next.js API route + JSON or SQLite |
| Multi-user login | Medium | Zustand + server session |
| Mobile touch window manager | High | Completely separate interaction model |
| Screensaver system | Low | Idle timer + canvas animations |
| Custom wallpaper upload | Low | FileReader API → localStorage |
| Menubar extras (custom widgets) | Medium | Slot system in menu bar |
| Mission Control (app switcher) | Medium | Grid animation of all open windows |
| Handoff / cross-device sync | High | Requires auth + database |

---

## Reference Inspiration

- **daedalOS** — open-source browser OS (https://github.com/DustinBrett/daedalOS)
- **macOS Sequoia** — design language reference
- **Figma macOS UI Kit** — component reference

---

*Last updated: 2026-06-04*
