import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { useSyncStore } from '@/store/useSyncStore'

// Canonical game-state persistence adapter for SQL Detective.
//
// Primary store is Supabase when a user is logged in; localStorage is the
// offline fallback / guest store. The live game keeps its progress in
// `useCaseStore` (zustand `persist` -> localStorage key 'sql-detective-game-state')
// and its per-case notes in 'detective-notes-<caseId>' keys. This module reads
// and writes those SAME keys so guest mode and the offline cache stay
// consistent with the running stores — and mirrors everything to Supabase when
// authenticated so progress follows the user across devices.
//
// NOTE: the original brief's GameState dropped hintsUsed / openedCases /
// desktopIconsCreated. Those are real progression the game depends on, so they
// are kept here (and in the schema) — otherwise a cross-device sync would lose
// hint counts and unlock/seed bookkeeping. settings.{crtFilter,soundEnabled}
// are carried per the brief even though no UI consumes them yet.

export interface GameState {
  completedCases: string[]
  activeCaseId: string | null
  playerNotes: Record<string, string>
  xp: number
  settings: {
    crtFilter: boolean
    soundEnabled: boolean
  }
  // Extra live-game progression (not in the original brief, kept so sync is lossless):
  hintsUsed: Record<string, number>
  openedCases: string[]
  desktopIconsCreated: string[]
}

const DEFAULT_STATE: GameState = {
  completedCases: [],
  activeCaseId: 'case-001',
  playerNotes: {},
  xp: 0,
  settings: { crtFilter: true, soundEnabled: false },
  hintsUsed: {},
  openedCases: [],
  desktopIconsCreated: [],
}

export { DEFAULT_STATE }

// localStorage keys — must match useCaseStore's persist name + DetectiveNotes.
const GAME_LS_KEY = 'sql-detective-game-state'
const NOTE_LS_PREFIX = 'detective-notes-'
const SETTINGS_LS_KEY = 'sql-detective-settings'

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/** Current Supabase auth session, or null (also null when not configured). */
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const { data } = await supabase.auth.getSession()
    return data.session ?? null
  } catch {
    return null
  }
}

/** Wraps supabase.auth.onAuthStateChange. Returns the subscription object. */
export function onAuthStateChange(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
) {
  return supabase.auth.onAuthStateChange(callback)
}

async function currentUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.id ?? null
}

// ---------------------------------------------------------------------------
// localStorage (guest / offline cache)
// ---------------------------------------------------------------------------

function readLocalNotes(): Record<string, string> {
  const notes: Record<string, string> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(NOTE_LS_PREFIX)) {
        const caseId = key.slice(NOTE_LS_PREFIX.length)
        notes[caseId] = localStorage.getItem(key) ?? ''
      }
    }
  } catch {
    /* localStorage unavailable */
  }
  return notes
}

function readLocalState(): GameState {
  try {
    const raw = localStorage.getItem(GAME_LS_KEY)
    const s = raw ? JSON.parse(raw)?.state : null
    let settings = DEFAULT_STATE.settings
    try {
      const rawSettings = localStorage.getItem(SETTINGS_LS_KEY)
      if (rawSettings) settings = { ...settings, ...JSON.parse(rawSettings) }
    } catch {
      /* ignore */
    }
    if (!s) return { ...DEFAULT_STATE, playerNotes: readLocalNotes(), settings }
    return {
      completedCases: s.completedCases ?? [],
      activeCaseId: s.activeCaseId ?? DEFAULT_STATE.activeCaseId,
      xp: s.xp ?? 0,
      hintsUsed: s.hintsUsed ?? {},
      openedCases: s.openedCases ?? [],
      desktopIconsCreated: s.desktopIconsCreated ?? [],
      playerNotes: readLocalNotes(),
      settings,
    }
  } catch {
    return { ...DEFAULT_STATE, playerNotes: readLocalNotes() }
  }
}

