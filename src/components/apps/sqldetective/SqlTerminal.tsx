'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { useCaseStore } from '@/store/useCaseStore'
import { createCaseDb, executeQuery } from '@/lib/sqldetective/queryEngine'
import type { QueryOutcome } from '@/lib/sqldetective/types'

// The core gameplay interface. On mount (and whenever the active case changes)
// it builds that case's in-memory SQLite DB from dbSetupSQL, then runs the
// player's queries via executeQuery(). Submit validates the current result rows
// against the case solution. Hints reveal progressively. The CodeMirror editor
// is created once; Ctrl/Cmd+Enter calls the latest runQuery through a ref so the
// keymap closure never goes stale — no global document listener (which would
// leak into the rest of the OS).

type SqlDatabase = Awaited<ReturnType<typeof createCaseDb>>
type DbStatus = 'loading' | 'ready' | 'error'

export default function SqlTerminal() {
  const activeCase = useCaseStore((s) => s.activeCase())
  const completeCase = useCaseStore((s) => s.completeCase)
  const nextHint = useCaseStore((s) => s.nextHint)
  // Aliased off the `use*` name so eslint's rules-of-hooks doesn't mistake this
  // store action for a React Hook when called inside handleHint.
  const revealHint = useCaseStore((s) => s.useHint)

  const [dbStatus, setDbStatus] = useState<DbStatus>('loading')
  const [dbError, setDbError] = useState<string | null>(null)
  const dbRef = useRef<SqlDatabase | null>(null)

  const [outcome, setOutcome] = useState<QueryOutcome | null>(null)
  const [schemaOpen, setSchemaOpen] = useState(false)
  const [currentHint, setCurrentHint] = useState<string | null>(null)
  const [submitResult, setSubmitResult] = useState<'correct' | 'wrong' | null>(null)

  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  const caseId = activeCase?.id

  // (Re)build the database whenever the active case changes.
  useEffect(() => {
    if (!activeCase) return
    let cancelled = false
    setDbStatus('loading')
    setDbError(null)
    setOutcome(null)
    setSubmitResult(null)
    setCurrentHint(null)
    dbRef.current?.close()
    dbRef.current = null

    createCaseDb(activeCase.dbSetupSQL)
      .then((db) => {
        if (cancelled) {
          db.close()
          return
        }
        dbRef.current = db
        setDbStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setDbError(err instanceof Error ? err.message : String(err))
        setDbStatus('error')
      })

    return () => {
      cancelled = true
      dbRef.current?.close()
      dbRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  const getSql = useCallback((): string => {
    return viewRef.current?.state.doc.toString() ?? ''
  }, [])

  const runQuery = useCallback(() => {
    if (!dbRef.current || !activeCase || dbStatus !== 'ready') return
    const result = executeQuery(getSql(), dbRef.current, activeCase.schema)
    setOutcome(result)
    setSubmitResult(null)
  }, [activeCase, dbStatus, getSql])

  // Keep a ref to the latest runQuery so the (create-once) CodeMirror keymap
  // always calls the current version without re-instantiating the editor.
  const runQueryRef = useRef(runQuery)
  runQueryRef.current = runQuery

  // Initialize CodeMirror once.
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return

    const firstTable = activeCase
      ? Object.keys(activeCase.schema.tables)[0]
      : 'employees'

    const state = EditorState.create({
      doc: `-- Query the evidence database\nSELECT * FROM ${firstTable};`,
      extensions: [
        lineNumbers(),
        history(),
        sql(),
        oneDark,
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              runQueryRef.current()
              return true
            },
          },
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        EditorView.theme({
          '&': { height: '100%', fontSize: '13px', backgroundColor: '#0d1117' },
          '.cm-scroller': { fontFamily: "'Courier New', monospace", overflow: 'auto' },
          '.cm-content': { padding: '8px 0' },
          '.cm-gutters': { backgroundColor: '#0d1117', borderRight: '1px solid #2a4a2a' },
          '.cm-lineNumbers .cm-gutterElement': { color: '#4a7a4a' },
        }),
      ],
    })

    viewRef.current = new EditorView({ state, parent: editorRef.current })
    return () => {
      viewRef.current?.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = () => {
    if (!activeCase || outcome?.type !== 'success') return
    const correct = activeCase.solution.validate(outcome.result.rows)
    if (correct) {
      completeCase(activeCase.id)
      setSubmitResult('correct')
    } else {
      setSubmitResult('wrong')
    }
  }

  const handleHint = () => {
    if (!activeCase) return
    const hint = nextHint(activeCase.id)
    if (hint) {
      revealHint(activeCase.id)
      setCurrentHint(hint)
    }
  }

  if (!activeCase) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0f0a] font-mono text-[#4a7a4a]">
        No active case. Open the Inbox to select a case.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#0a0f0a] text-[#7fbf7f]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#2a4a2a] bg-[#0d1117] px-3 py-1.5 font-mono text-xs">
        <span className="text-[#b8ff6a]">
          CRIMEDB v1.0 — {activeCase.title.toUpperCase()}
        </span>
        <button
          onClick={() => setSchemaOpen((v) => !v)}
          className="rounded border border-[#2a4a2a] px-2 py-0.5 text-[#4a7a4a] hover:border-[#7fbf7f] hover:text-[#7fbf7f]"
        >
          [SCHEMA {schemaOpen ? '▲' : '▼'}]
        </button>
      </div>

      {/* Main area */}
      <div className="flex min-h-0 flex-1">
        {/* Editor + Results */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Editor */}
          <div className="flex min-h-0 flex-1 flex-col border-b border-[#2a4a2a]">
            <div className="flex shrink-0 items-center justify-between border-b border-[#1a2a1a] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[#4a7a4a]">
              <span>SQL QUERY — Ctrl+Enter to run</span>
              <button
                onClick={runQuery}
                disabled={dbStatus !== 'ready'}
                className="rounded border border-[#2a6a2a] px-2 py-0.5 text-[10px] font-bold tracking-widest text-[#b8ff6a] hover:bg-[#162016] disabled:cursor-not-allowed disabled:border-[#2a4a2a] disabled:text-[#2a5a2a]"
              >
                ▶ RUN
              </button>
            </div>
            <div ref={editorRef} className="min-h-0 flex-1 overflow-hidden" />
          </div>

          {/* Results */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-[#1a2a1a] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[#4a7a4a]">
              RESULTS
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-[13px]">
              {dbStatus === 'loading' && (
                <span className="text-[#4a7a4a]">
                  {'>'} Initializing database engine...
                </span>
              )}
              {dbStatus === 'error' && (
                <span className="text-[#ff6b6b]">
                  {'>'} Failed to initialize: {dbError}
                </span>
              )}
              {dbStatus === 'ready' && !outcome && (
                <div className="space-y-1 text-[#4a7a4a]">
                  <div>{'>'} Ready. Run a query with Ctrl+Enter.</div>
                  <div>{'>'}</div>
                  <div>{'>'} Connected to: {activeCase.id}.db</div>
                  <div>
                    {'>'} Tables: {Object.keys(activeCase.schema.tables).join(', ')}
                  </div>
                </div>
              )}
              {outcome?.type === 'empty' && (
                <span className="text-[#ffcc6b]">{'>'} {outcome.message}</span>
              )}
              {outcome?.type === 'error' && (
                <div className="space-y-2">
                  <div className="text-[#ff6b6b]">⚠ {outcome.message}</div>
                  {outcome.rawError && (
                    <details className="text-[#4a7a4a]">
                      <summary className="cursor-pointer text-[11px] hover:text-[#7fbf7f]">
                        ▸ Show raw error
                      </summary>
                      <pre className="mt-1 text-[11px]">{outcome.rawError}</pre>
                    </details>
                  )}
                </div>
              )}
              {outcome?.type === 'success' && (
                <div className="overflow-auto">
                  <table className="w-full border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-[#162016]">
                        {outcome.result.columns.map((col) => (
                          <th
                            key={col}
                            className="border border-[#2a4a2a] px-3 py-1 text-left font-mono text-[#b8ff6a]"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {outcome.result.rows.slice(0, 100).map((row, i) => (
                        <tr
                          key={i}
                          className={i % 2 === 0 ? 'bg-transparent' : 'bg-[#0d150d]'}
                        >
                          {outcome.result.columns.map((col) => (
                            <td
                              key={col}
                              className="border border-[#1a2a1a] px-3 py-1 text-[#7fbf7f]"
                            >
                              {String(row[col] ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-2 text-[11px] text-[#4a7a4a]">
                    {outcome.result.rowCount} row
                    {outcome.result.rowCount !== 1 ? 's' : ''} returned
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schema panel */}
        {schemaOpen && (
          <div className="w-52 shrink-0 overflow-auto border-l border-[#2a4a2a] bg-[#0d1117] p-3 font-mono text-[11px]">
            <div className="mb-2 text-[10px] uppercase tracking-widest text-[#b8ff6a]">
              Schema
            </div>
            {Object.entries(activeCase.schema.tables).map(([table, def]) => (
              <div key={table} className="mb-3">
                <div className="mb-1 text-[#7fbf7f]">{table}</div>
                {def.columns.map((col) => (
                  <div key={col} className="pl-2 text-[#4a7a4a]">
                    {col}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hint callout */}
      {currentHint && (
        <div className="shrink-0 border-t border-[#2a4a2a] bg-[#0d150d] px-4 py-2 font-mono text-[12px] text-[#ffcc6b]">
          <span className="text-[#b8ff6a]">HINT: </span>
          {currentHint}
          <button
            onClick={() => setCurrentHint(null)}
            className="ml-3 text-[#4a7a4a] hover:text-[#7fbf7f]"
          >
            [dismiss]
          </button>
        </div>
      )}

      {/* Submit result message */}
      {submitResult === 'wrong' && (
        <div className="shrink-0 border-t border-[#2a4a2a] bg-[#1a0a0a] px-4 py-2 font-mono text-[12px] text-[#ff6b6b]">
          That&apos;s not the answer. The suspect is still out there.
        </div>
      )}
      {submitResult === 'correct' && (
        <div className="shrink-0 border-t border-[#2a6a2a] bg-[#0a1a0a] px-4 py-2 font-mono text-[12px] text-[#6bffb8]">
          ✓ CASE CLOSED. That&apos;s the one. +100 XP
        </div>
      )}

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-[#2a4a2a] bg-[#0d1117] px-3 py-1.5">
        <button
          onClick={handleHint}
          className="rounded border border-[#2a4a2a] px-3 py-1 font-mono text-[11px] text-[#4a7a4a] hover:border-[#7fbf7f] hover:text-[#7fbf7f]"
        >
          [?] HINT
        </button>
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#2a5a2a]">
          {dbStatus === 'loading' ? 'LOADING' : dbStatus === 'error' ? 'ERROR' : 'READY'}
        </span>
        <button
          onClick={handleSubmit}
          disabled={outcome?.type !== 'success'}
          className="rounded border border-[#b8ff6a] px-3 py-1 font-mono text-[11px] text-[#b8ff6a] hover:bg-[#162016] disabled:cursor-not-allowed disabled:border-[#2a4a2a] disabled:text-[#2a5a2a]"
        >
          [✓] SUBMIT ANSWER
        </button>
      </div>
    </div>
  )
}
