'use client'

import { useEffect, useState } from 'react'
import { MonitorSmartphone } from 'lucide-react'
import { Z } from '@/lib/constants'

/**
 * Degradation overlay for small viewports. Per DECISIONS.md, WebOS does not
 * ship a mobile layout in v1 — below 768px we show a "best on desktop" notice
 * instead. Layer 6 hardens this; the basic gate lives here from Layer 1.
 */
export default function MobileOverlay() {
  const [isSmall, setIsSmall] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsSmall(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (!isSmall) return null

  return (
    <div
      className="glass fixed inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center"
      style={{ zIndex: Z.sleepScreen + 100 }}
    >
      <MonitorSmartphone size={56} className="text-[var(--color-accent)]" />
      <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
        Best viewed on desktop
      </h1>
      <p className="max-w-xs text-sm text-[var(--color-text-secondary)]">
        WebOS is a desktop-class experience. Open it on a larger screen to
        explore the full operating system.
      </p>
    </div>
  )
}
