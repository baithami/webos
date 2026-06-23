'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

// Auth context for CrimeOS. Holds the current Supabase user and exposes
// magic-link sign-in / sign-out. When Supabase isn't configured, this stays
// in guest mode forever (user = null, loading = false) and the app plays
// offline against localStorage.
//
// IMPORTANT: an account is its own isolated profile. We deliberately do NOT
// migrate the browser's guest/localStorage progress into an account on login —
// otherwise whatever was played as a guest (or by a previous account) in this
// browser would bleed into a freshly signed-in account. A brand-new email
// therefore starts from DEFAULT_STATE; thereafter only that account's own play
// is saved to Supabase (see GameSync). Guest mode keeps using localStorage
// separately.

interface AuthContextValue {
  user: User | null
  loading: boolean
  /** Whether real Supabase credentials are present (vs guest-only mode). */
  configured: boolean
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    let active = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      setUser(data.session?.user ?? null)
      setLoading(false)
    })()

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signInWithEmail = async (email: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.')
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }

  const signOut = async () => {
    // Do NOT clear localStorage — the user may keep playing as a guest.
    if (isSupabaseConfigured()) await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured: isSupabaseConfigured(),
        signInWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
