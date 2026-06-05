'use client'

import { useSystemStore } from '@/store/useSystemStore'
import { getWallpaper } from '@/lib/wallpapers'
import { Z } from '@/lib/constants'

/**
 * Full-viewport wallpaper layer. Renders the selected wallpaper's image when
 * present, always with its CSS gradient underneath as a guaranteed fallback.
 */
export default function Wallpaper() {
  const wallpaperId = useSystemStore((s) => s.wallpaperId)
  const wallpaper = getWallpaper(wallpaperId)

  return (
    <div
      className="absolute inset-0 h-full w-full"
      style={{ zIndex: Z.desktop, background: wallpaper.gradient }}
    >
      {wallpaper.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={wallpaper.image}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          onError={(e) => {
            // No image file present → reveal the gradient underneath.
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      )}
    </div>
  )
}
