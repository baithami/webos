import type { NextRequest } from 'next/server'

// Server-side Supabase token validation for the API routes. The app's routes
// are internet-exposed (Cloudflare tunnel), so any request touching a real
// account's state must prove it owns that account. The browser client uses the
// implicit flow with localStorage (no auth cookies), so callers attach the
// session's access token as `Authorization: Bearer <token>` and we verify it
// against Supabase's /auth/v1/user endpoint.
//
// Guest mode stays open by design: the shared 'guest' key needs no token, and
// when Supabase isn't configured at all every key collapses to guest-only play.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** Mirrors isSupabaseConfigured() in lib/supabase/client.ts. */
export function isSupabaseConfigured(): boolean {
  return (
    /^https:\/\/.+\.supabase\.co/.test(url) &&
    !url.includes('YOUR-PROJECT') &&
    anonKey.length > 20 &&
    !anonKey.includes('YOUR_')
  )
}

// Verifying a token costs a round-trip to Supabase; saves are debounced at
// ~700ms so cache verdicts briefly to keep rapid save bursts cheap.
const CACHE_TTL_MS = 60_000
const CACHE_MAX = 500
const verdicts = new Map<string, { id: string | null; until: number }>()

/**
 * The authenticated Supabase user id for this request, or null when the
 * request carries no valid token (or Supabase isn't configured).
 */
export async function authedUserId(req: NextRequest): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return null

  const hit = verdicts.get(token)
  if (hit && hit.until > Date.now()) return hit.id

  let id: string | null = null
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.ok) {
      const user = (await res.json()) as { id?: unknown }
      if (typeof user?.id === 'string') id = user.id
    }
  } catch {
    // Supabase unreachable — treat as unauthenticated rather than throwing.
    return null
  }

  if (verdicts.size >= CACHE_MAX) verdicts.clear()
  verdicts.set(token, { id, until: Date.now() + CACHE_TTL_MS })
  return id
}

/**
 * May this request read/write the state stored under `key`?
 * 'guest' is the shared sandbox; any other key must match the token's user id.
 */
export async function authorizedForKey(
  req: NextRequest,
  key: string
): Promise<boolean> {
  if (key === 'guest') return true
  return (await authedUserId(req)) === key
}
