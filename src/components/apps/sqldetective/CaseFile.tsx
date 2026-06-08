'use client'

import { useState } from 'react'
import { useCaseStore } from '@/store/useCaseStore'

// Evidence document viewer. Reads the live active case from useCaseStore.
// BRIEFING renders a scanned physical document (light paper, ruled lines, red
// case stamp — the one place in the OS that intentionally inverts to a light
// scheme); SCHEMA lists the case's evidence tables in the dark OS theme.

const PHOSPHOR = '#7fbf7f'
const PHOSPHOR_BRIGHT = '#b8ff6a'

type Tab = 'BRIEFING' | 'SCHEMA'

/** 'case-001' → '#0001' */
function caseNumber(id: string): string {
  const n = id.replace(/\D/g, '')
  return `#${n.padStart(4, '0')}`
}

export default function CaseFile() {
  const [tab, setTab] = useState<Tab>('BRIEFING')
  const activeCase = useCaseStore((s) => s.activeCase())

  if (!activeCase) {
    return (
      <div
        className="flex h-full w-full items-center justify-center font-mono text-[13px]"
        style={{ background: 'var(--color-window-bg)', color: PHOSPHOR }}
      >
        No active case. Open the Inbox to select a case.
      </div>
    )
  }

  const stamp = caseNumber(activeCase.id)

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: 'var(--color-window-bg)' }}
    >
      {/* Tab bar — OS glass style */}
      <div
        className="glass flex shrink-0 gap-1 px-3 py-2"
        style={{ borderBottom: '1px solid var(--color-window-border)' }}
      >
        {(['BRIEFING', 'SCHEMA'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="rounded px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors"
            style={{
              background: tab === t ? 'rgba(127,191,127,0.15)' : 'transparent',
              color: tab === t ? PHOSPHOR_BRIGHT : 'var(--color-text-secondary)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        {tab === 'BRIEFING' ? (
          <BriefingDoc briefing={activeCase.briefing} stamp={stamp} />
        ) : (
          <SchemaView
            stamp={stamp}
            tables={activeCase.schema.tables}
          />
        )}
      </div>
    </div>
  )
}

function BriefingDoc({ briefing, stamp }: { briefing: string; stamp: string }) {
  return (
    <div
      className="relative h-full overflow-y-auto px-10 py-10 no-scrollbar"
      style={{
        background: '#f5f0e8',
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.04) 24px, rgba(0,0,0,0.04) 25px)',
      }}
    >
      {/* Red case stamp */}
      <div
        className="pointer-events-none absolute right-8 top-8 select-none rounded border-2 px-3 py-1 font-mono text-lg font-extrabold tracking-widest"
        style={{
          color: '#b91c1c',
          borderColor: '#b91c1c',
          opacity: 0.8,
          transform: 'rotate(-5deg)',
        }}
      >
        CASE {stamp}
      </div>

      <pre
        className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed"
        style={{ color: '#1c1917' }}
      >
        {briefing}
      </pre>
    </div>
  )
}

function SchemaView({
  stamp,
  tables,
}: {
  stamp: string
  tables: Record<string, { columns: string[] }>
}) {
  return (
    <div
      className="h-full overflow-y-auto px-5 py-5 font-mono no-scrollbar"
      style={{ background: 'var(--color-window-bg)' }}
    >
      <h2
        className="mb-4 text-[12px] font-bold uppercase tracking-[0.2em]"
        style={{ color: PHOSPHOR_BRIGHT }}
      >
        Evidence Database — Case {stamp}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(tables).map(([name, def]) => (
          <div
            key={name}
            className="rounded-lg border p-3"
            style={{
              borderColor: 'var(--color-window-border)',
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            <div
              className="mb-2 text-[13px] font-bold"
              style={{ color: PHOSPHOR_BRIGHT }}
            >
              {name}
            </div>
            <ul className="space-y-1">
              {def.columns.map((col) => {
                const [colName, ...rest] = col.split(' ')
                return (
                  <li
                    key={col}
                    className="flex items-baseline justify-between text-[12px]"
                  >
                    <span style={{ color: PHOSPHOR }}>{colName}</span>
                    <span
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {rest.join(' ')}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
