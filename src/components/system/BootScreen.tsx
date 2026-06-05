'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Apple } from 'lucide-react'
import { useSessionStore } from '@/store/useSessionStore'
import { Z } from '@/lib/constants'

const BOOT_MS = 1800

/** Black Apple-logo boot screen with a filling progress bar. */
export default function BootScreen() {
  const finishBoot = useSessionStore((s) => s.finishBoot)

  useEffect(() => {
    const t = setTimeout(finishBoot, BOOT_MS)
    return () => clearTimeout(t)
  }, [finishBoot])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-black"
      style={{ zIndex: Z.loginScreen + 50 }}
    >
      <Apple size={72} fill="white" strokeWidth={0} className="text-white" />
      <div className="mt-16 h-1.5 w-48 overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full rounded-full bg-white"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: BOOT_MS / 1000, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}
