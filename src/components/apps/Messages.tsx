'use client'

import { useState } from 'react'

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
      <aside
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 240,
          flexShrink: 0,
          height: '100%',
          background: '#c0c0c0',
          borderRight: '2px solid #808080',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', height: 36, padding: '0 6px', gap: 4, borderBottom: '2px solid #808080' }}>
          <input
            placeholder="Search"
            style={{
              flex: 1,
              height: 22,
              background: '#ffffff',
              borderStyle: 'solid',
              borderWidth: 2,
              borderColor: '#808080 #ffffff #ffffff #808080',
              padding: '0 6px',
              fontSize: 12,
              fontFamily: 'Arial, sans-serif',
              color: '#000000',
              outline: 'none',
            }}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
          {CONVERSATIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className="flex w-full items-center gap-3 px-2 py-2 text-left"
              style={{ background: activeId === c.id ? '#000080' : 'transparent' }}
              onMouseEnter={(e) => {
                if (activeId !== c.id) e.currentTarget.style.background = '#c8c8c8'
              }}
              onMouseLeave={(e) => {
                if (activeId !== c.id) e.currentTarget.style.background = 'transparent'
              }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white"
                style={{ background: '#000080' }}
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          height: 32,
          flexShrink: 0,
          background: '#c0c0c0',
          borderBottom: '2px solid #808080',
          padding: '0 10px',
          gap: 8,
        }}>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', color: '#000000' }}>
            {active.name}
          </span>
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
                    m.fromMe ? 'rounded-br-md' : 'rounded-bl-md'
                  }`}
                  style={
                    m.fromMe
                      ? { background: '#0a84ff', color: '#ffffff' }
                      : { background: '#e4e4e4', color: '#000000' }
                  }
                >
                  {m.text}
                </div>
              </div>
            )
          })}
        </div>

        {/* Composer (non-functional) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 6px',
          borderTop: '2px solid #808080',
          background: '#c0c0c0',
        }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && draft.trim() && setDraft('')}
            placeholder="Type a message…"
            style={{
              flex: 1,
              height: 22,
              background: '#ffffff',
              borderStyle: 'solid',
              borderWidth: 2,
              borderColor: '#808080 #ffffff #ffffff #808080',
              padding: '0 6px',
              fontSize: 12,
              fontFamily: 'Arial, sans-serif',
              color: '#000000',
              outline: 'none',
            }}
          />
          <button
            onClick={() => draft.trim() && setDraft('')}
            style={{
              background: '#c0c0c0',
              borderStyle: 'solid',
              borderWidth: 2,
              borderColor: '#ffffff #808080 #808080 #ffffff',
              padding: '1px 10px',
              fontSize: 12,
              fontFamily: 'Arial, sans-serif',
              color: '#000000',
              cursor: 'default',
              height: 22,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
