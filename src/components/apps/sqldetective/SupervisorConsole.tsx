'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCaseStore } from '@/store/useCaseStore'
import { SUPERVISORS, type Supervisor, type SupervisorLine } from '@/lib/sqldetective/supervisors'
import { rankForXp } from '@/lib/sqldetective/ranks'

// The Supervisor Console — a beige government machine cabinet with a small
// recessed CRT face-screen (the ADA ship-computer from The Outer Worlds:
// "tiny face, giant box"). A precinct supervisor delivers a scripted intro the
// first time a case is opened (auto-popped from the Inbox) and re-serves that
// case's hints on demand. Hints are pulled live from useCaseStore so the
// console and the SQL Terminal share one hint counter.

// Flip to false once real face PNGs are dropped into public/supervisors/<id>/.
// (Until then the CSS placeholder renders the talk animation predictably.)
const USE_PLACEHOLDER_FACE = true

const TYPE_MS = 22 // per-character teletype speed
const MOUTH_MS = 200 // talking mouth open/closed swap (~2 fps)

// Session-level record of which cases have auto-played their intro. Module-level
// (not a store) per the brief — survives window close/reopen within a session,
// resets on full reload.
const introPlayed = new Set<string>()

const HINT_EXPR = ['neutral', 'stern', 'suspicious'] // hint 1/2/3 escalation

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export default function SupervisorConsole() {
  const reduced = usePrefersReducedMotion()

  const activeCaseId = useCaseStore((s) => s.activeCaseId)
  const hintsUsed = useCaseStore((s) => s.hintsUsed)
  const nextHint = useCaseStore((s) => s.nextHint)
  const revealHint = useCaseStore((s) => s.useHint)
  const rankTitle = useCaseStore((s) => rankForXp(s.xp).title)

  const supervisor: Supervisor | undefined = SUPERVISORS[activeCaseId]

  // Transcript queue + the line currently being delivered.
  const [lines, setLines] = useState<SupervisorLine[]>([])
  const [lineIdx, setLineIdx] = useState(0)
  const [printed, setPrinted] = useState('')
  const [printing, setPrinting] = useState(false)

  const current = lines[lineIdx] ?? null
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Enqueue the active case's intro once per session (covers both auto-pop and
  // opening the console manually on a not-yet-introduced case).
  useEffect(() => {
    if (!activeCaseId) return
    const sup = SUPERVISORS[activeCaseId]
    if (!sup || introPlayed.has(activeCaseId)) return
    introPlayed.add(activeCaseId)
    setLines(sup.signoff ? [...sup.intro, sup.signoff] : [...sup.intro])
    setLineIdx(0)
  }, [activeCaseId])

  // Teletype the current line character-by-character (or instantly when reduced
  // motion is requested). While typing, the face "talks".
  useEffect(() => {
    if (typeTimer.current) {
      clearInterval(typeTimer.current)
      typeTimer.current = null
    }
    if (!current) {
      setPrinted('')
      setPrinting(false)
      return
    }
    if (reduced) {
      setPrinted(current.text)
      setPrinting(false)
      return
    }
    setPrinting(true)
    setPrinted('')
    let i = 0
    typeTimer.current = setInterval(() => {
      i += 1
      setPrinted(current.text.slice(0, i))
      if (i >= current.text.length) {
        if (typeTimer.current) clearInterval(typeTimer.current)
        typeTimer.current = null
        setPrinting(false)
      }
    }, TYPE_MS)
    return () => {
      if (typeTimer.current) clearInterval(typeTimer.current)
      typeTimer.current = null
    }
  }, [lineIdx, current?.text, reduced]) // eslint-disable-line react-hooks/exhaustive-deps

  const finishLine = useCallback(() => {
    if (typeTimer.current) {
      clearInterval(typeTimer.current)
      typeTimer.current = null
    }
    if (current) setPrinted(current.text)
    setPrinting(false)
  }, [current])

  const atLastLine = lineIdx >= lines.length - 1
  const handleNext = () => {
    if (printing) {
      finishLine() // fast-forward the current line
      return
    }
    if (!atLastLine) setLineIdx((i) => i + 1)
  }

  const used = hintsUsed[activeCaseId] ?? -1
  const hintsExhausted = used >= 2
  const handleHint = () => {
    if (!activeCaseId) return
    const usedBefore = useCaseStore.getState().hintsUsed[activeCaseId] ?? -1
    if (usedBefore >= 2) return
    const hint = nextHint(activeCaseId)
    if (!hint) return
    revealHint(activeCaseId) // advances the SHARED counter (SqlTerminal sees it)
    const n = usedBefore + 1 // 0-based hint index just revealed
    setLines((prev) => {
      const nextLines = [
        ...prev,
        { text: `HINT ${n + 1}/3 — ${hint}`, expr: HINT_EXPR[n] ?? 'neutral' },
      ]
      setLineIdx(nextLines.length - 1)
      return nextLines
    })
  }

  const expr = current?.expr ?? 'neutral'
  const idle = !current
  const cabinet = '#cdc8ba' // warm government beige-gray

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{
        background: cabinet,
        fontFamily: "'Courier New', Consolas, monospace",
        // Heavy raised outer bevel — the machine's front panel.
        borderStyle: 'solid',
        borderWidth: 3,
        borderColor: '#efece2 #8a8678 #6d6a5e #efece2',
        padding: 12,
        userSelect: 'none',
      }}
    >
      {/* local keyframes so we never touch globals.css */}
      <style>{`
        @keyframes svFlicker { 0%,100%{opacity:1} 50%{opacity:.93} 92%{opacity:.85} }
        @keyframes svRec { 0%,49%{opacity:1} 50%,100%{opacity:.15} }
      `}</style>

      {/* Channel strip — embossed label on the bezel */}
      <div
        className="flex shrink-0 items-center justify-between px-1 pb-2"
        style={{ fontSize: 11, letterSpacing: 1, color: '#4b4838' }}
      >
        <span style={{ fontWeight: 'bold', textShadow: '1px 1px 0 #efece2' }}>
          ▣ {supervisor?.channel ?? 'PRECINCT CH-04'}
        </span>
        <span style={{ textShadow: '1px 1px 0 #efece2' }}>
          {supervisor?.name ?? 'UNASSIGNED'}
        </span>
      </div>

      {/* Recessed face-screen (~55%) */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          flex: '1 1 55%',
          minHeight: 0,
          background: '#070b07',
          borderStyle: 'solid',
          borderWidth: 4,
          borderColor: '#6d6a5e #efece2 #efece2 #6d6a5e', // inset (recessed)
          boxShadow: 'inset 0 0 24px rgba(0,0,0,0.8)',
        }}
      >
        <FaceScreen
          portraitId={supervisor?.portraitId ?? 'vane'}
          name={supervisor?.name ?? 'UNASSIGNED'}
          channel={supervisor?.channel ?? 'PRECINCT CH-04'}
          expr={expr}
          talking={printing}
          awaiting={!supervisor}
          reduced={reduced}
        />
        {/* scanlines + soft flicker overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px)',
            animation: reduced ? undefined : 'svFlicker 5s infinite',
            mixBlendMode: 'multiply',
          }}
        />
      </div>

      {/* Teletype readout strip */}
      <div
        className="mt-2 shrink-0 overflow-hidden"
        style={{
          background: '#120c00',
          borderStyle: 'solid',
          borderWidth: 2,
          borderColor: '#6d6a5e #efece2 #efece2 #6d6a5e',
          padding: '8px 10px',
          minHeight: 64,
          color: '#ffb000', // amber teletype
          fontSize: 13,
          lineHeight: 1.45,
          textShadow: '0 0 4px rgba(255,176,0,0.5)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {idle ? (
          <span style={{ opacity: 0.55 }}>
            {supervisor ? '— STANDBY —' : '— AWAITING ASSIGNMENT —'}
          </span>
        ) : (
          <>
            <span style={{ opacity: 0.6 }}>{'> '}</span>
            {printed}
            <span style={{ opacity: printing ? 1 : 0.5 }}>
              {printing ? '▋' : ' ▍'}
            </span>
          </>
        )}
      </div>

      {/* Hardware control row */}
      <div className="mt-2 flex shrink-0 items-center gap-2">
        <Lamp color="#27c93f" label="PWR" on />
        <Lamp color="#ff3b30" label="REC" on={printing} blink={printing && !reduced} />

        {/* Embossed rank nameplate — the player's current detective rank */}
        <span
          data-testid="supervisor-rank-plate"
          title="Your current rank — solve cases to advance"
          style={{
            marginLeft: 4,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 'bold',
            letterSpacing: 1,
            color: '#4b4838',
            textShadow: '1px 1px 0 #efece2',
            borderStyle: 'solid',
            borderWidth: 2,
            borderColor: '#8a8678 #efece2 #efece2 #8a8678', // engraved
            whiteSpace: 'nowrap',
          }}
        >
          {rankTitle}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <CabinetButton
            onClick={handleNext}
            disabled={idle || (atLastLine && !printing)}
          >
            {printing ? 'SKIP ▸▸' : 'NEXT ▸'}
          </CabinetButton>
          <CabinetButton onClick={handleHint} disabled={hintsExhausted} primary>
            {hintsExhausted ? 'NO MORE HINTS' : 'REQUEST HINT'}
          </CabinetButton>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FaceScreen — the small animated face. Tries the expression PNG; falls back to
