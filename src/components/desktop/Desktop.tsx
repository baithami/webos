'use client'

import { useEffect, useState } from 'react'
import { useSystemStore } from '@/store/useSystemStore'
import { useUIStore } from '@/store/useUIStore'
import { ACCENT_COLORS } from '@/lib/constants'
import Wallpaper from './Wallpaper'
import Taskbar from './Taskbar'
import DesktopContextMenu from './DesktopContextMenu'
import MobileOverlay from './MobileOverlay'
import WindowLayer from '@/components/window/WindowLayer'
import SystemLayer from '@/components/system/SystemLayer'
import StateSync from '@/components/system/StateSync'
import DesktopIcons from './DesktopIcons'

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
  const closeAllPopovers = useUIStore((s) => s.closeAllPopovers)

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

  // Clicking the desktop dismisses the context menu and any open popover
  // (Start Menu, Spotlight, Control Center, Notifications).
  const handleDesktopClick = () => {
    closeContextMenu()
    closeAllPopovers()
  }

  // Avoid rendering persisted-state-dependent UI until mounted to prevent
  // hydration mismatch between server defaults and client localStorage.
  if (!mounted) {
    return <div className="h-full w-full bg-[var(--color-desktop-bg)]" />
  }

  return (
    <main
      className="relative h-full w-full overflow-hidden bg-[var(--color-desktop-bg)]"
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
    >
      <Wallpaper />
      <DesktopIcons />
      <WindowLayer />
      <Taskbar />

      {contextMenu && (
        <DesktopContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}

      <StateSync />
      <SystemLayer />
      <MobileOverlay />
    </main>
  )
}

/** Derive the accent hover shade from the canonical accent list. */
function useAccentHover(accent: string): string {
  const match = ACCENT_COLORS.find((c) => c.value === accent)
  return match?.hover ?? accent
}
