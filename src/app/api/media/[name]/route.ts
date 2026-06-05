import { NextRequest, NextResponse } from 'next/server'
import { readMedia, deleteMedia, contentTypeFor } from '@/lib/server/storage'

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

// DELETE /api/media/<name> → remove the file from disk.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { name: string } }
) {
  const name = decodeURIComponent(params.name)
  const ok = await deleteMedia(name)
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 })
}
