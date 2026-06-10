'use client'

import { ROOT_ID } from '@/lib/fs'
import type { ViewMode } from './shared'

const FAVORITES: { id: string; label: string }[] = [
  { id: ROOT_ID, label: 'Home' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'documents', label: 'Documents' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'pictures', label: 'Pictures' },
  { id: 'music', label: 'Music' },
  { id: 'movies', label: 'Movies' },
]

export function Sidebar({
  currentId,
  onNavigate,
}: {
  currentId: string
  onNavigate: (id: string) => void
}) {
  return (
    <aside
      style={{
        width: 160,
        flexShrink: 0,
        height: '100%',
        overflowY: 'auto',
        background: '#c0c0c0',
        borderRight: '2px solid',
        borderRightColor: '#808080',
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      <p
        style={{
          padding: '2px 8px 4px',
          fontSize: 11,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          color: '#000000',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Favorites
      </p>
      {FAVORITES.map((f) => {
        const active = currentId === f.id
        return (
          <button
            key={f.id}
            onClick={() => onNavigate(f.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
              padding: '3px 8px',
              fontSize: 12,
              fontFamily: 'Arial, sans-serif',
              textAlign: 'left',
              border: 'none',
              cursor: 'default',
              background: active ? '#000080' : 'transparent',
              color: active ? '#ffffff' : '#000000',
            }}
          >
            <W95SidebarIcon category={f.id} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.label}
            </span>
          </button>
        )
      })}
    </aside>
  )
}

/** Small Win95-style icon for the sidebar — a house for Home, a folder otherwise. */
function W95SidebarIcon({ category }: { category: string }) {
  const isHome = category === ROOT_ID
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0 }}>
      {isHome ? (
        <polygon
          points="8,2 14,8 12,8 12,14 10,14 10,10 6,10 6,14 4,14 4,8 2,8"
          fill="#000080"
          stroke="none"
        />
      ) : (
        <>
          <rect x="1" y="5" width="14" height="10" fill="#c8a000" stroke="#000000" strokeWidth="0.5" />
          <path d="M1,5 L1,4 L5,4 L6,5" fill="#c8a000" stroke="#000000" strokeWidth="0.5" />
        </>
      )}
    </svg>
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        height: 36,
        flexShrink: 0,
        background: '#c0c0c0',
        borderBottom: '2px solid',
        borderBottomColor: '#808080',
        padding: '0 6px',
      }}
    >
      {/* Back / Forward */}
      <W95ToolbarBtn disabled={!canBack} onClick={onBack} label="Back">
        {'<'}
      </W95ToolbarBtn>
      <W95ToolbarBtn disabled={!canForward} onClick={onForward} label="Forward">
        {'>'}
      </W95ToolbarBtn>

      <ToolbarDivider />

      {/* Current folder title */}
      <span
        style={{
          flex: 1,
          fontSize: 12,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          color: '#000000',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          paddingLeft: 4,
        }}
      >
        {title}
      </span>

      <ToolbarDivider />

      {/* View mode buttons */}
      <W95ToolbarBtn active={viewMode === 'icon'} onClick={() => onViewMode('icon')} label="Icon view">
        Icons
      </W95ToolbarBtn>
      <W95ToolbarBtn active={viewMode === 'list'} onClick={() => onViewMode('list')} label="List view">
        List
      </W95ToolbarBtn>
      <W95ToolbarBtn active={viewMode === 'column'} onClick={() => onViewMode('column')} label="Details view">
        Details
      </W95ToolbarBtn>

      <ToolbarDivider />

      {/* New Folder */}
      <W95ToolbarBtn onClick={onNewFolder} label="New Folder">
        New Folder
      </W95ToolbarBtn>
    </div>
  )
}

function ToolbarDivider() {
  return (
    <div
      style={{
        width: 2,
        height: 20,
        borderLeft: '1px solid #808080',
        borderRight: '1px solid #ffffff',
        margin: '0 2px',
        flexShrink: 0,
      }}
    />
  )
}

function W95ToolbarBtn({
  disabled = false,
  active = false,
  onClick,
  label,
  children,
}: {
  disabled?: boolean
  active?: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      style={{
        background: '#c0c0c0',
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: active
          ? '#808080 #ffffff #ffffff #808080'
          : disabled
          ? '#c0c0c0 #c0c0c0 #c0c0c0 #c0c0c0'
          : '#ffffff #808080 #808080 #ffffff',
        padding: active ? '3px 7px 1px 9px' : '2px 8px',
        fontSize: 11,
        fontFamily: 'Arial, sans-serif',
        color: disabled ? '#808080' : '#000000',
        cursor: 'default',
        flexShrink: 0,
        minWidth: 24,
      }}
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
      style={{
        position: 'fixed',
        left: menu.x,
        top: menu.y,
        zIndex: 9999,
        background: '#c0c0c0',
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: '#ffffff #808080 #808080 #ffffff',
        boxShadow: '2px 2px 0 #000000',
        minWidth: 140,
        paddingTop: 2,
        paddingBottom: 2,
        fontFamily: 'Arial, sans-serif',
        fontSize: 12,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {onNode ? (
        <>
          <CtxItem onClick={run(onOpen)}>Open</CtxItem>
          <CtxItem onClick={run(onRename)}>Rename</CtxItem>
          <CtxDivider />
          <CtxItem onClick={run(onDelete)} danger>
            Delete
          </CtxItem>
        </>
      ) : (
        <>
          <CtxItem onClick={run(onNewFolder)}>New Folder</CtxItem>
          <CtxItem onClick={run(onNewFile)}>New Text File</CtxItem>
        </>
      )}
    </div>
  )
}

function CtxItem({
  children,
  onClick,
  danger = false,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: '3px 20px',
        textAlign: 'left',
        border: 'none',
        background: 'transparent',
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        color: danger ? '#cc0000' : '#000000',
        cursor: 'default',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = '#000080'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#ffffff'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        ;(e.currentTarget as HTMLButtonElement).style.color = danger ? '#cc0000' : '#000000'
      }}
    >
      {children}
    </button>
  )
}

function CtxDivider() {
  return (
    <div
      style={{
        height: 0,
        borderTop: '1px solid #808080',
        borderBottom: '1px solid #ffffff',
        margin: '3px 4px',
      }}
    />
  )
}
