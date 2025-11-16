'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [url, setUrl] = useState('')
  const router = useRouter()

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (url.trim()) {
      const encodedUrl = encodeURIComponent(url.trim())
      router.push(`/explore?url=${encodedUrl}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Discover Watch Market Insights
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Analyze Chrono24 watch listings, compare prices, and explore market trends with powerful data visualization
          </p>
        </div>

        {/* URL Input Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="chrono24-url" className="block text-sm font-medium text-slate-200 mb-2">
                Chrono24 Watch URL
              </label>
              <input
                type="url"
                id="chrono24-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.chrono24.com/rolex/..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-2 text-sm text-slate-400">
                Paste a Chrono24 watch listing URL to analyze pricing, history, and market data
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Analyze Watch
            </button>
          </form>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Price Analysis</h3>
            <p className="text-slate-400 text-sm">
              Compare current prices with historical data and market averages
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">⌚</div>
            <h3 className="text-lg font-semibold text-white mb-2">Watch Details</h3>
            <p className="text-slate-400 text-sm">
              Comprehensive specifications and condition information
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-lg font-semibold text-white mb-2">Market Trends</h3>
            <p className="text-slate-400 text-sm">
              Track pricing trends and market movements over time
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
