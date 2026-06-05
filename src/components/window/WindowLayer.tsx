'use client'

import { AnimatePresence } from 'framer-motion'
import { useWindowStore } from '@/store/useWindowStore'
import { Z } from '@/lib/constants'
import Window from './Window'

/**
 * Renders every open window in stacking order. Z-index is derived from the
 * window's index in `order` (bottom→top), so focusing — which moves an id to
 * the end of `order` — brings it forward without an ever-growing z counter.
 * The active window is the topmost one that isn't minimized.
 */
export default function WindowLayer() {
  const windows = useWindowStore((s) => s.windows)
  const order = useWindowStore((s) => s.order)

  let activeId: string | null = null
  for (let i = order.length - 1; i >= 0; i--) {
    const w = windows[order[i]]
    if (w && !w.isMinimized) {
      activeId = w.id
      break
    }
  }

  return (
    <AnimatePresence>
      {order.map((id, index) => {
        const win = windows[id]
        if (!win) return null
        return (
          <Window
            key={id}
            win={win}
            zIndex={Z.window + index}
            active={id === activeId}
          />
        )
      })}
    </AnimatePresence>
  )
}
