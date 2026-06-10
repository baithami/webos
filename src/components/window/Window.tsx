'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  useWindowStore,
  WINDOW_LIMITS,
  type WindowInstance,
} from '@/store/useWindowStore'
import { Z } from '@/lib/constants'
import AppContent from '@/components/apps/AppContent'
import Win95TitleButtons from './Win95TitleButtons'

const { MIN_W, MIN_H, MENUBAR_H } = WINDOW_LIMITS
const SNAP_EDGE = 6 // px from a screen edge that triggers a snap

interface ResizeEdges {
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
}

const HANDLES: { dir: string; className: string; edges: ResizeEdges }[] = [
  { dir: 'n', className: 'left-2 right-2 top-0 h-1.5 cursor-ns-resize', edges: { top: true } },
  { dir: 's', className: 'left-2 right-2 bottom-0 h-1.5 cursor-ns-resize', edges: { bottom: true } },
  { dir: 'e', className: 'top-2 bottom-2 right-0 w-1.5 cursor-ew-resize', edges: { right: true } },
  { dir: 'w', className: 'top-2 bottom-2 left-0 w-1.5 cursor-ew-resize', edges: { left: true } },
  { dir: 'ne', className: 'top-0 right-0 h-3 w-3 cursor-nesw-resize', edges: { top: true, right: true } },
  { dir: 'nw', className: 'top-0 left-0 h-3 w-3 cursor-nwse-resize', edges: { top: true, left: true } },
  { dir: 'se', className: 'bottom-0 right-0 h-3 w-3 cursor-nwse-resize', edges: { bottom: true, right: true } },
  { dir: 'sw', className: 'bottom-0 left-0 h-3 w-3 cursor-nesw-resize', edges: { bottom: true, left: true } },
]

interface WindowProps {
  win: WindowInstance
  zIndex: number
  active: boolean
}

export default function Window({ win, zIndex, active }: WindowProps) {
  const focus = useWindowStore((s) => s.focus)
  const close = useWindowStore((s) => s.close)
  const minimize = useWindowStore((s) => s.minimize)
  const toggleFullscreen = useWindowStore((s) => s.toggleFullscreen)
  const setBounds = useWindowStore((s) => s.setBounds)

  // Tracked during drag/resize (kept for potential snap/UX hooks); Win95 windows
  // snap to position with no CSS transition, so it no longer gates styling.
  const [, setInteracting] = useState(false)
  const lastPointer = useRef({ x: 0, y: 0 })

  // ---- Dragging (from the titlebar) -------------------------------------
  const onTitlePointerDown = (e: React.PointerEvent) => {
    if (win.isFullscreen) return // can't drag a fullscreen window
    e.preventDefault()
    focus(win.id)
    setInteracting(true)
    const start = { x: win.x, y: win.y }
    const px = e.clientX
    const py = e.clientY
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)

    const onMove = (ev: PointerEvent) => {
      lastPointer.current = { x: ev.clientX, y: ev.clientY }
      setBounds(win.id, {
        x: start.x + (ev.clientX - px),
        y: start.y + (ev.clientY - py),
      })
    }
    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(e.pointerId)
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      applySnap(ev.clientX, ev.clientY)
      setInteracting(false)
    }
    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
  }

  /** Edge snapping (ROADMAP: snap to screen edges on drag). */
  const applySnap = (clientX: number, clientY: number) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const workH = vh - MENUBAR_H
    if (clientY <= MENUBAR_H + SNAP_EDGE) {
      // Top edge → maximize to the work area.
      setBounds(win.id, { x: 0, y: MENUBAR_H, width: vw, height: workH })
    } else if (clientX <= SNAP_EDGE) {
      setBounds(win.id, { x: 0, y: MENUBAR_H, width: Math.round(vw / 2), height: workH })
    } else if (clientX >= vw - SNAP_EDGE) {
      const w = Math.round(vw / 2)
      setBounds(win.id, { x: vw - w, y: MENUBAR_H, width: w, height: workH })
    }
  }

  // ---- Resizing (from the 8 handles) ------------------------------------
  const onResizePointerDown = (e: React.PointerEvent, edges: ResizeEdges) => {
    e.preventDefault()
    e.stopPropagation()
    focus(win.id)
    setInteracting(true)
    const start = { x: win.x, y: win.y, width: win.width, height: win.height }
    const px = e.clientX
    const py = e.clientY
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - px
      const dy = ev.clientY - py
      let { x, y, width, height } = start
      if (edges.right) width = Math.max(MIN_W, start.width + dx)
      if (edges.bottom) height = Math.max(MIN_H, start.height + dy)
      if (edges.left) {
        const right = start.x + start.width
        width = Math.max(MIN_W, start.width - dx)
        x = right - width
      }
      if (edges.top) {
        const bottom = start.y + start.height
        height = Math.max(MIN_H, start.height - dy)
        y = bottom - height
        if (y < MENUBAR_H) {
          y = MENUBAR_H
          height = bottom - MENUBAR_H
        }
      }
      setBounds(win.id, { x, y, width, height })
    }
    const onUp = () => {
      target.releasePointerCapture(e.pointerId)
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      setInteracting(false)
    }
    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
  }

  // Apps that paint their own full-bleed dark background get no inset border —
  // the Win95 sunken margin would leave a gray gap around the dark content.
  const DARK_APPS = new Set(['sql-terminal'])
  const isDark = DARK_APPS.has(win.appId)

  return (
    <motion.div
      data-window="true"
      role="dialog"
      aria-label={win.title}
      onPointerDownCapture={() => focus(win.id)}
      initial={{ opacity: 0 }}
      animate={win.isMinimized ? { opacity: 0 } : { opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.08 }}
      className="win95-raised absolute flex flex-col overflow-hidden"
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex,
        pointerEvents: win.isMinimized ? 'none' : 'auto',
      }}
    >
      {/* Title bar */}
      <div
        onPointerDown={onTitlePointerDown}
        onDoubleClick={() => toggleFullscreen(win.id)}
        className={`win95-titlebar shrink-0 ${active ? '' : 'win95-titlebar-inactive'}`}
        style={{ touchAction: 'none' }}
      >
        <span className="flex-1 truncate px-1 text-[12px] font-bold text-white leading-none pointer-events-none select-none">
          {win.title}
        </span>
        <Win95TitleButtons
          onClose={() => close(win.id)}
          onMinimize={() => minimize(win.id)}
          onMaximize={() => toggleFullscreen(win.id)}
        />
      </div>

      {/* App body — apps own their own padding/scroll. The Win95 sunken inner
          border insets content inside the gray frame. Dark full-bleed apps (the
          SQL Terminal) instead fill the body edge-to-edge with their own dark
          color so no gray frame bleeds around the content. */}
      <div
        className="min-h-0 flex-1 overflow-hidden"
        style={
          isDark
            ? { background: '#0a0f0a' }
            : {
                margin: 4,
                borderStyle: 'solid',
                borderWidth: 2,
                borderColor: '#808080 #ffffff #ffffff #808080',
              }
        }
      >
        <AppContent appId={win.appId} />
      </div>

      {/* Resize handles (hidden while fullscreen) */}
      {!win.isFullscreen &&
        HANDLES.map((h) => (
          <div
            key={h.dir}
            onPointerDown={(e) => onResizePointerDown(e, h.edges)}
            className={`absolute ${h.className}`}
            style={{ touchAction: 'none', zIndex: Z.window }}
          />
        ))}
    </motion.div>
  )
}
