'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Upload,
  RefreshCw,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from 'lucide-react'
import { listMedia, uploadMedia, deleteMedia, type MediaItem } from '@/lib/upload'
import { useUIStore } from '@/store/useUIStore'

/**
 * Photos — a library view over the server media folder (the same store the
 * wallpaper picker uses). Add photos with Upload (or by dropping files into the
 * media/ folder on disk), view full-screen, and delete.
 */
export default function Photos() {
  const pushNotification = useUIStore((s) => s.pushNotification)
  const [photos, setPhotos] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [viewer, setViewer] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    setPhotos(await listMedia())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    const { saved, skipped } = await uploadMedia(files)
    await refresh()
    setBusy(false)
    pushNotification({
      appId: 'photos',
      title: saved.length ? 'Photos added' : 'Upload failed',
      body:
        `${saved.length} photo${saved.length === 1 ? '' : 's'} added to your library.` +
        (skipped.length ? ` ${skipped.length} skipped.` : ''),
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const remove = async (item: MediaItem) => {
    if (await deleteMedia(item.name)) {
      setViewer(null)
      await refresh()
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-window-bg)]">
      {/* Toolbar */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--color-window-border)] bg-[var(--color-window-titlebar)] px-4">
        <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          Library
        </span>
        <span className="text-[12px] text-[var(--color-text-tertiary)]">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={refresh}
            aria-label="Refresh"
            className="rounded-md p-1.5 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-[var(--color-text-primary)]"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white hover:brightness-110 disabled:opacity-60"
          >
            <Upload size={15} />
            {busy ? 'Uploading…' : 'Add Photos'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-[13px] text-[var(--color-text-tertiary)]">
            Loading…
          </div>
        ) : photos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--color-text-tertiary)]">
            <ImageIcon size={40} />
            <p className="text-[14px] font-medium text-[var(--color-text-secondary)]">
              No photos yet
            </p>
            <p className="max-w-xs text-center text-[12px]">
              Click “Add Photos” to import images into your library.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
            {photos.map((item, i) => (
              <button
                key={item.name}
                onClick={() => setViewer(i)}
                className="group relative aspect-square overflow-hidden rounded-lg bg-black/20 ring-1 ring-white/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {viewer !== null && photos[viewer] && (
        <Lightbox
          items={photos}
          index={viewer}
          onIndex={setViewer}
          onClose={() => setViewer(null)}
          onDelete={remove}
        />
      )}
    </div>
  )
}

function Lightbox({
  items,
  index,
  onIndex,
  onClose,
  onDelete,
}: {
  items: MediaItem[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
  onDelete: (item: MediaItem) => void
}) {
  const item = items[index]
  const prev = () => onIndex((index - 1 + items.length) % items.length)
  const next = () => onIndex((index + 1) % items.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length])

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col bg-black/90"
      onClick={onClose}
    >
      <div
        className="flex h-12 shrink-0 items-center justify-between px-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="truncate text-[13px]">{item.name}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete(item)}
            aria-label="Delete"
            className="rounded-md p-1.5 text-white/80 hover:bg-white/15 hover:text-[var(--color-close)]"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
        {items.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="Previous"
            className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.name}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
        />
        {items.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="Next"
            className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </div>
  )
}
