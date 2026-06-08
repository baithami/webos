'use client'

import { useState } from 'react'
import { useWindowStore } from '@/store/useWindowStore'
import { CASES, CASE_001_BRIEFING, difficultyDots, type CaseSummary } from './data'

// Case selection screen styled like a 1990s police-department dispatch
// terminal. Left sidebar lists cases; right panel shows the selected briefing.
// Only Case #0001 is OPEN for the placeholder phase — later cases unlock as the
// game progresses.

const PHOSPHOR = '#7fbf7f'
const PHOSPHOR_BRIGHT = '#b8ff6a'

export default function Inbox() {
  const openApp = useWindowStore((s) => s.openApp)
  // Default to the first OPEN case (Case #0001).
  const [selected, setSelected] = useState(CASES[0].number)
  const active = CASES.find((c) => c.number === selected) ?? CASES[0]

  return (
    <div
      className="flex h-full w-full font-mono text-[13px]"
      style={{ background: 'var(--color-window-bg)', color: PHOSPHOR }}
    >
      {/* Sidebar */}
      <aside
        className="flex w-[260px] shrink-0 flex-col border-r"
        style={{ borderColor: 'var(--color-window-border)' }}
      >
        <div
          className="border-b px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ borderColor: 'var(--color-window-border)', color: PHOSPHOR_BRIGHT }}
        >
          Dispatch Inbox
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {CASES.map((c) => (
            <CaseRow
              key={c.number}
              caseItem={c}
              selected={c.number === selected}
              onSelect={() => c.status === 'OPEN' && setSelected(c.number)}
            />
          ))}
        </div>
        <div
          className="border-t px-4 py-2 text-[10px] uppercase tracking-widest opacity-40"
          style={{ borderColor: 'var(--color-window-border)' }}
        >
          {CASES.filter((c) => c.status === 'OPEN').length} active ·{' '}
          {CASES.filter((c) => c.status === 'LOCKED').length} locked
        </div>
      </aside>

      {/* Detail panel */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: 'var(--color-window-border)' }}
        >
          <div>
            <div className="text-[15px]" style={{ color: PHOSPHOR_BRIGHT }}>
              CASE #{active.number}
            </div>
            <div className="mt-0.5 text-[11px] uppercase tracking-widest opacity-70">
              {active.classification}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest opacity-50">
              Difficulty
            </div>
            <div className="text-base" style={{ color: PHOSPHOR_BRIGHT }}>
              {difficultyDots(active.difficulty)}
            </div>
          </div>
        </header>

        <pre
          className="flex-1 overflow-y-auto whitespace-pre-wrap px-6 py-5 text-[13px] leading-relaxed no-scrollbar"
          style={{ color: 'rgba(230, 240, 220, 0.88)' }}
        >
          {CASE_001_BRIEFING}
        </pre>

        <footer
          className="flex gap-3 border-t px-5 py-3"
          style={{ borderColor: 'var(--color-window-border)' }}
        >
          <ActionButton label="OPEN CASE FILE" onClick={() => openApp('casefile')} />
          <ActionButton
            label="OPEN TERMINAL"
            primary
            onClick={() => openApp('sql-terminal')}
          />
        </footer>
      </section>
    </div>
  )
}

function CaseRow({
  caseItem,
  selected,
  onSelect,
}: {
  caseItem: CaseSummary
  selected: boolean
  onSelect: () => void
}) {
  const locked = caseItem.status === 'LOCKED'
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={locked}
      className={`block w-full border-b px-4 py-3 text-left transition-colors ${
        locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white/5'
      }`}
      style={{
        borderColor: 'var(--color-window-border)',
        background: selected ? 'rgba(127, 191, 127, 0.12)' : 'transparent',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-bold"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: selected ? PHOSPHOR_BRIGHT : PHOSPHOR,
          }}
        >
          #{caseItem.number}
        </span>
        <StatusBadge status={caseItem.status} />
      </div>
      <div
        className="mt-1.5 text-[13px]"
        style={{ color: selected ? PHOSPHOR_BRIGHT : 'rgba(230,240,220,0.85)' }}
      >
        {caseItem.title}
      </div>
      <div className="mt-1 text-[12px] opacity-60">
        {difficultyDots(caseItem.difficulty)}
      </div>
    </button>
  )
}

function StatusBadge({ status }: { status: CaseSummary['status'] }) {
  const open = status === 'OPEN'
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
      style={{
        background: open ? 'rgba(40, 200, 64, 0.18)' : 'rgba(255,255,255,0.06)',
        color: open ? '#5fe070' : 'rgba(255,255,255,0.4)',
      }}
    >
      {status}
    </span>
  )
}

function ActionButton({
  label,
  onClick,
  primary,
}: {
  label: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors"
      style={{
        border: `1px solid ${primary ? PHOSPHOR_BRIGHT : 'var(--color-window-border)'}`,
        background: primary ? 'rgba(184, 255, 106, 0.12)' : 'transparent',
        color: primary ? PHOSPHOR_BRIGHT : PHOSPHOR,
      }}
    >
      {label}
    </button>
  )
}
