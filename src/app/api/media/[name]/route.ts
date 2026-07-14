import { NextRequest, NextResponse } from 'next/server'
import { readMedia, deleteMedia, contentTypeFor } from '@/lib/server/storage'
import { authedUserId, isSupabaseConfigured } from '@/lib/server/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/media/<name> → serve the file bytes.
export async function GET(
  _req: NextRequest,
  { params }: { params: { name: string } }
) {
  const name = decodeURIComponent(params.name)
  const buf = await readMedia(name)
  if (!buf) return new NextResponse('Not found', { status: 404 })
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': contentTypeFor(name),
      // Names are stable; allow caching but revalidate so deletes propagate.
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  })
}

// DELETE /api/media/<name> → remove the file from disk. The media folder is
// shared, so deletion requires a signed-in user when Supabase auth is live.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  if (isSupabaseConfigured() && !(await authedUserId(req))) {
    return NextResponse.json({ error: 'sign in to delete' }, { status: 401 })
  }
  const name = decodeURIComponent(params.name)
  const ok = await deleteMedia(name)
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 })
}
