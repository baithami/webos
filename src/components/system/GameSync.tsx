'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/supabase/AuthContext'
import { useCaseStore } from '@/store/useCaseStore'
import { loadState, saveState, DEFAULT_STATE } from '@/lib/gameState'

// Bridges the live game store (useCaseStore) to Supabase when a user is logged
// in. On login it loads remote progress and hydrates the store; thereafter it
// debounce-saves progression changes to Supabase (localStorage offline cache is
// kept by saveState + the store's own persist middleware).
//
// Notes (playerNotes) are synced separately by DetectiveNotes via gameState, so
// saveState here passes an empty playerNotes — upsert only writes present note
// rows, leaving remote notes untouched.
//
// Guest mode: AuthContext keeps user = null, so this component is inert and the
// store/localStorage behave exactly as before.

const SAVE_DEBOUNCE_MS = 600

export default function GameSync() {
  const { user, loading } = useAuth()
  const hydrated = useRef(false)

  // Hydrate from Supabase whenever a user becomes available. Migration already
  // ran in AuthContext before `user` was exposed, so remote state is seeded.
  useEffect(() => {
    if (loading) return
    if (!user) {
      hydrated.current = false
      return
    }
    let cancelled = false
    ;(async () => {
      const remote = await loadState()
      if (cancelled) return
      useCaseStore.getState().hydrate({
        activeCaseId: remote.activeCaseId ?? undefined,
        completedCases: remote.completedCases,
        hintsUsed: remote.hintsUsed,
        xp: remote.xp,
        openedCases: remote.openedCases,
        desktopIconsCreated: remote.desktopIconsCreated,
      })
      hydrated.current = true
    })()
    return () => {
      cancelled = true
    }
  }, [user, loading])

  // Debounced push of progression changes to Supabase (only while logged in).
  useEffect(() => {
    if (!user) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsub = useCaseStore.subscribe((s, p) => {
      if (!hydrated.current) return
      const changed =
        s.completedCases !== p.completedCases ||
        s.activeCaseId !== p.activeCaseId ||
        s.hintsUsed !== p.hintsUsed ||
        s.xp !== p.xp ||
        s.openedCases !== p.openedCases ||
        s.desktopIconsCreated !== p.desktopIconsCreated
      if (!changed) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        const st = useCaseStore.getState()
        saveState({
          completedCases: st.completedCases,
          activeCaseId: st.activeCaseId,
          xp: st.xp,
          hintsUsed: st.hintsUsed,
          openedCases: st.openedCases,
          desktopIconsCreated: st.desktopIconsCreated,
          playerNotes: {},
          settings: DEFAULT_STATE.settings,
        })
      }, SAVE_DEBOUNCE_MS)
    })
    return () => {
      clearTimeout(timer)
      unsub()
    }
  }, [user])

  return null
}
