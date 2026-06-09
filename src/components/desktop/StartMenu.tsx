'use client'

import { Z } from '@/lib/constants'
import { useWindowStore } from '@/store/useWindowStore'
import { useCaseStore } from '@/store/useCaseStore'
import { APPS } from '@/lib/apps'

interface Props {
  onClose: () => void
}

// Start Menu entries. `label` is the Win95-flavored name (Files, Browser, …)
// while `id` still maps to the real app in the APPS registry. `__sep__` rows
// render a divider. Only ids present in APPS are shown.
interface MenuEntry {
  id: string
  label: string
  icon: string
}

const START_MENU_ITEMS: MenuEntry[] = [
  // SQL Detective — the headline apps
  { id: 'inbox', label: 'Inbox', icon: '📬' },
  { id: 'casefile', label: 'Case File', icon: '📁' },
  { id: 'sql-terminal', label: 'SQL Terminal', icon: '⬛' },
  { id: 'detective-notes', label: 'Detective Notes', icon: '📝' },
  { id: '__sep__', label: '', icon: '' },
  // Accessories (macOS apps re-skinned with Windows names)
  { id: 'finder', label: 'Files', icon: '🗂️' },
  { id: 'safari', label: 'Browser', icon: '🌐' },
  { id: 'photos', label: 'Photos', icon: '🖼️' },
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'notes', label: 'Notes', icon: '🗒️' },
  { id: 'textedit', label: 'Notepad', icon: '📄' },
  { id: 'terminal', label: 'MS-DOS Prompt', icon: '💾' },
  { id: 'calculator', label: 'Calculator', icon: '🧮' },
  { id: 'clock', label: 'Clock', icon: '⏰' },
  { id: '__sep__', label: '', icon: '' },
  { id: 'settings', label: 'Control Panel', icon: '⚙️' },
]

const ITEM_STYLE: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  background: 'none',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '5px 16px 5px 8px',
  fontSize: 12,
  fontFamily: 'Arial, sans-serif',
  cursor: 'default',
}

export default function StartMenu({ onClose }: Props) {
  const openApp = useWindowStore((s) => s.openApp)
  const unread = useCaseStore((s) => s.unreadCount())

  const launch = (id: string) => {
    onClose()
    openApp(id)
  }

  return (
    <div
      data-testid="start-menu"
      style={{
        position: 'absolute',
        bottom: 34,
        left: 0,
        zIndex: Z.notification,
        display: 'flex',
        flexDirection: 'row',
        background: '#c0c0c0',
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: '#ffffff #404040 #404040 #ffffff',
        minWidth: 200,
        boxShadow: '4px 4px 0 rgba(0,0,0,0.4)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Vertical sidebar with the OS name */}
      <div
        style={{
          width: 24,
          background: 'linear-gradient(180deg, #000080 0%, #1084d0 100%)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: 8,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            letterSpacing: 1,
            userSelect: 'none',
          }}
        >
          CrimeOS
        </span>
      </div>

      {/* Menu items */}
      <div style={{ flex: 1, paddingTop: 2, paddingBottom: 2 }}>
        {START_MENU_ITEMS.map((item, i) => {
          if (item.id === '__sep__') return <div key={`sep-${i}`} className="win95-separator" />
          if (!APPS.find((a) => a.id === item.id)) return null
          const showBadge = item.id === 'inbox' && unread > 0
          return (
            <button
              key={item.id}
              className="win95-menu-item"
              style={ITEM_STYLE}
              onClick={() => launch(item.id)}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {showBadge && (
                <span
                  data-testid="start-unread-inbox"
                  style={{
                    minWidth: 16,
                    height: 16,
                    padding: '0 4px',
                    background: '#ff0000',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 'bold',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {unread}
                </span>
              )}
            </button>
          )
        })}

        <div className="win95-separator" />
        <button className="win95-menu-item" style={ITEM_STYLE} onClick={onClose}>
          <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>💻</span>
          <span>Shut Down…</span>
        </button>
      </div>
    </div>
  )
}
