'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ExploreContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url')

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Watch Analysis Dashboard</h1>
          {url && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Analyzing URL:</p>
              <p className="text-slate-200 break-all">{decodeURIComponent(url)}</p>
            </div>
          )}
        </div>

        {/* Placeholder for results dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Watch Information</h2>
            <p className="text-slate-400">
              Watch details will be displayed here after scraping and processing the Chrono24 listing.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Price Analysis</h2>
            <p className="text-slate-400">
              Price comparison and historical data will be shown here.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 md:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">Market Trends</h2>
            <p className="text-slate-400">
              Interactive charts and trend analysis will be displayed in this section.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">Loading...</div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  )
}
