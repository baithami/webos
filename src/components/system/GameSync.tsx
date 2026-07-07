'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/supabase/AuthContext'
import { useCaseStore } from '@/store/useCaseStore'
import { loadRemoteState, saveState, DEFAULT_STATE } from '@/lib/gameState'

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

  // Hydrate from Supabase whenever a user becomes available.
  //
  // Two correctness rules here:
  //  1. A FAILED remote load never hydrates from this browser's localStorage
  //     (that may be guest or another account's progress, and once hydrated
  //     the debounced saver would push it up to this account). Instead we
  //     retry with backoff and keep saves blocked (hydrated stays false).
  //  2. Progress made WHILE the load was in flight (the player is signed in
  //     and acting) is merged on top of the remote snapshot instead of being
  //     clobbered by it — additive fields union, hint counters take the max,
  //     and the active case follows the player's in-flight choice.
  useEffect(() => {
    if (loading) return
    if (!user) {
      hydrated.current = false
      return
    }
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const snap = () => {
      const s = useCaseStore.getState()
      return {
        activeCaseId: s.activeCaseId,
        completedCases: s.completedCases,
        hintsUsed: s.hintsUsed,
        openedCases: s.openedCases,
        desktopIconsCreated: s.desktopIconsCreated,
      }
    }
    const addedSince = (before: string[], now: string[]) =>
      now.filter((x) => !before.includes(x))
    const union = (a: string[], b: string[]) =>
      Array.from(new Set([...a, ...b]))

    const attempt = async (n: number) => {
      const before = snap()
      const remote = await loadRemoteState()
      if (cancelled) return
      if (!remote) {
        retryTimer = setTimeout(
          () => attempt(n + 1),
          Math.min(30_000, 2_000 * 2 ** n)
        )
        return
      }

      const now = snap()
      const completedCases = union(
        remote.completedCases,
        addedSince(before.completedCases, now.completedCases)
      )
      // Hint counters changed in flight keep their max vs the remote value.
      const hintsUsed = { ...remote.hintsUsed }
      for (const [k, v] of Object.entries(now.hintsUsed)) {
        if (before.hintsUsed[k] !== v) {
          hintsUsed[k] = Math.max(hintsUsed[k] ?? -1, v)
        }
      }
      useCaseStore.getState().hydrate({
        activeCaseId:
          now.activeCaseId !== before.activeCaseId
            ? now.activeCaseId
            : remote.activeCaseId ?? undefined,
        completedCases,
        hintsUsed,
        // XP is 100 per completed case everywhere in the game, so derive it
        // from the merged list; max() keeps any remote surplus intact.
        xp: Math.max(remote.xp, completedCases.length * 100),
        openedCases: union(
          remote.openedCases,
          addedSince(before.openedCases, now.openedCases)
        ),
        desktopIconsCreated: union(
          remote.desktopIconsCreated,
          addedSince(before.desktopIconsCreated, now.desktopIconsCreated)
        ),
      })
      hydrated.current = true
    }

    attempt(0)
    return () => {
      cancelled = true
      clearTimeout(retryTimer)
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
