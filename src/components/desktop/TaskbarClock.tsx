'use client'

import { useEffect, useState } from 'react'

// The system-tray clock — updates every 30s. Empty on the server / first paint
// to avoid a hydration mismatch, then fills in on mount.
export default function TaskbarClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [])
  return (
    <span
      style={{
        fontSize: 11,
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        userSelect: 'none',
        minWidth: 42,
        textAlign: 'center',
      }}
    >
      {time}
    </span>
  )
}
