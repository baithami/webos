import { NextRequest, NextResponse } from 'next/server'
import { writeState } from '@/lib/server/storage'
import { seedFileSystem } from '@/lib/fs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/reset?key=<uid|guest> → wipe that account's saved state and reseed
// to defaults.
export async function POST(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key') || 'guest'
  const nodes = seedFileSystem()
  await writeState(key, { nodes, settings: null, savedAt: Date.now() })
  return NextResponse.json({ ok: true })
}
