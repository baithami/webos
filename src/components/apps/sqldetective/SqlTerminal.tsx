'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
import { sql } from '@codemirror/lang-sql'
import { useCaseStore } from '@/store/useCaseStore'
import { createCaseDb, executeQuery } from '@/lib/sqldetective/queryEngine'
import { checkAnswer } from '@/lib/sqldetective/answer'
import type { QueryOutcome } from '@/lib/sqldetective/types'
import { win95LightTheme, win95SqlSyntax } from './win95Theme'

// The core gameplay interface. On mount (and whenever the active case changes)
// it builds that case's in-memory SQLite DB from dbSetupSQL, then runs the
// player's queries via executeQuery(). Submit validates the current result rows
// against the case solution. Hints reveal progressively. The CodeMirror editor
// is created once; Ctrl/Cmd+Enter calls the latest runQuery through a ref so the
// keymap closure never goes stale — no global document listener (which would
// leak into the rest of the OS).

type SqlDatabase = Awaited<ReturnType<typeof createCaseDb>>
type DbStatus = 'loading' | 'ready' | 'error'

// Classic Win95 raised button; border flips to sunken while pressed.
const win95Btn =
  'shrink-0 cursor-default select-none border-2 bg-[#c0c0c0] px-3 py-0.5 text-[12px] text-black ' +
  '[border-color:#ffffff_#404040_#404040_#ffffff] ' +
  'active:[border-color:#404040_#ffffff_#ffffff_#404040] ' +
  'disabled:text-[#808080]'

