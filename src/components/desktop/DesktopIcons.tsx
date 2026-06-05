'use client'

import { useEffect, useState } from 'react'
import { HardDrive } from 'lucide-react'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { useAppIntent } from '@/store/useAppIntent'
import { getChildren, nodeCategory, type FSNode } from '@/lib/fs'
import { categoryMeta } from '@/lib/fileTypes'
import { FileIcon } from '@/components/apps/finder/shared'

const DESKTOP_FOLDER_ID = 'desktop'
const DRIVE_KEY = '__drive__'

/**
 * Icons that live on the desktop surface: the system drive ("WebOS HD") plus
 * the live contents of the Desktop folder. Anything created in that folder
 * (via Finder or Terminal) appears here automatically. Double-click opens;
 * windows render above this layer.
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
      openFolder(node.id)
    } else {
      const app = categoryMeta(nodeCategory(node)).defaultApp
      if (app) openFile(app, node.id)
    }
  }

  return (
    // Full-screen, click-through layer; only the icons themselves are interactive.
    // Icons stack top-right, macOS-style.
    <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col items-end gap-1 overflow-hidden px-2 pt-9">
      {/* System drive */}
      <IconButton
        label="WebOS HD"
        selected={selected === DRIVE_KEY}
        onSelect={() => setSelected(DRIVE_KEY)}
        onOpen={() => openFolder('root')}
      >
        <HardDrive size={42} className="text-zinc-200" strokeWidth={1.4} />
      </IconButton>

      {/* Desktop folder contents */}
      {items.map((node) => (
        <IconButton
          key={node.id}
          label={node.name}
          selected={selected === node.id}
          onSelect={() => setSelected(node.id)}
          onOpen={() => openItem(node)}
        >
          <FileIcon node={node} size={42} />
        </IconButton>
      ))}
    </div>
  )
}

function IconButton({
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
      className="pointer-events-auto flex w-20 flex-col items-center gap-1 rounded-lg p-1.5 text-center"
    >
      <span
        className={`rounded-lg p-1 ${selected ? 'bg-white/20' : ''}`}
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
      >
        {children}
      </span>
      <span
        className={`max-w-full rounded px-1 text-[12px] leading-tight ${
          selected
            ? 'bg-[var(--color-accent)] text-white'
            : 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]'
        }`}
      >
        {label}
      </span>
    </button>
  )
}
