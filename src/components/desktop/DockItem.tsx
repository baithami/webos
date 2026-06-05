'use client'

import { useRef } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import type { AppDefinition } from '@/lib/apps'

const BASE_SIZE = 48 // resting icon size (px)
const MAX_SIZE = 80 // magnified size at cursor center
const INFLUENCE = 140 // px on either side the cursor magnifies

interface DockItemProps {
  app: AppDefinition
  /** Cursor x in dock-local coordinates, or null when not hovering. */
  mouseX: MotionValue<number>
  isRunning?: boolean
  bouncing?: boolean
  onLaunch: (id: string) => void
}

/**
 * A single dock tile. Size scales with the cursor's horizontal distance to the
 * tile's center, producing the classic macOS magnification fisheye.
 */
export default function DockItem({
  app,
  mouseX,
  isRunning = false,
  bouncing = false,
  onLaunch,
}: DockItemProps) {
  const ref = useRef<HTMLButtonElement>(null)

  // Distance from cursor to this tile's center along x.
  const distance = useTransform(mouseX, (x) => {
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds || x === Infinity) return INFLUENCE + 1
    return x - (bounds.left + bounds.width / 2)
  })

  const sizeTarget = useTransform(
    distance,
    [-INFLUENCE, 0, INFLUENCE],
    [BASE_SIZE, MAX_SIZE, BASE_SIZE]
  )
  const size = useSpring(sizeTarget, {
    stiffness: 400,
    damping: 28,
    mass: 0.2,
  })

  const Icon = app.icon

  return (
    <div className="group relative flex flex-col items-center justify-end">
      {/* Tooltip */}
      <span className="glass pointer-events-none absolute -top-9 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium text-[var(--color-text-primary)] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {app.name}
      </span>

      <motion.button
        ref={ref}
        style={{ width: size, height: size }}
        animate={bouncing ? { y: [0, -18, 0, -9, 0] } : { y: 0 }}
        transition={
          bouncing
            ? { duration: 0.5, times: [0, 0.3, 0.55, 0.75, 1] }
            : { duration: 0.2 }
        }
        onClick={() => onLaunch(app.id)}
        aria-label={app.name}
        className={`flex items-center justify-center rounded-[22%] bg-gradient-to-b ${app.tile} shadow-lg`}
      >
        <Icon
          className="text-white drop-shadow"
          style={{ width: '55%', height: '55%' }}
          strokeWidth={1.75}
        />
      </motion.button>

      {/* Running indicator */}
      <span
        className={`mt-1 h-1 w-1 rounded-full bg-[var(--color-text-primary)] transition-opacity ${
          isRunning ? 'opacity-80' : 'opacity-0'
        }`}
      />
    </div>
  )
}
