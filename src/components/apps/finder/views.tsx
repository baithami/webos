'use client'

import { useState } from 'react'
import type { FSNode } from '@/lib/fs'
import { getChildren, ROOT_ID } from '@/lib/fs'
import {
  FileIcon,
  RenameInput,
  type ViewProps,
} from './shared'

// ---- Drag/drop helpers (HTML5 DnD for move-into-folder) ----------------

function dragProps(node: FSNode) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData('text/webos-node', node.id)
      e.dataTransfer.effectAllowed = 'move'
    },
  }
}

function dropProps(
  node: FSNode,
  onDropMove: (dragId: string, folderId: string) => void,
  setHover: (v: boolean) => void
) {
  if (node.type !== 'folder') return {}
  return {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setHover(true)
    },
    onDragLeave: () => setHover(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      setHover(false)
      const dragId = e.dataTransfer.getData('text/webos-node')
      if (dragId && dragId !== node.id) onDropMove(dragId, node.id)
    },
  }
}

// ---- Icon view ---------------------------------------------------------

export function IconView(props: ViewProps) {
  const { items } = props
  if (items.length === 0) return <EmptyFolder />
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        gap: 4,
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        padding: 8,
        background: '#ffffff',
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: '#808080 #ffffff #ffffff #808080',
      }}
      onClick={() => props.onSelect(null)}
    >
      {items.map((node) => (
        <IconTile key={node.id} node={node} {...props} />
      ))}
    </div>
  )
}

function IconTile({
  node,
  selectedId,
  renamingId,
  onSelect,
  onOpen,
  onContextMenu,
  onCommitRename,
  onCancelRename,
  onDropMove,
}: ViewProps & { node: FSNode }) {
  const [hover, setHover] = useState(false)
  const selected = selectedId === node.id
  return (
    <button
      {...dragProps(node)}
      {...dropProps(node, onDropMove, setHover)}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(node.id)
      }}
      onDoubleClick={() => onOpen(node)}
      onContextMenu={(e) => onContextMenu(e, node)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        width: 80,
        padding: 8,
        textAlign: 'center',
        background: selected ? '#000080' : 'transparent',
        outline: hover ? '2px solid #000080' : 'none',
        cursor: 'default',
        border: 'none',
      }}
    >
      <FileIcon node={node} size={44} />
      <div className="w-full">
        {renamingId === node.id ? (
          <RenameInput
            initial={node.name}
            onCommit={(name) => onCommitRename(node.id, name)}
            onCancel={onCancelRename}
          />
        ) : (
          <span
            style={{
              fontSize: 12,
              fontFamily: 'Arial, sans-serif',
              color: selected ? '#ffffff' : '#000000',
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {node.name}
          </span>
        )}
      </div>
    </button>
  )
}

// ---- List view ---------------------------------------------------------

export function ListView(props: ViewProps) {
  const { items } = props
  if (items.length === 0) return <EmptyFolder />
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        background: '#ffffff',
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: '#808080 #ffffff #ffffff #808080',
      }}
      onClick={() => props.onSelect(null)}
    >
      <table className="w-full border-collapse text-[13px]">
        <thead style={{ background: '#000080', color: '#ffffff', position: 'sticky', top: 0 }}>
          <tr>
            <th
              className="px-3 py-1.5 text-left font-medium"
              style={{ color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: 12 }}
            >
              Name
            </th>
            <th
              className="w-28 px-3 py-1.5 text-left font-medium"
              style={{ color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: 12 }}
            >
              Kind
            </th>
            <th
              className="w-28 px-3 py-1.5 text-right font-medium"
              style={{ color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: 12 }}
            >
              Size
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((node) => (
            <ListRow key={node.id} node={node} {...props} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ListRow({
  node,
  selectedId,
  renamingId,
  onSelect,
  onOpen,
  onContextMenu,
  onCommitRename,
  onCancelRename,
  onDropMove,
}: ViewProps & { node: FSNode }) {
  const [hover, setHover] = useState(false)
  const selected = selectedId === node.id
  const kind = node.type === 'folder' ? 'Folder' : kindLabel(node.name)
  const size =
    node.type === 'folder' ? '--' : `${node.content.length} B`
  return (
    <tr
      {...dragProps(node)}
      {...dropProps(node, onDropMove, setHover)}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(node.id)
      }}
      onDoubleClick={() => onOpen(node)}
      onContextMenu={(e) => onContextMenu(e, node)}
      className={`cursor-default ${
        selected
          ? 'bg-[#000080] text-white'
          : 'hover:bg-[#c8c8c8]'
      } ${hover ? 'outline outline-2 -outline-offset-2 outline-[#000080]' : ''}`}
    >
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-2">
          <FileIcon node={node} size={18} />
          {renamingId === node.id ? (
            <RenameInput
              initial={node.name}
              onCommit={(name) => onCommitRename(node.id, name)}
              onCancel={onCancelRename}
            />
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </div>
      </td>
      <td className="px-3 py-1.5 text-[var(--color-text-secondary)]">{kind}</td>
      <td className="px-3 py-1.5 text-right text-[var(--color-text-secondary)]">
        {size}
      </td>
    </tr>
  )
}

// ---- Column view -------------------------------------------------------

export function ColumnView(props: ViewProps) {
  // Self-contained Miller columns rooted at the file-system root.
  const { nodes, onOpen, onContextMenu } = props
  const [path, setPath] = useState<string[]>([ROOT_ID])

  const select = (depth: number, node: FSNode) => {
    const nextPath = path.slice(0, depth + 1)
    if (node.type === 'folder') {
      setPath([...nextPath, node.id])
    } else {
      setPath(nextPath)
      props.onSelect(node.id)
    }
  }

  return (
    <div className="flex h-full w-full overflow-x-auto">
      {path.map((folderId, depth) => {
        const folder = nodes[folderId]
        if (!folder) return null
        const children = getChildren(nodes, folderId)
        const selectedNext = path[depth + 1]
        return (
          <div
            key={folderId}
            className="h-full w-56 shrink-0 overflow-auto border-r border-[var(--color-window-border)]"
          >
            {children.length === 0 ? (
              <p className="p-3 text-[12px] text-[var(--color-text-tertiary)]">
                Empty
              </p>
            ) : (
              children.map((node) => {
                const isSel =
                  selectedNext === node.id || props.selectedId === node.id
                return (
                  <button
                    key={node.id}
                    onClick={() => select(depth, node)}
                    onDoubleClick={() => node.type === 'file' && onOpen(node)}
                    onContextMenu={(e) => onContextMenu(e, node)}
                    className="flex w-full items-center gap-2 px-2 py-1 text-left text-[13px]"
                    style={{
                      background: isSel ? '#000080' : 'transparent',
                      color: isSel ? '#ffffff' : '#000000',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSel)
                        (e.currentTarget as HTMLButtonElement).style.background = '#c8c8c8'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel)
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    }}
                  >
                    <FileIcon node={node} size={16} />
                    <span className="flex-1 truncate">{node.name}</span>
                    {node.type === 'folder' && <span className="opacity-60">›</span>}
                  </button>
                )
              })
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---- bits --------------------------------------------------------------

function EmptyFolder() {
  return (
    <div className="flex h-full w-full items-center justify-center text-[13px] text-[var(--color-text-tertiary)]">
      This folder is empty
    </div>
  )
}

function kindLabel(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return 'Document'
  return name.slice(dot + 1).toUpperCase() + ' file'
}
