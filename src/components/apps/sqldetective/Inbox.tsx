'use client'

import { useState } from 'react'
import { useWindowStore } from '@/store/useWindowStore'
import { useCaseStore } from '@/store/useCaseStore'
import { createCaseDesktopIcon } from '@/lib/sqldetective/desktopIcon'
import { CASES } from '@/lib/sqldetective/cases'
import type { GameCase } from '@/lib/sqldetective/types'

// The Inbox is the player's email client: each case arrives as a dispatch email
// from the Municipal Database Division. Unread (un-opened, unlocked) cases are
// bold with a green dot; opening one marks it read, sets it active, and — the
// first time — drops a folder for the case onto the desktop (see desktopIcon.ts).
// Modeled on Messages.tsx but read-only and game-aware via useCaseStore.

const DISPATCH_INITIALS = 'DS'

/** 'case-001' → '#0001' */
function caseNumber(id: string): string {
  const n = id.replace(/\D/g, '')
  return `#${n.padStart(4, '0')}`
}

/** Subject line shown in the list and reader, e.g. "Case #0001 — The Missing Muffin". */
function subjectOf(c: GameCase): string {
  return `Case ${caseNumber(c.id)} — ${c.title}`
}

/** ~60-char preview pulled from the start of the briefing. */
function previewOf(c: GameCase): string {
  const flat = c.briefing.replace(/\s+/g, ' ').trim()
  return flat.length > 60 ? flat.slice(0, 60).trimEnd() + '…' : flat
}

// Fixed per-case email metadata (purely cosmetic).
const TIMES = ['9:07 AM', '9:14 AM', '9:22 AM']
const DATES = ['May 20, 2026', 'May 20, 2026', 'May 20, 2026']

export default function Inbox() {
  const activeCaseId = useCaseStore((s) => s.activeCaseId)
  const completedCases = useCaseStore((s) => s.completedCases)
  const openedCases = useCaseStore((s) => s.openedCases)
  const desktopIconsCreated = useCaseStore((s) => s.desktopIconsCreated)
  const isLocked = useCaseStore((s) => s.isLocked)
  const setActiveCase = useCaseStore((s) => s.setActiveCase)
  const openCase = useCaseStore((s) => s.openCase)

  // Which email is shown in the reader. Defaults to the active case so the
  // panel isn't empty when the app is reopened on an in-progress case.
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = selectedId
    ? CASES.find((c) => c.id === selectedId) ?? null
    : null

  const handleRowClick = (c: GameCase) => {
    setSelectedId(c.id)
    if (isLocked(c.id)) return // locked: just show the locked message in the reader

    const firstOpen = !openedCases.includes(c.id)
    openCase(c.id)
    setActiveCase(c.id)
    if (firstOpen && !desktopIconsCreated.includes(c.id)) {
      createCaseDesktopIcon(c)
    }
  }

  return (
    <div className="flex h-full w-full bg-[var(--color-window-bg)]">
      {/* Left — email list */}
      <aside className="flex h-full w-80 shrink-0 flex-col border-r border-[var(--color-window-border)] bg-[var(--color-sidebar-bg)]">
        <div className="shrink-0 px-4 pb-3 pt-4">
          <div className="text-[16px] font-semibold text-[var(--color-text-primary)]">
            Dispatch Inbox
          </div>
          <div className="text-[12px] text-[var(--color-text-secondary)]">
            Municipal Database Division
          </div>
        </div>
        <div className="h-px shrink-0 bg-[var(--color-window-border)]" />

        <div className="min-h-0 flex-1 overflow-auto">
          {CASES.map((c, i) => (
            <EmailRow
              key={c.id}
              caseItem={c}
              time={TIMES[i] ?? ''}
              locked={isLocked(c.id)}
              opened={openedCases.includes(c.id)}
              completed={completedCases.includes(c.id)}
              selected={selectedId === c.id}
              onClick={() => handleRowClick(c)}
            />
          ))}
        </div>
      </aside>

      {/* Right — email reader */}
      <section className="flex min-w-0 flex-1 flex-col bg-[var(--color-window-bg)]">
        {selected == null ? (
          <Placeholder>
            Select a case from your inbox
            <br />
            to begin the investigation.
          </Placeholder>
        ) : isLocked(selected.id) ? (
          <Placeholder>
            This case is locked.
            <br />
            Complete the previous case to unlock it.
          </Placeholder>
        ) : (
          <EmailReader caseItem={selected} />
        )}
      </section>
    </div>
  )
}

