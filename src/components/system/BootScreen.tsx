'use client'

import { useEffect, useState } from 'react'
import { useSessionStore } from '@/store/useSessionStore'
import { Z } from '@/lib/constants'

const BOOT_MS = 2800

const BOOT_LINES = [
  'JPD MUNICIPAL DATA SYSTEMS v2.1',
  'Copyright (c) 1995-2026 Jacksonville PD',
  '',
  'Initializing case database.............. OK',
  'Loading evidence modules................. OK',
  'Checking officer credentials............. OK',
  'Starting SQL engine...................... OK',
  '',
  'WELCOME, DETECTIVE.',
]

export default function BootScreen() {
  const finishBoot = useSessionStore((s) => s.finishBoot)
  const [visibleLines, setVisibleLines] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Reveal lines one at a time
    const lineInterval = setInterval(() => {
      setVisibleLines((v) => {
        if (v >= BOOT_LINES.length) {
          clearInterval(lineInterval)
          return v
        }
        return v + 1
      })
    }, BOOT_MS / (BOOT_LINES.length + 2))

    // Progress bar fills over BOOT_MS
    const start = Date.now()
    const progInterval = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / BOOT_MS) * 100)
      setProgress(pct)
      if (pct >= 100) clearInterval(progInterval)
    }, 30)

    const t = setTimeout(finishBoot, BOOT_MS)
    return () => {
      clearTimeout(t)
      clearInterval(lineInterval)
      clearInterval(progInterval)
    }
  }, [finishBoot])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        zIndex: Z.loginScreen + 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 32,
      }}
    >
      {/* JPD Badge — SVG police shield */}
      <JpdBadge />

      {/* Boot text */}
      <div style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 13,
        color: '#aaffaa',
        width: '100%',
        maxWidth: 500,
        lineHeight: 1.8,
        minHeight: 220,
      }}>
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} style={{ color: line === '' ? 'transparent' : line.startsWith('WELCOME') ? '#ffffff' : '#aaffaa' }}>
            {line || ' '}
          </div>
        ))}
      </div>

      {/* Progress bar — chunky Win95 style */}
      <div style={{
        width: '100%',
        maxWidth: 500,
        height: 20,
        background: '#1a1a1a',
        border: '2px solid #444444',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: '#000080',
          transition: 'width 0.03s linear',
        }} />
      </div>
    </div>
  )
}

function JpdBadge() {
  return (
    <svg width="100" height="110" viewBox="0 0 100 110" aria-label="JPD Badge">
      {/* Shield outline */}
      <path
        d="M50,4 L90,20 L90,60 Q90,90 50,106 Q10,90 10,60 L10,20 Z"
        fill="#000080"
        stroke="#c0c0c0"
        strokeWidth="3"
      />
      {/* Shield inner border */}
      <path
        d="M50,12 L82,26 L82,60 Q82,84 50,98 Q18,84 18,60 L18,26 Z"
        fill="none"
        stroke="#aaaaff"
        strokeWidth="1.5"
      />
      {/* Star burst center */}
      <circle cx="50" cy="55" r="14" fill="#c8a000" stroke="#ffdd44" strokeWidth="1" />
      <polygon points="50,41 53,51 64,51 55,58 58,68 50,62 42,68 45,58 36,51 47,51" fill="#ffffff" />
      {/* Text: JPD */}
      <text x="50" y="33" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="Arial" fontWeight="bold" letterSpacing="3">JPD</text>
      {/* Text: POLICE */}
      <text x="50" y="82" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="Arial" letterSpacing="2">POLICE</text>
      {/* Text: JACKSONVILLE */}
      <text x="50" y="92" textAnchor="middle" fill="#aaaaff" fontSize="5.5" fontFamily="Arial" letterSpacing="1">JACKSONVILLE</text>
    </svg>
  )
}
