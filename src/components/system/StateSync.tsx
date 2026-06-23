'use client'

import { useEffect } from 'react'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { useSystemStore, type Theme } from '@/store/useSystemStore'
import { useAuth } from '@/lib/supabase/AuthContext'
import { seedFileSystem, type NodeMap } from '@/lib/fs'
import { DEFAULT_WALLPAPER_ID } from '@/lib/wallpapers'
import { ACCENT_COLORS } from '@/lib/constants'

// Syncs the whole virtual file system + user settings with the server, PER
// ACCOUNT. Each signed-in Supabase user has their own server-side state
// (/api/state?key=<uid>); logged-out play uses key 'guest'. So every email gets
// its own desktop, files, theme, and wallpaper — fully isolated from other
// accounts and from guest mode. Loads on mount / whenever the account changes,
// then debounce-saves any change.
//
// A brand-new account starts from a FRESH seeded desktop (NOT this browser's
// localStorage), so a previous account's or guest's files never bleed in. Only
// the 'guest' key adopts the old per-browser localStorage as a one-time import.

const SAVE_DEBOUNCE_MS = 700

interface Settings {
  theme?: Theme
  accent?: string
  wallpaperId?: string
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  accent: ACCENT_COLORS[0].value,
  wallpaperId: DEFAULT_WALLPAPER_ID,
}

function readLocalNodes(): NodeMap | null {
  try {
    const raw = localStorage.getItem('webos-filesystem')
    const nodes = raw ? JSON.parse(raw)?.state?.nodes : null
    return nodes && Object.keys(nodes).length ? nodes : null
  } catch {
    return null
  }
}

function readLocalSettings(): Settings | null {
  try {
    const raw = localStorage.getItem('webos-system')
    const s = raw ? JSON.parse(raw)?.state : null
    if (!s) return null
    return { theme: s.theme, accent: s.accent, wallpaperId: s.wallpaperId }
  } catch {
    return null
  }
}

// Apply settings to the live store. Always sets all three fields so switching
// accounts can't leave the previous account's theme/wallpaper lingering.
function applySettings(s: Settings | null) {
  const merged = { ...DEFAULT_SETTINGS, ...(s ?? {}) }
  useSystemStore.setState({
    theme: merged.theme === 'light' ? 'light' : 'dark',
    accent:
      typeof merged.accent === 'string'
        ? merged.accent
        : DEFAULT_SETTINGS.accent!,
    wallpaperId:
      typeof merged.wallpaperId === 'string'
        ? merged.wallpaperId
        : DEFAULT_SETTINGS.wallpaperId!,
  })
}

async function saveState(key: string) {
  const nodes = useFileSystemStore.getState().nodes
  const { theme, accent, wallpaperId } = useSystemStore.getState()
  try {
    await fetch(`/api/state?key=${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, settings: { theme, accent, wallpaperId } }),
    })
  } catch {
    // Offline / server down — keep working from memory; next change retries.
  }
}

export default function StateSync() {
  const userId = useAuth().user?.id ?? null
  const stateKey = userId ?? 'guest'

  // One-time data wipe for v2 reskin — runs once total, not per account.
  useEffect(() => {
    if (!localStorage.getItem('webos-v2-reset-done')) {
      localStorage.clear()
      localStorage.setItem('webos-v2-reset-done', '1')
    }
  }, [])

  // Load this account's state whenever the account changes.
  useEffect(() => {
    let cancelled = false
    useFileSystemStore.setState({ hydrated: false })
    ;(async () => {
      let nodes: NodeMap | null = null
      let settings: Settings | null = null
      try {
        const res = await fetch(
          `/api/state?key=${encodeURIComponent(stateKey)}`,
          { cache: 'no-store' }
        )
        if (res.ok) {
          const data = await res.json()
          if (data?.nodes && Object.keys(data.nodes).length) nodes = data.nodes
          if (data?.settings) settings = data.settings
        }
      } catch {
        // fall through to seed
      }
      if (cancelled) return

      const serverWasEmpty = !nodes
      if (!nodes) {
        // Guest: adopt this browser's old localStorage once. A real account:
        // always start fresh so nothing bleeds across profiles.
        nodes =
          stateKey === 'guest'
            ? readLocalNodes() ?? seedFileSystem()
            : seedFileSystem()
      }
      if (!settings) {
        settings = stateKey === 'guest' ? readLocalSettings() : DEFAULT_SETTINGS
      }

      applySettings(settings)
      useFileSystemStore.setState({ nodes, hydrated: true })

      // Seed the per-account file the first time it's empty.
      if (serverWasEmpty) saveState(stateKey)
    })()
    return () => {
      cancelled = true
    }
  }, [stateKey])

  // Debounced save whenever the tree or settings change (post-hydration),
  // always to the current account's key.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      if (!useFileSystemStore.getState().hydrated) return
      clearTimeout(timer)
      timer = setTimeout(() => saveState(stateKey), SAVE_DEBOUNCE_MS)
    }
    const unsubFs = useFileSystemStore.subscribe((s, p) => {
      if (s.nodes !== p.nodes) schedule()
    })
    const unsubSys = useSystemStore.subscribe((s, p) => {
      if (
        s.theme !== p.theme ||
        s.accent !== p.accent ||
        s.wallpaperId !== p.wallpaperId
      )
        schedule()
    })
    return () => {
      clearTimeout(timer)
      unsubFs()
      unsubSys()
    }
  }, [stateKey])

  return null
}
