'use client'

import { useState } from 'react'
import { Search, Video, Phone, Info, ArrowUp, PenSquare } from 'lucide-react'

// Messages — a static, good-looking iMessage clone. Non-functional: the data is
// mock and the composer doesn't send anywhere. Purely for the look.

interface Message {
  id: number
  text: string
  fromMe: boolean
  time: string
}

interface Conversation {
  id: string
  name: string
  color: string
  preview: string
  time: string
  unread?: number
  messages: Message[]
}

const CONVERSATIONS: Conversation[] = [
  {
    id: 'sara',
    name: 'Sara Chen',
    color: 'from-pink-400 to-rose-500',
    preview: 'Sounds perfect, see you then! 🎉',
    time: '9:41 AM',
    messages: [
      { id: 1, text: 'Hey! Are we still on for coffee tomorrow?', fromMe: false, time: '9:30 AM' },
      { id: 2, text: 'Absolutely 😄 10am at the usual place?', fromMe: true, time: '9:32 AM' },
      { id: 3, text: 'Perfect. I found that book you mentioned btw', fromMe: false, time: '9:35 AM' },
      { id: 4, text: 'No way! Bring it, I’ll buy the coffee', fromMe: true, time: '9:36 AM' },
      { id: 5, text: 'Sounds perfect, see you then! 🎉', fromMe: false, time: '9:41 AM' },
    ],
  },
  {
    id: 'dev',
    name: 'Dev Team',
    color: 'from-indigo-400 to-violet-500',
    preview: 'Marcus: shipped the build ✅',
    time: 'Yesterday',
    unread: 2,
    messages: [
      { id: 1, text: 'Standup in 5 everyone', fromMe: false, time: '10:00 AM' },
      { id: 2, text: 'On my way', fromMe: true, time: '10:01 AM' },
      { id: 3, text: 'shipped the build ✅', fromMe: false, time: '10:42 AM' },
    ],
  },
  {
    id: 'mom',
    name: 'Mom',
    color: 'from-amber-400 to-orange-500',
    preview: 'Call me when you get a chance ❤️',
    time: 'Yesterday',
    messages: [
      { id: 1, text: 'Did you eat today?', fromMe: false, time: '6:12 PM' },
      { id: 2, text: 'Yes mom 😅', fromMe: true, time: '6:30 PM' },
      { id: 3, text: 'Call me when you get a chance ❤️', fromMe: false, time: '6:31 PM' },
    ],
  },
  {
    id: 'alex',
    name: 'Alex Rivera',
    color: 'from-teal-400 to-emerald-500',
    preview: 'haha that meme killed me 💀',
    time: 'Monday',
    messages: [
      { id: 1, text: 'check your email when you can', fromMe: true, time: '2:00 PM' },
      { id: 2, text: 'haha that meme killed me 💀', fromMe: false, time: '2:15 PM' },
    ],
  },
]

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
}

export default function Messages() {
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id)
  const [draft, setDraft] = useState('')
  const active = CONVERSATIONS.find((c) => c.id === activeId)!

  return (
    <div className="flex h-full w-full">
      {/* Conversation list */}
      <aside className="flex h-full w-72 shrink-0 flex-col border-r border-[var(--color-window-border)] bg-[var(--color-sidebar-bg)]">
        <div className="flex h-12 shrink-0 items-center gap-2 px-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-black/20 px-2.5 py-1.5">
            <Search size={14} className="text-[var(--color-text-tertiary)]" />
            <input
              placeholder="Search"
              className="w-full bg-transparent text-[13px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>
          <button
            aria-label="New message"
            className="rounded-md p-1.5 text-[var(--color-accent)] hover:bg-white/10"
          >
            <PenSquare size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
          {CONVERSATIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left ${
                activeId === c.id ? 'bg-[var(--color-accent)]' : 'hover:bg-white/5'
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${c.color} text-[14px] font-semibold text-white`}
              >
                {initials(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`truncate text-[14px] font-semibold ${
                      activeId === c.id ? 'text-white' : 'text-[var(--color-text-primary)]'
                    }`}
                  >
                    {c.name}
                  </span>
                  <span
                    className={`shrink-0 text-[11px] ${
                      activeId === c.id ? 'text-white/70' : 'text-[var(--color-text-tertiary)]'
                    }`}
                  >
                    {c.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`truncate text-[13px] ${
                      activeId === c.id ? 'text-white/80' : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {c.preview}
                  </span>
                  {c.unread && activeId !== c.id && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 text-[11px] font-semibold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Conversation */}
      <div className="flex min-w-0 flex-1 flex-col bg-[var(--color-window-bg)]">
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--color-window-border)] bg-[var(--color-window-titlebar)] px-4">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${active.color} text-[12px] font-semibold text-white`}
          >
            {initials(active.name)}
          </div>
          <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            {active.name}
          </span>
          <div className="ml-auto flex items-center gap-1 text-[var(--color-accent)]">
            <button aria-label="Audio call" className="rounded-md p-1.5 hover:bg-white/10">
              <Phone size={17} />
            </button>
            <button aria-label="Video call" className="rounded-md p-1.5 hover:bg-white/10">
              <Video size={18} />
            </button>
            <button aria-label="Info" className="rounded-md p-1.5 hover:bg-white/10">
              <Info size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto px-4 py-4">
          {active.messages.map((m, i) => {
            const showTime =
              i === 0 || active.messages[i - 1].fromMe !== m.fromMe
            return (
              <div
                key={m.id}
                className={`flex flex-col ${m.fromMe ? 'items-end' : 'items-start'}`}
              >
                {showTime && (
                  <span className="mb-1 mt-2 px-2 text-[10px] text-[var(--color-text-tertiary)]">
                    {m.time}
                  </span>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-[14px] leading-snug ${
                    m.fromMe
                      ? 'rounded-br-md bg-[#0a84ff] text-white'
                      : 'rounded-bl-md bg-[var(--color-sidebar-active)] text-[var(--color-text-primary)]'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            )
          })}
        </div>

        {/* Composer (non-functional) */}
        <div className="flex shrink-0 items-center gap-2 border-t border-[var(--color-window-border)] px-3 py-2.5">
          <div className="flex flex-1 items-center rounded-full border border-[var(--color-window-border)] bg-[var(--color-window-bg)] px-3 py-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="iMessage"
              className="w-full bg-transparent text-[14px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>
          <button
            onClick={() => setDraft('')}
            disabled={!draft.trim()}
            aria-label="Send"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0a84ff] text-white disabled:opacity-30"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
