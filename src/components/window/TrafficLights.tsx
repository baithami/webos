'use client'

import { X, Minus, Maximize2 } from 'lucide-react'

interface Props {
  active: boolean
  onClose: () => void
  onMinimize: () => void
  onFullscreen: () => void
}

/**
 * macOS traffic-light cluster. Glyphs only reveal on hover of the group; the
 * dots dim to gray when the window is not the active one.
 */
export default function TrafficLights({
  active,
  onClose,
  onMinimize,
  onFullscreen,
}: Props) {
  return (
    <div className="group/lights flex items-center gap-2">
      <Light
        color="var(--color-close)"
        active={active}
        onClick={onClose}
        label="Close"
      >
        <X size={8} strokeWidth={2.5} className="text-black/60" />
      </Light>
      <Light
        color="var(--color-minimize)"
        active={active}
        onClick={onMinimize}
        label="Minimize"
      >
        <Minus size={8} strokeWidth={2.5} className="text-black/60" />
      </Light>
      <Light
        color="var(--color-fullscreen)"
        active={active}
        onClick={onFullscreen}
        label="Fullscreen"
      >
        <Maximize2 size={6} strokeWidth={2.5} className="text-black/60" />
      </Light>
    </div>
  )
}

function Light({
  color,
  active,
  onClick,
  label,
  children,
}: {
  color: string
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      // Don't let the titlebar drag begin from a traffic-light press.
      onPointerDown={(e) => e.stopPropagation()}
      className="flex h-3 w-3 items-center justify-center rounded-full transition-colors"
      style={{ backgroundColor: active ? color : 'rgba(255,255,255,0.22)' }}
    >
      <span className="opacity-0 group-hover/lights:opacity-100">
        {children}
      </span>
    </button>
  )
}
