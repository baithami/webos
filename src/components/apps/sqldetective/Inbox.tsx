'use client'

import { useWindowStore } from '@/store/useWindowStore'
import { useCaseStore } from '@/store/useCaseStore'
import { CASES } from '@/lib/sqldetective/cases'
import { difficultyDots } from './data'
import type { GameCase } from '@/lib/sqldetective/types'

// Case selection screen styled like a 1990s police-department dispatch
// terminal. Reads live game state from useCaseStore: lock state cascades from
// completion, solved cases show a CLOSED badge, and selecting an unlocked case
// sets it active and opens both the Case File and SQL Terminal.

const PHOSPHOR = '#7fbf7f'
const PHOSPHOR_BRIGHT = '#b8ff6a'

export default function Inbox() {
  const openApp = useWindowStore((s) => s.openApp)
  const activeCaseId = useCaseStore((s) => s.activeCaseId)
  const completedCases = useCaseStore((s) => s.completedCases)
  const isLocked = useCaseStore((s) => s.isLocked)
  const setActiveCase = useCaseStore((s) => s.setActiveCase)

  const active = CASES.find((c) => c.id === activeCaseId) ?? CASES[0]

  const openCase = (id: string) => {
    if (isLocked(id)) return
    setActiveCase(id)
  }

  const launch = (id: string, app: 'casefile' | 'sql-terminal') => {
    setActiveCase(id)
    openApp(app)
  }

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
              key={c.id}
              caseItem={c}
              locked={isLocked(c.id)}
              completed={completedCases.includes(c.id)}
              selected={c.id === active.id}
              onSelect={() => openCase(c.id)}
            />
          ))}
        </div>
        <div
          className="border-t px-4 py-2 text-[10px] uppercase tracking-widest opacity-40"
          style={{ borderColor: 'var(--color-window-border)' }}
        >
          {completedCases.length} closed · {CASES.length} total
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
              {caseNumber(active.id)} — {active.title}
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
          {active.briefing}
        </pre>

        <footer
          className="flex gap-3 border-t px-5 py-3"
          style={{ borderColor: 'var(--color-window-border)' }}
        >
          <ActionButton
            label="OPEN CASE FILE"
            onClick={() => launch(active.id, 'casefile')}
          />
          <ActionButton
            label="OPEN TERMINAL"
            primary
            onClick={() => launch(active.id, 'sql-terminal')}
          />
        </footer>
      </section>
    </div>
  )
}

/** 'case-001' → '#0001' */
function caseNumber(id: string): string {
  const n = id.replace(/\D/g, '')
  return `#${n.padStart(4, '0')}`
}

function CaseRow({
  caseItem,
  locked,
  completed,
  selected,
  onSelect,
}: {
  caseItem: GameCase
  locked: boolean
  completed: boolean
  selected: boolean
  onSelect: () => void
}) {
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
          {caseNumber(caseItem.id)}
        </span>
        <StatusBadge locked={locked} completed={completed} />
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

function StatusBadge({ locked, completed }: { locked: boolean; completed: boolean }) {
  const label = completed ? 'CLOSED' : locked ? 'LOCKED' : 'OPEN'
  const colors = completed
    ? { bg: 'rgba(107, 255, 184, 0.16)', fg: '#6bffb8' }
    : locked
      ? { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.4)' }
      : { bg: 'rgba(40, 200, 64, 0.18)', fg: '#5fe070' }
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
      style={{ background: colors.bg, color: colors.fg }}
    >
      {label}
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
