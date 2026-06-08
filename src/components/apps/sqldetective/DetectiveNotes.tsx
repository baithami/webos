'use client'

import { useEffect, useRef, useState } from 'react'

// A lined-notepad scratchpad for the player's working notes. Intentionally
// breaks from the dark OS theme — cream paper, dark ink, ruled lines — while
// the window chrome stays dark. Content persists to localStorage and auto-saves
// 500ms after the last keystroke. No backend; this is per-device by design.

const STORAGE_KEY = 'detective-notes-case-001'
const FALLBACK_STACK = "'Caveat', 'Comic Sans MS', cursive"

export default function DetectiveNotes() {
  const [text, setText] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load persisted notes once on mount. (localStorage is client-only; this app
  // is rendered with ssr:false so window is always available here.)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved !== null) setText(saved)
    } catch {
      /* localStorage unavailable — degrade to in-memory only. */
    }
  }, [])

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
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, value)
      } catch {
        /* ignore quota / availability errors */
      }
    }, 500)
  }

  // Flush any pending save on unmount so a quick close doesn't lose the tail.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

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
          Case Notes — #0001
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
        Auto-saved • Case #0001
      </footer>
    </div>
  )
}
