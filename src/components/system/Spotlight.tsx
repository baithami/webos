'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, CornerDownLeft } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useWindowStore } from '@/store/useWindowStore'
import { useAppIntent } from '@/store/useAppIntent'
import { useFileSystemStore } from '@/store/useFileSystemStore'
import { spotlightVariants } from '@/lib/animations'
import { Z } from '@/lib/constants'
import { APPS } from '@/lib/apps'
import {
  pathString,
  nodeCategory,
  type FSNode,
} from '@/lib/fs'
import { categoryMeta } from '@/lib/fileTypes'
import { FileIcon } from '@/components/apps/finder/shared'

interface Result {
  key: string
  kind: 'app' | 'file'
  title: string
  subtitle: string
  icon: React.ReactNode
  run: () => void
}

const MAX_RESULTS = 8

export default function Spotlight() {
  const closeSpotlight = useUIStore((s) => s.closeSpotlight)
  const openApp = useWindowStore((s) => s.openApp)
  const openFile = useAppIntent((s) => s.openFile)
  const nodes = useFileSystemStore((s) => s.nodes)

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const appHits: Result[] = APPS.filter((a) =>
      a.name.toLowerCase().includes(q)
    ).map((a) => {
      const Icon = a.icon
      return {
        key: 'app:' + a.id,
        kind: 'app',
        title: a.name,
        subtitle: 'Application',
        icon: (
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-b ${a.tile}`}
          >
            <Icon size={16} className="text-white" />
          </div>
        ),
        run: () => {
          openApp(a.id)
          closeSpotlight()
        },
      }
    })

    const fileHits: Result[] = Object.values(nodes)
      .filter((n: FSNode) => n.id !== 'root' && n.name.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS)
      .map((n) => ({
        key: 'file:' + n.id,
        kind: 'file' as const,
        title: n.name,
        subtitle: pathString(nodes, n.id),
        icon: <FileIcon node={n} size={22} />,
        run: () => {
          if (n.type === 'folder') {
            openApp('finder')
          } else {
            const app = categoryMeta(nodeCategory(n)).defaultApp
            if (app) openFile(app, n.id)
          }
          closeSpotlight()
        },
      }))

    return [...appHits, ...fileHits].slice(0, MAX_RESULTS)
  }, [query, nodes, openApp, openFile, closeSpotlight])

  // Keep the active index within bounds as results change.
  useEffect(() => setActive(0), [query])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      results[active]?.run()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeSpotlight()
    }
  }

  return (
    <div
      className="absolute inset-0 flex items-start justify-center pt-[18vh]"
      style={{ zIndex: Z.spotlight }}
      onClick={closeSpotlight}
    >
      <motion.div
        variants={spotlightVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="glass w-[560px] max-w-[90vw] overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: 'var(--color-spotlight-bg)' }}
      >
        {/* Search field */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Search size={22} className="text-[var(--color-text-secondary)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Spotlight Search"
            spellCheck={false}
            className="flex-1 bg-transparent text-[22px] font-light text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>

        {results.length > 0 && (
          <div className="max-h-80 overflow-auto border-t border-[var(--color-spotlight-border)] p-2">
            {results.map((r, i) => (
              <button
                key={r.key}
                onMouseEnter={() => setActive(i)}
                onClick={r.run}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                  i === active ? 'bg-[var(--color-accent)] text-white' : ''
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                  {r.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">
                    {r.title}
                  </span>
                  <span
                    className={`block truncate text-[11px] ${
                      i === active
                        ? 'text-white/70'
                        : 'text-[var(--color-text-tertiary)]'
                    }`}
                  >
                    {r.subtitle}
                  </span>
                </span>
                {i === active && <CornerDownLeft size={14} className="opacity-70" />}
              </button>
            ))}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="border-t border-[var(--color-spotlight-border)] px-4 py-6 text-center text-[13px] text-[var(--color-text-tertiary)]">
            No results for “{query}”
          </div>
        )}
      </motion.div>
    </div>
  )
}
