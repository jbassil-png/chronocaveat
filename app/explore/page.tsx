'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

interface ExtractedData {
  brand: string | null
  model: string | null
  reference: string | null
  url: string
}

interface Listing {
  title: string
  price: string
  url: string
  image: string | null
  sellerLocation: string | null
}

interface EbayListing {
  title: string
  price: string
  url: string
  image: string | null
  condition: string | null
  sellerLocation: string | null
}

function ExploreContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url')
  const [watchData, setWatchData] = useState<ExtractedData | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [ebayListings, setEbayListings] = useState<EbayListing[]>([])
  const [loading, setLoading] = useState(false)
  const [listingsLoading, setListingsLoading] = useState(false)
  const [ebayLoading, setEbayLoading] = useState(false)

  useEffect(() => {
    if (!url) return

    const fetchWatchData = async () => {
      setLoading(true)
      try {
        const apiUrl = `/api/extract?url=${encodeURIComponent(url)}`
        const response = await fetch(apiUrl, { cache: 'no-store' })

        if (!response.ok) {
          console.error('Failed to fetch watch data:', response.statusText)
          setWatchData(null)
          return
        }

        const data = await response.json()
        setWatchData(data)
      } catch (error) {
        console.error('Error fetching watch data:', error)
        setWatchData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchWatchData()
  }, [url])

  // Fetch Chrono24 listings when we have a reference number
  useEffect(() => {
    if (!watchData?.reference) {
      setListings([])
      return
    }

    const fetchListings = async () => {
      setListingsLoading(true)
      try {
        const response = await fetch(
          `/api/chrono24?reference=${encodeURIComponent(watchData.reference as string)}`,
          { cache: 'no-store' }
        )

        if (!response.ok) {
          console.error('Failed to fetch listings:', response.statusText)
          setListings([])
          return
        }

        const data = await response.json()
        setListings(data)
      } catch (error) {
        console.error('Error fetching listings:', error)
        setListings([])
      } finally {
        setListingsLoading(false)
      }
    }

    fetchListings()
  }, [watchData])

  // Fetch eBay listings when we have a reference number
  useEffect(() => {
    if (!watchData?.reference) {
      setEbayListings([])
      return
    }

    const fetchEbayListings = async () => {
      setEbayLoading(true)
      try {
        const response = await fetch(
          `/api/ebay?reference=${encodeURIComponent(watchData.reference as string)}`,
          { cache: 'no-store' }
        )

        if (!response.ok) {
          console.error('Failed to fetch eBay listings:', response.statusText)
          setEbayListings([])
          return
        }

        const data = await response.json()
        setEbayListings(data)
      } catch (error) {
        console.error('Error fetching eBay listings:', error)
        setEbayListings([])
      } finally {
        setEbayLoading(false)
      }
    }

    fetchEbayListings()
  }, [watchData])

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

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div className="text-slate-400">Loading watch information...</div>
              <div className="text-slate-500 text-sm">This may take 15-30 seconds</div>
            </div>
          ) : watchData ? (
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
                {url ? 'No data available' : 'Enter a Chrono24 URL to see watch details'}
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

          {/* Chrono24 Listings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Chrono24 Listings</h3>

            {listingsLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <div className="text-slate-400">Loading Chrono24 listings...</div>
                <div className="text-slate-500 text-sm">This may take 15-20 seconds</div>
              </div>
            ) : !watchData?.reference ? (
              <p className="text-slate-400 italic">
                No reference number detected — cannot search for listings.
              </p>
            ) : listings.length === 0 ? (
              <p className="text-slate-400 italic">No listings found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 shadow rounded-lg hover:shadow-md transition"
                  >
                    {listing.image && (
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-full h-48 object-cover rounded-md mb-3"
                      />
                    )}
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                      {listing.title}
                    </h4>
                    <p className="text-lg font-bold text-gray-900 mb-2">{listing.price}</p>
                    {listing.sellerLocation && (
                      <p className="text-xs text-gray-600 mb-3">
                        📍 {listing.sellerLocation}
                      </p>
                    )}
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-2 px-4 rounded transition-colors duration-200"
                    >
                      View on Chrono24
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* eBay Listings */}
          <div className="pt-6 border-t border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">eBay Listings</h3>

            {ebayLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <div className="text-slate-400">Loading eBay listings...</div>
                <div className="text-slate-500 text-sm">This may take a few seconds</div>
              </div>
            ) : !watchData?.reference ? (
              <p className="text-slate-400 italic">
                No reference number detected — cannot search for listings.
              </p>
            ) : ebayListings.length === 0 ? (
              <p className="text-slate-400 italic">No eBay listings found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ebayListings.map((listing, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 shadow rounded-lg hover:shadow-md transition"
                  >
                    {listing.image && (
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-full h-48 object-cover rounded-md mb-3"
                      />
                    )}
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                      {listing.title}
                    </h4>
                    <p className="text-lg font-bold text-gray-900 mb-2">{listing.price}</p>
                    {listing.condition && (
                      <p className="text-xs text-gray-700 mb-2">
                        Condition: {listing.condition}
                      </p>
                    )}
                    {listing.sellerLocation && (
                      <p className="text-xs text-gray-600 mb-3">
                        📍 {listing.sellerLocation}
                      </p>
                    )}
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-2 px-4 rounded transition-colors duration-200"
                    >
                      View on eBay
                    </a>
                  </div>
                ))}
              </div>
            )}
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

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <div className="animate-pulse">Loading dashboard...</div>
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  )
}
