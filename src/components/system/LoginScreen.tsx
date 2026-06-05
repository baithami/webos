'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Delete } from 'lucide-react'
import { useSessionStore, SESSION_PIN } from '@/store/useSessionStore'
import { getWallpaper } from '@/lib/wallpapers'
import { useSystemStore } from '@/store/useSystemStore'
import { Z } from '@/lib/constants'

const PIN_LENGTH = 4

/** Lock screen with a 4-digit PIN pad. Default PIN is shown as a hint. */
export default function LoginScreen() {
  const unlock = useSessionStore((s) => s.unlock)
  const wallpaperId = useSystemStore((s) => s.wallpaperId)
  const wallpaper = getWallpaper(wallpaperId)

  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)

  const submit = (value: string) => {
    if (!unlock(value)) {
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setPin('')
      }, 450)
    }
  }

  const addDigit = (d: string) => {
    setPin((cur) => {
      if (cur.length >= PIN_LENGTH) return cur
      const next = cur + d
      if (next.length === PIN_LENGTH) submit(next)
      return next
    })
  }

  const backspace = () => setPin((cur) => cur.slice(0, -1))

  // Physical keyboard support.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') addDigit(e.key)
      else if (e.key === 'Backspace') backspace()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ zIndex: Z.loginScreen, background: wallpaper.gradient }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-xl" />

      <motion.div
        animate={shake ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className="relative flex flex-col items-center"
      >
        {/* Avatar */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-4xl font-semibold text-white shadow-xl">
          W
        </div>
        <p className="mt-3 text-[17px] font-medium text-white">WebOS User</p>

        {/* PIN dots */}
        <div className="mt-6 flex gap-3">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-full border border-white/60 ${
                i < pin.length ? 'bg-white' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="mt-7 grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <PadKey key={d} onClick={() => addDigit(d)}>
              {d}
            </PadKey>
          ))}
          <span />
          <PadKey onClick={() => addDigit('0')}>0</PadKey>
          <PadKey onClick={backspace} aria-label="Delete">
            <Delete size={20} />
          </PadKey>
        </div>

        <p className="mt-6 text-[12px] text-white/60">
          Hint: PIN is {SESSION_PIN}
        </p>
      </motion.div>
    </div>
  )
}

function PadKey({
  children,
  onClick,
  ...rest
}: {
  children: React.ReactNode
  onClick: () => void
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl font-light text-white backdrop-blur transition-colors hover:bg-white/20"
      {...rest}
    >
      {children}
    </button>
  )
}
