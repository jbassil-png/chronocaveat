import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export interface Listing {
  title: string
  price: string
  url: string
  image: string | null
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

    // Construct Chrono24 search URL
    const searchUrl = `https://www.chrono24.com/search/index.htm?query=${encodeURIComponent(reference)}`

    // Fetch the search results page through Zyte API
    const apiKey = process.env.ZYTE_API_KEY
    if (!apiKey) {
      console.error('Zyte API key not configured')
      return NextResponse.json([] as Listing[], { status: 200 })
    }

    const apiUrl = `https://api.zyte.com/v1/extract`
    const auth = Buffer.from(`${apiKey}:`).toString('base64')
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        url: searchUrl,
        httpResponseBody: true,
      }),
    })

    if (!response.ok) {
      console.error(`Failed to fetch Chrono24 search: ${response.status} ${response.statusText}`)
      return NextResponse.json([] as Listing[], { status: 200 })
    }

    const data = await response.json()
    const htmlBase64 = data.httpResponseBody || ''

    // Decode Base64 HTML
    const html = Buffer.from(htmlBase64, 'base64').toString('utf-8')

    const $ = cheerio.load(html)

    const listings: Listing[] = []

    // Chrono24 uses various selectors for listing cards
    // Try multiple possible selectors for robustness
    const possibleSelectors = [
      'article[class*="article"]',
      '.article-item',
      '[data-test="search-results"] article',
      '.article-item-container',
      'article.wt-search-result',
    ]

    let $items = $()
    for (const selector of possibleSelectors) {
      $items = $(selector)
      if ($items.length > 0) break
    }

    // If no items found with article selectors, try generic container approaches
    if ($items.length === 0) {
      // Look for any elements with data-test or class containing "article"
      $items = $('[data-test*="article"], [class*="article-"]').filter((_, el) => {
        const $el = $(el)
        // Must have both a link and some text content
        return $el.find('a[href*="/"]').length > 0 && $el.text().trim().length > 50
      })
    }

    $items.each((_, element) => {
      const $item = $(element)

      // Extract title - try multiple selectors
      let title = $item.find('[class*="article-title"], h2, h3, [data-test*="title"]').first().text().trim()
      if (!title) {
        // Fallback: get the main link text
        title = $item.find('a[href*="/"]').first().text().trim()
      }

      // Extract price - look for currency symbols and price patterns
      let price = ''
      const priceSelectors = [
        '[class*="price"]',
        '[data-test*="price"]',
        '.m-price',
        '.article-price',
      ]

      for (const selector of priceSelectors) {
        const priceText = $item.find(selector).first().text().trim()
        if (priceText && /[$€£¥₹]|USD|EUR|GBP/.test(priceText)) {
          price = priceText
          break
        }
      }

      // If no price found with selectors, search for text with currency patterns
      if (!price) {
        const allText = $item.text()
        const priceMatch = allText.match(/(?:[$€£¥₹]|USD|EUR|GBP)\s*[\d,]+/)
        if (priceMatch) {
          price = priceMatch[0].trim()
        }
      }

      // Extract URL
      let url = ''
      const $link = $item.find('a[href*="/"]').first()
      const href = $link.attr('href')
      if (href) {
        // Handle relative URLs
        url = href.startsWith('http') ? href : `https://www.chrono24.com${href}`
      }

      // Extract image URL
      let image: string | null = null
      const $img = $item.find('img').first()
      const imgSrc = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src')
      if (imgSrc) {
        image = imgSrc.startsWith('http') ? imgSrc : `https:${imgSrc}`
      }

      // Extract seller location
      let sellerLocation: string | null = null
      const locationSelectors = [
        '[class*="location"]',
        '[class*="dealer"]',
        '[class*="seller"]',
        '[data-test*="location"]',
      ]

      for (const selector of locationSelectors) {
        const locationText = $item.find(selector).first().text().trim()
        if (locationText && locationText.length > 0 && locationText.length < 100) {
          sellerLocation = locationText
          break
        }
      }

      // Only add listing if we have at least title and URL
      if (title && url) {
        listings.push({
          title,
          price: price || 'Price not available',
          url,
          image,
          sellerLocation,
        })
      }
    })

    // Return the listings (empty array if none found)
    return NextResponse.json(listings, { status: 200 })
  } catch (error) {
    console.error('Error in Chrono24 search API:', error)
    // Return empty array on error rather than failing
    return NextResponse.json([] as Listing[], { status: 200 })
  }
}
