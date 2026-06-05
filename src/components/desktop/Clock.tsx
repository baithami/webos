'use client'

import { useEffect, useState } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function format(now: Date): string {
  const day = DAYS[now.getDay()]
  const month = MONTHS[now.getMonth()]
  const date = now.getDate()
  let hours = now.getHours()
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${day} ${month} ${date}  ${hours}:${minutes} ${ampm}`
}

/** Live menu-bar clock. Updates every 30s, aligned to the minute. */
export default function Clock() {
  const [label, setLabel] = useState('')

  useEffect(() => {
    const tick = () => setLabel(format(new Date()))
    tick()
    const interval = setInterval(tick, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Render nothing until the client tick fills it in (avoids hydration drift).
  return <span className="tabular-nums">{label}</span>
}