// a green-on-dark CRT placeholder (default for this build) that mirrors the
// talk animation with a mouth-bar and blinks while idle.
// ---------------------------------------------------------------------------

function FaceScreen({
  portraitId,
  name,
  channel,
  expr,
  talking,
  awaiting,
  reduced,
}: {
  portraitId: string
  name: string
  channel: string
  expr: string
  talking: boolean
  awaiting: boolean
  reduced: boolean
}) {
  const [mouthOpen, setMouthOpen] = useState(false)
  const [blink, setBlink] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Mouth cycle while talking.
  useEffect(() => {
    if (!talking || reduced) {
      setMouthOpen(false)
      return
    }
    const id = setInterval(() => setMouthOpen((o) => !o), MOUTH_MS)
    return () => clearInterval(id)
  }, [talking, reduced])

  // Occasional blink while idle.
  useEffect(() => {
    if (talking || reduced) {
      setBlink(false)
      return
    }
    let to: ReturnType<typeof setTimeout>
    let off: ReturnType<typeof setTimeout>
    const schedule = () => {
      to = setTimeout(() => {
        setBlink(true)
        off = setTimeout(() => setBlink(false), 130)
        schedule()
      }, 3000 + Math.random() * 3000)
    }
    schedule()
    return () => {
      clearTimeout(to)
      clearTimeout(off)
    }
  }, [talking, reduced])

  // Real footage path (used once USE_PLACEHOLDER_FACE is false and PNGs exist).
  if (!USE_PLACEHOLDER_FACE && !imgError) {
    const frame = `${expr}_${mouthOpen ? 'open' : 'closed'}`
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/supervisors/${portraitId}/${frame}.png`}
        alt=""
        aria-hidden
        draggable={false}
        onError={() => setImgError(true)}
        className="absolute inset-0 h-full w-full"
        style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
      />
    )
  }

  // CSS placeholder — clearly shows the talk animation working without art.
  const green = '#33ff66'
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: green }}>
      {/* tiny face — eyes + mouth bar (the "small face, giant box" look) */}
      <div
        className="flex flex-col items-center justify-center"
        style={{ width: 96, height: 84, filter: 'drop-shadow(0 0 6px rgba(51,255,102,0.6))' }}
      >
        {/* eyes */}
        <div className="flex items-center gap-4" style={{ height: 18 }}>
          {[0, 1].map((i) => (
            <span
              key={i}
              style={{
                width: 14,
                height: blink ? 2 : 12,
                background: green,
                borderRadius: 2,
                transition: reduced ? undefined : 'height 90ms',
              }}
            />
          ))}
        </div>
        {/* mouth bar — grows when "open" while talking */}
        <span
          aria-hidden
          style={{
            marginTop: 18,
            width: 40,
            height: talking ? (mouthOpen ? 14 : 3) : 3,
            background: green,
            borderRadius: 2,
            transition: reduced ? undefined : 'height 80ms',
          }}
        />
      </div>

      {/* identity readout, green CRT text */}
      <div className="mt-3 text-center" style={{ fontSize: 11, letterSpacing: 1 }}>
        <div style={{ fontWeight: 'bold' }}>
          {awaiting ? 'AWAITING ASSIGNMENT' : name.toUpperCase()}
        </div>
        <div style={{ opacity: 0.7, marginTop: 2 }}>
          {awaiting ? channel : `${channel} / ${expr}`}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small hardware widgets
// ---------------------------------------------------------------------------

function Lamp({
  color,
  label,
  on,
  blink,
}: {
  color: string
  label: string
  on: boolean
  blink?: boolean
}) {
  return (
    <div className="flex items-center gap-1" style={{ fontSize: 9, color: '#4b4838', letterSpacing: 1 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: on ? color : '#5a5648',
          boxShadow: on ? `0 0 6px ${color}` : 'inset 0 0 2px #000',
          border: '1px solid rgba(0,0,0,0.45)',
          animation: blink ? 'svRec 0.7s steps(1,end) infinite' : undefined,
        }}
      />
      <span style={{ fontWeight: 'bold' }}>{label}</span>
    </div>
  )
}

function CabinetButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="active:[border-color:#6d6a5e_#efece2_#efece2_#6d6a5e]"
      style={{
        background: disabled ? '#bdb9ad' : primary ? '#d8cf9c' : '#cdc8ba',
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: disabled
          ? '#bdb9ad #bdb9ad #bdb9ad #bdb9ad'
          : '#efece2 #6d6a5e #6d6a5e #efece2',
        padding: '5px 12px',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        color: disabled ? '#8a8678' : '#2c2a1f',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: "'Courier New', monospace",
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}
