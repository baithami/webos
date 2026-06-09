import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CASES } from '@/lib/sqldetective/cases'
import type { GameCase } from '@/lib/sqldetective/types'

// Game state for SQL Detective: which case is active, which are solved, how many
// hints have been revealed per case, and accumulated XP. Persisted to
// localStorage so progress survives refreshes. Window/OS state stays in
// useWindowStore — this store only owns game progression.

interface CaseState {
  activeCaseId: string
  completedCases: string[]
  hintsUsed: Record<string, number> // caseId → highest hint index shown (0-2)
  xp: number
  openedCases: string[] // case ids whose dispatch email has been opened (≠ completed)
  desktopIconsCreated: string[] // case ids that already have a desktop folder

  // Derived
  activeCase: () => GameCase | undefined
  isLocked: (caseId: string) => boolean
  nextHint: (caseId: string) => string | null
  unreadCount: () => number // unlocked cases whose email hasn't been opened yet

  // Actions
  setActiveCase: (id: string) => void
  completeCase: (id: string) => void
  useHint: (caseId: string) => void
  openCase: (caseId: string) => void
  markDesktopIconCreated: (caseId: string) => void
}

export const useCaseStore = create<CaseState>()(
  persist(
    (set, get) => ({
      activeCaseId: 'case-001',
      completedCases: [],
      hintsUsed: {},
      xp: 0,
      openedCases: [],
      desktopIconsCreated: [],

      activeCase: () => CASES.find((c) => c.id === get().activeCaseId),

      isLocked: (caseId) => {
        const idx = CASES.findIndex((c) => c.id === caseId)
        if (idx <= 0) return false
        const prev = CASES[idx - 1]
        return !get().completedCases.includes(prev.id)
      },

      nextHint: (caseId) => {
        const gameCase = CASES.find((c) => c.id === caseId)
        if (!gameCase) return null
        const used = get().hintsUsed[caseId] ?? -1
        const next = used + 1
        if (next > 2) return 'No more hints available for this case.'
        return gameCase.solution.hints[next]
      },

      unreadCount: () => {
        const { openedCases, isLocked } = get()
        return CASES.filter((c) => !isLocked(c.id) && !openedCases.includes(c.id))
          .length
      },

      setActiveCase: (id) => set({ activeCaseId: id }),

      completeCase: (id) =>
        set((s) => ({
          completedCases: s.completedCases.includes(id)
            ? s.completedCases
            : [...s.completedCases, id],
          xp: s.completedCases.includes(id) ? s.xp : s.xp + 100,
        })),

      useHint: (caseId) =>
        set((s) => {
          const used = s.hintsUsed[caseId] ?? -1
          if (used >= 2) return s
          return { hintsUsed: { ...s.hintsUsed, [caseId]: used + 1 } }
        }),

      openCase: (caseId) =>
        set((s) =>
          s.openedCases.includes(caseId)
            ? s
            : { openedCases: [...s.openedCases, caseId] }
        ),

      markDesktopIconCreated: (caseId) =>
        set((s) =>
          s.desktopIconsCreated.includes(caseId)
            ? s
            : { desktopIconsCreated: [...s.desktopIconsCreated, caseId] }
        ),
    }),
    {
      name: 'sql-detective-game-state',
    }
  )
)
