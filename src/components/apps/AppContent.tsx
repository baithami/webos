'use client'

import { Component, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { getApp } from '@/lib/apps'

/** Spinner shown while an app's chunk loads. */
function AppLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--color-window-bg)]">
      <Loader2
        size={26}
        className="animate-spin text-[var(--color-text-tertiary)]"
      />
    </div>
  )
}

// Each app is code-split via next/dynamic so its bundle only loads when the app
// is first opened. ssr:false is correct — these are client-only and never part
// of the initial desktop render.
const dyn = (loader: Parameters<typeof dynamic>[0]) =>
  dynamic(loader, { loading: AppLoading, ssr: false })

const CONTENT: Record<string, React.ComponentType> = {
  finder: dyn(() => import('./finder/Finder')),
  textedit: dyn(() => import('./TextEdit')),
  notes: dyn(() => import('./notes/NotesApp')),
  terminal: dyn(() => import('./Terminal')),
  calculator: dyn(() => import('./Calculator')),
  clock: dyn(() => import('./ClockApp')),
  settings: dyn(() => import('./Settings')),
  safari: dyn(() => import('./Safari')),
  photos: dyn(() => import('./Photos')),
  messages: dyn(() => import('./Messages')),
  inbox: dyn(() => import('./sqldetective/Inbox')),
  casefile: dyn(() => import('./sqldetective/CaseFile')),
  'sql-terminal': dyn(() => import('./sqldetective/SqlTerminal')),
  'detective-notes': dyn(() => import('./sqldetective/DetectiveNotes')),
  supervisor: dyn(() => import('./sqldetective/SupervisorConsole')),
}

// A render error inside one app must not blank the whole desktop — contain it
// to the window and offer a retry (remounts the app subtree).
class AppErrorBoundary extends Component<
  { appId: string; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#c0c0c0] p-6 text-center">
        <div className="text-[28px]" aria-hidden>
          ⚠️
        </div>
        <p className="text-[13px] font-bold text-black">
          This program has performed an illegal operation.
        </p>
        <p className="max-w-xs break-words font-mono text-[11px] text-[#444444]">
          {String(this.state.error.message || this.state.error)}
        </p>
        <button
          type="button"
          className="win95-raised px-4 py-1 text-[12px] font-bold text-black active:translate-y-px"
          onClick={() => this.setState({ error: null })}
        >
          Restart {getApp(this.props.appId)?.name ?? 'app'}
        </button>
      </div>
    )
  }
}

export default function AppContent({ appId }: { appId: string }) {
  const Specific = CONTENT[appId]
  if (Specific)
    return (
      <AppErrorBoundary appId={appId}>
        <Specific />
      </AppErrorBoundary>
    )

  const app = getApp(appId)
  const Icon = app?.icon

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
      {Icon && (
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-[22%] bg-gradient-to-b ${app?.tile} shadow-lg`}
        >
          <Icon className="h-8 w-8 text-white" strokeWidth={1.75} />
        </div>
      )}
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
        {app?.name ?? appId}
      </p>
      <p className="max-w-xs text-[13px] text-[var(--color-text-secondary)]">
        This app isn’t available yet.
      </p>
    </div>
  )
}
