'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/useSessionStore'
import { Z } from '@/lib/constants'

/** Full black sleep overlay. Any key press or click wakes (→ lock screen). */
export default function SleepScreen() {
  const wake = useSessionStore((s) => s.wake)

  useEffect(() => {
    const onKey = () => wake()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [wake])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      onClick={wake}
      className="fixed inset-0 bg-black"
      style={{ zIndex: Z.sleepScreen }}
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[13px] text-white/40"
      >
        Click or press any key to wake
      </motion.p>
    </motion.div>
  )
}
