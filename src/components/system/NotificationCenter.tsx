'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell } from 'lucide-react'
import { useUIStore, type AppNotification } from '@/store/useUIStore'
import { getApp } from '@/lib/apps'
import { Z } from '@/lib/constants'

function relativeTime(ms: number): string {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/** Slide-in panel anchored under the menu bar on the right. */
export default function NotificationCenter() {
  const notifications = useUIStore((s) => s.notifications)
  const dismiss = useUIStore((s) => s.dismissNotification)
  const clear = useUIStore((s) => s.clearNotifications)
  const close = useUIStore((s) => s.toggleNotifications)

  return (
    <motion.aside
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      onClick={(e) => e.stopPropagation()}
      className="glass absolute right-2 top-9 flex max-h-[80vh] w-80 flex-col overflow-hidden rounded-2xl shadow-2xl"
      style={{ zIndex: Z.notification }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          Notifications
        </span>
        {notifications.length > 0 && (
          <button
            onClick={clear}
            className="text-[12px] text-[var(--color-accent)] hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-[var(--color-text-tertiary)]">
            <Bell size={28} />
            <p className="text-[13px]">No Notifications</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <NotificationCard key={n.id} n={n} onDismiss={() => dismiss(n.id)} />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={close}
        className="border-t border-[var(--color-window-border)] py-2 text-center text-[12px] text-[var(--color-text-secondary)] hover:bg-white/5"
      >
        Close
      </button>
    </motion.aside>
  )
}

function NotificationCard({
  n,
  onDismiss,
}: {
  n: AppNotification
  onDismiss: () => void
}) {
  const app = n.appId ? getApp(n.appId) : undefined
  const Icon = app?.icon ?? Bell
  return (
    <div className="glass group relative rounded-xl p-3">
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded-full bg-black/30 p-0.5 text-white/70 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
      >
        <X size={12} />
      </button>
      <div className="flex gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            app ? `bg-gradient-to-b ${app.tile}` : 'bg-white/15'
          }`}
        >
          <Icon size={17} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
              {n.title}
            </span>
            <span className="shrink-0 text-[10px] text-[var(--color-text-tertiary)]">
              {relativeTime(n.time)}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] leading-snug text-[var(--color-text-secondary)]">
            {n.body}
          </p>
        </div>
      </div>
    </div>
  )
}
