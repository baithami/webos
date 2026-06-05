'use client'

import { getApp } from '@/lib/apps'
import Finder from './finder/Finder'
import TextEdit from './TextEdit'
import Notes from './Notes'
import Terminal from './Terminal'
import Calculator from './Calculator'
import ClockApp from './ClockApp'
import Settings from './Settings'
import Safari from './Safari'

/**
 * App body registry, keyed by appId. Apps register here as they are built in
 * Layer 4; anything not yet registered falls back to the placeholder below.
 */
const CONTENT: Record<string, React.ComponentType> = {
  finder: Finder,
  textedit: TextEdit,
  notes: Notes,
  terminal: Terminal,
  calculator: Calculator,
  clock: ClockApp,
  settings: Settings,
  safari: Safari,
}

export default function AppContent({ appId }: { appId: string }) {
  const Specific = CONTENT[appId]
  if (Specific) return <Specific />

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
        This app arrives in Layer 4. The window manager is fully functional —
        drag, resize, focus, minimize, and fullscreen all work.
      </p>
    </div>
  )
}
