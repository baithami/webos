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
  Aperture,
  MessageCircle,
  Inbox,
  FolderOpen,
  Database,
  NotebookPen,
  RadioTower,
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
    id: 'photos',
    name: 'Photos',
    icon: Aperture,
    tile: 'from-rose-400 via-amber-300 to-sky-500',
    pinned: true,
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: MessageCircle,
    tile: 'from-green-400 to-green-600',
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
  // SQL Detective game apps (see src/components/apps/sqldetective).
  {
    id: 'inbox',
    name: 'Inbox',
    icon: Inbox,
    tile: 'from-amber-500 to-orange-600',
    pinned: true,
  },
  {
    id: 'casefile',
    name: 'Case File',
    icon: FolderOpen,
    tile: 'from-slate-500 to-slate-700',
    pinned: true,
  },
  {
    id: 'sql-terminal',
    name: 'SQL Terminal',
    icon: Database,
    tile: 'from-green-700 to-emerald-900',
    pinned: true,
  },
  {
    id: 'detective-notes',
    name: 'Detective Notes',
    icon: NotebookPen,
    tile: 'from-yellow-600 to-amber-700',
    pinned: true,
  },
  {
    id: 'supervisor',
    name: 'Supervisor Console',
    icon: RadioTower,
    tile: 'from-stone-400 to-stone-600',
    // pinned has no effect in the Win95 shell (taskbar shows running windows
    // only). Summon via Spotlight ("supervisor") + auto-pop on first case open.
    pinned: false,
  },
]

export const PINNED_APPS = APPS.filter((a) => a.pinned)

export function getApp(id: string): AppDefinition | undefined {
  return APPS.find((a) => a.id === id)
}
