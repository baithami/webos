'use client'

import {
  Home,
  Monitor,
  FileText,
  Download,
  Image as ImageIcon,
  Music,
  Film,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  Columns3,
  FolderPlus,
} from 'lucide-react'
import { ROOT_ID } from '@/lib/fs'
import type { ViewMode } from './shared'

const FAVORITES: { id: string; label: string; icon: typeof Home }[] = [
  { id: ROOT_ID, label: 'Home', icon: Home },
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'pictures', label: 'Pictures', icon: ImageIcon },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'movies', label: 'Movies', icon: Film },
]

export function Sidebar({
  currentId,
  onNavigate,
}: {
  currentId: string
  onNavigate: (id: string) => void
}) {
  return (
    <aside className="h-full w-44 shrink-0 overflow-auto bg-[var(--color-sidebar-bg)] px-2 py-3">
      <p className="px-2 pb-1 text-[11px] font-semibold uppercase text-[var(--color-text-tertiary)]">
        Favorites
      </p>
      {FAVORITES.map((f) => {
        const Icon = f.icon
        const active = currentId === f.id
        return (
          <button
            key={f.id}
            onClick={() => onNavigate(f.id)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-[13px] ${
              active
                ? 'bg-[var(--color-sidebar-active)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-white/5'
            }`}
          >
            <Icon size={15} className="text-[var(--color-accent)]" />
            <span className="truncate">{f.label}</span>
          </button>
        )
      })}
    </aside>
  )
}

export function Toolbar({
  title,
  canBack,
  canForward,
  onBack,
  onForward,
  viewMode,
  onViewMode,
  onNewFolder,
}: {
  title: string
  canBack: boolean
  canForward: boolean
  onBack: () => void
  onForward: () => void
  viewMode: ViewMode
  onViewMode: (m: ViewMode) => void
  onNewFolder: () => void
}) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[var(--color-window-border)] bg-[var(--color-window-titlebar)] px-3">
      <NavBtn disabled={!canBack} onClick={onBack} label="Back">
        <ChevronLeft size={18} />
      </NavBtn>
      <NavBtn disabled={!canForward} onClick={onForward} label="Forward">
        <ChevronRight size={18} />
      </NavBtn>

      <span className="ml-1 truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
        {title}
      </span>

      <div className="ml-auto flex items-center gap-1 rounded-md bg-black/20 p-0.5">
        <SegBtn active={viewMode === 'icon'} onClick={() => onViewMode('icon')} label="Icons">
          <LayoutGrid size={15} />
        </SegBtn>
        <SegBtn active={viewMode === 'list'} onClick={() => onViewMode('list')} label="List">
          <ListIcon size={15} />
        </SegBtn>
        <SegBtn active={viewMode === 'column'} onClick={() => onViewMode('column')} label="Columns">
          <Columns3 size={15} />
        </SegBtn>
      </div>

      <button
        onClick={onNewFolder}
        aria-label="New Folder"
        className="rounded-md p-1.5 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-[var(--color-text-primary)]"
      >
        <FolderPlus size={17} />
      </button>
    </div>
  )
}

function NavBtn({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="rounded-md p-1 text-[var(--color-text-secondary)] enabled:hover:bg-white/10 enabled:hover:text-[var(--color-text-primary)] disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function SegBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`rounded p-1 ${
        active
          ? 'bg-white/15 text-[var(--color-text-primary)]'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  )
}

export interface FinderMenuState {
  x: number
  y: number
  nodeId: string | null
}

export function FinderContextMenu({
  menu,
  onClose,
  onNewFolder,
  onNewFile,
  onOpen,
  onRename,
  onDelete,
}: {
  menu: FinderMenuState
  onClose: () => void
  onNewFolder: () => void
  onNewFile: () => void
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const onNode = menu.nodeId !== null
  const run = (fn: () => void) => () => {
    fn()
    onClose()
  }
  return (
    <div
      className="glass fixed z-50 min-w-44 rounded-lg py-1 text-[13px] text-[var(--color-text-primary)] shadow-xl"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {onNode ? (
        <>
          <Item onClick={run(onOpen)}>Open</Item>
          <Item onClick={run(onRename)}>Rename</Item>
          <Divider />
          <Item danger onClick={run(onDelete)}>
            Move to Trash
          </Item>
        </>
      ) : (
        <>
          <Item onClick={run(onNewFolder)}>New Folder</Item>
          <Item onClick={run(onNewFile)}>New Text File</Item>
        </>
      )}
    </div>
  )
}

function Item({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-1.5 text-left hover:bg-[var(--color-accent)] hover:text-white ${
        danger ? 'text-[var(--color-close)]' : ''
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="my-1 h-px bg-[var(--color-window-border)]" />
}
