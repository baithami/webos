'use client'

import { useEffect, useState } from 'react'
import { HardDrive } from 'lucide-react'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { useAppIntent } from '@/store/useAppIntent'
import { getChildren, nodeCategory, ROOT_ID, type FSNode } from '@/lib/fs'
import { categoryMeta } from '@/lib/fileTypes'
import { FileIcon } from '@/components/apps/finder/shared'

const DESKTOP_FOLDER_ID = 'desktop'
const DRIVE_KEY = '__drive__'

/**
 * Icons on the desktop surface: the system drive ("WebOS HD") plus the live
 * contents of the Desktop folder. Single-click selects, double-click opens —
 * the drive and folders open in Finder, files open in their default app.
 */
export default function DesktopIcons() {
  const nodes = useFileSystemStore((s) => s.nodes)
  const openFile = useAppIntent((s) => s.openFile)
  const openFolder = useAppIntent((s) => s.openFolder)

  const [selected, setSelected] = useState<string | null>(null)

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
    <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col flex-wrap content-start items-start gap-y-1 overflow-hidden px-3 pt-10">
      {/* The grid flows top→bottom then wraps into a new column; anchor right. */}
      <div className="ml-auto flex flex-col items-center gap-1">
        <DesktopIcon
          label="WebOS HD"
          selected={selected === DRIVE_KEY}
          onSelect={() => setSelected(DRIVE_KEY)}
          onOpen={() => openFolder(ROOT_ID)}
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
          >
            <FileIcon node={node} size={52} />
          </DesktopIcon>
        ))}
      </div>
    </div>
  )
}

/** A macOS-style hard-drive tile (metallic gradient + drive glyph). */
function DriveGlyph() {
  return (
    <div
      className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-gradient-to-b from-zinc-200 to-zinc-400 shadow-md ring-1 ring-black/10"
    >
      <HardDrive size={30} strokeWidth={1.6} className="text-zinc-700" />
    </div>
  )
}

function DesktopIcon({
  label,
  selected,
  onSelect,
  onOpen,
  children,
}: {
  label: string
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  children: React.ReactNode
}) {
  return (
    <button
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
          selected ? 'bg-white/25' : 'group-hover:bg-white/10'
        }`}
        style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' }}
      >
        {children}
      </span>
      <span
        className={`line-clamp-2 max-w-full rounded px-1.5 text-[12px] font-medium leading-tight ${
          selected
            ? 'bg-[var(--color-accent)] text-white'
            : 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]'
        }`}
      >
        {label}
      </span>
    </button>
  )
}
