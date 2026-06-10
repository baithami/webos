'use client'

import { useEffect, useRef, useState } from 'react'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { useAppIntent } from '@/store/useAppIntent'
import { getChildren, nodeCategory, ROOT_ID, type FSNode } from '@/lib/fs'
import { categoryMeta } from '@/lib/fileTypes'
import { FileIcon } from '@/components/apps/finder/shared'

const DESKTOP_FOLDER_ID = 'desktop'
const DRIVE_KEY = '__drive__'

interface SelectionRect {
  startX: number
  startY: number
  currentX: number
  currentY: number
  active: boolean
}

/** True if the marquee rect overlaps the icon, both in container-local space. */
function rectsOverlap(
  sel: SelectionRect,
  iconRect: DOMRect,
  containerRect: DOMRect
): boolean {
  const selLeft = Math.min(sel.startX, sel.currentX)
  const selRight = Math.max(sel.startX, sel.currentX)
  const selTop = Math.min(sel.startY, sel.currentY)
  const selBottom = Math.max(sel.startY, sel.currentY)

  const iconLeft = iconRect.left - containerRect.left
  const iconRight = iconRect.right - containerRect.left
  const iconTop = iconRect.top - containerRect.top
  const iconBottom = iconRect.bottom - containerRect.top

  return !(
    selRight < iconLeft ||
    selLeft > iconRight ||
    selBottom < iconTop ||
    selTop > iconBottom
  )
}

/**
 * Icons on the desktop surface: the system drive ("My Computer") plus the live
 * contents of the Desktop folder. Single-click selects, double-click opens —
 * the drive and folders open in Finder, files open in their default app.
 * A marquee (rubber-band) drag on the desktop highlights overlapping icons.
 */
export default function DesktopIcons({
  selectionBox,
}: {
  selectionBox?: SelectionRect | null
}) {
  const nodes = useFileSystemStore((s) => s.nodes)
  const openFile = useAppIntent((s) => s.openFile)
  const openFolder = useAppIntent((s) => s.openFolder)

  const [selected, setSelected] = useState<string | null>(null)
  // Spans the full desktop (absolute inset-0), so its rect matches the marquee
  // coordinate space (relative to the desktop <main>).
  const containerRef = useRef<HTMLDivElement>(null)

  // Deselect when clicking anything that isn't a desktop icon.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement
      if (!el.closest('[data-desktop-icon]')) setSelected(null)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [])

  const items: FSNode[] = nodes[DESKTOP_FOLDER_ID]
    ? getChildren(nodes, DESKTOP_FOLDER_ID)
    : []

  const openItem = (node: FSNode) => {
    if (node.type === 'folder') {
      openFolder(node.id) // open in Finder, navigated to this folder
    } else {
      const app = categoryMeta(nodeCategory(node)).defaultApp
      if (app) openFile(app, node.id)
    }
  }

  return (
    // Full-screen, click-through layer; only the icons themselves are interactive.
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-[1] flex flex-col flex-wrap content-start items-start gap-y-1 overflow-hidden px-3 pt-10"
    >
      {/* The grid flows top→bottom then wraps into a new column; anchor right. */}
      <div className="ml-auto flex flex-col items-center gap-1">
        <DesktopIcon
          label="My Computer"
          selected={selected === DRIVE_KEY}
          onSelect={() => setSelected(DRIVE_KEY)}
          onOpen={() => openFolder(ROOT_ID)}
          selectionBox={selectionBox}
          containerRef={containerRef}
        >
          <DriveGlyph />
        </DesktopIcon>

        {items.map((node) => (
          <DesktopIcon
            key={node.id}
            label={node.name}
            selected={selected === node.id}
            onSelect={() => setSelected(node.id)}
            onOpen={() => openItem(node)}
            selectionBox={selectionBox}
            containerRef={containerRef}
          >
            <FileIcon node={node} size={52} />
          </DesktopIcon>
        ))}
      </div>
    </div>
  )
}

/** Win95 "My Computer" icon — classic monitor + tower. */
function DriveGlyph() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
      {/* Monitor */}
      <rect x="8" y="6" width="28" height="20" rx="0" fill="#c0c0c0" stroke="#000000" strokeWidth="1" />
      <rect x="10" y="8" width="24" height="15" fill="#000080" />
      {/* Monitor stand neck */}
      <rect x="19" y="26" width="6" height="4" fill="#808080" />
      {/* Monitor base */}
      <rect x="14" y="30" width="16" height="3" fill="#c0c0c0" stroke="#000000" strokeWidth="1" />
      {/* Tower/case */}
      <rect x="38" y="10" width="10" height="22" rx="0" fill="#c0c0c0" stroke="#000000" strokeWidth="1" />
      {/* Tower drive slots */}
      <rect x="40" y="14" width="6" height="2" fill="#808080" />
      <rect x="40" y="18" width="6" height="2" fill="#808080" />
      {/* Tower power button */}
      <rect x="41" y="27" width="4" height="2" rx="1" fill="#008080" />
      {/* Screen glare dot */}
      <rect x="12" y="10" width="2" height="2" fill="#4444cc" opacity="0.5" />
    </svg>
  )
}

function DesktopIcon({
  label,
  selected,
  onSelect,
  onOpen,
  children,
  selectionBox,
  containerRef,
}: {
  label: string
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  children: React.ReactNode
  selectionBox?: SelectionRect | null
  containerRef?: React.RefObject<HTMLDivElement>
}) {
  const iconRef = useRef<HTMLButtonElement>(null)

  // While a marquee drag is active, an overlapping icon shows as selected.
  // Reading layout on render is fine here: every pointermove re-renders this.
  const isInSelection =
    selectionBox?.active && iconRef.current && containerRef?.current
      ? rectsOverlap(
          selectionBox,
          iconRef.current.getBoundingClientRect(),
          containerRef.current.getBoundingClientRect()
        )
      : false

  const isSelected = selected || isInSelection

  return (
    <button
      ref={iconRef}
      data-desktop-icon
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onDoubleClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen()
      }}
      className="group pointer-events-auto flex w-[88px] flex-col items-center gap-1 rounded-lg p-1.5 text-center outline-none"
    >
      <span
        className={`rounded-xl p-1 transition-colors ${
          isSelected ? 'bg-white/25' : 'group-hover:bg-white/10'
        }`}
        style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' }}
      >
        {children}
      </span>
      <span
        className={`line-clamp-2 max-w-full rounded px-1.5 text-[12px] font-medium leading-tight ${
          isSelected
            ? 'bg-[var(--color-accent)] text-white'
            : 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]'
        }`}
      >
        {label}
      </span>
    </button>
  )
}
