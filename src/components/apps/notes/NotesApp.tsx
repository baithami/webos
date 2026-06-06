'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Folder as FolderIcon,
  FolderPlus,
  SquarePen,
  Trash2,
  Notebook,
} from 'lucide-react'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { getChildren, ROOT_ID, type FSNode } from '@/lib/fs'
import FolderTree from './FolderTree'

const NOTES_ROOT_NAME = 'Notes'

function noteTitle(content: string): string {
  const first = content.split('\n').find((l) => l.trim().length > 0)
  return first?.trim().slice(0, 80) || 'New Note'
}
function noteSnippet(content: string): string {
  const rest = content.split('\n').slice(1).join(' ').trim()
  return rest.slice(0, 60) || 'No additional text'
}
function formatDate(ms: number): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(ms))
  } catch {
    return ''
  }
}
function formatEdited(ms: number): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(ms))
  } catch {
    return ''
  }
}

interface MenuState {
  x: number
  y: number
  folderId: string
}

/**
 * Notes — an Apple Notes clone: folders + subfolders in a sidebar, a notes list,
 * and an editor. Backed by the virtual file system under a "Notes" root folder,
 * so everything persists and syncs cross-device. The note's first line is its
 * title (styled larger), the rest is the body.
 */
export default function NotesApp() {
  const nodes = useFileSystemStore((s) => s.nodes)
  const createNode = useFileSystemStore((s) => s.createNode)
  const updateContent = useFileSystemStore((s) => s.updateContent)
  const rename = useFileSystemStore((s) => s.rename)
  const deleteNode = useFileSystemStore((s) => s.deleteNode)

  const ensured = useRef(false)
  const notesRoot = useMemo(
    () =>
      getChildren(nodes, ROOT_ID).find(
        (n) => n.type === 'folder' && n.name === NOTES_ROOT_NAME
      ),
    [nodes]
  )

  useEffect(() => {
    if (!notesRoot && !ensured.current) {
      ensured.current = true
      createNode(ROOT_ID, NOTES_ROOT_NAME, 'folder')
    }
  }, [notesRoot, createNode])

  const rootId = notesRoot?.id ?? ''

  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [menu, setMenu] = useState<MenuState | null>(null)

  // Default selection → the Notes root once it exists.
  useEffect(() => {
    if (rootId && !selectedFolderId) setSelectedFolderId(rootId)
  }, [rootId, selectedFolderId])

  // Keep selections valid as the tree changes.
  useEffect(() => {
    if (selectedFolderId && !nodes[selectedFolderId]) setSelectedFolderId(rootId)
    if (selectedNoteId && !nodes[selectedNoteId]) setSelectedNoteId(null)
  }, [nodes, selectedFolderId, selectedNoteId, rootId])

  const notes: FSNode[] = useMemo(() => {
    if (!selectedFolderId) return []
    return getChildren(nodes, selectedFolderId)
      .filter((n) => n.type === 'file')
      .sort((a, b) => b.modifiedAt - a.modifiedAt)
  }, [nodes, selectedFolderId])

  const selectedNote = selectedNoteId ? nodes[selectedNoteId] : null

  // ---- actions ----------------------------------------------------------
  const newNote = () => {
    const target = selectedFolderId || rootId
    if (!target) return
    const id = createNode(target, 'New Note.txt', 'file', '')
    if (id) setSelectedNoteId(id)
  }

  const newFolder = (parentId: string) => {
    if (!parentId) return
    const id = createNode(parentId, 'New Folder', 'folder')
    if (id) {
      setExpanded((e) => new Set(e).add(parentId))
      setSelectedFolderId(id)
      setRenamingId(id)
    }
  }

  const deleteNote = (id: string) => {
    deleteNode(id)
    if (selectedNoteId === id) setSelectedNoteId(null)
  }

  const deleteFolder = (id: string) => {
    deleteNode(id)
    if (selectedFolderId === id) setSelectedFolderId(rootId)
  }

  const toggle = (id: string) =>
    setExpanded((e) => {
      const next = new Set(e)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const folderName =
    selectedFolderId === rootId
      ? 'Notes'
      : nodes[selectedFolderId]?.name ?? 'Notes'

  return (
    <div
      className="flex h-full w-full"
      onClick={() => setMenu(null)}
    >
      {/* Folder sidebar */}
      <aside className="flex h-full w-56 shrink-0 flex-col bg-[var(--color-sidebar-bg)]">
        <div className="flex-1 overflow-auto px-2 py-3">
          <p className="px-2 pb-1 text-[11px] font-semibold uppercase text-[var(--color-text-tertiary)]">
            iCloud
          </p>

          {/* Root "Notes" folder */}
          <div
            onClick={() => setSelectedFolderId(rootId)}
            className={`flex cursor-default items-center gap-1.5 rounded-md py-1 pl-2 pr-2 text-[13px] ${
              selectedFolderId === rootId
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-primary)] hover:bg-white/5'
            }`}
          >
            <span className="flex h-4 w-4" />
            <Notebook size={15} className="shrink-0 text-[#e6b400]" />
            <span className="flex-1 truncate">Notes</span>
            {rootId && (
              <span
                className={`text-[12px] ${
                  selectedFolderId === rootId
                    ? 'text-white/70'
                    : 'text-[var(--color-text-tertiary)]'
                }`}
              >
                {getChildren(nodes, rootId).filter((n) => n.type === 'file').length ||
                  ''}
              </span>
            )}
          </div>

          {/* Subfolders */}
          {rootId && (
            <FolderTree
              nodes={nodes}
              parentId={rootId}
              depth={0}
              selectedFolderId={selectedFolderId}
              expanded={expanded}
              renamingId={renamingId}
              onSelect={setSelectedFolderId}
              onToggle={toggle}
              onContextMenu={(e, folderId) => {
                e.preventDefault()
                e.stopPropagation()
                setSelectedFolderId(folderId)
                setMenu({ x: e.clientX, y: e.clientY, folderId })
              }}
              onCommitRename={(id, name) => {
                rename(id, name)
                setRenamingId(null)
              }}
              onCancelRename={() => setRenamingId(null)}
            />
          )}
        </div>

        <button
          onClick={() => newFolder(selectedFolderId || rootId)}
          className="flex shrink-0 items-center gap-2 border-t border-[var(--color-window-border)] px-3 py-2 text-[13px] text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)]"
        >
          <FolderPlus size={16} />
          New Folder
        </button>
      </aside>

      {/* Notes list */}
      <div className="flex h-full w-64 shrink-0 flex-col border-l border-r border-[var(--color-window-border)] bg-[var(--color-window-bg)]">
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--color-window-border)] px-3">
          <span className="truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
            {folderName}
          </span>
          <button
            onClick={newNote}
            aria-label="New Note"
            className="rounded-md p-1.5 text-[#e6b400] hover:bg-white/10"
          >
            <SquarePen size={17} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {notes.length === 0 ? (
            <p className="p-3 text-center text-[12px] text-[var(--color-text-tertiary)]">
              No notes
            </p>
          ) : (
            notes.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedNoteId(n.id)}
                className={`group mb-0.5 flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left ${
                  selectedNoteId === n.id
                    ? 'bg-[#e6b400]/25'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
                    {noteTitle(n.content)}
                  </span>
                  <Trash2
                    size={14}
                    className="shrink-0 text-[var(--color-text-tertiary)] opacity-0 hover:text-[var(--color-close)] group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNote(n.id)
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[var(--color-text-tertiary)]">
                  <span className="shrink-0">{formatDate(n.modifiedAt)}</span>
                  <span className="truncate">{noteSnippet(n.content)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="min-w-0 flex-1 bg-[var(--color-window-bg)]">
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onChange={(content) => updateContent(selectedNote.id, content)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--color-text-tertiary)]">
            <FolderIcon size={36} />
            <p className="text-[13px]">Select or create a note</p>
          </div>
        )}
      </div>

      {/* Folder context menu */}
      {menu && (
        <div
          className="glass fixed z-50 min-w-44 rounded-lg py-1 text-[13px] text-[var(--color-text-primary)] shadow-xl"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            onClick={() => {
              newFolder(menu.folderId)
              setMenu(null)
            }}
          >
            New Subfolder
          </MenuItem>
          <MenuItem
            onClick={() => {
              setRenamingId(menu.folderId)
              setMenu(null)
            }}
          >
            Rename
          </MenuItem>
          <div className="my-1 h-px bg-[var(--color-window-border)]" />
          <MenuItem
            danger
            onClick={() => {
              deleteFolder(menu.folderId)
              setMenu(null)
            }}
          >
            Delete Folder
          </MenuItem>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-1.5 text-left hover:bg-[var(--color-accent)] hover:text-white ${
        danger ? 'text-[var(--color-close)]' : ''
      }`}
    >
      {children}
    </button>
  )
}

/** Title (first line) + body editor, Apple-Notes style. */
function NoteEditor({
  note,
  onChange,
}: {
  note: FSNode
  onChange: (content: string) => void
}) {
  const lines = note.content.split('\n')
  const title = lines[0] ?? ''
  const body = lines.slice(1).join('\n')

  const setTitle = (t: string) => onChange([t, body].join('\n'))
  const setBody = (b: string) => onChange([title, b].join('\n'))

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col px-8 py-5">
      <p className="mb-3 text-center text-[11px] text-[var(--color-text-tertiary)]">
        {formatEdited(note.modifiedAt)}
      </p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="mb-2 shrink-0 bg-transparent text-[22px] font-bold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Start writing…"
        spellCheck
        className="min-h-0 flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
      />
    </div>
  )
}
