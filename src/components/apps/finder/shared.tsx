'use client'

import { useEffect, useRef, useState } from 'react'
import type { FSNode, NodeMap } from '@/lib/fs'
import { nodeCategory } from '@/lib/fs'

export type ViewMode = 'icon' | 'list' | 'column'

export function FileIcon({ node, size = 40 }: { node: FSNode; size?: number }) {
  const cat = nodeCategory(node)

  // Image files carry a data URL in content — show an actual thumbnail.
  if (cat === 'image' && node.content.startsWith('data:')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={node.content}
        alt={node.name}
        style={{ width: size, height: size, objectFit: 'cover', border: '1px solid #808080' }}
      />
    )
  }

  if (cat === 'folder') return <W95FolderIcon size={size} />
  return <W95FileIcon size={size} cat={cat} />
}

/** Classic Win95 yellow folder. */
function W95FolderIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="10" width="28" height="19" fill="#c8a000" stroke="#000000" strokeWidth="1" />
      <path d="M2,10 L2,8 L10,8 L12,10" fill="#c8a000" stroke="#000000" strokeWidth="1" />
      <line x1="3" y1="11" x2="29" y2="11" stroke="#ffdd44" strokeWidth="1" />
      <line x1="2" y1="28" x2="30" y2="28" stroke="#806000" strokeWidth="1" />
    </svg>
  )
}

/** Classic Win95 white page with a folded corner and a colored type stripe. */
function W95FileIcon({ size, cat }: { size: number; cat: string }) {
  const badgeColor: Record<string, string> = {
    text: '#ffffff',
    richtext: '#0000cc',
    code: '#007700',
    audio: '#cc0077',
    video: '#7700cc',
    pdf: '#cc0000',
    archive: '#cc7700',
    unknown: '#808080',
  }
  const badge = badgeColor[cat] ?? '#808080'
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <polygon points="4,2 22,2 28,8 28,30 4,30" fill="#ffffff" stroke="#000000" strokeWidth="1" />
      <polygon points="22,2 22,8 28,8" fill="#c0c0c0" stroke="#000000" strokeWidth="1" />
      <rect x="7" y="13" width="18" height="3" fill={badge} />
      <rect x="7" y="18" width="14" height="2" fill="#c0c0c0" />
      <rect x="7" y="22" width="16" height="2" fill="#c0c0c0" />
    </svg>
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
      style={{
        width: '100%',
        border: '2px solid',
        borderColor: '#808080 #ffffff #ffffff #808080',
        background: '#ffffff',
        padding: '1px 4px',
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        outline: 'none',
      }}
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
