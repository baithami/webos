import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from '@/components/system/Providers'

export const metadata: Metadata = {
  title: 'WebOS',
  description: 'A browser-based operating system built with Next.js.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1c1c1e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
