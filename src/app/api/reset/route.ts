import { NextRequest, NextResponse } from 'next/server'
import { writeState } from '@/lib/server/storage'
import { seedFileSystem } from '@/lib/fs'
import { authorizedForKey } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/reset?key=<uid|guest> → wipe that account's saved state and reseed
// to defaults. Account keys require a matching Bearer token.
export async function POST(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key') || 'guest'
  if (!(await authorizedForKey(req, key))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const nodes = seedFileSystem()
  await writeState(key, { nodes, settings: null, savedAt: Date.now() })
  return NextResponse.json({ ok: true })
}
