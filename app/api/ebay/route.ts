import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export interface EbayListing {
  title: string
  price: string
  url: string
  image: string | null
  condition: string | null
  sellerLocation: string | null
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get('reference')

    // Validate reference parameter
    if (!reference) {
      return NextResponse.json(
        { error: 'Missing reference' },
        { status: 400 }
      )
    }

    // Construct eBay search URL
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(reference)}`

    // Fetch the search results page
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch eBay search: ${response.status} ${response.statusText}`)
      return NextResponse.json([] as EbayListing[], { status: 200 })
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const listings: EbayListing[] = []

    // eBay uses .s-item for search result items
    $('.s-item').each((_, element) => {
      const $item = $(element)

      // Skip the first item as it's usually a placeholder/header
      if ($item.hasClass('s-item--before-first-card')) return

      // Extract title
      const title = $item.find('.s-item__title').text().trim()
      if (!title || title === '') return

      // Extract price
      let price = $item.find('.s-item__price').first().text().trim()

      // Extract URL
      const url = $item.find('.s-item__link').attr('href') || ''
      if (!url) return

      // Extract image
      const image = $item.find('.s-item__image-img').attr('src') || null

      // Extract condition
      const condition = $item.find('.SECONDARY_INFO').text().trim() || null

      // Extract seller location (often in subtitle or shipping info)
      let sellerLocation: string | null = null
      const locationText = $item.find('.s-item__location, .s-item__shipping').text().trim()
      if (locationText && locationText.length > 0 && locationText.length < 100) {
        sellerLocation = locationText
      }

      // Only add listing if we have at least title and URL
      if (title && url) {
        listings.push({
          title,
          price: price || 'Price not available',
          url,
          image,
          condition,
          sellerLocation,
        })
      }
    })

    // Return the listings (empty array if none found)
    return NextResponse.json(listings, { status: 200 })
  } catch (error) {
    console.error('Error in eBay search API:', error)
    // Return empty array on error rather than failing
    return NextResponse.json([] as EbayListing[], { status: 200 })
  }
}
