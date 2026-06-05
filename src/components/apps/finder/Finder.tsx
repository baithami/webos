'use client'

import { useEffect, useState } from 'react'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { useAppIntent } from '@/store/useAppIntent'
import { getChildren, nodeCategory, ROOT_ID, type FSNode } from '@/lib/fs'
import { categoryMeta } from '@/lib/fileTypes'
import { Sidebar, Toolbar, FinderContextMenu, type FinderMenuState } from './chrome'
import { IconView, ListView, ColumnView } from './views'
import type { ViewMode } from './shared'

/**
 * Finder — the file browser. Holds its own navigation history, selection, view
 * mode, and rename/context-menu state. All persistence goes through the FS
 * store; opening a file routes through the app-intent bus to its default app.
 */
export default function Finder() {
  const nodes = useFileSystemStore((s) => s.nodes)
  const createNode = useFileSystemStore((s) => s.createNode)
  const rename = useFileSystemStore((s) => s.rename)
  const deleteNode = useFileSystemStore((s) => s.deleteNode)
  const move = useFileSystemStore((s) => s.move)
  const openFile = useAppIntent((s) => s.openFile)
  const consumeFolder = useAppIntent((s) => s.consumeFolder)
  const pendingFolder = useAppIntent((s) => s.pendingFolder)

  // Navigation history (back/forward).
  const [history, setHistory] = useState<string[]>([ROOT_ID])
  const [histIndex, setHistIndex] = useState(0)
  const currentId = history[histIndex]

  const [viewMode, setViewMode] = useState<ViewMode>('icon')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [menu, setMenu] = useState<FinderMenuState | null>(null)

  // If the current folder gets deleted out from under us, fall back to Home.
  useEffect(() => {
    if (!nodes[currentId]) {
      setHistory([ROOT_ID])
      setHistIndex(0)
    }
  }, [nodes, currentId])

  const navigate = (id: string) => {
    if (!nodes[id] || nodes[id].type !== 'folder') return
    const next = history.slice(0, histIndex + 1)
    next.push(id)
    setHistory(next)
    setHistIndex(next.length - 1)
    setSelectedId(null)
  }

  // Honor "open Finder at this folder" requests (e.g. from desktop icons).
  useEffect(() => {
    if (pendingFolder === undefined) return
    const id = consumeFolder()
    if (id && nodes[id]?.type === 'folder') {
      setHistory((h) => [...h.slice(0, histIndex + 1), id])
      setHistIndex((i) => i + 1)
      setSelectedId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFolder])

  const back = () => histIndex > 0 && setHistIndex(histIndex - 1)
  const forward = () =>
    histIndex < history.length - 1 && setHistIndex(histIndex + 1)

  const open = (node: FSNode) => {
    if (node.type === 'folder') {
      navigate(node.id)
      return
    }
    const app = categoryMeta(nodeCategory(node)).defaultApp
    if (app) openFile(app, node.id)
  }

  const newFolder = () => {
    const id = createNode(currentId, 'New Folder', 'folder')
    if (id) {
      setSelectedId(id)
      setRenamingId(id)
    }
  }

  const newFile = () => {
    const id = createNode(currentId, 'Untitled.txt', 'file', '')
    if (id) {
      setSelectedId(id)
      setRenamingId(id)
    }
  }

  const commitRename = (id: string, name: string) => {
    rename(id, name)
    setRenamingId(null)
  }

  const removeSelected = (id: string) => {
    deleteNode(id)
    if (selectedId === id) setSelectedId(null)
  }

  const onContextMenu = (e: React.MouseEvent, node: FSNode | null) => {
    e.preventDefault()
    e.stopPropagation()
    if (node) setSelectedId(node.id)
    setMenu({ x: e.clientX, y: e.clientY, nodeId: node?.id ?? null })
  }

  const items = getChildren(nodes, currentId)
  const folderName =
    currentId === ROOT_ID ? 'Home' : nodes[currentId]?.name ?? 'Finder'

  const viewProps = {
    items,
    nodes,
    selectedId,
    renamingId,
    onSelect: setSelectedId,
    onOpen: open,
    onContextMenu,
    onCommitRename: commitRename,
    onCancelRename: () => setRenamingId(null),
    onDropMove: (dragId: string, folderId: string) => move(dragId, folderId),
  }

  return (
    <div
      className="flex h-full w-full"
      onClick={() => setMenu(null)}
      onContextMenu={(e) => {
        // Right-click on empty Finder background.
        if (e.target === e.currentTarget) onContextMenu(e, null)
      }}
    >
      <Sidebar currentId={currentId} onNavigate={navigate} />

      <div
        className="flex min-w-0 flex-1 flex-col"
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) onContextMenu(e, null)
        }}
      >
        <Toolbar
          title={folderName}
          canBack={histIndex > 0}
          canForward={histIndex < history.length - 1}
          onBack={back}
          onForward={forward}
          viewMode={viewMode}
          onViewMode={setViewMode}
          onNewFolder={newFolder}
        />

        <div
          className="min-h-0 flex-1"
          onContextMenu={(e) => {
            if (e.target === e.currentTarget) onContextMenu(e, null)
          }}
        >
          {viewMode === 'icon' && <IconView {...viewProps} />}
          {viewMode === 'list' && <ListView {...viewProps} />}
          {viewMode === 'column' && <ColumnView {...viewProps} />}
        </div>
      </div>

      {menu && (
        <FinderContextMenu
          menu={menu}
          onClose={() => setMenu(null)}
          onNewFolder={newFolder}
          onNewFile={newFile}
          onOpen={() => {
            const node = menu.nodeId ? nodes[menu.nodeId] : null
            if (node) open(node)
          }}
          onRename={() => menu.nodeId && setRenamingId(menu.nodeId)}
          onDelete={() => menu.nodeId && removeSelected(menu.nodeId)}
        />
      )}
    </div>
  )
}
