'use client'

import { Apple, Wifi, Search, BatteryFull, Volume2 } from 'lucide-react'
import { Z } from '@/lib/constants'
import Clock from './Clock'

// Static menu titles for the active app. The full per-app menu system is a
// later layer; Layer 1 establishes the bar, branding, clock, and status icons.
const APP_MENUS = ['WebOS', 'File', 'Edit', 'View', 'Window', 'Help']

export default function MenuBar() {
  return (
    <header
      className="glass-menubar menubar-shadow absolute left-0 right-0 top-0 flex h-7 items-center justify-between px-3 text-[13px] font-normal text-[var(--color-text-primary)]"
      style={{ zIndex: Z.menubar }}
    >
      {/* Left: Apple logo + app menus */}
      <nav className="flex items-center gap-4">
        <button
          className="flex items-center rounded px-1 transition-colors hover:bg-white/10"
          aria-label="Apple menu"
        >
          <Apple size={15} fill="currentColor" strokeWidth={0} />
        </button>
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
        <Search size={14} className="opacity-90" />
        <Clock />
      </div>
    </header>
  )
}
