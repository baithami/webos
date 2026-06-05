import { create } from 'zustand'

// Ephemeral, session-only UI state: which system overlays are open and the
// live notification list. Nothing here is persisted.

export interface AppNotification {
  id: string
  appId?: string
  title: string
  body: string
  /** Epoch ms when raised. */
  time: number
}

interface UIState {
  spotlightOpen: boolean
  notificationsOpen: boolean
  controlCenterOpen: boolean
  appleMenuOpen: boolean
  notifications: AppNotification[]

  openSpotlight: () => void
  closeSpotlight: () => void
  toggleSpotlight: () => void

  toggleNotifications: () => void
  toggleControlCenter: () => void
  toggleAppleMenu: () => void

  /** Close every transient popover/overlay at once. */
  closeAllPopovers: () => void

  pushNotification: (n: Omit<AppNotification, 'id' | 'time'>) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID()
  return 'u_' + Math.random().toString(36).slice(2, 10)
}

export const useUIStore = create<UIState>()((set) => ({
  spotlightOpen: false,
  notificationsOpen: false,
  controlCenterOpen: false,
  appleMenuOpen: false,
  notifications: [],

  openSpotlight: () =>
    set({
      spotlightOpen: true,
      notificationsOpen: false,
      controlCenterOpen: false,
      appleMenuOpen: false,
    }),
  closeSpotlight: () => set({ spotlightOpen: false }),
  toggleSpotlight: () =>
    set((s) => ({
      spotlightOpen: !s.spotlightOpen,
      notificationsOpen: false,
      controlCenterOpen: false,
      appleMenuOpen: false,
    })),

  toggleNotifications: () =>
    set((s) => ({
      notificationsOpen: !s.notificationsOpen,
      controlCenterOpen: false,
      appleMenuOpen: false,
    })),
  toggleControlCenter: () =>
    set((s) => ({
      controlCenterOpen: !s.controlCenterOpen,
      notificationsOpen: false,
      appleMenuOpen: false,
    })),
  toggleAppleMenu: () =>
    set((s) => ({
      appleMenuOpen: !s.appleMenuOpen,
      notificationsOpen: false,
      controlCenterOpen: false,
    })),

  closeAllPopovers: () =>
    set({
      spotlightOpen: false,
      notificationsOpen: false,
      controlCenterOpen: false,
      appleMenuOpen: false,
    }),

  pushNotification: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: uid(), time: Date.now() },
        ...s.notifications,
      ].slice(0, 50),
    })),
  dismissNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}))
