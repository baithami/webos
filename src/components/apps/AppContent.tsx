'use client'

import { getApp } from '@/lib/apps'

/**
 * App body registry. Real applications (Finder, TextEdit, Terminal, …) arrive
 * in Layer 4; until then every window renders this placeholder so the window
 * manager can be built and tested end-to-end. Layer 4 swaps entries into
 * CONTENT keyed by appId.
 */
const CONTENT: Record<string, React.ComponentType> = {}

export default function AppContent({ appId }: { appId: string }) {
  const Specific = CONTENT[appId]
  if (Specific) return <Specific />

  const app = getApp(appId)
  const Icon = app?.icon

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
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
