import { create } from 'zustand'

// Session lifecycle. Not persisted — every page load boots fresh. The Supabase
// magic-link account login (AuthScreen) is the gate now, so there is no PIN
// step: boot goes straight to active, and sleep wakes straight back to active.
// Flow: booting → active ⇄ asleep. ('locked' + the PIN LoginScreen remain in
// the codebase but are no longer entered by the normal flow.)

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
  finishBoot: () => set({ phase: 'active' }),
  unlock: (pin) => {
    if (pin === PIN) {
      set({ phase: 'active' })
      return true
    }
    return false
  },
  sleep: () => set({ phase: 'asleep' }),
  wake: () => set({ phase: 'active' }),
  lock: () => set({ phase: 'locked' }),
}))

export const SESSION_PIN = PIN
