import { create } from 'zustand'

// Cross-cutting sync health for the two persistence pipelines:
//  - stateSync: virtual FS + settings via /api/state (StateSync component)
//  - gameSync:  SQL Detective progress via Supabase (GameSync + gameState)
// 'error' means the most recent save/load attempt failed. Local play keeps
// working from memory/localStorage; the taskbar tray shows an offline
// indicator until a later attempt succeeds. Session-only, never persisted.

export type SyncHealth = 'ok' | 'error'

interface SyncState {
  stateSync: SyncHealth
  gameSync: SyncHealth
  reportStateSync: (h: SyncHealth) => void
  reportGameSync: (h: SyncHealth) => void
}

export const useSyncStore = create<SyncState>()((set) => ({
  stateSync: 'ok',
  gameSync: 'ok',
  // No-op when unchanged so per-save reports don't churn subscribers.
  reportStateSync: (h) =>
    set((s) => (s.stateSync === h ? s : { stateSync: h })),
  reportGameSync: (h) => set((s) => (s.gameSync === h ? s : { gameSync: h })),
}))
