'use client'

import { useEffect, useRef, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { Database } from 'lucide-react'
import { CASE_001_SCHEMA } from './data'

// The core gameplay interface: a SQL IDE with a "CrimeOS Database Terminal"
// aesthetic. SQL execution / hints / submission are stubs for this phase —
// Ctrl+Enter surfaces a "not yet implemented" message and the status flips to
// ERROR so the wiring is visible without a real engine behind it.

const PHOSPHOR = '#7fbf7f'
const PHOSPHOR_BRIGHT = '#b8ff6a'
const PHOSPHOR_ERR = '#ff6b6b'
const EDITOR_BG = '#0d1117'
const RESULTS_BG = '#0a0f0a'

const INITIAL_DOC = '-- Query the evidence database\nSELECT * FROM employees;'

const READY_MESSAGE = `> Ready. Run a query with Ctrl+Enter.
>
> Connected to: case_001.db
> Tables: employees, break_room_log, muffin_inventory`

type Status = 'IDLE' | 'RUNNING' | 'ERROR'

export default function SqlTerminal() {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [showSchema, setShowSchema] = useState(false)
  const [status, setStatus] = useState<Status>('IDLE')
  // null → show the default ready message; otherwise the stub run output.
  const [ranOnce, setRanOnce] = useState(false)

  // Run stub. Keyed off a ref-less state setter so the CodeMirror keymap below
  // can call the latest version via a ref.
  const runQuery = useRef<() => void>(() => {})
  runQuery.current = () => {
    setStatus('ERROR')
    setRanOnce(true)
  }

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return
    const state = EditorState.create({
      doc: INITIAL_DOC,
      extensions: [
        lineNumbers(),
        sql(),
        oneDark,
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              runQuery.current()
              return true
            },
          },
          ...defaultKeymap,
        ]),
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px', background: EDITOR_BG },
          '.cm-scroller': { fontFamily: 'monospace', overflow: 'auto' },
          '.cm-gutters': { background: EDITOR_BG },
        }),
      ],
    })
    viewRef.current = new EditorView({ state, parent: editorRef.current })
    return () => {
      viewRef.current?.destroy()
      viewRef.current = null
    }
  }, [])

  return (
    <div
      className="flex h-full w-full flex-col font-mono"
      style={{ background: RESULTS_BG, color: PHOSPHOR }}
    >
      {/* Header bar */}
      <header
        className="flex h-8 shrink-0 items-center justify-between border-b px-3 text-[11px]"
        style={{ borderColor: 'rgba(127,191,127,0.2)', background: '#070b07' }}
      >
        <span className="flex items-center gap-1.5" style={{ color: PHOSPHOR_BRIGHT }}>
          <Database size={12} />
          CRIMEDB v1.0 — CASE #0001
        </span>
        <button
          type="button"
          onClick={() => setShowSchema((s) => !s)}
          className="rounded px-2 py-0.5 text-[10px] font-bold tracking-widest transition-colors hover:bg-white/5"
          style={{
            border: '1px solid rgba(127,191,127,0.3)',
            color: showSchema ? PHOSPHOR_BRIGHT : PHOSPHOR,
          }}
        >
          [SCHEMA]
        </button>
      </header>

      {/* Editor + Results + optional Schema panel */}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Editor pane */}
          <div className="flex min-h-0 flex-1 flex-col">
            <PaneLabel>SQL QUERY</PaneLabel>
            <div className="min-h-0 flex-1" style={{ background: EDITOR_BG }}>
              <div ref={editorRef} className="h-full w-full" />
            </div>
          </div>
          {/* Results pane */}
          <div
            className="flex min-h-0 flex-1 flex-col border-t"
            style={{ borderColor: 'rgba(127,191,127,0.2)' }}
          >
            <PaneLabel>RESULTS</PaneLabel>
            <pre
              className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap px-3 py-2 text-[12px] leading-relaxed no-scrollbar"
              style={{ background: RESULTS_BG }}
            >
              {ranOnce ? (
                <span style={{ color: '#ffb454' }}>
                  {'> SQL execution not yet implemented.'}
                </span>
              ) : (
                <span style={{ color: 'rgba(127,191,127,0.65)' }}>
                  {READY_MESSAGE}
                </span>
              )}
            </pre>
          </div>
        </div>

        {showSchema && <SchemaPanel />}
      </div>

      {/* Footer action bar */}
      <footer
        className="flex h-10 shrink-0 items-center justify-between border-t px-3"
        style={{ borderColor: 'rgba(127,191,127,0.2)', background: '#070b07' }}
      >
        <button
          type="button"
          onClick={() => alert('Hints coming soon')}
          className="rounded px-2.5 py-1 text-[11px] font-bold tracking-widest transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-window-border)' }}
        >
          [?] HINT
        </button>

        <StatusIndicator status={status} />

        <button
          type="button"
          onClick={() => alert('Submission coming soon')}
          className="rounded px-2.5 py-1 text-[11px] font-bold tracking-widest transition-colors"
          style={{
            color: PHOSPHOR_BRIGHT,
            border: `1px solid ${PHOSPHOR_BRIGHT}`,
            background: 'rgba(184,255,106,0.12)',
          }}
        >
          [✓] SUBMIT ANSWER
        </button>
      </footer>
    </div>
  )
}

function PaneLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="shrink-0 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
      style={{ color: PHOSPHOR, background: '#070b07' }}
    >
      {children}
    </div>
  )
}

function StatusIndicator({ status }: { status: Status }) {
  const color =
    status === 'ERROR'
      ? PHOSPHOR_ERR
      : status === 'RUNNING'
        ? '#ffb454'
        : PHOSPHOR
  return (
    <span
      className="text-[11px] font-bold tracking-[0.3em]"
      style={{ color }}
    >
      {status}
    </span>
  )
}

function SchemaPanel() {
  return (
    <aside
      className="w-[220px] shrink-0 overflow-y-auto border-l px-3 py-2 no-scrollbar"
      style={{ borderColor: 'rgba(127,191,127,0.2)', background: '#070b07' }}
    >
      <div
        className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ color: PHOSPHOR_BRIGHT }}
      >
        Schema
      </div>
      {CASE_001_SCHEMA.map((table) => (
        <div key={table.name} className="mb-3">
          <div className="text-[12px] font-bold" style={{ color: PHOSPHOR_BRIGHT }}>
            {table.name}
          </div>
          <ul className="mt-1 space-y-0.5">
            {table.columns.map((col) => (
              <li
                key={col.name}
                className="flex items-baseline justify-between text-[11px]"
              >
                <span style={{ color: PHOSPHOR }}>{col.name}</span>
                <span
                  className="text-[9px] uppercase"
                  style={{ color: 'rgba(127,191,127,0.4)' }}
                >
                  {col.type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  )
}
