// Wallpaper catalog. STYLE_GUIDE.md asks for 4+ options stored in
// /public/wallpapers/. Until real images are dropped in, every wallpaper
// carries a CSS gradient fallback so the desktop always renders.

export interface Wallpaper {
  id: string
  name: string
  /** Optional image path under /public. If absent, gradient is used. */
  image?: string
  /** CSS background fallback — always present. */
  gradient: string
  /** Which theme this wallpaper pairs best with. */
  pairsWith: 'dark' | 'light'
}

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'sonoma-dark',
    name: 'Sonoma Dark',
    image: '/wallpapers/sonoma-dark.jpg',
    gradient:
      'linear-gradient(160deg, #1b2845 0%, #2a3f6b 28%, #5e4b8b 60%, #8a4c7d 100%)',
    pairsWith: 'dark',
  },
  {
    id: 'sonoma-light',
    name: 'Sonoma Light',
    image: '/wallpapers/sonoma-light.jpg',
    gradient:
      'linear-gradient(160deg, #f6d365 0%, #fda085 45%, #f88a9f 75%, #c79bd8 100%)',
    pairsWith: 'light',
  },
  {
    id: 'abstract-dark',
    name: 'Abstract Dark',
    image: '/wallpapers/abstract-dark.jpg',
    gradient:
      'radial-gradient(circle at 25% 20%, #3a1c71 0%, transparent 45%), radial-gradient(circle at 80% 70%, #d76d77 0%, transparent 50%), linear-gradient(135deg, #0f0c29 0%, #1a1a3e 100%)',
    pairsWith: 'dark',
  },
  {
    id: 'monterey-classic',
    name: 'Monterey Classic',
    image: '/wallpapers/monterey-classic.jpg',
    gradient:
      'linear-gradient(180deg, #0b1026 0%, #1c2a5e 40%, #464f8c 70%, #6d5a8c 100%)',
    pairsWith: 'dark',
  },
]

export const DEFAULT_WALLPAPER_ID = 'sonoma-dark'

export function getWallpaper(id: string): Wallpaper {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0]
}
