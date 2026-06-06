import { create } from 'zustand'
import { DEFAULT_WALLPAPER_ID } from '@/lib/wallpapers'
import { ACCENT_COLORS } from '@/lib/constants'

export type Theme = 'dark' | 'light'

interface SystemState {
  // Appearance
  theme: Theme
  accent: string // hex value, one of ACCENT_COLORS
  wallpaperId: string

  // Actions
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setAccent: (hex: string) => void
  setWallpaper: (id: string) => void
}

// Defaults here are just the pre-hydration state; StateSync loads the saved
// settings from the server on boot and writes changes back (cross-device).
export const useSystemStore = create<SystemState>()((set) => ({
  theme: 'dark',
  accent: ACCENT_COLORS[0].value,
  wallpaperId: DEFAULT_WALLPAPER_ID,

  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setAccent: (accent) => set({ accent }),
  setWallpaper: (wallpaperId) => set({ wallpaperId }),
}))
