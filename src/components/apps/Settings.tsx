'use client'

import { useState } from 'react'
import { Palette, Image as ImageIcon, Database, Info, Check } from 'lucide-react'
import { useSystemStore } from '@/store/useSystemStore'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { ACCENT_COLORS } from '@/lib/constants'
import { WALLPAPERS } from '@/lib/wallpapers'

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

  return (
    <div>
      <SectionTitle>Wallpaper</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
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
