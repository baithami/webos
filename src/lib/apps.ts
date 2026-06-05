import type { LucideIcon } from 'lucide-react'
import {
  Folder,
  FileText,
  TerminalSquare,
  Compass,
  StickyNote,
  Settings,
  Calculator,
  Clock,
} from 'lucide-react'

// Application registry. Full app windows arrive in Layer 4; for now this
// drives the dock and (later) Spotlight. `pinned` controls dock presence.

export interface AppDefinition {
  id: string
  name: string
  icon: LucideIcon
  /** Tailwind gradient classes for the dock tile background. */
  tile: string
  pinned: boolean
}

export const APPS: AppDefinition[] = [
  {
    id: 'finder',
    name: 'Finder',
    icon: Folder,
    tile: 'from-sky-400 to-blue-600',
    pinned: true,
  },
  {
    id: 'safari',
    name: 'Safari',
    icon: Compass,
    tile: 'from-cyan-300 to-blue-500',
    pinned: true,
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: StickyNote,
    tile: 'from-yellow-300 to-amber-500',
    pinned: true,
  },
  {
    id: 'textedit',
    name: 'TextEdit',
    icon: FileText,
    tile: 'from-zinc-200 to-zinc-400',
    pinned: true,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: TerminalSquare,
    tile: 'from-zinc-700 to-zinc-900',
    pinned: true,
  },
  {
    id: 'calculator',
    name: 'Calculator',
    icon: Calculator,
    tile: 'from-neutral-600 to-neutral-800',
    pinned: true,
  },
  {
    id: 'clock',
    name: 'Clock',
    icon: Clock,
    tile: 'from-orange-400 to-rose-500',
    pinned: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    tile: 'from-slate-400 to-slate-600',
    pinned: true,
  },
]

export const PINNED_APPS = APPS.filter((a) => a.pinned)

export function getApp(id: string): AppDefinition | undefined {
  return APPS.find((a) => a.id === id)
}