function EmailRow({
  caseItem,
  time,
  locked,
  opened,
  completed,
  selected,
  onClick,
}: {
  caseItem: GameCase
  time: string
  locked: boolean
  opened: boolean
  completed: boolean
  selected: boolean
  onClick: () => void
}) {
  const unread = !locked && !opened
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={subjectOf(caseItem)}
      className={`flex w-full items-start gap-3 border-b border-[var(--color-window-border)] px-3 py-3 text-left transition-colors ${
        locked
          ? 'cursor-default opacity-40'
          : selected
            ? 'bg-[var(--color-sidebar-active)]'
            : 'hover:bg-white/5'
      }`}
    >
      {/* Left edge: unread dot / lock */}
      <div className="flex w-3 shrink-0 justify-center pt-3.5">
        {locked ? (
          <span className="text-[11px] leading-none">🔒</span>
        ) : unread ? (
          <span className="h-2 w-2 rounded-full bg-[#5fe070]" />
        ) : null}
      </div>

      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1d4a1d] text-[13px] font-semibold text-[#7fbf7f]">
        {DISPATCH_INITIALS}
      </div>

      {/* Sender / subject / preview */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate text-[14px] text-[var(--color-text-primary)] ${
              unread ? 'font-bold' : 'font-normal'
            }`}
          >
            Dispatch
          </span>
          <span className="shrink-0 text-[11px] text-[var(--color-text-tertiary)]">
            {time}
          </span>
        </div>
        <div
          className={`truncate text-[13px] text-[var(--color-text-primary)] ${
            unread ? 'font-bold' : 'font-normal'
          }`}
        >
          {subjectOf(caseItem)}
        </div>
        <div className="flex items-center gap-2">
          <span className="truncate text-[12px] text-[var(--color-text-secondary)]">
            {previewOf(caseItem)}
          </span>
          {completed && (
            <span className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-[#6bffb8]">
              ✓ CLOSED
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function EmailReader({ caseItem }: { caseItem: GameCase }) {
  const openApp = useWindowStore.getState().openApp
  const idx = CASES.findIndex((c) => c.id === caseItem.id)
  const date = DATES[idx] ?? 'May 20, 2026'
  const time = TIMES[idx] ?? '9:07 AM'

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--color-window-border)] px-6 py-4 font-mono text-[12px] text-[var(--color-text-secondary)]">
        <HeaderLine label="FROM" value="Dispatch <dispatch@citypd.gov>" />
        <HeaderLine label="TO" value="Detective [You]" />
        <HeaderLine label="SUBJECT" value={subjectOf(caseItem)} />
        <HeaderLine label="DATE" value={`${date}, ${time}`} />
        <div className="my-2 border-t border-[var(--color-window-border)]" />
        <span className="inline-block rounded bg-[#3a2c0e] px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#e0b020]">
          CLASSIFICATION: {caseItem.classification}
        </span>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto bg-[var(--color-window-bg)] px-6 py-5">
        <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-[var(--color-text-primary)]">
          {caseItem.briefing}
        </pre>
      </div>

      {/* Action bar */}
      <div className="flex shrink-0 gap-3 border-t border-[var(--color-window-border)] px-6 py-3">
        <ReaderButton label="Open Case File" onClick={() => openApp('casefile')} />
        <ReaderButton
          label="Open SQL Terminal"
          primary
          onClick={() => openApp('sql-terminal')}
        />
      </div>
    </div>
  )
}

function HeaderLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-16 shrink-0 text-[var(--color-text-tertiary)]">
        {label}:
      </span>
      <span className="text-[var(--color-text-primary)]">{value}</span>
    </div>
  )
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
      <p>{children}</p>
    </div>
  )
}

function ReaderButton({
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
      className="rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors"
      style={
        primary
          ? { background: 'var(--color-accent)', color: '#fff' }
          : {
              border: '1px solid var(--color-window-border)',
              color: 'var(--color-accent)',
            }
      }
    >
      {label}
    </button>
  )
}
