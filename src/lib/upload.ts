// Client helpers for the server-backed media library (see /api/media). Photos
// are downscaled in the browser before upload to keep them light, then stored
// as real files in the server's media/ folder. Uploads/deletes require a
// signed-in user when Supabase auth is configured (the media folder is shared).

import { apiAuthHeaders } from '@/lib/supabase/client'

const DOWNSCALE_OVER_BYTES = 800_000
const MAX_DIMENSION = 2560
const JPEG_QUALITY = 0.85

export interface MediaItem {
  name: string
  url: string
  size: number
  mtime: number
}

export async function listMedia(): Promise<MediaItem[]> {
  try {
    const res = await fetch('/api/media', { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.files) ? data.files : []
  } catch {
    return []
  }
}

export async function deleteMedia(name: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/media/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: await apiAuthHeaders(),
    })
    return res.ok
  } catch {
    return false
  }
}

export interface UploadResult {
  saved: MediaItem[]
  skipped: { name: string; reason: string }[]
}

/** Downscale large images client-side, then upload to the media folder. */
export async function uploadMedia(files: ArrayLike<File>): Promise<UploadResult> {
  const list = Array.from(files as ArrayLike<File>)
  const form = new FormData()
  const skipped: { name: string; reason: string }[] = []

  for (const file of list) {
    if (!file.type.startsWith('image/')) {
      skipped.push({ name: file.name, reason: 'not an image' })
      continue
    }
    try {
      const blob = await prepareImage(file)
      // Keep the original-ish name; if we re-encoded to JPEG, fix the extension.
      const name = blob === file ? file.name : toJpegName(file.name)
      form.append('file', blob, name)
    } catch {
      skipped.push({ name: file.name, reason: 'could not read' })
    }
  }

  let saved: MediaItem[] = []
  if (form.has('file')) {
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        body: form,
        headers: await apiAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        saved = data.saved ?? []
        for (const s of data.skipped ?? []) skipped.push(s)
      } else {
        skipped.push({
          name: 'upload',
          reason: res.status === 401 ? 'sign in to upload' : 'server rejected',
        })
      }
    } catch {
      skipped.push({ name: 'upload', reason: 'network error' })
    }
  }

  return { saved, skipped }
}

function toJpegName(name: string): string {
  const dot = name.lastIndexOf('.')
  return (dot > 0 ? name.slice(0, dot) : name) + '.jpg'
}

/** Returns the original File when small, or a downscaled JPEG Blob when large. */
async function prepareImage(file: File): Promise<Blob> {
  if (file.size <= DOWNSCALE_OVER_BYTES) return file
  const dataURL = await fileToDataURL(file)
  const blob = await downscaleToBlob(dataURL)
  return blob ?? file
}

function fileToDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function downscaleToBlob(dataURL: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      const longest = Math.max(width, height)
      if (longest > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / longest
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(null)
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY)
    }
    img.onerror = () => resolve(null)
    img.src = dataURL
  })
}
