import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Single browser Supabase client for the app. Auth + cross-device persistence
// only — sql.js, the query engine, and all game logic are untouched.
//
// FLOW: this is a pure client-side SPA (no server component / route handler /
// middleware reads the auth session), so we use the supabase-js client with the
// IMPLICIT flow + localStorage. The implicit flow returns the session tokens in
// the magic-link redirect URL fragment and establishes the session entirely in
// the browser via detectSessionInUrl — no PKCE code-verifier and no server-side
// /auth/callback route required. (The @supabase/ssr createBrowserClient defaults
// to PKCE + cookie storage, which needs a server callback route to exchange the
// code; without one, magic links bounce back to the login screen.)
//
// The app must still boot and play in "guest mode" when no Supabase project is
// configured (placeholder env values). So we never let client construction
// throw: missing/placeholder env falls back to a syntactically-valid dummy URL,
// and `isSupabaseConfigured()` gates every real network call. When it returns
// false, gameState/AuthContext degrade to localStorage-only.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** True only when real (non-placeholder) Supabase credentials are present. */
export function isSupabaseConfigured(): boolean {
  return (
    /^https:\/\/.+\.supabase\.co/.test(url) &&
    !url.includes('YOUR-PROJECT') &&
    anonKey.length > 20 &&
    !anonKey.includes('YOUR_')
  )
}

export function createClient() {
  // Fall back to a valid dummy URL/key so construction can't throw in guest
  // mode; isSupabaseConfigured() prevents any call from actually being made.
  return createSupabaseClient(
    isSupabaseConfigured() ? url : 'https://placeholder.supabase.co',
    isSupabaseConfigured() ? anonKey : 'placeholder-anon-key',
    {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
}

export const supabase = createClient()

/**
 * Authorization header for the app's own API routes (/api/state, /api/media…),
 * which validate the Supabase access token server-side. Empty in guest mode.
 */
export async function apiAuthHeaders(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured()) return {}
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}
