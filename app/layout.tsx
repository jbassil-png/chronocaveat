import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChronoCaveat - Chrono24 Watch Analysis',
  description: 'Analyze and explore watch listings from Chrono24',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-[#0D0D0D] via-[#0D0D0D] to-[#0D0D0D]">
        <main>{children}</main>
      </body>
    </html>
  )
}
