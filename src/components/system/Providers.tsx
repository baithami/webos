'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/lib/supabase/AuthContext'

// Client boundary for app-wide context providers, mounted from the root
// (server) layout. Currently just Supabase auth.
export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
