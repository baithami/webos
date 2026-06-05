import { create } from 'zustand'
import { getApp } from '@/lib/apps'

// v1 runs one window per app (single-instance). The window id IS the appId,
// which keeps the dock running-indicator and focus logic trivial. Multi-window
// per app is a v2 concern.

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowInstance extends WindowBounds {
  id: string // === appId in v1
  appId: string
  title: string
  isMinimized: boolean
  isFullscreen: boolean
  /** Bounds saved before fullscreen so we can restore on toggle-off. */
  restoreBounds?: WindowBounds
}

interface WindowState {
  windows: Record<string, WindowInstance>
  /** Bottom→top stacking order of window ids. */
  order: string[]

  openApp: (appId: string) => void
  close: (id: string) => void
  focus: (id: string) => void
  minimize: (id: string) => void
  toggleMinimize: (id: string) => void
  toggleFullscreen: (id: string) => void
  setBounds: (id: string, bounds: Partial<WindowBounds>) => void

  /** Convenience selectors. */
  isRunning: (appId: string) => boolean
  activeId: () => string | null
}

const MENUBAR_H = 28
const DEFAULT_W = 720
const DEFAULT_H = 480
const CASCADE = 28
const MIN_W = 320
const MIN_H = 200

/** Compute a cascaded spawn position so stacked windows don't overlap exactly. */
function spawnBounds(index: number): WindowBounds {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const offset = (index % 6) * CASCADE
  const x = Math.max(40, Math.round((vw - DEFAULT_W) / 2) - 60 + offset)
  const y = Math.max(MENUBAR_H + 12, Math.round((vh - DEFAULT_H) / 2) - 40 + offset)
  return { x, y, width: DEFAULT_W, height: DEFAULT_H }
}

export const useWindowStore = create<WindowState>()((set, get) => ({
  windows: {},
  order: [],

  openApp: (appId) => {
    const state = get()
    const existing = state.windows[appId]
    if (existing) {
      // Already open: un-minimize and bring to front.
      set((s) => ({
        windows: {
          ...s.windows,
          [appId]: { ...s.windows[appId], isMinimized: false },
        },
        order: [...s.order.filter((id) => id !== appId), appId],
      }))
      return
    }

    const app = getApp(appId)
    if (!app) return

    const bounds = spawnBounds(state.order.length)
    const win: WindowInstance = {
      id: appId,
      appId,
      title: app.name,
      ...bounds,
      isMinimized: false,
      isFullscreen: false,
    }
    set((s) => ({
      windows: { ...s.windows, [appId]: win },
      order: [...s.order, appId],
    }))
  },

  close: (id) =>
    set((s) => {
      const next = { ...s.windows }
      delete next[id]
      return { windows: next, order: s.order.filter((w) => w !== id) }
    }),

  focus: (id) =>
    set((s) => {
      if (!s.windows[id]) return s
      if (s.order[s.order.length - 1] === id) return s // already top
      return { order: [...s.order.filter((w) => w !== id), id] }
    }),

  minimize: (id) =>
    set((s) => {
      const win = s.windows[id]
      if (!win) return s
      return {
        windows: { ...s.windows, [id]: { ...win, isMinimized: true } },
        // Drop minimized window to bottom of the stack.
        order: [id, ...s.order.filter((w) => w !== id)],
      }
    }),

  toggleMinimize: (id) => {
    const win = get().windows[id]
    if (!win) return
    if (win.isMinimized) {
      get().openApp(id) // restore + focus
    } else {
      get().minimize(id)
    }
  },

  toggleFullscreen: (id) =>
    set((s) => {
      const win = s.windows[id]
      if (!win) return s
      if (win.isFullscreen) {
        const r = win.restoreBounds ?? spawnBounds(0)
        return {
          windows: {
            ...s.windows,
            [id]: {
              ...win,
              isFullscreen: false,
              restoreBounds: undefined,
              ...r,
            },
          },
        }
      }
      const vw = window.innerWidth
      const vh = window.innerHeight
      return {
        windows: {
          ...s.windows,
          [id]: {
            ...win,
            isFullscreen: true,
            restoreBounds: {
              x: win.x,
              y: win.y,
              width: win.width,
              height: win.height,
            },
            x: 0,
            y: MENUBAR_H,
            width: vw,
            height: vh - MENUBAR_H,
          },
        },
        order: [...s.order.filter((w) => w !== id), id],
      }
    }),

  setBounds: (id, bounds) =>
    set((s) => {
      const win = s.windows[id]
      if (!win) return s
      const merged = { ...win, ...bounds }
      // Enforce minimums when width/height are part of the update.
      if (bounds.width !== undefined) merged.width = Math.max(MIN_W, merged.width)
      if (bounds.height !== undefined)
        merged.height = Math.max(MIN_H, merged.height)
      // Keep the titlebar from going under the menu bar.
      if (bounds.y !== undefined) merged.y = Math.max(MENUBAR_H, merged.y)
      return { windows: { ...s.windows, [id]: merged } }
    }),

  isRunning: (appId) => Boolean(get().windows[appId]),

  activeId: () => {
    const { order, windows } = get()
    for (let i = order.length - 1; i >= 0; i--) {
      const w = windows[order[i]]
      if (w && !w.isMinimized) return w.id
    }
    return null
  },
}))

export const WINDOW_LIMITS = { MIN_W, MIN_H, MENUBAR_H }
