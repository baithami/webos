'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Apple,
  Wifi,
  Search,
  BatteryFull,
  Volume2,
  SlidersHorizontal,
} from 'lucide-react'
import { Z } from '@/lib/constants'
import { useUIStore } from '@/store/useUIStore'
import { useSessionStore } from '@/store/useSessionStore'
import { useWindowStore } from '@/store/useWindowStore'
import Clock from './Clock'

const APP_MENUS = ['WebOS', 'File', 'Edit', 'View', 'Window', 'Help']

export default function MenuBar() {
  const openSpotlight = useUIStore((s) => s.openSpotlight)
  const toggleControlCenter = useUIStore((s) => s.toggleControlCenter)
  const toggleNotifications = useUIStore((s) => s.toggleNotifications)
  const appleMenuOpen = useUIStore((s) => s.appleMenuOpen)
  const toggleAppleMenu = useUIStore((s) => s.toggleAppleMenu)
  const closeAllPopovers = useUIStore((s) => s.closeAllPopovers)

  const sleep = useSessionStore((s) => s.sleep)
  const lock = useSessionStore((s) => s.lock)
  const openApp = useWindowStore((s) => s.openApp)

  return (
    <header
      className="glass-menubar menubar-shadow absolute left-0 right-0 top-0 flex h-7 items-center justify-between px-3 text-[13px] font-normal text-[var(--color-text-primary)]"
      style={{ zIndex: Z.menubar }}
    >
      {/* Left: Apple menu + app menus */}
      <nav className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleAppleMenu()
            }}
            className="flex items-center rounded px-1 transition-colors hover:bg-white/10"
            aria-label="Apple menu"
          >
            <Apple size={15} fill="currentColor" strokeWidth={0} />
          </button>

          <AnimatePresence>
            {appleMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                onClick={(e) => e.stopPropagation()}
                className="glass absolute left-0 top-8 w-56 rounded-lg py-1 text-[13px] shadow-xl"
                style={{ zIndex: Z.notification }}
              >
                <MenuRow
                  onClick={() => {
                    openApp('settings')
                    closeAllPopovers()
                  }}
                >
                  About This WebOS
                </MenuRow>
                <MenuRow
                  onClick={() => {
                    openApp('settings')
                    closeAllPopovers()
                  }}
                >
                  System Settings…
                </MenuRow>
                <Divider />
                <MenuRow
                  onClick={() => {
                    sleep()
                    closeAllPopovers()
                  }}
                >
                  Sleep
                </MenuRow>
                <MenuRow
                  onClick={() => {
                    lock()
                    closeAllPopovers()
                  }}
                >
                  Lock Screen
                </MenuRow>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {APP_MENUS.map((label, i) => (
          <button
            key={label}
            className={`rounded px-1 transition-colors hover:bg-white/10 ${
              i === 0 ? 'font-semibold' : ''
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Right: status icons + clock */}
      <div className="flex items-center gap-3.5">
        <BatteryFull size={17} className="opacity-90" />
        <Wifi size={15} className="opacity-90" />
        <Volume2 size={15} className="opacity-90" />
        <button
          onClick={(e) => {
            e.stopPropagation()
            openSpotlight()
          }}
          aria-label="Spotlight"
          className="rounded p-0.5 hover:bg-white/10"
        >
          <Search size={14} className="opacity-90" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleControlCenter()
          }}
          aria-label="Control Center"
          className="rounded p-0.5 hover:bg-white/10"
        >
          <SlidersHorizontal size={14} className="opacity-90" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleNotifications()
          }}
          aria-label="Notifications"
          className="rounded px-1 hover:bg-white/10"
        >
          <Clock />
        </button>
      </div>
    </header>
  )
}

function MenuRow({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-1 text-left hover:bg-[var(--color-accent)] hover:text-white"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="my-1 h-px bg-[var(--color-window-border)]" />
}
