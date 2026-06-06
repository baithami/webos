# WebOS

A browser-based desktop operating system — a macOS-style shell with a real
window manager, a virtual file system, eight built-in apps, and system features
like Spotlight and a lock screen. Built with **Next.js 14**, **React**,
**TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Zustand**.

> Default lock-screen PIN: **`0000`**

---

## Features

**Shell & desktop**
- Full-viewport desktop with wallpapers (4 built-in gradient presets + your own uploads)
- macOS-style menu bar (Apple menu, live clock, status icons) and a magnifying Dock
- Desktop icons: a "WebOS HD" drive + live contents of the Desktop folder
- Right-click wallpaper / theme menu

**Window manager**
- Draggable, 8-handle resizable windows (mouse + touch)
- Traffic-light controls, focus/z-index stacking, minimize-to-dock, fullscreen
- Edge snapping (top → maximize, left/right → half)

**Built-in apps**
- **Finder** — file browser with icon / list / column views, CRUD, drag-to-move
- **TextEdit** — plain + rich text, save/open to the file system
- **Terminal** — simulated shell over the file system (`ls`, `cd`, `cat`, `mkdir`, `rm`, `open`, …)
- **Notes** — file-system-backed notes
- **Safari** — iframe browser with an address bar
- **Calculator** — standard + scientific
- **Clock** — world clock + month calendar
- **Settings** — appearance, wallpaper, storage, about

**System features**
- Spotlight search (⌘ + Space) across apps and files
- Notification center + Control Center
- Dark / light themes and an accent-color picker
- Boot, lock (PIN), and sleep/wake screens

**Persistence (cross-device)**
- The virtual file system + user settings are stored **server-side** (`data/state.json`)
  and sync across any device that reaches the app
- Uploaded photos are stored as **real files** in a `media/` folder you can also
  manage by hand, served by an API and usable as wallpapers

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router), `output: 'standalone'` |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS variables for theme tokens |
| State | Zustand |
| Animation | Framer Motion |
| Icons | lucide-react |

---

## Getting started

Requires **Node.js 20+**.

```bash
npm install
npm run dev          # http://localhost:3000
```

Unlock with PIN **`0000`**.

### Production build

This project builds as a standalone server (`next.config.js` sets
`output: 'standalone'`), so the production entrypoint is
`.next/standalone/server.js` — not `next start`.

```bash
npm run build:standalone   # build + copy static assets next to the server bundle
npm run start:standalone   # node .next/standalone/server.js
```

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full PM2 + Nginx + Cloudflare
Tunnel setup.

---

## Environment variables

Create `.env.local` (gitignored):

```env
NEXT_PUBLIC_APP_NAME=WebOS
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_DEFAULT_PIN=0000

# Where server-side state + uploads live (defaults shown; override in prod)
WEBOS_DATA_DIR=./data      # data/state.json — file system + settings
WEBOS_MEDIA_DIR=./media    # uploaded photos (real files)
```

`data/` and `media/` are **runtime data** (gitignored). Put them on a stable,
writable path in production and back them up — they hold the user's files,
settings, and photos.

---

## How persistence works

| Data | Where | Scope |
|---|---|---|
| File system tree + settings | `data/state.json` via `GET/PUT /api/state` | cross-device |
| Uploaded photos | `media/<name>` via `/api/media` | cross-device |

On boot the client loads state from the server; changes are debounce-saved back.
The first run migrates any pre-existing browser `localStorage` data to the
server. Single-user, last-write-wins.

> The API routes are unauthenticated (the PIN is a client-side gate). If the app
> is exposed publicly, put a Cloudflare Access policy in front of it.

---

## Project structure

```
src/
  app/                 # Next.js App Router
    api/media/         # upload / list / serve / delete photos
    api/state/         # load / save the file system + settings
    layout.tsx, page.tsx, globals.css
  components/
    desktop/           # wallpaper, menu bar, dock, desktop icons, context menu
    window/            # window manager + window chrome
    system/            # spotlight, notifications, control center, login/boot/sleep, sync
    apps/              # the eight built-in apps
  lib/                 # fs model, file types, wallpapers, apps registry, animations, upload
    server/            # server-only storage (media + state)
  store/               # Zustand stores (window, file system, system, ui, session, intent)
```

---

## Project docs

This project is built and tracked through a set of living documents:

- **[PROGRESS.md](./PROGRESS.md)** — build tracker (layers, status, session log)
- **[DECISIONS.md](./DECISIONS.md)** — architectural decision log
- **[ROADMAP.md](./ROADMAP.md)** — scope: what's in v1 and what's deferred
- **[STYLE_GUIDE.md](./STYLE_GUIDE.md)** — design system (tokens, glass, animation)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — server setup (PM2, Nginx, Cloudflare Tunnel)
- **[PROMPT_LIBRARY_ENTRY.md](./PROMPT_LIBRARY_ENTRY.md)** — prompt to resume the build in a new session

---

## License

Personal project — all rights reserved unless stated otherwise.
