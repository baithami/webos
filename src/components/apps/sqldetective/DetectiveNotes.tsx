'use client'

import { useEffect, useRef, useState } from 'react'
import { useCaseStore } from '@/store/useCaseStore'

// A lined-notepad scratchpad for the player's working notes — cream paper,
// dark ink, ruled lines. Notes are keyed per case (detective-notes-<caseId>)
// so switching cases never bleeds notes across investigations. Content
// persists to localStorage and auto-saves 500ms after the last keystroke.
// No backend; this is per-device by design.

const FALLBACK_STACK = "'Caveat', 'Comic Sans MS', cursive"

/** 'case-001' → '#0001' */
function caseNumber(id: string): string {
  const n = id.replace(/\D/g, '')
  return `#${n.padStart(4, '0')}`
}

export default function DetectiveNotes() {
  const activeCaseId = useCaseStore((s) => s.activeCaseId)
  const storageKey = `detective-notes-${activeCaseId}`

  const [text, setText] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The not-yet-written save, with the key it belongs to — so a case switch
  // mid-debounce flushes to the OLD case's key, never the new one.
  const pendingSave = useRef<{ key: string; value: string } | null>(null)

  const flushSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = null
    if (pendingSave.current) {
      try {
        window.localStorage.setItem(pendingSave.current.key, pendingSave.current.value)
      } catch {
        /* ignore quota / availability errors */
      }
      pendingSave.current = null
    }
  }

  // Load this case's notes; on case switch (or unmount) flush any pending save
  // for the previous case first. (localStorage is client-only; this app is
  // rendered with ssr:false so window is always available here.)
  useEffect(() => {
    try {
      setText(window.localStorage.getItem(storageKey) ?? '')
    } catch {
      setText('') /* localStorage unavailable — degrade to in-memory only. */
    }
    return flushSave
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  // Inject the Caveat handwriting font once. Falls back to system cursive if
  // the network is unavailable.
  useEffect(() => {
    const id = 'detective-notes-font'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap'
    document.head.appendChild(link)
  }, [])

  const onChange = (value: string) => {
    setText(value)
    pendingSave.current = { key: storageKey, value }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(flushSave, 500)
  }

  const stamp = caseNumber(activeCaseId)

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: 'var(--color-window-bg)' }}
    >
      {/* Header */}
      <header
        className="flex shrink-0 items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid var(--color-window-border)' }}
      >
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Case Notes — {stamp}
        </span>
        <span
          className="font-mono text-[11px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {text.length} chars
        </span>
      </header>

      {/* Notepad */}
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Jot your observations here, Detective..."
        spellCheck={false}
        className="min-h-0 flex-1 resize-none px-8 py-3 outline-none"
        style={{
          background: '#faf8f0',
          color: '#1c1917',
          fontFamily: FALLBACK_STACK,
          fontSize: '20px',
          lineHeight: '32px',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(60,90,160,0.25) 31px, rgba(60,90,160,0.25) 32px)',
          backgroundAttachment: 'local',
        }}
      />

      {/* Footer */}
      <footer
        className="shrink-0 px-4 py-1.5 font-mono text-[10px]"
        style={{
          borderTop: '1px solid var(--color-window-border)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        Auto-saved • Case {stamp}
      </footer>
    </div>
  )
}
