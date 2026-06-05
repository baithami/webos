// Central design + system constants for WebOS — see STYLE_GUIDE.md

/** Z-index scale. Window stacking adds to Z.window. */
export const Z = {
  desktop: 0,
  window: 100,
  windowActive: 200,
  dock: 500,
  menubar: 600,
  spotlight: 800,
  notification: 900,
  loginScreen: 1000,
  sleepScreen: 1100,
} as const

/** Accent color options surfaced in Settings (STYLE_GUIDE.md). */
export interface AccentColor {
  name: string
  value: string
  hover: string
}

export const ACCENT_COLORS: AccentColor[] = [
  { name: 'Blue', value: '#0a84ff', hover: '#409cff' },
  { name: 'Purple', value: '#bf5af2', hover: '#d08cf5' },
  { name: 'Pink', value: '#ff375f', hover: '#ff6b88' },
  { name: 'Red', value: '#ff453a', hover: '#ff6d64' },
  { name: 'Orange', value: '#ff9f0a', hover: '#ffb74d' },
  { name: 'Yellow', value: '#ffd60a', hover: '#ffe14d' },
  { name: 'Green', value: '#32d74b', hover: '#5fe072' },
  { name: 'Graphite', value: '#98989d', hover: '#b0b0b5' },
]