function writeLocalState(state: GameState): void {
  try {
    // Merge into the existing zustand-persist blob so we never clobber fields
    // the store owns that aren't modeled here.
    let existing: { state?: Record<string, unknown>; version?: number } = {}
    try {
      const raw = localStorage.getItem(GAME_LS_KEY)
      if (raw) existing = JSON.parse(raw)
    } catch {
      /* ignore */
    }
    const merged = {
      state: {
        ...(existing.state ?? {}),
        completedCases: state.completedCases,
        activeCaseId: state.activeCaseId,
        xp: state.xp,
        hintsUsed: state.hintsUsed,
        openedCases: state.openedCases,
        desktopIconsCreated: state.desktopIconsCreated,
      },
      version: existing.version ?? 0,
    }
    localStorage.setItem(GAME_LS_KEY, JSON.stringify(merged))
    localStorage.setItem(SETTINGS_LS_KEY, JSON.stringify(state.settings))
    for (const [caseId, content] of Object.entries(state.playerNotes)) {
      localStorage.setItem(NOTE_LS_PREFIX + caseId, content)
    }
  } catch {
    /* quota / availability — ignore */
  }
}

// ---------------------------------------------------------------------------
// Supabase (primary when logged in)
// ---------------------------------------------------------------------------

async function loadFromSupabase(userId: string): Promise<GameState> {
  const [progressRes, notesRes] = await Promise.all([
    supabase.from('user_progress').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_notes').select('case_id, content').eq('user_id', userId),
  ])

  const row = progressRes.data
  const playerNotes: Record<string, string> = {}
  for (const n of notesRes.data ?? []) {
    playerNotes[(n as { case_id: string }).case_id] =
      (n as { content: string }).content ?? ''
  }

  if (!row) {
    // Logged in but no row yet (pre-migration first login).
    return { ...DEFAULT_STATE, playerNotes }
  }

  return {
    completedCases: row.completed_cases ?? [],
    activeCaseId: row.active_case_id ?? DEFAULT_STATE.activeCaseId,
    xp: row.xp ?? 0,
    settings: { ...DEFAULT_STATE.settings, ...(row.settings ?? {}) },
    hintsUsed: row.hints_used ?? {},
    openedCases: row.opened_cases ?? [],
    desktopIconsCreated: row.desktop_icons_created ?? [],
    playerNotes,
  }
}

async function saveToSupabase(userId: string, state: GameState): Promise<void> {
  await supabase.from('user_progress').upsert({
    id: userId,
    completed_cases: state.completedCases,
    active_case_id: state.activeCaseId,
    xp: state.xp,
    settings: state.settings,
    hints_used: state.hintsUsed,
    opened_cases: state.openedCases,
    desktop_icons_created: state.desktopIconsCreated,
    updated_at: new Date().toISOString(),
  })

  const noteRows = Object.entries(state.playerNotes).map(([caseId, content]) => ({
    user_id: userId,
    case_id: caseId,
    content,
    updated_at: new Date().toISOString(),
  }))
  if (noteRows.length) {
    await supabase.from('user_notes').upsert(noteRows, {
      onConflict: 'user_id,case_id',
    })
  }
}

// ---------------------------------------------------------------------------
// Public API (same shape as the brief)
// ---------------------------------------------------------------------------

/**
 * Load the full game state. Logged in -> Supabase; otherwise localStorage;
 * nothing anywhere -> DEFAULT_STATE. Async because Supabase reads are async.
 */
export async function loadState(): Promise<GameState> {
  const userId = await currentUserId()
  if (userId) {
    try {
      return await loadFromSupabase(userId)
    } catch {
      // Network/Supabase failure — fall back to the offline cache.
      return readLocalState()
    }
  }
  return readLocalState()
}

