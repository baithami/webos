'use client'

import { useState } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { PINNED_APPS } from '@/lib/apps'
import { Z } from '@/lib/constants'
import { useWindowStore } from '@/store/useWindowStore'
import DockItem from './DockItem'

/**
 * The dock. Tracks the cursor's x position and feeds it to each DockItem so
 * they magnify based on proximity. Launch bounces a tile briefly — full window
 * launching is wired up in Layer 2/4; for now it provides the tactile feedback.
 */
export default function Dock() {
  // Infinity = cursor not over the dock; tiles rest at base size.
  const mouseX = useMotionValue<number>(Infinity)
  const [bouncing, setBouncing] = useState<string | null>(null)
  const windows = useWindowStore((s) => s.windows)
  const openApp = useWindowStore((s) => s.openApp)
  const toggleMinimize = useWindowStore((s) => s.toggleMinimize)

  const handleLaunch = (id: string) => {
    const existing = windows[id]
    if (existing && !existing.isMinimized) {
      // Already open and visible → bring to front (openApp focuses it).
      openApp(id)
    } else if (existing) {
      // Minimized → restore.
      toggleMinimize(id)
    } else {
      // Not running → launch with a bounce.
      openApp(id)
      setBouncing(id)
      window.setTimeout(
        () => setBouncing((cur) => (cur === id ? null : cur)),
        600
      )
    }
  }

  return (
    <div
      className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-center pb-2"
      style={{ zIndex: Z.dock }}
    >
      <motion.nav
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="glass-dock dock-shadow pointer-events-auto flex items-end gap-2.5 rounded-2xl px-3 pb-2 pt-2"
      >
        {PINNED_APPS.map((app) => (
          <DockItem
            key={app.id}
            app={app}
            mouseX={mouseX}
            isRunning={Boolean(windows[app.id])}
            bouncing={bouncing === app.id}
            onLaunch={handleLaunch}
          />
        ))}
      </motion.nav>
    </div>
  )
}
