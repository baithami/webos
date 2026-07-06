'use client'

import { useEffect, useRef, useState } from 'react'
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
import GameSync from '@/components/system/GameSync'
import DesktopIcons from './DesktopIcons'
import AuthScreen from '@/components/system/AuthScreen'
import { useAuth } from '@/lib/supabase/AuthContext'

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

  const { user, loading: authLoading, configured: authConfigured } = useAuth()
  const [guest, setGuest] = useState(false)

  const [mounted, setMounted] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const desktopRef = useRef<HTMLElement>(null)
  // Marquee state lives OUTSIDE React on purpose: pointermove fires at display
  // refresh rate, and routing it through any state store re-renders (or worse,
  // trips up) the whole shell. The drag mutates these refs and paints the box
  // + icon highlights straight into the DOM — zero React work per move.
  const marqueeStart = useRef<{ x: number; y: number } | null>(null)
  const marqueeRef = useRef<HTMLDivElement>(null)

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

  // ---- Rubber-band (marquee) selection ----------------------------------
  // Only begins on a left-press that lands on the desktop background itself or
  // the wallpaper layer. Inclusion-based on purpose: an exclusion list would
  // miss the many interactive overlays mounted under <main> (Start Menu,
  // Spotlight, Control Center, Notifications, context menu) — pressing one of
  // those would otherwise start a marquee and pointer-capture the click.
  const onDesktopPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    const onBackground =
      e.target === e.currentTarget ||
      !!(e.target as HTMLElement).closest('[data-wallpaper]')
    if (!onBackground) return

    const rect = e.currentTarget.getBoundingClientRect()
    closeContextMenu()
    marqueeStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onDesktopPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const start = marqueeStart.current
    const box = marqueeRef.current
    if (!start || !box) return
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const x = Math.min(start.x, cx)
    const y = Math.min(start.y, cy)
    const w = Math.abs(cx - start.x)
    const h = Math.abs(cy - start.y)

    if (w < 3 && h < 3) {
      box.style.display = 'none'
      return
    }
    box.style.display = 'block'
    box.style.left = `${x}px`
    box.style.top = `${y}px`
    box.style.width = `${w}px`
    box.style.height = `${h}px`

    // Live icon highlight: overlap test in viewport space, toggled as a CSS
    // class (styled in globals.css) so no component re-renders.
    const selLeft = rect.left + x
    const selTop = rect.top + y
    const selRight = selLeft + w
    const selBottom = selTop + h
    e.currentTarget
      .querySelectorAll<HTMLElement>('[data-desktop-icon]')
      .forEach((el) => {
        const r = el.getBoundingClientRect()
        const hit = !(
          selRight < r.left ||
          selLeft > r.right ||
          selBottom < r.top ||
          selTop > r.bottom
        )
        el.classList.toggle('marquee-hit', hit)
      })
  }

  const onDesktopPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!marqueeStart.current) return
    marqueeStart.current = null
    if (marqueeRef.current) marqueeRef.current.style.display = 'none'
    e.currentTarget
      .querySelectorAll<HTMLElement>('[data-desktop-icon].marquee-hit')
      .forEach((el) => el.classList.remove('marquee-hit'))
  }

  // Avoid rendering persisted-state-dependent UI until mounted to prevent
  // hydration mismatch between server defaults and client localStorage.
  if (!mounted) {
    return <div className="h-full w-full bg-[var(--color-desktop-bg)]" />
  }

  // Auth gate: when Supabase is configured, an unauthenticated user sees the
  // CrimeOS officer-authentication screen INSTEAD of the boot sequence (unless
  // they chose to continue as a guest). While the session resolves, hold on a
  // blank teal screen to avoid flashing the desktop. When Supabase is not
  // configured the app runs in guest mode and skips this entirely.
  if (authConfigured && !user && !guest) {
    if (authLoading) {
      return <div className="h-full w-full" style={{ background: '#008080' }} />
    }
    return <AuthScreen onGuest={() => setGuest(true)} />
  }

  return (
    <main
      ref={desktopRef}
      className="relative h-full w-full overflow-hidden bg-[var(--color-desktop-bg)]"
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
      onPointerDown={onDesktopPointerDown}
      onPointerMove={onDesktopPointerMove}
      onPointerUp={onDesktopPointerUp}
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

      {/* Rubber-band box; positioned imperatively by onDesktopPointerMove. */}
      <div
        ref={marqueeRef}
        style={{
          display: 'none',
          position: 'absolute',
          border: '1px dashed #000080',
          background: 'rgba(0, 0, 128, 0.08)',
          pointerEvents: 'none',
          zIndex: 9998,
        }}
      />

      <StateSync />
      <GameSync />
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
