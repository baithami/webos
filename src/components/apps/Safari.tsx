'use client'

import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Search,
  Lock,
} from 'lucide-react'

// Iframe-based browser. Real navigation/back-forward inside cross-origin frames
// isn't observable, so we track our own visited stack and reset the iframe src.
// A start page of shortcuts shows when no URL is loaded.

const SHORTCUTS: { name: string; url: string; color: string }[] = [
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', color: 'from-zinc-500 to-zinc-700' },
  { name: 'MDN', url: 'https://developer.mozilla.org', color: 'from-slate-600 to-slate-800' },
  { name: 'Example', url: 'https://example.com', color: 'from-sky-500 to-blue-700' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', color: 'from-orange-500 to-amber-600' },
]

function normalize(input: string): string {
  const text = input.trim()
  if (!text) return ''
  // Looks like a domain/URL → ensure a protocol.
  if (/^https?:\/\//i.test(text)) return text
  if (/\.[a-z]{2,}(\/|$|:)/i.test(text) && !text.includes(' ')) {
    return 'https://' + text
  }
  // Otherwise treat it as a web search.
  return 'https://www.google.com/search?q=' + encodeURIComponent(text)
}

export default function Safari() {
  const [history, setHistory] = useState<string[]>([])
  const [index, setIndex] = useState(-1)
  const [address, setAddress] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const current = index >= 0 ? history[index] : ''

  const go = (target: string) => {
    const url = normalize(target)
    if (!url) return
    const next = history.slice(0, index + 1)
    next.push(url)
    setHistory(next)
    setIndex(next.length - 1)
    setAddress(url)
  }

  const back = () => {
    if (index > 0) {
      setIndex(index - 1)
      setAddress(history[index - 1])
    }
  }
  const forward = () => {
    if (index < history.length - 1) {
      setIndex(index + 1)
      setAddress(history[index + 1])
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-window-bg)]">
      {/* Toolbar */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[var(--color-window-border)] bg-[var(--color-window-titlebar)] px-3">
        <NavBtn disabled={index <= 0} onClick={back} label="Back">
          <ChevronLeft size={18} />
        </NavBtn>
        <NavBtn
          disabled={index >= history.length - 1}
          onClick={forward}
          label="Forward"
        >
          <ChevronRight size={18} />
        </NavBtn>
        <NavBtn
          disabled={!current}
          onClick={() => setReloadKey((k) => k + 1)}
          label="Reload"
        >
          <RotateCw size={15} />
        </NavBtn>

        <form
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-black/25 px-3 py-1"
          onSubmit={(e) => {
            e.preventDefault()
            go(address)
          }}
        >
          {current ? (
            <Lock size={12} className="shrink-0 text-[var(--color-text-tertiary)]" />
          ) : (
            <Search size={13} className="shrink-0 text-[var(--color-text-tertiary)]" />
          )}
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Search or enter website name"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-center text-[13px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
          />
        </form>
      </div>

      {/* Viewport */}
      <div className="min-h-0 flex-1">
        {current ? (
          <iframe
            key={`${current}-${reloadKey}`}
            src={current}
            title="Safari"
            className="h-full w-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <StartPage onPick={go} />
        )}
      </div>
    </div>
  )
}

function StartPage({ onPick }: { onPick: (url: string) => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        Favorites
      </h1>
      <div className="grid grid-cols-4 gap-4">
        {SHORTCUTS.map((s) => (
          <button
            key={s.name}
            onClick={() => onPick(s.url)}
            className="flex flex-col items-center gap-2"
          >
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-xl font-bold text-white shadow-lg`}
            >
              {s.name[0]}
            </div>
            <span className="text-[12px] text-[var(--color-text-secondary)]">
              {s.name}
            </span>
          </button>
        ))}
      </div>
      <p className="max-w-sm text-center text-[11px] text-[var(--color-text-tertiary)]">
        Some websites block being embedded in a frame and may not load here.
      </p>
    </div>
  )
}

function NavBtn({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="rounded-md p-1 text-[var(--color-text-secondary)] enabled:hover:bg-white/10 enabled:hover:text-[var(--color-text-primary)] disabled:opacity-30"
    >
      {children}
    </button>
  )
}
