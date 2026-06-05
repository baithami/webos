'use client'

import { useEffect, useRef, useState } from 'react'
import {
  FilePlus,
  FolderOpen,
  Save,
  Bold,
  Italic,
  Underline,
  Type,
} from 'lucide-react'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { useAppIntent } from '@/store/useAppIntent'
import { getExtension } from '@/lib/fileTypes'
import { pathString, nodeCategory, type FSNode } from '@/lib/fs'

type Mode = 'plain' | 'rich'

const RICH_EXTS = new Set(['rtf', 'html', 'htm'])

function modeForName(name: string): Mode {
  return RICH_EXTS.has(getExtension(name)) ? 'rich' : 'plain'
}

interface Doc {
  fileId: string | null
  name: string
  content: string
  dirty: boolean
}

const BLANK: Doc = { fileId: null, name: 'Untitled.txt', content: '', dirty: false }

export default function TextEdit() {
  const nodes = useFileSystemStore((s) => s.nodes)
  const createNode = useFileSystemStore((s) => s.createNode)
  const updateContent = useFileSystemStore((s) => s.updateContent)
  const consumeFile = useAppIntent((s) => s.consumeFile)
  const pendingFile = useAppIntent((s) => s.pendingFile['textedit'])

  const [doc, setDoc] = useState<Doc>(BLANK)
  const [mode, setMode] = useState<Mode>('plain')
  const [openMenu, setOpenMenu] = useState(false)
  const richRef = useRef<HTMLDivElement>(null)

  const loadFile = (node: FSNode) => {
    setDoc({
      fileId: node.id,
      name: node.name,
      content: node.content,
      dirty: false,
    })
    setMode(modeForName(node.name))
  }

  // Honor "open this file in TextEdit" requests from Finder.
  useEffect(() => {
    if (pendingFile === undefined) return
    const id = consumeFile('textedit')
    if (id && nodes[id]) loadFile(nodes[id])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFile])

  // Push loaded rich content into the contentEditable surface.
  useEffect(() => {
    if (mode === 'rich' && richRef.current) {
      richRef.current.innerHTML = doc.content
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.fileId, mode])

  const newDoc = () => {
    setDoc(BLANK)
    setMode('plain')
  }

  const save = () => {
    if (doc.fileId && nodes[doc.fileId]) {
      updateContent(doc.fileId, doc.content)
      setDoc((d) => ({ ...d, dirty: false }))
    } else {
      // Save As → create in Documents.
      const id = createNode('documents', doc.name, 'file', doc.content)
      if (id) setDoc((d) => ({ ...d, fileId: id, dirty: false }))
    }
  }

  const setText = (content: string) =>
    setDoc((d) => ({ ...d, content, dirty: true }))

  const toggleMode = () => {
    if (mode === 'plain') {
      // Plain → rich: escape and keep line breaks.
      const html = doc.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
      setDoc((d) => ({ ...d, content: html }))
      setMode('rich')
    } else {
      // Rich → plain: strip tags.
      const tmp = document.createElement('div')
      tmp.innerHTML = doc.content
      setDoc((d) => ({ ...d, content: tmp.textContent ?? '', dirty: true }))
      setMode('plain')
    }
  }

  const exec = (cmd: string) => {
    document.execCommand(cmd, false)
    if (richRef.current)
      setDoc((d) => ({ ...d, content: richRef.current!.innerHTML, dirty: true }))
  }

  // Only offer text-editable files (skip images and other binaries stored as
  // data URLs, which would render as base64 noise).
  const TEXTUAL = new Set(['text', 'richtext', 'code', 'unknown'])
  const openableFiles = Object.values(nodes).filter(
    (n) => n.type === 'file' && TEXTUAL.has(nodeCategory(n))
  )

  return (
    <div className="flex h-full w-full flex-col" onClick={() => setOpenMenu(false)}>
      {/* Toolbar */}
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-[var(--color-window-border)] bg-[var(--color-window-titlebar)] px-3">
        <TBtn onClick={newDoc} label="New">
          <FilePlus size={17} />
        </TBtn>

        <div className="relative">
          <TBtn
            onClick={(e) => {
              e.stopPropagation()
              setOpenMenu((v) => !v)
            }}
            label="Open"
          >
            <FolderOpen size={17} />
          </TBtn>
          {openMenu && (
            <div
              className="glass absolute left-0 top-9 z-50 max-h-72 w-64 overflow-auto rounded-lg py-1 text-[13px] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {openableFiles.length === 0 ? (
                <p className="px-3 py-2 text-[var(--color-text-tertiary)]">
                  No files
                </p>
              ) : (
                openableFiles.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      loadFile(n)
                      setOpenMenu(false)
                    }}
                    className="flex w-full flex-col px-3 py-1.5 text-left hover:bg-[var(--color-accent)] hover:text-white"
                  >
                    <span className="truncate">{n.name}</span>
                    <span className="truncate text-[11px] text-[var(--color-text-tertiary)]">
                      {pathString(nodes, n.id)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <TBtn onClick={save} label="Save">
          <Save size={17} />
        </TBtn>

        <div className="mx-1 h-5 w-px bg-[var(--color-window-border)]" />

        <TBtn onClick={toggleMode} active={mode === 'rich'} label="Rich text">
          <Type size={17} />
        </TBtn>
        {mode === 'rich' && (
          <>
            <TBtn onClick={() => exec('bold')} label="Bold">
              <Bold size={16} />
            </TBtn>
            <TBtn onClick={() => exec('italic')} label="Italic">
              <Italic size={16} />
            </TBtn>
            <TBtn onClick={() => exec('underline')} label="Underline">
              <Underline size={16} />
            </TBtn>
          </>
        )}

        <span className="ml-auto flex items-center gap-1.5 truncate text-[12px] text-[var(--color-text-secondary)]">
          {doc.dirty && (
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-secondary)]" />
          )}
          {doc.name}
        </span>
      </div>

      {/* Editor surface */}
      {mode === 'plain' ? (
        <textarea
          value={doc.content}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder="Start typing…"
          className="min-h-0 flex-1 resize-none bg-transparent p-4 font-mono text-[14px] leading-relaxed text-[var(--color-text-primary)] outline-none"
        />
      ) : (
        <div
          ref={richRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) =>
            setDoc((d) => ({
              ...d,
              content: (e.currentTarget as HTMLDivElement).innerHTML,
              dirty: true,
            }))
          }
          className="min-h-0 flex-1 overflow-auto p-4 text-[14px] leading-relaxed text-[var(--color-text-primary)] outline-none"
        />
      )}
    </div>
  )
}

function TBtn({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  label: string
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-md p-1.5 ${
        active
          ? 'bg-white/15 text-[var(--color-text-primary)]'
          : 'text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  )
}
