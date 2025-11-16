import Link from 'next/link'

interface ExtractedData {
  brand: string | null
  model: string | null
  reference: string | null
  url: string
}

interface PageProps {
  searchParams: { url?: string }
}

async function fetchWatchData(url: string): Promise<ExtractedData | null> {
  try {
    const apiUrl = `http://localhost:3000/api/extract?url=${encodeURIComponent(url)}`
    const response = await fetch(apiUrl, { cache: 'no-store' })

    if (!response.ok) {
      console.error('Failed to fetch watch data:', response.statusText)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching watch data:', error)
    return null
  }
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const url = searchParams.url
  let watchData: ExtractedData | null = null

  // Fetch data on the server if URL is provided
  if (url) {
    watchData = await fetchWatchData(url)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-white">
            ChronoCaveat: Watch Research Dashboard
          </h1>
          <Link
            href="/"
            className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Home</span>
          </Link>
        </div>

        {/* URL Display */}
        {url && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-slate-300 mb-2">Analyzing Watch:</p>
            <p className="text-slate-100 break-all font-mono text-sm">
              {decodeURIComponent(url)}
            </p>
          </div>
        )}
      </div>

      {/* Dashboard Cards Grid */}
      <div className="space-y-6">
        {/* Model Information Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">⌚</div>
            <h2 className="text-2xl font-semibold text-white">Model Information</h2>
          </div>

          {watchData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Brand
                  </label>
                  <p className="text-lg text-slate-100">
                    {watchData.brand || '—'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Reference Number
                  </label>
                  <p className="text-lg text-slate-100">
                    {watchData.reference || '—'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Model
                </label>
                <p className="text-lg text-slate-100">
                  {watchData.model || '—'}
                </p>
              </div>

              <p className="text-slate-500 text-sm mt-4 pt-4 border-t border-slate-700">
                Additional specifications, year, condition, and authenticity information will be added in future updates.
              </p>
            </div>
          ) : (
            <>
              <p className="text-slate-400 italic">
                {url ? 'Loading watch information...' : 'Enter a Chrono24 URL to see watch details'}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Detailed specifications, model number, reference, year, condition, and authenticity information.
              </p>
            </>
          )}
        </div>

        {/* Other Listings Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">🔍</div>
            <h2 className="text-2xl font-semibold text-white">Other Listings (Chrono24 + eBay)</h2>
          </div>
          <p className="text-slate-400 italic mb-4">Coming soon...</p>
          <p className="text-slate-500 text-sm mb-4">
            Compare similar watches from multiple marketplaces to find the best deals.
          </p>
          {/* Grid placeholder for future listings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
              <p className="text-slate-500 text-sm">Listing placeholder</p>
            </div>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
              <p className="text-slate-500 text-sm">Listing placeholder</p>
            </div>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
              <p className="text-slate-500 text-sm">Listing placeholder</p>
            </div>
          </div>
        </div>

        {/* Price Trends Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">📈</div>
            <h2 className="text-2xl font-semibold text-white">Price Trends</h2>
          </div>
          <p className="text-slate-400 italic">Coming soon...</p>
          <p className="text-slate-500 text-sm mt-2">
            Historical pricing data, market trends, and price predictions based on market analysis.
          </p>
          {/* Chart placeholder */}
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-16 text-center mt-4">
            <p className="text-slate-500">Chart visualization area</p>
          </div>
        </div>

        {/* Background Reading Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">📚</div>
            <h2 className="text-2xl font-semibold text-white">Background Reading</h2>
          </div>
          <p className="text-slate-400 italic">Coming soon...</p>
          <p className="text-slate-500 text-sm mt-2">
            Articles, reviews, and resources about this watch model from trusted sources.
          </p>
          {/* List placeholder for future articles */}
          <div className="space-y-3 mt-4">
            <div className="border-l-4 border-slate-600 pl-4 py-2">
              <p className="text-slate-500 text-sm">Article link placeholder</p>
            </div>
            <div className="border-l-4 border-slate-600 pl-4 py-2">
              <p className="text-slate-500 text-sm">Article link placeholder</p>
            </div>
            <div className="border-l-4 border-slate-600 pl-4 py-2">
              <p className="text-slate-500 text-sm">Article link placeholder</p>
            </div>
          </div>
        </div>

        {/* Community Feedback Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">💬</div>
            <h2 className="text-2xl font-semibold text-white">Community Feedback</h2>
          </div>
          <p className="text-slate-400 italic">Coming soon...</p>
          <p className="text-slate-500 text-sm mt-2">
            User reviews, ratings, and community discussions about this watch model.
          </p>
          {/* Feedback placeholder */}
          <div className="space-y-3 mt-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-500 text-sm">Community feedback placeholder</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-500 text-sm">Community feedback placeholder</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="mt-12"></div>
    </div>
  )
}
