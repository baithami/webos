'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSessionStore } from '@/store/useSessionStore'
import { useUIStore } from '@/store/useUIStore'
import { Z } from '@/lib/constants'
import BootScreen from './BootScreen'
import LoginScreen from './LoginScreen'
import SleepScreen from './SleepScreen'
import Spotlight from './Spotlight'
import NotificationCenter from './NotificationCenter'
import ControlCenter from './ControlCenter'

/**
 * Owns the session lifecycle overlays (boot/login/sleep), the global hotkeys,
 * and the transient system popovers (Spotlight, notifications, control center).
 * Rendered inside Desktop so the desktop stays mounted behind the overlays.
 */
export default function SystemLayer() {
  const phase = useSessionStore((s) => s.phase)
  const toggleSpotlight = useUIStore((s) => s.toggleSpotlight)
  const closeAllPopovers = useUIStore((s) => s.closeAllPopovers)
  const pushNotification = useUIStore((s) => s.pushNotification)

  const spotlightOpen = useUIStore((s) => s.spotlightOpen)
  const notificationsOpen = useUIStore((s) => s.notificationsOpen)
  const controlCenterOpen = useUIStore((s) => s.controlCenterOpen)
  const appleMenuOpen = useUIStore((s) => s.appleMenuOpen)

  const greeted = useRef(false)

  // Global hotkeys (only while the session is active).
  useEffect(() => {
    if (phase !== 'active') return
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault()
        toggleSpotlight()
      } else if (e.key === 'Escape') {
        closeAllPopovers()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, toggleSpotlight, closeAllPopovers])

  // Welcome notification once per session, the first time we go active.
  useEffect(() => {
    if (phase === 'active' && !greeted.current) {
      greeted.current = true
      pushNotification({
        appId: 'finder',
        title: 'Welcome to WebOS',
        body: 'Press ⌘ + Space for Spotlight. Right-click the desktop to change your wallpaper.',
      })
    }
  }, [phase, pushNotification])

  if (phase === 'booting') return <BootScreen />
  if (phase === 'locked') return <LoginScreen />
  if (phase === 'asleep') return <SleepScreen />

  const anyPopover =
    spotlightOpen || notificationsOpen || controlCenterOpen || appleMenuOpen

  return (
    <>
      {/* Click-catcher behind popovers to dismiss on outside click. */}
      {anyPopover && (
        <div
          className="absolute inset-0"
          // Just below the lowest popover layer so it can never occlude one.
          style={{ zIndex: Z.spotlight - 1 }}
          onClick={closeAllPopovers}
          onContextMenu={(e) => {
            e.preventDefault()
            closeAllPopovers()
          }}
        />
      )}

      <AnimatePresence>
        {spotlightOpen && <Spotlight key="spotlight" />}
      </AnimatePresence>
      <AnimatePresence>
        {notificationsOpen && <NotificationCenter key="notifications" />}
      </AnimatePresence>
      <AnimatePresence>
        {controlCenterOpen && <ControlCenter key="control-center" />}
      </AnimatePresence>
    </>
  )
}
