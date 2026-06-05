'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Palette,
  Image as ImageIcon,
  Database,
  Info,
  Check,
  Upload,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { useSystemStore } from '@/store/useSystemStore'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { useUIStore } from '@/store/useUIStore'
import { ACCENT_COLORS } from '@/lib/constants'
import { WALLPAPERS } from '@/lib/wallpapers'
import { listMedia, uploadMedia, deleteMedia, type MediaItem } from '@/lib/upload'

type Section = 'appearance' | 'wallpaper' | 'storage' | 'about'

const SECTIONS: { id: Section; label: string; icon: typeof Palette }[] = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'wallpaper', label: 'Wallpaper', icon: ImageIcon },
  { id: 'storage', label: 'Storage', icon: Database },
  { id: 'about', label: 'About', icon: Info },
]

export default function Settings() {
  const [section, setSection] = useState<Section>('appearance')

  return (
    <div className="flex h-full w-full">
      <aside className="h-full w-44 shrink-0 bg-[var(--color-sidebar-bg)] p-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] ${
                section === s.id
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-white/5'
              }`}
            >
              <Icon size={15} />
              {s.label}
            </button>
          )
        })}
      </aside>

      <div className="min-w-0 flex-1 overflow-auto p-6">
        {section === 'appearance' && <Appearance />}
        {section === 'wallpaper' && <WallpaperPicker />}
        {section === 'storage' && <Storage />}
        {section === 'about' && <About />}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-[17px] font-semibold text-[var(--color-text-primary)]">
      {children}
    </h2>
  )
}

function Appearance() {
  const theme = useSystemStore((s) => s.theme)
  const setTheme = useSystemStore((s) => s.setTheme)
  const accent = useSystemStore((s) => s.accent)
  const setAccent = useSystemStore((s) => s.setAccent)

  return (
    <div>
      <SectionTitle>Appearance</SectionTitle>

      <p className="mb-2 text-[13px] text-[var(--color-text-secondary)]">Theme</p>
      <div className="mb-6 inline-flex rounded-lg bg-black/20 p-1">
        {(['dark', 'light'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`rounded-md px-4 py-1.5 text-[13px] capitalize ${
              theme === t
                ? 'bg-white/15 text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[13px] text-[var(--color-text-secondary)]">
        Accent color
      </p>
      <div className="flex flex-wrap gap-3">
        {ACCENT_COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => setAccent(c.value)}
            aria-label={c.name}
            title={c.name}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: c.value,
              boxShadow:
                accent === c.value
                  ? `0 0 0 2px var(--color-window-bg), 0 0 0 4px ${c.value}`
                  : 'none',
            }}
          >
            {accent === c.value && <Check size={16} className="text-white" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function WallpaperPicker() {
  const wallpaperId = useSystemStore((s) => s.wallpaperId)
  const setWallpaper = useSystemStore((s) => s.setWallpaper)
  const pushNotification = useUIStore((s) => s.pushNotification)

  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [photos, setPhotos] = useState<MediaItem[]>([])

  const refresh = async () => setPhotos(await listMedia())

  // Load the server media folder on open (also reflects files added on disk).
  useEffect(() => {
    refresh()
  }, [])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    const { saved, skipped } = await uploadMedia(files)
    await refresh()
    setBusy(false)
    if (saved.length > 0) setWallpaper(saved[0].url)
    pushNotification({
      appId: 'settings',
      title: saved.length ? 'Photos uploaded' : 'Upload failed',
      body:
        `${saved.length} photo${saved.length === 1 ? '' : 's'} saved to the media folder.` +
        (skipped.length ? ` ${skipped.length} skipped (${skipped[0].reason}).` : ''),
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const removePhoto = async (item: MediaItem) => {
    if (await deleteMedia(item.name)) {
      if (wallpaperId === item.url) setWallpaper(WALLPAPERS[0].id)
      await refresh()
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle>Wallpaper</SectionTitle>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white hover:brightness-110 disabled:opacity-60"
        >
          <Upload size={15} />
          {busy ? 'Uploading…' : 'Upload Photos'}
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

      {/* Built-in presets */}
      <p className="mb-2 text-[13px] text-[var(--color-text-secondary)]">
        Default Wallpapers
      </p>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {WALLPAPERS.map((w) => (
          <button
            key={w.id}
            onClick={() => setWallpaper(w.id)}
            className={`group relative overflow-hidden rounded-xl ${
              wallpaperId === w.id
                ? 'ring-2 ring-[var(--color-accent)]'
                : 'ring-1 ring-white/10'
            }`}
            style={{ aspectRatio: '16/10' }}
          >
            <div className="h-full w-full" style={{ background: w.gradient }} />
            <span className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 text-left text-[12px] text-white">
              {w.name}
            </span>
            {wallpaperId === w.id && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]">
                <Check size={13} className="text-white" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Uploaded photos (the server media folder) */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Your Photos
        </p>
        <button
          onClick={refresh}
          className="flex items-center gap-1 text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {photos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--color-window-border)] p-4 text-center text-[12px] text-[var(--color-text-tertiary)]">
          No photos yet. Use “Upload Photos” above — or drop image files into the
          server’s <code className="text-[var(--color-text-secondary)]">media/</code>{' '}
          folder and hit Refresh.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((item) => {
            const selected = wallpaperId === item.url
            return (
              <div
                key={item.name}
                className={`group relative overflow-hidden rounded-xl ${
                  selected ? 'ring-2 ring-[var(--color-accent)]' : 'ring-1 ring-white/10'
                }`}
                style={{ aspectRatio: '16/10' }}
              >
                <button onClick={() => setWallpaper(item.url)} className="h-full w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </button>
                <span className="pointer-events-none absolute bottom-0 left-0 right-0 truncate bg-black/40 px-2 py-1 text-left text-[11px] text-white">
                  {item.name}
                </span>
                {selected && (
                  <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]">
                    <Check size={13} className="text-white" />
                  </span>
                )}
                <button
                  onClick={() => removePhoto(item)}
                  aria-label={`Delete ${item.name}`}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white/80 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Storage() {
  const reset = useFileSystemStore((s) => s.reset)
  const count = useFileSystemStore((s) => Object.keys(s.nodes).length)
  const [confirm, setConfirm] = useState(false)

  return (
    <div>
      <SectionTitle>Storage</SectionTitle>
      <p className="mb-4 text-[13px] text-[var(--color-text-secondary)]">
        Your file system currently holds{' '}
        <span className="text-[var(--color-text-primary)]">{count}</span> items,
        stored in this browser.
      </p>
      <button
        onClick={() => {
          if (confirm) {
            reset()
            setConfirm(false)
          } else {
            setConfirm(true)
          }
        }}
        onBlur={() => setConfirm(false)}
        className="rounded-lg bg-[var(--color-close)] px-4 py-2 text-[13px] font-medium text-white hover:brightness-110"
      >
        {confirm ? 'Click again to confirm reset' : 'Reset file system'}
      </button>
    </div>
  )
}

function About() {
  const name = process.env.NEXT_PUBLIC_APP_NAME ?? 'WebOS'
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'
  return (
    <div>
      <SectionTitle>About</SectionTitle>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-2xl font-bold text-white">
          W
        </div>
        <div>
          <p className="text-[17px] font-semibold text-[var(--color-text-primary)]">
            {name}
          </p>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Version {version}
          </p>
        </div>
      </div>
      <p className="mt-5 max-w-md text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        A browser-based operating system built with Next.js, React, TypeScript,
        Tailwind CSS, Framer Motion, and Zustand.
      </p>
    </div>
  )
}
