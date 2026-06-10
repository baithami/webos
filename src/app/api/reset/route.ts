import { NextResponse } from 'next/server'
import { writeState } from '@/lib/server/storage'
import { seedFileSystem } from '@/lib/fs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/reset → wipe the saved state and reseed to defaults.
export async function POST() {
  const nodes = seedFileSystem()
  await writeState({ nodes, settings: null, savedAt: Date.now() })
  return NextResponse.json({ ok: true })
}
