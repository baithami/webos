'use client'

import { Search, SlidersHorizontal, Bell, Mail, CloudOff } from 'lucide-react'
import { Z } from '@/lib/constants'
import { useWindowStore } from '@/store/useWindowStore'
import { useUIStore } from '@/store/useUIStore'
import { useCaseStore } from '@/store/useCaseStore'
import { useSyncStore } from '@/store/useSyncStore'
import StartMenu from './StartMenu'
import TaskbarClock from './TaskbarClock'

// The Win95 taskbar: Start button + Start Menu, one button per open window, and
// a system tray. The tray preserves the macOS-shell overlays that used to live
// in the menu bar (Spotlight, Control Center, Notifications) plus an always-on
// unread-cases mail indicator (the old dock badge, re-homed here).
export default function Taskbar() {
  const windows = useWindowStore((s) => s.windows)
  const order = useWindowStore((s) => s.order)
  const toggleMinimize = useWindowStore((s) => s.toggleMinimize)
  const focus = useWindowStore((s) => s.focus)
  const openApp = useWindowStore((s) => s.openApp)
  const activeId = useWindowStore((s) => s.activeId)

  const startMenuOpen = useUIStore((s) => s.startMenuOpen)
  const toggleStartMenu = useUIStore((s) => s.toggleStartMenu)
  const closeAllPopovers = useUIStore((s) => s.closeAllPopovers)
  const openSpotlight = useUIStore((s) => s.openSpotlight)
  const toggleControlCenter = useUIStore((s) => s.toggleControlCenter)
  const toggleNotifications = useUIStore((s) => s.toggleNotifications)

  const unread = useCaseStore((s) => s.unreadCount())
  const syncError = useSyncStore(
    (s) => s.stateSync === 'error' || s.gameSync === 'error'
  )

  const activeWindowId = activeId()

  const handleTaskbarBtn = (winId: string) => {
    const win = windows[winId]
    if (!win) return
    if (win.isMinimized) {
      toggleMinimize(winId)
    } else if (activeWindowId === winId) {
      toggleMinimize(winId)
    } else {
      focus(winId)
    }
  }

  return (
    <>
      {startMenuOpen && <StartMenu onClose={closeAllPopovers} />}

      <div
        className="win95-taskbar absolute bottom-0 left-0 right-0"
        style={{ zIndex: Z.dock }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Start button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleStartMenu()
          }}
          className={startMenuOpen ? 'win95-btn-pressed' : 'win95-btn'}
          style={{
            height: 26,
            fontWeight: 'bold',
            paddingLeft: 8,
            paddingRight: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="1" y="1" width="6" height="6" fill="#ff0000" />
            <rect x="9" y="1" width="6" height="6" fill="#00cc00" />
            <rect x="1" y="9" width="6" height="6" fill="#0000ff" />
            <rect x="9" y="9" width="6" height="6" fill="#ffcc00" />
          </svg>
          Start
        </button>

        {/* Raised divider */}
        <div
          style={{
            width: 2,
            height: 26,
            borderLeft: '1px solid #808080',
            borderRight: '1px solid #ffffff',
            flexShrink: 0,
          }}
        />

        {/* Running windows */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 2, overflow: 'hidden' }}>
          {order.map((id) => {
            const win = windows[id]
            if (!win) return null
            const isActive = id === activeWindowId && !win.isMinimized
            return (
              <button
                key={id}
                onClick={() => handleTaskbarBtn(id)}
                className={isActive ? 'win95-btn-pressed' : 'win95-btn'}
                style={{
                  height: 26,
                  minWidth: 100,
                  maxWidth: 160,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  overflow: 'hidden',
                  flexShrink: 1,
                  padding: '0 8px',
                }}
                title={win.title}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                >
                  <rect x="1" y="1" width="5" height="5" fill="#000080" />
                  <rect x="8" y="1" width="5" height="5" fill="#000080" />
                  <rect x="1" y="8" width="5" height="5" fill="#000080" />
                  <rect x="8" y="8" width="5" height="5" fill="#000080" />
                </svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {win.title}
                </span>
              </button>
            )
          })}
        </div>

        {/* System tray */}
        <div
          style={{
            borderStyle: 'solid',
            borderWidth: 2,
            borderColor: '#808080 #ffffff #ffffff #808080',
            height: 26,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            paddingLeft: 6,
            paddingRight: 6,
            flexShrink: 0,
          }}
        >
          {unread > 0 && (
            <button
              data-testid="taskbar-unread-inbox"
              onClick={(e) => {
                e.stopPropagation()
                openApp('inbox')
              }}
              aria-label={`${unread} unread case${unread === 1 ? '' : 's'}`}
              title={`${unread} unread case${unread === 1 ? '' : 's'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: 'none',
                border: 'none',
                cursor: 'default',
                color: '#000080',
              }}
            >
              <Mail size={14} />
              <span style={{ fontSize: 11, fontWeight: 'bold', color: '#c00000' }}>{unread}</span>
            </button>
          )}
          {syncError && (
            <span
              data-testid="taskbar-sync-offline"
              role="status"
              aria-label="Offline — changes saved locally, not yet synced"
              title="Offline — changes saved locally, not yet synced"
              style={{ display: 'flex', alignItems: 'center', color: '#c00000' }}
            >
              <CloudOff size={14} />
            </span>
          )}
          <TrayButton onClick={openSpotlight} label="Search">
            <Search size={14} />
          </TrayButton>
          <TrayButton onClick={toggleControlCenter} label="Control Center">
            <SlidersHorizontal size={14} />
          </TrayButton>
          <TrayButton onClick={toggleNotifications} label="Notifications">
            <Bell size={14} />
          </TrayButton>
          <TaskbarClock />
        </div>
      </div>
    </>
  )
}

function TrayButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={label}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: 'default',
        color: '#000000',
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}
