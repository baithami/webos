'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const CITIES: { name: string; tz: string }[] = [
  { name: 'Cupertino', tz: 'America/Los_Angeles' },
  { name: 'New York', tz: 'America/New_York' },
  { name: 'London', tz: 'Europe/London' },
  { name: 'Dubai', tz: 'Asia/Dubai' },
  { name: 'Tokyo', tz: 'Asia/Tokyo' },
  { name: 'Sydney', tz: 'Australia/Sydney' },
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function ClockApp() {
  const [tab, setTab] = useState<'clock' | 'calendar'>('clock')

  return (
    <div className="flex h-full w-full flex-col bg-[var(--color-window-bg)]">
      <div className="flex h-10 shrink-0 items-center justify-center gap-1 border-b border-[var(--color-window-border)] bg-[var(--color-window-titlebar)]">
        <Tab active={tab === 'clock'} onClick={() => setTab('clock')}>
          World Clock
        </Tab>
        <Tab active={tab === 'calendar'} onClick={() => setTab('calendar')}>
          Calendar
        </Tab>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === 'clock' ? <WorldClock /> : <Calendar />}
      </div>
    </div>
  )
}

function Tab({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-[13px] font-medium ${
        active
          ? 'bg-white/15 text-[var(--color-text-primary)]'
          : 'text-[var(--color-text-secondary)] hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  )
}

function WorldClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {CITIES.map((c) => {
        const time = new Intl.DateTimeFormat('en-US', {
          timeZone: c.tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(now)
        const day = new Intl.DateTimeFormat('en-US', {
          timeZone: c.tz,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }).format(now)
        return (
          <div
            key={c.name}
            className="glass flex flex-col gap-1 rounded-xl p-3"
          >
            <span className="text-[13px] text-[var(--color-text-secondary)]">
              {c.name}
            </span>
            <span className="text-2xl font-light tabular-nums text-[var(--color-text-primary)]">
              {time}
            </span>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">
              {day}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Calendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isToday = (d: number) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()

  const prev = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else setMonth((m) => m - 1)
  }
  const next = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else setMonth((m) => m + 1)
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prev}
          aria-label="Previous month"
          className="rounded-md p-1 text-[var(--color-text-secondary)] hover:bg-white/10"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={next}
          aria-label="Next month"
          className="rounded-md p-1 text-[var(--color-text-secondary)] hover:bg-white/10"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="py-1 text-[11px] font-medium text-[var(--color-text-tertiary)]"
          >
            {w}
          </div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-full text-[13px] ${
              d === null
                ? ''
                : isToday(d)
                  ? 'bg-[var(--color-accent)] font-semibold text-white'
                  : 'text-[var(--color-text-primary)] hover:bg-white/5'
            }`}
          >
            {d ?? ''}
          </div>
        ))}
      </div>
    </div>
  )
}
