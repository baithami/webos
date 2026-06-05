'use client'

import { motion } from 'framer-motion'
import { Moon, Sun, Wifi, Bluetooth } from 'lucide-react'
import { useSystemStore } from '@/store/useSystemStore'
import { ACCENT_COLORS, Z } from '@/lib/constants'

/**
 * Quick-access Control Center popover from the menu bar. Surfaces the
 * system-wide theme toggle and accent picker (also in Settings) plus a couple
 * of decorative toggles for the macOS feel.
 */
export default function ControlCenter() {
  const theme = useSystemStore((s) => s.theme)
  const toggleTheme = useSystemStore((s) => s.toggleTheme)
  const accent = useSystemStore((s) => s.accent)
  const setAccent = useSystemStore((s) => s.setAccent)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      onClick={(e) => e.stopPropagation()}
      className="glass absolute right-2 top-9 w-72 rounded-2xl p-3 shadow-2xl"
      style={{ zIndex: Z.notification }}
    >
      {/* Connectivity (decorative) */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Pill icon={<Wifi size={16} />} label="Wi-Fi" sub="Home" on />
        <Pill icon={<Bluetooth size={16} />} label="Bluetooth" sub="On" on />
      </div>

      {/* Appearance toggle */}
      <button
        onClick={toggleTheme}
        className="glass mb-3 flex w-full items-center gap-3 rounded-xl p-3 text-left hover:brightness-110"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-white">
          {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
        </span>
        <span>
          <span className="block text-[13px] font-semibold text-[var(--color-text-primary)]">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
          <span className="block text-[11px] text-[var(--color-text-secondary)]">
            Tap to switch
          </span>
        </span>
      </button>

      {/* Accent */}
      <div className="glass rounded-xl p-3">
        <p className="mb-2 text-[12px] font-medium text-[var(--color-text-secondary)]">
          Accent Color
        </p>
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setAccent(c.value)}
              aria-label={c.name}
              title={c.name}
              className="h-6 w-6 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c.value,
                boxShadow:
                  accent === c.value
                    ? `0 0 0 2px var(--color-window-bg), 0 0 0 4px ${c.value}`
                    : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function Pill({
  icon,
  label,
  sub,
  on,
}: {
  icon: React.ReactNode
  label: string
  sub: string
  on?: boolean
}) {
  return (
    <div className="glass flex items-center gap-2 rounded-xl p-2.5">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          on ? 'bg-[var(--color-accent)] text-white' : 'bg-white/15'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold text-[var(--color-text-primary)]">
          {label}
        </span>
        <span className="block truncate text-[10px] text-[var(--color-text-secondary)]">
          {sub}
        </span>
      </span>
    </div>
  )
}
