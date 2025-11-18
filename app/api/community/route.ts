import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export const runtime = 'nodejs'

export interface CommunityPost {
  title: string
  url: string
  author: string | null
  date: string | null
  snippet: string | null
  source: 'Reddit' | 'WatchUSeek'
  replies?: number
}

const SOURCES = [
  {
    name: 'Reddit' as const,
    buildUrl: (q: string) =>
      `https://www.reddit.com/r/Watches/search/?q=${encodeURIComponent(q)}&restrict_sr=1&sort=relevance`,
  },
  {
    name: 'WatchUSeek' as const,
    buildUrl: (q: string) =>
      `https://www.watchuseek.com/search/1/?q=${encodeURIComponent(q)}&o=relevance`,
  },
]

async function fetchViaZyte(url: string): Promise<string> {
  const apiKey = process.env.ZYTE_API_KEY
  const auth = Buffer.from(`${apiKey}:`).toString('base64')

  const res = await fetch('https://api.zyte.com/v1/extract', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      browserHtml: true,
      javascript: true,
      actions: [
        {
          action: 'waitForTimeout',
          timeout: 5,
          onError: 'return',
        },
      ],
    }),
  })

  const data = await res.json()
  return data.browserHtml ?? ''
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const brand = searchParams.get('brand') || ''
  const model = searchParams.get('model') || ''

  if (!brand && !model) {
    return NextResponse.json(
      { error: 'Missing brand or model parameters' },
      { status: 400 }
    )
  }

  const query = `${brand} ${model}`.trim()
  const results: CommunityPost[] = []

  for (const source of SOURCES) {
    try {
      const searchUrl = source.buildUrl(query)
      const html = await fetchViaZyte(searchUrl)
      const $ = cheerio.load(html)

      if (source.name === 'Reddit') {
        // Reddit search results
        const redditPosts = $('[data-testid="search-post-unit"]')
        redditPosts.slice(0, 3).each((_, el) => {
          const $post = $(el)

          const $titleLink = $post.find('a[data-testid="post-title-text"]')
          const title = $titleLink.text().trim()
          const url = $titleLink.attr('href') || ''

          // Get comment count from search-counter-row
          const $counterRow = $post.find('div[data-testid="search-counter-row"]')
          const commentsText = $counterRow.find('faceplate-number').eq(1).text().trim()
          const replies = parseInt(commentsText) || 0

          if (title && url) {
            results.push({
              title,
              url: url.startsWith('http') ? url : `https://www.reddit.com${url}`,
              author: null, // Reddit doesn't show author in search results
              date: null,
              snippet: null,
              source: 'Reddit',
              replies,
            })
          }
        })
      }

      if (source.name === 'WatchUSeek') {
        // WatchUSeek forum threads
        const threads = $('li.block-row')
        threads.slice(0, 3).each((_, el) => {
          const $thread = $(el)

          const $titleLink = $thread.find('h3.contentRow-title a')
          const title = $titleLink.text().trim()
          const url = $titleLink.attr('href') || ''

          const author = $thread.find('a.username').first().text().trim()
          const date = $thread.find('time').attr('title') || $thread.find('time').text().trim()
          const snippet = $thread.find('.contentRow-snippet').text().trim()
          const repliesText = $thread.find('.pairs--justified dd').first().text().trim()
          const replies = parseInt(repliesText.replace(/,/g, '')) || 0

          if (title && url) {
            results.push({
              title,
              url: url.startsWith('http') ? url : `https://www.watchuseek.com${url}`,
              author: author || null,
              date: date || null,
              snippet: snippet || null,
              source: 'WatchUSeek',
              replies,
            })
          }
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`Error fetching ${source.name}:`, errorMsg)
      continue
    }
  }

  return NextResponse.json(results)
}