/**
 * STRICT remote load for the logged-in hydration path (GameSync). Unlike
 * loadState(), a Supabase failure returns null instead of falling back to
 * this browser's localStorage — that cache may hold GUEST (or a previous
 * account's) progress, and hydrating it into a signed-in session would later
 * be pushed up to the account. Callers must treat null as "retry later" and
 * keep remote saves blocked until a real load succeeds.
 */
export async function loadRemoteState(): Promise<GameState | null> {
  const userId = await currentUserId()
  if (!userId) return null
  try {
    const state = await loadFromSupabase(userId)
    useSyncStore.getState().reportGameSync('ok')
    return state
  } catch {
    useSyncStore.getState().reportGameSync('error')
    return null
  }
}

/**
 * Persist the full game state. Fire-and-forget: returns void, runs async
 * internally so synchronous callers don't block. Logged in -> Supabase +
 * localStorage offline cache; guest -> localStorage only.
 */
export function saveState(state: GameState): void {
  // Always keep the local offline cache fresh.
  writeLocalState(state)
  void (async () => {
    const userId = await currentUserId()
    if (!userId) return
    try {
      await saveToSupabase(userId, state)
      useSyncStore.getState().reportGameSync('ok')
    } catch {
      // Offline / server down — local cache already written, retries on next
      // change. Surface it so the taskbar can show the offline indicator.
      useSyncStore.getState().reportGameSync('error')
    }
  })()
}

/** Load current state, shallow-merge the partial, save. Fire-and-forget. */
export function updateState(partial: Partial<GameState>): void {
  void (async () => {
    const current = await loadState()
    const next: GameState = {
      ...current,
      ...partial,
      settings: { ...current.settings, ...(partial.settings ?? {}) },
      playerNotes: { ...current.playerNotes, ...(partial.playerNotes ?? {}) },
      hintsUsed: { ...current.hintsUsed, ...(partial.hintsUsed ?? {}) },
    }
    saveState(next)
  })()
}

/**
 * Load a single case's notes. Used by the DetectiveNotes scratchpad.
 *
 * When logged in, the ACCOUNT is the source of truth: return the user's stored
 * note, or '' when there is none — never the browser's localStorage note (that
 * would bleed a guest's or a previous account's notes into this account). The
 * localStorage cache is only consulted as an offline fallback when the Supabase
 * query itself fails. Guest mode reads localStorage directly.
 */
export async function loadNote(caseId: string): Promise<string> {
  const userId = await currentUserId()
  if (userId) {
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('content')
        .eq('user_id', userId)
        .eq('case_id', caseId)
        .maybeSingle()
      if (error) throw error
      return data?.content ?? '' // account is authoritative (empty if no note)
    } catch {
      // Offline / server down only — fall back to the cached copy.
      try {
        return localStorage.getItem(NOTE_LS_PREFIX + caseId) ?? ''
      } catch {
        return ''
      }
    }
  }
  try {
    return localStorage.getItem(NOTE_LS_PREFIX + caseId) ?? ''
  } catch {
    return ''
  }
}

/**
 * Save a single case's notes. Fire-and-forget. Always writes the localStorage
 * offline cache; when logged in also upserts the user_notes row.
 */
export function saveNote(caseId: string, content: string): void {
  try {
    localStorage.setItem(NOTE_LS_PREFIX + caseId, content)
  } catch {
    /* ignore */
  }
  void (async () => {
    const userId = await currentUserId()
    if (!userId) return
    try {
      await supabase.from('user_notes').upsert(
        {
          user_id: userId,
          case_id: caseId,
          content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,case_id' }
      )
      useSyncStore.getState().reportGameSync('ok')
    } catch {
      // Offline / server down — local cache already written.
      useSyncStore.getState().reportGameSync('error')
    }
  })()
}

// NOTE: there is intentionally no guest->account migration. Accounts are
// isolated profiles — a freshly signed-in email starts from DEFAULT_STATE and
// only its own play is persisted (see GameSync + AuthContext). Guest progress
// stays in localStorage and is never folded into an account.
