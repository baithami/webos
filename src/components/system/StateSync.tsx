'use client'

import { useEffect } from 'react'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { useSystemStore, type Theme } from '@/store/useSystemStore'
import { seedFileSystem, type NodeMap } from '@/lib/fs'

// Syncs the whole virtual file system + user settings with the server, so they
// follow the user across devices. Loads once on boot, then debounce-saves any
// change. The first time the server is empty, it adopts whatever was in this
// browser's old localStorage (one-time migration) before taking over.

const SAVE_DEBOUNCE_MS = 700

interface Settings {
  theme?: Theme
  accent?: string
  wallpaperId?: string
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

function applySettings(s: Settings | null) {
  if (!s) return
  const patch: Partial<Settings> = {}
  if (s.theme === 'dark' || s.theme === 'light') patch.theme = s.theme
  if (typeof s.accent === 'string') patch.accent = s.accent
  if (typeof s.wallpaperId === 'string') patch.wallpaperId = s.wallpaperId
  if (Object.keys(patch).length) useSystemStore.setState(patch)
}

async function saveState() {
  const nodes = useFileSystemStore.getState().nodes
  const { theme, accent, wallpaperId } = useSystemStore.getState()
  try {
    await fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, settings: { theme, accent, wallpaperId } }),
    })
  } catch {
    // Offline / server down — keep working from memory; next change retries.
  }
}

export default function StateSync() {
  // Load once on mount.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let nodes: NodeMap | null = null
      let settings: Settings | null = null
      try {
        const res = await fetch('/api/state', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data?.nodes && Object.keys(data.nodes).length) nodes = data.nodes
          if (data?.settings) settings = data.settings
        }
      } catch {
        // fall through to local/seed
      }
      if (cancelled) return

      const serverWasEmpty = !nodes
      if (!nodes) nodes = readLocalNodes() ?? seedFileSystem()
      if (!settings) settings = readLocalSettings()

      applySettings(settings)
      useFileSystemStore.setState({ nodes, hydrated: true })

      // Seed/migrate the server if it had nothing yet.
      if (serverWasEmpty) saveState()
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Debounced save whenever the tree or settings change (post-hydration).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      if (!useFileSystemStore.getState().hydrated) return
      clearTimeout(timer)
      timer = setTimeout(saveState, SAVE_DEBOUNCE_MS)
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
  }, [])

  return null
}
