import { NextRequest, NextResponse } from 'next/server'
import { listMedia, saveMedia } from '@/lib/server/storage'

// The media folder is mutable at runtime, so never cache these.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BYTES = 15 * 1024 * 1024 // 15 MB per file

// GET /api/media → list the media folder (reflects files added on disk too).
export async function GET() {
  const files = await listMedia()
  return NextResponse.json({ files })
}

// POST /api/media → upload one or more images (multipart form field "file").
export async function POST(req: NextRequest) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'expected multipart form' }, { status: 400 })
  }

  const parts = form.getAll('file').filter((p): p is File => p instanceof File)
  if (parts.length === 0) {
    return NextResponse.json({ error: 'no files' }, { status: 400 })
  }

  const saved = []
  const skipped: { name: string; reason: string }[] = []

  for (const file of parts) {
    if (!file.type.startsWith('image/')) {
      skipped.push({ name: file.name, reason: 'not an image' })
      continue
    }
    if (file.size > MAX_BYTES) {
      skipped.push({ name: file.name, reason: 'too large' })
      continue
    }
    try {
      const bytes = Buffer.from(await file.arrayBuffer())
      saved.push(await saveMedia(bytes, file.name || 'image.jpg'))
    } catch {
      skipped.push({ name: file.name, reason: 'write failed' })
    }
  }

  return NextResponse.json({ saved, skipped })
}
