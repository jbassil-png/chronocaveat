import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export interface BackgroundArticle {
  title: string
  url: string
  snippet: string | null
  source: string
}

const publishers = [
  { name: 'Hodinkee', domain: 'hodinkee.com' },
  { name: 'Fratello', domain: 'fratellowatches.com' },
  { name: 'Monochrome', domain: 'monochrome-watches.com' },
  { name: 'SJX', domain: 'watchesbysjx.com' },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const brand = searchParams.get('brand')
    const model = searchParams.get('model')

    // Validate required parameters
    if (!brand || !model) {
      return NextResponse.json(
        { error: 'Both brand and model parameters are required' },
        { status: 400 }
      )
    }

    const articles: BackgroundArticle[] = []

    // Check for Zyte API key
    const apiKey = process.env.ZYTE_API_KEY
    if (!apiKey) {
      console.error('Zyte API key not configured')
      return NextResponse.json([] as BackgroundArticle[], { status: 200 })
    }

    // Search each publisher
    for (const publisher of publishers) {
      try {
        // Construct Google site search query
        const googleQuery = `site:${publisher.domain} ${brand} ${model} review`
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`

        // Fetch via Zyte API
        const response = await fetch('https://api.zyte.com/v1/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            url: googleSearchUrl,
            browserHtml: true,
          }),
        })

        if (!response.ok) {
          console.error(`Failed to fetch Google search for ${publisher.name}: ${response.status}`)
          continue
        }

        const data = await response.json()
        const html = data.browserHtml ?? ''

        const $ = cheerio.load(html)

        // Parse Google search results
        // Google uses div.g for organic search results
        let resultsFound = 0
        $('div.g').each((_, element) => {
          if (resultsFound >= 2) return false // Limit to top 2 results per publisher

          const $result = $(element)

          // Extract title from h3
          const title = $result.find('h3').first().text().trim()
          if (!title) return // Skip if no title

          // Extract URL from the main link
          const $link = $result.find('a[href]').first()
          const href = $link.attr('href') || ''

          // Google wraps URLs, extract actual URL
          let url = ''
          if (href.startsWith('/url?q=')) {
            // Parse the actual URL from Google's redirect
            const urlMatch = href.match(/\/url\?q=([^&]+)/)
            if (urlMatch) {
              url = decodeURIComponent(urlMatch[1])
            }
          } else if (href.startsWith('http')) {
            url = href
          }

          // Verify URL is from the correct domain
          if (!url || !url.includes(publisher.domain)) return

          // Extract snippet (description text)
          // Google uses various classes for snippets: .VwiC3b, .lEBKkf, etc.
          let snippet = $result
            .find('.VwiC3b, .lEBKkf, [data-sncf="1"], [data-sncf="2"]')
            .first()
            .text()
            .trim()

          // Fallback: try to find any div with description-like text
          if (!snippet) {
            snippet = $result
              .find('div[style*="-webkit-line-clamp"]')
              .first()
              .text()
              .trim()
          }

          articles.push({
            title,
            url,
            snippet: snippet || null,
            source: publisher.name,
          })

          resultsFound++
        })
      } catch (error) {
        console.error(`Error searching ${publisher.name}:`, error)
        // Continue with next publisher
      }
    }

    // Return articles (empty array if none found)
    return NextResponse.json(articles, { status: 200 })
  } catch (error) {
    console.error('Error in background reading API:', error)
    // Return empty array on error rather than failing
    return NextResponse.json([] as BackgroundArticle[], { status: 200 })
  }
}
