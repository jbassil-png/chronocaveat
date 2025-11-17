import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export const runtime = 'nodejs'

export interface BackgroundArticle {
  title: string
  url: string
  snippet: string | null
  source: string
}

const SOURCES = [
  { name: 'Hodinkee', url: (q: string) => `https://www.hodinkee.com/search?q=${encodeURIComponent(q)}` },
  { name: 'Fratello', url: (q: string) => `https://www.fratellowatches.com/?s=${encodeURIComponent(q)}` },
  { name: 'Monochrome', url: (q: string) => `https://monochrome-watches.com/?s=${encodeURIComponent(q)}` },
  { name: 'SJX', url: (q: string) => `https://watchesbysjx.com/?s=${encodeURIComponent(q)}` },
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

    // Build cleaned query string
    const query = `${brand} ${model}`.trim()
    const articles: BackgroundArticle[] = []

    // Check for Zyte API key
    const apiKey = process.env.ZYTE_API_KEY
    if (!apiKey) {
      console.error('Zyte API key not configured')
      return NextResponse.json([] as BackgroundArticle[], { status: 200 })
    }

    // Search each publisher
    for (const source of SOURCES) {
      try {
        // Get search URL for this publisher
        const searchUrl = source.url(query)

        // Fetch via Zyte API
        const auth = Buffer.from(`${apiKey}:`).toString('base64')
        const response = await fetch('https://api.zyte.com/v1/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
          },
          body: JSON.stringify({
            url: searchUrl,
            browserHtml: true,
          }),
        })

        if (!response.ok) {
          console.error(`Failed to fetch ${source.name} search: ${response.status}`)
          continue
        }

        const data = await response.json()
        const html = data.browserHtml ?? ''
        console.log(`DEBUG ${source.name} HTML:`, html.slice(0, 500))
        const $ = cheerio.load(html)

        let resultsFound = 0

        // Extract articles based on publisher
        switch (source.name) {
          case 'Hodinkee':
            $('article').each((_, element) => {
              if (resultsFound >= 2) return false

              const $article = $(element)
              const $link = $article.find('a[href]').first()
              const url = $link.attr('href')
              const title = $article.find('h2').first().text().trim()
              const snippet = $article.find('p').first().text().trim()

              if (title && url) {
                articles.push({
                  title,
                  url: url.startsWith('http') ? url : `https://www.hodinkee.com${url}`,
                  snippet: snippet || null,
                  source: source.name,
                })
                resultsFound++
              }
            })
            break

          case 'Fratello':
            $('.post-item, .post').each((_, element) => {
              if (resultsFound >= 2) return false

              const $post = $(element)
              const $link = $post.find('a[href]').first()
              const url = $link.attr('href')
              const title = $post.find('h2, h3, .entry-title').first().text().trim()
              const snippet = $post.find('.excerpt, .entry-excerpt, p').first().text().trim()

              if (title && url) {
                articles.push({
                  title,
                  url: url.startsWith('http') ? url : `https://www.fratellowatches.com${url}`,
                  snippet: snippet || null,
                  source: source.name,
                })
                resultsFound++
              }
            })
            break

          case 'Monochrome':
            $('article.post').each((_, element) => {
              if (resultsFound >= 2) return false

              const $article = $(element)
              const title = $article.find('h2.entry-title').first().text().trim()
              const $link = $article.find('h2.entry-title a').first()
              const url = $link.attr('href')
              const snippet = $article.find('div.entry-excerpt, .entry-summary, p').first().text().trim()

              if (title && url) {
                articles.push({
                  title,
                  url: url.startsWith('http') ? url : `https://monochrome-watches.com${url}`,
                  snippet: snippet || null,
                  source: source.name,
                })
                resultsFound++
              }
            })
            break

          case 'SJX':
            $('article.post').each((_, element) => {
              if (resultsFound >= 2) return false

              const $article = $(element)
              const title = $article.find('h2.entry-title').first().text().trim()
              const $link = $article.find('h2.entry-title a').first()
              const url = $link.attr('href')
              const snippet = $article.find('div.entry-summary, .entry-excerpt, p').first().text().trim()

              if (title && url) {
                articles.push({
                  title,
                  url: url.startsWith('http') ? url : `https://watchesbysjx.com${url}`,
                  snippet: snippet || null,
                  source: source.name,
                })
                resultsFound++
              }
            })
            break
        }
      } catch (error) {
        console.error(`Error searching ${source.name}:`, error)
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