export default function SqlTerminal() {
  const activeCase = useCaseStore((s) => s.activeCase())
  const completeCase = useCaseStore((s) => s.completeCase)
  const nextHint = useCaseStore((s) => s.nextHint)
  // Aliased off the `use*` name so eslint's rules-of-hooks doesn't mistake this
  // store action for a React Hook when called inside handleHint.
  const revealHint = useCaseStore((s) => s.useHint)
  // Highest hint index revealed for the active case (-1 = none) — drives the
  // "HINT [n/3]" label on the callout.
  const hintIdx = useCaseStore((s) =>
    activeCase ? (s.hintsUsed[activeCase.id] ?? -1) : -1,
  )

  const [dbStatus, setDbStatus] = useState<DbStatus>('loading')
  const [dbError, setDbError] = useState<string | null>(null)
  const dbRef = useRef<SqlDatabase | null>(null)

  const [outcome, setOutcome] = useState<QueryOutcome | null>(null)
  const [schemaOpen, setSchemaOpen] = useState(false)
  const [currentHint, setCurrentHint] = useState<string | null>(null)
  const [submitResult, setSubmitResult] = useState<'correct' | 'wrong' | null>(null)
  // Set once the player runs a successful query — the accusation can only be made
  // after they've actually investigated.
  const [hasRunSuccess, setHasRunSuccess] = useState(false)
  // The accusation bar: open state + the name the player is typing.
  const [accusing, setAccusing] = useState(false)
  const [accusation, setAccusation] = useState('')

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
    setHasRunSuccess(false)
    setAccusing(false)
    setAccusation('')
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
    if (result.type === 'success') setHasRunSuccess(true)
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
        win95LightTheme,
        win95SqlSyntax,
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
      ],
    })

    viewRef.current = new EditorView({ state, parent: editorRef.current })
    return () => {
      viewRef.current?.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAccuse = () => {
    if (!activeCase) return
    const correct = checkAnswer(accusation, activeCase.solution)
    if (correct) {
      completeCase(activeCase.id)
      setSubmitResult('correct')
      setAccusing(false)
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
      <div
        className="flex h-full items-center justify-center bg-[#c0c0c0] text-[#444444]"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        No active case. Open the Inbox to select a case.
      </div>
    )
  }

  return (
    <div
      className="relative flex h-full flex-col bg-[#c0c0c0] text-black"
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      {/* Case header bar */}
      <div className="flex shrink-0 items-center justify-between border-b-2 border-[#808080] bg-[#c0c0c0] px-2.5 py-1 text-[13px] font-bold text-black">
        <span>
          CRIMEDB v1.0 — {activeCase.title.toUpperCase()}
        </span>
        <button onClick={() => setSchemaOpen((v) => !v)} className={win95Btn}>
          [SCHEMA {schemaOpen ? '▲' : '▼'}]
        </button>
      </div>

      {/* Main area */}
      <div className="flex min-h-0 flex-1">
        {/* Editor + Results */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Editor */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-[30px] shrink-0 items-center justify-between border-b border-[#808080] bg-[#c0c0c0] px-2 text-[11px] uppercase tracking-widest text-[#444444]">
              <span>SQL QUERY — Ctrl+Enter to run</span>
              <button
                onClick={runQuery}
                disabled={dbStatus !== 'ready'}
                className={`${win95Btn} font-bold tracking-widest`}
              >
                ▶ RUN
              </button>
            </div>
            <div ref={editorRef} className="min-h-0 flex-1 overflow-hidden" />
          </div>

          {/* Results */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-t-2 border-[#808080] bg-[#c0c0c0] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em] text-black">
              RESULTS
            </div>
            <div className="min-h-0 flex-1 overflow-auto border-2 [border-color:#808080_#ffffff_#ffffff_#808080] bg-white px-2.5 py-2 text-[13px] text-black">
              {dbStatus === 'loading' && (
                <span>
                  <span className="text-[#000080]">{'>'}</span> Initializing
                  database engine...
                </span>
              )}
              {dbStatus === 'error' && (
                <span className="text-[#cc0000]">
                  ⚠ Failed to initialize: {dbError}
                </span>
              )}
              {dbStatus === 'ready' && !outcome && (
                <div className="space-y-1">
                  <div>
                    <span className="text-[#000080]">{'>'}</span> Ready. Run a
                    query with Ctrl+Enter.
                  </div>
                  <div className="text-[#000080]">{'>'}</div>
                  <div>
                    <span className="text-[#000080]">{'>'}</span> Connected to:{' '}
                    {activeCase.id}.db
                  </div>
                  <div>
                    <span className="text-[#000080]">{'>'}</span> Tables:{' '}
                    {Object.keys(activeCase.schema.tables).join(', ')}
                  </div>
                </div>
              )}
              {outcome?.type === 'empty' && (
                <span className="italic text-[#808080]">
                  {'>'} {outcome.message}
                </span>
              )}
              {outcome?.type === 'error' && (
                <div className="my-1 space-y-2 border-2 border-[#c04000] bg-[#fff8f0] px-3 py-2 text-[12px]">
                  <div className="text-black">
                    <span className="text-[#c04000]">⚠ </span>
                    {outcome.message}
                  </div>
                  {outcome.rawError && (
                    <details className="text-[#808080]">
                      <summary className="cursor-pointer text-[11px] hover:text-black">
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
                      <tr className="bg-[#000080] text-white">
                        {outcome.result.columns.map((col) => (
                          <th
                            key={col}
                            className="border-r border-[#4040a0] px-2.5 py-[3px] text-left font-bold"
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
                          className={`hover:bg-[#dde8ff] ${
                            i % 2 === 0 ? 'bg-white' : 'bg-[#f0f0f8]'
                          }`}
                        >
                          {outcome.result.columns.map((col) => (
                            <td
                              key={col}
                              className="border-b border-[#e0e0e8] px-2.5 py-0.5 text-black"
                            >
                              {String(row[col] ?? 'NULL')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-2 text-[11px] text-[#808080]">
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
          <div className="w-52 shrink-0 overflow-auto border-l-2 border-[#808080] bg-[#c0c0c0] p-3 text-[11px]">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#000080]">
              Schema
            </div>
            {Object.entries(activeCase.schema.tables).map(([table, def]) => (
              <div key={table} className="mb-3">
                <div className="mb-1 font-bold text-black">{table}</div>
                {def.columns.map((col) => (
                  <div key={col} className="pl-2 text-[#444444]">
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
        <div className="shrink-0 border-2 border-[#808080] bg-[#fffff0] px-3 py-2 text-[12px] text-black">
          <span className="font-bold text-[#000080]">
            💡 HINT [{Math.min(hintIdx + 1, 3)}/3]:{' '}
          </span>
          {currentHint}
          <button
            onClick={() => setCurrentHint(null)}
            className="ml-3 text-[#808080] hover:text-black"
          >
            [dismiss]
          </button>
        </div>
      )}

      {/* Accusation bar — type the suspect's name to submit your answer. */}
      {accusing && (
        <div className="flex shrink-0 items-center gap-2 border-t-2 border-[#808080] bg-[#c0c0c0] px-3 py-1.5 text-[12px]">
          <span className="shrink-0 font-bold text-[#000080]">
            {activeCase.solution.prompt}
          </span>
          <input
            autoFocus
            value={accusation}
            onChange={(e) => setAccusation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAccuse()
              if (e.key === 'Escape') setAccusing(false)
            }}
            placeholder="Name the suspect…"
            className="min-w-0 flex-1 border-2 [border-color:#808080_#ffffff_#ffffff_#808080] bg-white px-2 py-0.5 text-black placeholder:text-[#808080] focus:outline-none"
            style={{ fontFamily: "'Courier New', monospace" }}
          />
          <button
            onClick={handleAccuse}
            disabled={!accusation.trim()}
            className={`${win95Btn} font-bold`}
          >
            CONFIRM
          </button>
          <button
            onClick={() => setAccusing(false)}
            className="shrink-0 text-[#808080] hover:text-black"
          >
            [cancel]
          </button>
        </div>
      )}

      {/* Submit result — wrong answer message */}
      {submitResult === 'wrong' && (
        <div className="shrink-0 border-t-2 border-[#808080] bg-[#c0c0c0] px-3 py-1.5 text-[12px] text-[#cc0000]">
          ⚠ That&apos;s not the answer. The suspect is still out there.
        </div>
      )}

      {/* Submit result — Win95 "CASE CLOSED" dialog */}
      {submitResult === 'correct' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="w-[320px] bg-[#c0c0c0]"
            style={{
              borderStyle: 'solid',
              borderWidth: 3,
              borderColor: '#ffffff #404040 #404040 #ffffff',
              boxShadow: '4px 4px 0 #000000',
            }}
          >
            <div
              className="px-2 py-1 text-[12px] font-bold text-white"
              style={{
                background: 'linear-gradient(90deg, #000080, #1084d0)',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              CRIMEDB
            </div>
            <div className="p-5 text-center text-[13px] text-black">
              <div className="mb-3 text-[16px] font-bold text-[#000080]">
                CASE CLOSED
              </div>
              <div>That&apos;s the one. +100 XP</div>
              <button
                onClick={() => setSubmitResult(null)}
                className={`${win95Btn} mt-4 min-w-[80px] font-bold`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t-2 border-[#808080] bg-[#c0c0c0] px-2 py-1">
        <button onClick={handleHint} className={win95Btn}>
          [?] HINT
        </button>
        <span
          className={`text-[12px] uppercase tracking-widest ${
            dbStatus === 'error' ? 'text-[#cc0000]' : 'text-[#444444]'
          }`}
        >
          {dbStatus === 'loading' ? 'LOADING' : dbStatus === 'error' ? 'ERROR' : 'READY'}
        </span>
        <button
          onClick={() => {
            setAccusing((v) => !v)
            setSubmitResult(null)
          }}
          disabled={!hasRunSuccess}
          title={hasRunSuccess ? undefined : 'Run a query to investigate first'}
          className={`${win95Btn} font-bold`}
        >
          [✓] SUBMIT ANSWER
        </button>
      </div>
    </div>
  )
}
