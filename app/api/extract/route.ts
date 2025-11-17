import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface ExtractedData {
  brand: string | null
  model: string | null
  reference: string | null
  url: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const url = searchParams.get('url')

    // Validate URL parameter
    if (!url) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      )
    }

    // Validate that it's a Chrono24 URL
    if (!url.includes('chrono24.com')) {
      return NextResponse.json(
        { error: 'Invalid URL: Only Chrono24 URLs are supported' },
        { status: 400 }
      )
    }

    // Fetch the HTML through Zyte API
    const apiKey = process.env.ZYTE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Zyte API key not configured' },
        { status: 500 }
      )
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
        url: url,
        httpResponseBody: true,
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 502 }
      )
    }

    const data = await response.json()
    const htmlBase64 = data.httpResponseBody || ''

    // Decode Base64 HTML
    const html = Buffer.from(htmlBase64, 'base64').toString('utf-8')

    const $ = cheerio.load(html)

    // Initialize extraction result
    const extracted: ExtractedData = {
      brand: null,
      model: null,
      reference: null,
      url,
    }

    // 1. Try to extract from <title> tag
    const title = $('title').text().trim()
    if (title) {
      // Chrono24 titles often follow pattern: "Brand Model - Reference - Price | Chrono24"
      // or "Brand Model | Ref. Reference | Chrono24"
      const titleParts = title.split('|')[0]?.trim() || ''

      // Try to extract brand (usually first word)
      const words = titleParts.split(/\s+/)
      if (words.length > 0) {
        extracted.brand = words[0]
      }

      // Store full title as model for now
      if (titleParts) {
        extracted.model = titleParts
      }
    }

    // 2. Try to find product metadata in JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonText = $(element).html()
        if (jsonText) {
          const data = JSON.parse(jsonText)

          // Handle both single objects and arrays
          const products = Array.isArray(data) ? data : [data]

          for (const item of products) {
            if (item['@type'] === 'Product') {
              // Extract brand
              if (item.brand?.name) {
                extracted.brand = item.brand.name
              }

              // Extract model/name
              if (item.name) {
                extracted.model = item.name
              }

              // Extract reference number (sometimes in SKU or model)
              if (item.sku) {
                extracted.reference = item.sku
              } else if (item.mpn) {
                extracted.reference = item.mpn
              }
            }
          }
        }
      } catch (e) {
        // Ignore JSON parse errors, continue with other methods
        console.error('Error parsing JSON-LD:', e)
      }
    })

    // 3. Look for product specifications table/sections
    // Chrono24 often has a specifications section with reference numbers

    // Try to find reference number in various common locations
    $('table tr, .specification-row, .detail-row, [class*="spec"]').each((_, row) => {
      const $row = $(row)
      const text = $row.text().toLowerCase()

      if (text.includes('reference') || text.includes('ref.') || text.includes('ref number')) {
        // Try to extract the value from the next cell or within the row
        const value = $row.find('td:last-child, .value, [class*="value"]').text().trim()
        if (value && !extracted.reference) {
          extracted.reference = value
        }
      }
    })

    // Also look for reference in meta tags
    const refMeta = $('meta[property="product:retailer_item_id"]').attr('content')
    if (refMeta && !extracted.reference) {
      extracted.reference = refMeta
    }

    // Look for brand in meta tags as fallback
    const brandMeta = $('meta[property="product:brand"]').attr('content')
    if (brandMeta && !extracted.brand) {
      extracted.brand = brandMeta
    }

    // Return extracted data (even if some fields are null)
    return NextResponse.json(extracted, { status: 200 })
  } catch (error) {
    console.error('Error in extract API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error during extraction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
