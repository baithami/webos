'use client'

import { useEffect, useRef, useState } from 'react'
import type { FSNode, NodeMap } from '@/lib/fs'
import { nodeCategory } from '@/lib/fs'
import { categoryMeta, type FileCategory } from '@/lib/fileTypes'

export type ViewMode = 'icon' | 'list' | 'column'

/** Tint per category for file/folder glyphs. */
const CATEGORY_COLOR: Record<FileCategory, string> = {
  folder: '#5aa7ff',
  text: '#cfd3da',
  richtext: '#cfd3da',
  code: '#7ee787',
  image: '#f0a868',
  audio: '#f78fb3',
  video: '#b98cff',
  pdf: '#ff6b6b',
  archive: '#d8b36a',
  unknown: '#c0c4cc',
}

export function categoryColor(node: FSNode): string {
  return CATEGORY_COLOR[nodeCategory(node)]
}

export function FileIcon({ node, size = 40 }: { node: FSNode; size?: number }) {
  const cat = nodeCategory(node)
  const Icon = categoryMeta(cat).icon
  return (
    <Icon
      width={size}
      height={size}
      strokeWidth={1.5}
      style={{ color: categoryColor(node) }}
      fill={cat === 'folder' ? categoryColor(node) : 'none'}
      fillOpacity={cat === 'folder' ? 0.18 : 0}
    />
  )
}

/** Inline rename field. Selects the basename (sans extension) on focus. */
export function RenameInput({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string
  onCommit: (name: string) => void
  onCancel: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(initial)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    const dot = initial.lastIndexOf('.')
    el.setSelectionRange(0, dot > 0 ? dot : initial.length)
  }, [initial])

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommit(value)
        else if (e.key === 'Escape') onCancel()
      }}
      onBlur={() => onCommit(value)}
      className="w-full rounded border border-[var(--color-accent)] bg-[var(--color-window-titlebar)] px-1 text-center text-[12px] text-[var(--color-text-primary)] outline-none"
    />
  )
}

export interface ViewProps {
  items: FSNode[]
  nodes: NodeMap
  selectedId: string | null
  renamingId: string | null
  onSelect: (id: string | null) => void
  onOpen: (node: FSNode) => void
  onContextMenu: (e: React.MouseEvent, node: FSNode | null) => void
  onCommitRename: (id: string, name: string) => void
  onCancelRename: () => void
  onDropMove: (dragId: string, folderId: string) => void
}
