'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Check } from 'lucide-react'
import { useSystemStore } from '@/store/useSystemStore'
import { WALLPAPERS } from '@/lib/wallpapers'
import { Z } from '@/lib/constants'

const MENU_WIDTH = 220
const SUBMENU_WIDTH = 200

interface Props {
  x: number
  y: number
  onClose: () => void
}

/**
 * Right-click desktop menu. Layer 1 wires the appearance actions that exist
 * today — wallpaper, theme. Item slots like "New Folder" arrive with the file
 * system in Layer 3.
 */
export default function DesktopContextMenu({ x, y, onClose }: Props) {
  const theme = useSystemStore((s) => s.theme)
  const toggleTheme = useSystemStore((s) => s.toggleTheme)
  const wallpaperId = useSystemStore((s) => s.wallpaperId)
  const setWallpaper = useSystemStore((s) => s.setWallpaper)

  const [submenu, setSubmenu] = useState(false)

  // Keep the menu on-screen near the right/bottom edges.
  const left = Math.min(x, window.innerWidth - MENU_WIDTH - 8)
  const top = Math.min(y, window.innerHeight - 240)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.1 }}
      className="glass absolute overflow-visible rounded-lg py-1 text-[13px] text-[var(--color-text-primary)] shadow-xl"
      style={{ left, top, width: MENU_WIDTH, zIndex: Z.notification }}
      // Stop the desktop's onClick (which closes) from firing on inner clicks.
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <MenuItem disabled>New Folder</MenuItem>
      <MenuItem disabled>Get Info</MenuItem>
      <Divider />

      {/* Change Wallpaper → submenu */}
      <div
        className="relative"
        onMouseEnter={() => setSubmenu(true)}
        onMouseLeave={() => setSubmenu(false)}
      >
        <button className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-[var(--color-accent)] hover:text-white">
          <span>Change Wallpaper</span>
          <ChevronRight size={14} />
        </button>

        {submenu && (
          <div
            className="glass absolute top-0 rounded-lg py-1 shadow-xl"
            style={{
              width: SUBMENU_WIDTH,
              // Flip submenu to the left if it would overflow the viewport.
              left:
                left + MENU_WIDTH + SUBMENU_WIDTH > window.innerWidth
                  ? -SUBMENU_WIDTH
                  : MENU_WIDTH,
              zIndex: Z.notification + 1,
            }}
          >
            {WALLPAPERS.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setWallpaper(w.id)
                  onClose()
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--color-accent)] hover:text-white"
              >
                <span
                  className="h-4 w-4 shrink-0 rounded border border-white/20"
                  style={{ background: w.gradient }}
                />
                <span className="flex-1">{w.name}</span>
                {wallpaperId === w.id && <Check size={14} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <MenuItem
        onClick={() => {
          toggleTheme()
          onClose()
        }}
      >
        {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      </MenuItem>
    </motion.div>
  )
}

function MenuItem({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-3 py-1.5 text-left enabled:hover:bg-[var(--color-accent)] enabled:hover:text-white disabled:cursor-default disabled:text-[var(--color-text-tertiary)]"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="my-1 h-px bg-[var(--color-window-border)]" />
}
