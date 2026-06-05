'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { SquarePen, Trash2 } from 'lucide-react'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { getChildren, ROOT_ID, type FSNode } from '@/lib/fs'

// Notes are FS-backed: each note is a .txt file inside a dedicated "Notes"
// folder under Home. The note's title is derived from its first line, so we
// never have to rename the underlying file on every keystroke.

function noteTitle(content: string): string {
  const firstLine = content.split('\n').find((l) => l.trim().length > 0)
  return firstLine?.trim().slice(0, 60) || 'New Note'
}

function notePreview(content: string): string {
  const rest = content.split('\n').slice(1).join(' ').trim()
  return rest.slice(0, 80) || 'No additional text'
}

export default function Notes() {
  const nodes = useFileSystemStore((s) => s.nodes)
  const createNode = useFileSystemStore((s) => s.createNode)
  const updateContent = useFileSystemStore((s) => s.updateContent)
  const deleteNode = useFileSystemStore((s) => s.deleteNode)

  const ensured = useRef(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Find (or lazily create) the Notes folder.
  const notesFolder = useMemo(
    () =>
      getChildren(nodes, ROOT_ID).find(
        (n) => n.type === 'folder' && n.name === 'Notes'
      ),
    [nodes]
  )

  useEffect(() => {
    if (!notesFolder && !ensured.current) {
      ensured.current = true
      createNode(ROOT_ID, 'Notes', 'folder')
    }
  }, [notesFolder, createNode])

  const notes: FSNode[] = useMemo(() => {
    if (!notesFolder) return []
    return getChildren(nodes, notesFolder.id)
      .filter((n) => n.type === 'file')
      .sort((a, b) => b.modifiedAt - a.modifiedAt)
  }, [nodes, notesFolder])

  // Keep a valid selection.
  useEffect(() => {
    if (selectedId && !nodes[selectedId]) setSelectedId(null)
    if (!selectedId && notes.length > 0) setSelectedId(notes[0].id)
  }, [notes, selectedId, nodes])

  const selected = selectedId ? nodes[selectedId] : null

  const newNote = () => {
    if (!notesFolder) return
    const id = createNode(notesFolder.id, 'New Note.txt', 'file', '')
    if (id) setSelectedId(id)
  }

  const removeNote = (id: string) => {
    deleteNode(id)
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className="flex h-full w-full">
      {/* Note list */}
      <aside className="flex h-full w-56 shrink-0 flex-col bg-[var(--color-sidebar-bg)]">
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--color-window-border)] px-3">
          <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
            Notes
          </span>
          <button
            onClick={newNote}
            aria-label="New Note"
            className="rounded-md p-1.5 text-[var(--color-accent)] hover:bg-white/10"
          >
            <SquarePen size={17} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {notes.length === 0 ? (
            <p className="p-3 text-[12px] text-[var(--color-text-tertiary)]">
              No notes yet
            </p>
          ) : (
            notes.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedId(n.id)}
                className={`group flex w-full flex-col gap-0.5 border-b border-[var(--color-window-border)] px-3 py-2 text-left ${
                  selectedId === n.id
                    ? 'bg-[var(--color-accent)]/20'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-[13px] font-medium text-[var(--color-text-primary)]">
                    {noteTitle(n.content)}
                  </span>
                  <Trash2
                    size={14}
                    className="shrink-0 text-[var(--color-text-tertiary)] opacity-0 hover:text-[var(--color-close)] group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeNote(n.id)
                    }}
                  />
                </div>
                <span className="truncate text-[11px] text-[var(--color-text-secondary)]">
                  {notePreview(n.content)}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Editor */}
      <div className="min-w-0 flex-1">
        {selected ? (
          <textarea
            key={selected.id}
            value={selected.content}
            onChange={(e) => updateContent(selected.id, e.target.value)}
            placeholder="Start writing…"
            spellCheck={false}
            className="h-full w-full resize-none bg-transparent p-5 text-[14px] leading-relaxed text-[var(--color-text-primary)] outline-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-[var(--color-text-tertiary)]">
            Select or create a note
          </div>
        )}
      </div>
    </div>
  )
}
