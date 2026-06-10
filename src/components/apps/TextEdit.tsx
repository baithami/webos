'use client'

import { useEffect, useRef, useState } from 'react'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { useAppIntent } from '@/store/useAppIntent'
import { getExtension } from '@/lib/fileTypes'
import { nodeCategory, type FSNode } from '@/lib/fs'

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
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
      onClick={() => setOpenMenu(false)}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          height: 32,
          flexShrink: 0,
          background: '#c0c0c0',
          borderBottom: '2px solid #808080',
          padding: '0 4px',
        }}
      >
        <W95AppBtn onClick={newDoc} label="New">New</W95AppBtn>

        {/* Open with dropdown */}
        <div style={{ position: 'relative' }}>
          <W95AppBtn
            onClick={(e) => { e.stopPropagation(); setOpenMenu((v) => !v) }}
            label="Open"
          >
            Open ▾
          </W95AppBtn>
          {openMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 9999,
                background: '#c0c0c0',
                borderStyle: 'solid',
                borderWidth: 2,
                borderColor: '#ffffff #404040 #404040 #ffffff',
                boxShadow: '2px 2px 0 #000',
                minWidth: 200,
                maxHeight: 220,
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {openableFiles.length === 0 ? (
                <p style={{ padding: '6px 12px', fontSize: 12, color: '#808080', fontFamily: 'Arial, sans-serif' }}>
                  No files
                </p>
              ) : (
                openableFiles.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { loadFile(n); setOpenMenu(false) }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '3px 12px',
                      textAlign: 'left',
                      border: 'none',
                      background: 'transparent',
                      fontSize: 12,
                      fontFamily: 'Arial, sans-serif',
                      color: '#000000',
                      cursor: 'default',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget).style.background = '#000080'; (e.currentTarget).style.color = '#fff' }}
                    onMouseLeave={(e) => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = '#000' }}
                  >
                    {n.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <W95AppBtn onClick={save} label="Save">Save</W95AppBtn>

        {/* Divider */}
        <div style={{ width: 2, height: 18, borderLeft: '1px solid #808080', borderRight: '1px solid #ffffff', margin: '0 3px', flexShrink: 0 }} />

        <W95AppBtn onClick={toggleMode} label="Rich text" active={mode === 'rich'}>Rich</W95AppBtn>
        {mode === 'rich' && (
          <>
            <W95AppBtn onClick={() => exec('bold')} label="Bold">B</W95AppBtn>
            <W95AppBtn onClick={() => exec('italic')} label="Italic" style={{ fontStyle: 'italic' }}>I</W95AppBtn>
            <W95AppBtn onClick={() => exec('underline')} label="Underline" style={{ textDecoration: 'underline' }}>U</W95AppBtn>
          </>
        )}

        {/* Filename right-aligned */}
        <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'Arial, sans-serif', color: '#000000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 4 }}>
          {doc.dirty && '● '}{doc.name}
        </span>
      </div>

      {/* Editor surface */}
      {mode === 'plain' ? (
        <textarea
          value={doc.content}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder="Start typing…"
          style={{
            flex: 1,
            minHeight: 0,
            resize: 'none',
            background: '#ffffff',
            padding: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            lineHeight: 1.6,
            color: '#000000',
            border: 'none',
            outline: 'none',
          }}
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
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            background: '#ffffff',
            padding: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            lineHeight: 1.6,
            color: '#000000',
            outline: 'none',
          }}
        />
      )}
    </div>
  )
}

function W95AppBtn({
  children,
  onClick,
  label,
  active,
  style: extraStyle,
}: {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  label: string
  active?: boolean
  style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        background: '#c0c0c0',
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: active
          ? '#808080 #ffffff #ffffff #808080'
          : '#ffffff #808080 #808080 #ffffff',
        padding: active ? '3px 7px 1px 9px' : '2px 8px',
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        cursor: 'default',
        flexShrink: 0,
        ...extraStyle,
      }}
    >
      {children}
    </button>
  )
}
