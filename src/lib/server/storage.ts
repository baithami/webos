import { promises as fs } from 'fs'
import path from 'path'

// Server-only media library. NEVER import this from a client component — it uses
// the Node fs module. Uploaded images live as REAL FILES in a project folder
// (default ./media, override with WEBOS_MEDIA_DIR) so they can also be added or
// removed directly on disk. The app lists this folder and serves it by URL.

const MEDIA_DIR =
  process.env.WEBOS_MEDIA_DIR || path.join(process.cwd(), 'media')

export const MEDIA_URL_PREFIX = '/api/media/'
const MAX_LIST = 500

async function ensureDir(): Promise<void> {
  await fs.mkdir(MEDIA_DIR, { recursive: true })
}

// Stored names are restricted to a URL-safe charset (no spaces, no traversal).
const SAFE_NAME = /^[A-Za-z0-9._-]+$/
export function isSafeName(name: string): boolean {
  return SAFE_NAME.test(name) && !name.includes('..')
}

/** Turn an arbitrary upload filename into a safe on-disk name. */
export function sanitizeName(name: string): string {
  const dot = name.lastIndexOf('.')
  const rawBase = dot > 0 ? name.slice(0, dot) : name
  const rawExt = dot > 0 ? name.slice(dot + 1) : ''
  const base =
    rawBase
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .slice(0, 64) || 'image'
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)
  return ext ? `${base}.${ext}` : base
}

export interface MediaEntry {
  name: string
  url: string
  size: number
  mtime: number
}

export async function listMedia(): Promise<MediaEntry[]> {
  try {
    const names = await fs.readdir(MEDIA_DIR)
    const entries: MediaEntry[] = []
    for (const name of names) {
      if (name.startsWith('.') || !isSafeName(name)) continue
      try {
        const stat = await fs.stat(path.join(MEDIA_DIR, name))
        if (!stat.isFile()) continue
        entries.push({
          name,
          url: MEDIA_URL_PREFIX + name,
          size: stat.size,
          mtime: stat.mtimeMs,
        })
      } catch {
        // skip unreadable entries
      }
    }
    entries.sort((a, b) => b.mtime - a.mtime)
    return entries.slice(0, MAX_LIST)
  } catch {
    return []
  }
}

/** Write bytes under a safe, de-duplicated version of `desiredName`. */
export async function saveMedia(
  bytes: Buffer,
  desiredName: string
): Promise<MediaEntry> {
  await ensureDir()
  const safe = sanitizeName(desiredName)
  const existing = new Set(await fs.readdir(MEDIA_DIR).catch(() => []))

  let finalName = safe
  if (existing.has(finalName)) {
    const dot = safe.lastIndexOf('.')
    const base = dot > 0 ? safe.slice(0, dot) : safe
    const ext = dot > 0 ? safe.slice(dot) : ''
    let i = 2
    while (existing.has(`${base}-${i}${ext}`)) i += 1
    finalName = `${base}-${i}${ext}`
  }

  await fs.writeFile(path.join(MEDIA_DIR, finalName), bytes)
  const stat = await fs.stat(path.join(MEDIA_DIR, finalName))
  return {
    name: finalName,
    url: MEDIA_URL_PREFIX + finalName,
    size: stat.size,
    mtime: stat.mtimeMs,
  }
}

export async function readMedia(name: string): Promise<Buffer | null> {
  if (!isSafeName(name)) return null
  try {
    return await fs.readFile(path.join(MEDIA_DIR, name))
  } catch {
    return null
  }
}

export async function deleteMedia(name: string): Promise<boolean> {
  if (!isSafeName(name)) return false
  try {
    await fs.unlink(path.join(MEDIA_DIR, name))
    return true
  } catch {
    return false
  }
}

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  heic: 'image/heic',
  avif: 'image/avif',
}

export function contentTypeFor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

export const MEDIA_DIR_PATH = MEDIA_DIR
