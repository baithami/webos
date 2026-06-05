'use client'

import { useSystemStore } from '@/store/useSystemStore'
import { getWallpaper, WALLPAPERS } from '@/lib/wallpapers'
import { Z } from '@/lib/constants'

/**
 * Full-viewport wallpaper layer. The wallpaperId is either a built-in preset id
 * (e.g. "sonoma-dark") or an uploaded image URL from the media library
 * ("/api/media/<name>"). A CSS gradient always sits underneath as a fallback.
 */
export function isImageUrl(id: string): boolean {
  return (
    id.startsWith('/api/media/') ||
    id.startsWith('http') ||
    id.startsWith('data:')
  )
}

export default function Wallpaper() {
  const wallpaperId = useSystemStore((s) => s.wallpaperId)

  let gradient = WALLPAPERS[0].gradient
  let imageSrc: string | undefined

  if (isImageUrl(wallpaperId)) {
    imageSrc = wallpaperId
  } else {
    const wallpaper = getWallpaper(wallpaperId)
    gradient = wallpaper.gradient
    imageSrc = wallpaper.image
  }

  return (
    <div
      className="absolute inset-0 h-full w-full"
      style={{ zIndex: Z.desktop, background: gradient }}
    >
      {imageSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={imageSrc}
          src={imageSrc}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          onError={(e) => {
            // Missing preset/media image → reveal the gradient underneath.
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      )}
    </div>
  )
}
