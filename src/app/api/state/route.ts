import { NextRequest, NextResponse } from 'next/server'
import { readState, writeState } from '@/lib/server/storage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/state?key=<uid|guest> → that account's saved { nodes, settings },
// or nulls if nothing saved yet.
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key') || 'guest'
  const state = await readState(key)
  return NextResponse.json(state ?? { nodes: null, settings: null })
}

// PUT /api/state → persist the whole file-system tree + user settings.
export async function PUT(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const { nodes, settings } = (body ?? {}) as {
    nodes?: unknown
    settings?: unknown
  }
  if (!nodes || typeof nodes !== 'object') {
    return NextResponse.json({ error: 'missing nodes' }, { status: 400 })
  }

  const key = new URL(req.url).searchParams.get('key') || 'guest'
  await writeState(key, { nodes, settings: settings ?? null, savedAt: Date.now() })
  return NextResponse.json({ ok: true })
}
