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
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-white">ChronoCaveat</h1>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
