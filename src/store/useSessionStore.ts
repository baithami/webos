import { create } from 'zustand'

// Session lifecycle. Not persisted — every page load boots fresh and requires
// the PIN, mirroring a cold start. Flow:
//   booting → locked → active ⇄ asleep, and asleep wakes back to locked.

export type SessionPhase = 'booting' | 'locked' | 'active' | 'asleep'

const PIN = process.env.NEXT_PUBLIC_DEFAULT_PIN ?? '0000'

interface SessionState {
  phase: SessionPhase
  finishBoot: () => void
  /** Returns true if the PIN matched and the session unlocked. */
  unlock: (pin: string) => boolean
  sleep: () => void
  wake: () => void
  lock: () => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  phase: 'booting',
  finishBoot: () => set({ phase: 'locked' }),
  unlock: (pin) => {
    if (pin === PIN) {
      set({ phase: 'active' })
      return true
    }
    return false
  },
  sleep: () => set({ phase: 'asleep' }),
  wake: () => set({ phase: 'locked' }),
  lock: () => set({ phase: 'locked' }),
}))

export const SESSION_PIN = PIN
