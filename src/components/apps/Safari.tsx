'use client'

import { useState } from 'react'

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        height: 32,
        flexShrink: 0,
        background: '#c0c0c0',
        borderBottom: '2px solid #808080',
        padding: '0 6px',
      }}>
        {/* Back */}
        <BrowserBtn disabled={index <= 0} onClick={back} label="Back">{'<'}</BrowserBtn>
        {/* Forward */}
        <BrowserBtn disabled={index >= history.length - 1} onClick={forward} label="Forward">{'>'}</BrowserBtn>
        {/* Reload */}
        <BrowserBtn disabled={!current} onClick={() => setReloadKey((k) => k + 1)} label="Reload">↻</BrowserBtn>

        {/* Address bar — sunken Win95 input */}
        <form
          style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 4 }}
          onSubmit={(e) => { e.preventDefault(); go(address) }}
        >
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address"
            spellCheck={false}
            style={{
              flex: 1,
              height: 22,
              background: '#ffffff',
              borderStyle: 'solid',
              borderWidth: 2,
              borderColor: '#808080 #ffffff #ffffff #808080',
              padding: '0 6px',
              fontSize: 12,
              fontFamily: 'Arial, sans-serif',
              color: '#000000',
              outline: 'none',
            }}
          />
          <BrowserBtn disabled={false} onClick={() => go(address)} label="Go">Go</BrowserBtn>
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      background: '#c0c0c0',
      gap: 16,
      padding: 24,
    }}>
      <p style={{ fontSize: 14, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', color: '#000000' }}>
        Favorites
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {SHORTCUTS.map((s) => (
          <button
            key={s.name}
            onClick={() => onPick(s.url)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'default',
              padding: 8,
            }}
          >
            {/* Win95 style link icon — globe glyph */}
            <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
              <circle cx="20" cy="20" r="16" fill="#ffffff" stroke="#000080" strokeWidth="2" />
              <ellipse cx="20" cy="20" rx="7" ry="16" fill="none" stroke="#000080" strokeWidth="1.5" />
              <line x1="5" y1="20" x2="35" y2="20" stroke="#000080" strokeWidth="1.5" />
              <line x1="8" y1="13" x2="32" y2="13" stroke="#000080" strokeWidth="1" />
              <line x1="8" y1="27" x2="32" y2="27" stroke="#000080" strokeWidth="1" />
            </svg>
            <span style={{ fontSize: 11, fontFamily: 'Arial, sans-serif', color: '#000080', textDecoration: 'underline' }}>
              {s.name}
            </span>
          </button>
        ))}
      </div>
      <p style={{ fontSize: 10, fontFamily: 'Arial, sans-serif', color: '#808080', textAlign: 'center', maxWidth: 300 }}>
        Some websites block being embedded in a frame and may not load here.
      </p>
    </div>
  )
}

function BrowserBtn({
  disabled = false,
  onClick,
  label,
  children,
}: {
  disabled?: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      style={{
        background: '#c0c0c0',
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: '#ffffff #808080 #808080 #ffffff',
        padding: '1px 8px',
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        color: disabled ? '#808080' : '#000000',
        cursor: 'default',
        flexShrink: 0,
        height: 22,
      }}
    >
      {children}
    </button>
  )
}
