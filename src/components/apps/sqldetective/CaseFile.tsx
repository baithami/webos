'use client'

import { useEffect, useState } from 'react'
import { useCaseStore } from '@/store/useCaseStore'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { createCaseBriefingFile } from '@/lib/sqldetective/desktopIcon'

// Evidence document viewer. Reads the live active case from useCaseStore.
// BRIEFING renders the case file as a clean printed report (white page, black
// monospace, sunken Win95 inset). SCHEMA lists the evidence tables as Win95
// panels with navy header rows. Also seeds the case briefing as a desktop
// .txt the first time a case becomes active (see desktopIcon.ts).

type Tab = 'BRIEFING' | 'SCHEMA'

/** 'case-001' → '#0001' */
function caseNumber(id: string): string {
  const n = id.replace(/\D/g, '')
  return `#${n.padStart(4, '0')}`
}

export default function CaseFile() {
  const [tab, setTab] = useState<Tab>('BRIEFING')
  const activeCase = useCaseStore((s) => s.activeCase())
  // Re-run seeding once the Desktop folder has hydrated from the server, so a
  // case that's already active on first load still gets its briefing file.
  const desktopReady = useFileSystemStore((s) => Boolean(s.nodes['desktop']))

  useEffect(() => {
    if (activeCase && desktopReady) createCaseBriefingFile(activeCase)
  }, [activeCase, desktopReady])

  if (!activeCase) {
    return (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{
          background: '#c0c0c0',
          color: '#000000',
          fontFamily: "'Courier New', monospace",
          fontSize: 13,
        }}
      >
        No active case. Open the Inbox to select a case.
      </div>
    )
  }

  const stamp = caseNumber(activeCase.id)

  return (
    <div className="flex h-full w-full flex-col" style={{ background: '#c0c0c0' }}>
      {/* Win95 tab bar — active tab raised, bold, connected to the content. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 2,
          padding: '4px 6px 0',
          background: '#c0c0c0',
          borderBottom: '2px solid #808080',
        }}
      >
        {(['BRIEFING', 'SCHEMA'] as Tab[]).map((t) => {
          const active = tab === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                background: active ? '#c0c0c0' : '#a0a0a0',
                border: '2px solid',
                borderColor: '#ffffff #808080 transparent #ffffff',
                borderBottom: 'none',
                padding: active ? '4px 14px 5px' : '3px 14px',
                fontSize: 12,
                fontFamily: 'Arial, sans-serif',
                fontWeight: active ? 'bold' : 'normal',
                color: '#000000',
                cursor: 'default',
                marginBottom: -2,
                position: active ? 'relative' : 'static',
                zIndex: active ? 1 : 'auto',
              }}
            >
              {t}
            </button>
          )
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {tab === 'BRIEFING' ? (
          <BriefingDoc briefing={activeCase.briefing} />
        ) : (
          <SchemaView stamp={stamp} tables={activeCase.schema.tables} />
        )}
      </div>
    </div>
  )
}

function BriefingDoc({ briefing }: { briefing: string }) {
  return (
    <div
      className="no-scrollbar"
      style={{
        flex: 1,
        overflowY: 'auto',
        background: '#ffffff',
        padding: '16px 20px',
        border: '2px solid',
        borderColor: '#808080 #ffffff #ffffff #808080', // sunken inset
        margin: '0 6px 6px',
        fontFamily: "'Courier New', monospace",
        fontSize: 13,
        lineHeight: 1.7,
        color: '#000000',
        whiteSpace: 'pre-wrap',
      }}
    >
      {briefing}
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: 12,
          fontWeight: 'bold',
          color: '#000000',
          letterSpacing: '0.08em',
          padding: '8px 10px 6px',
          borderBottom: '1px solid #808080',
          background: '#c0c0c0',
        }}
      >
        EVIDENCE DATABASE — CASE {stamp}
      </div>
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          padding: 10,
          background: '#c0c0c0',
          overflowY: 'auto',
          flex: 1,
          alignContent: 'flex-start',
        }}
      >
        {Object.entries(tables).map(([name, def]) => (
          <div
            key={name}
            style={{
              background: '#ffffff',
              border: '2px solid',
              borderColor: '#808080 #ffffff #ffffff #808080', // sunken inset
              padding: 0,
              borderRadius: 0,
              overflow: 'hidden',
              minWidth: 180,
              flex: '1 1 180px',
            }}
          >
            {/* Table name — navy header row */}
            <div
              style={{
                background: '#000080',
                color: '#ffffff',
                fontFamily: "'Courier New', monospace",
                fontSize: 12,
                fontWeight: 'bold',
                padding: '4px 10px',
                letterSpacing: '0.05em',
              }}
            >
              {name}
            </div>
            {/* Columns */}
            <div style={{ padding: '4px 0' }}>
              {def.columns.map((col) => {
                const [colName, ...rest] = col.split(' ')
                return (
                  <div
                    key={col}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e8e8ff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '2px 10px',
                      fontFamily: "'Courier New', monospace",
                      fontSize: 11,
                      borderBottom: '1px solid #e8e8e8',
                    }}
                  >
                    <span style={{ color: '#000000', fontWeight: 'normal' }}>
                      {colName}
                    </span>
                    <span
                      style={{
                        color: '#808080',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {rest.join(' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
