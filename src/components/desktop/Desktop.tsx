'use client'

import { useEffect, useState } from 'react'
import { useSystemStore } from '@/store/useSystemStore'
import { ACCENT_COLORS } from '@/lib/constants'
import Wallpaper from './Wallpaper'
import MenuBar from './MenuBar'
import Dock from './Dock'
import DesktopContextMenu from './DesktopContextMenu'
import MobileOverlay from './MobileOverlay'

export interface ContextMenuState {
  x: number
  y: number
}

/**
 * Root orchestrator for the WebOS shell. Owns:
 *  - theme + accent application to the document root
 *  - hydration mount guard (persisted store reads localStorage on the client)
 *  - desktop right-click context menu state
 */
export default function Desktop() {
  const theme = useSystemStore((s) => s.theme)
  const accent = useSystemStore((s) => s.accent)
  const accentHover = useAccentHover(accent)

  const [mounted, setMounted] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  useEffect(() => setMounted(true), [])

  // Reflect theme on <html> so [data-theme] CSS overrides apply.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Reflect accent as live CSS variables.
  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', accent)
    document.documentElement.style.setProperty(
      '--color-accent-hover',
      accentHover
    )
  }, [accent, accentHover])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const closeContextMenu = () => setContextMenu(null)

  // Avoid rendering persisted-state-dependent UI until mounted to prevent
  // hydration mismatch between server defaults and client localStorage.
  if (!mounted) {
    return <div className="h-full w-full bg-[var(--color-desktop-bg)]" />
  }

  return (
    <main
      className="relative h-full w-full overflow-hidden bg-[var(--color-desktop-bg)]"
      onContextMenu={handleContextMenu}
      onClick={closeContextMenu}
    >
      <Wallpaper />
      <MenuBar />
      <Dock />

      {contextMenu && (
        <DesktopContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}

      <MobileOverlay />
    </main>
  )
}

/** Derive the accent hover shade from the canonical accent list. */
function useAccentHover(accent: string): string {
  const match = ACCENT_COLORS.find((c) => c.value === accent)
  return match?.hover ?? accent
}
