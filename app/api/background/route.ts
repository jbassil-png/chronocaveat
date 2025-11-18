// Force Node runtime so console.log and Cheerio work reliably
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Trusted watch publishers with direct search URLs
const SOURCES = [
  {
    name: "Hodinkee",
    buildUrl: (q: string) => `https://www.hodinkee.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Fratello",
    buildUrl: (q: string) => `https://www.fratellowatches.com/?s=${encodeURIComponent(q)}`,
  },
  {
    name: "Monochrome",
    buildUrl: (q: string) => `https://monochrome-watches.com/?s=${encodeURIComponent(q)}`,
  },
  {
    name: "SJX",
    buildUrl: (q: string) => `https://watchesbysjx.com/?s=${encodeURIComponent(q)}`,
  },
];

// Proper Zyte JSON structure with JavaScript rendering
async function fetchViaZyte(url: string): Promise<string> {
  const apiKey = process.env.ZYTE_API_KEY;
  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  const res = await fetch("https://api.zyte.com/v1/extract", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      browserHtml: true,
      javascript: true,
      // Wait for page to load before extracting
      actions: [
        {
          action: "waitForTimeout",
          timeout: 3,
          onError: "return",
        },
      ],
    }),
  });

  const data = await res.json();
  return data.browserHtml ?? "";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const brand = searchParams.get("brand") || "";
  const model = searchParams.get("model") || "";
  const reference = searchParams.get("reference") || "";

  if (!brand && !model) {
    return NextResponse.json(
      { error: "Missing brand or model" },
      { status: 400 }
    );
  }

  // Build search query - use clean model name from JSON-LD
  const searchQuery = `${brand} ${model}`.trim();

  console.log(`[Background API] Searching for: "${searchQuery}"`);

  const results: any[] = [];

  // Search each publisher directly using their native search
  for (const source of SOURCES) {
    try {
      const searchUrl = source.buildUrl(searchQuery);
      console.log(`[Background API] Fetching ${source.name}: ${searchUrl}`);

      const html = await fetchViaZyte(searchUrl);
      const $ = cheerio.load(html);

      let resultsFound = 0;

      // Publisher-specific selectors for search results
      if (source.name === "Hodinkee") {
        // Hodinkee uses article cards in search results
        $("article.search-result, article[class*='search'], .search-results article").each((_, element) => {
          if (resultsFound >= 2) return false;

          const $article = $(element);
          const $link = $article.find("a[href*='/articles/']").first();
          const url = $link.attr("href") || "";
          const title = $link.text().trim() || $article.find("h2, h3, .title").text().trim();
          const snippet = $article.find("p, .excerpt, .description").first().text().trim();

          if (title && url) {
            results.push({
              title,
              url: url.startsWith("http") ? url : `https://www.hodinkee.com${url}`,
              snippet: snippet || null,
              source: source.name,
            });
            resultsFound++;
          }
        });
      }

      if (source.name === "Fratello") {
        // Fratello uses article elements
        $("article, .post, .search-result").each((_, element) => {
          if (resultsFound >= 2) return false;

          const $article = $(element);
          const $link = $article.find("a[rel='bookmark'], h2 a, h3 a").first();
          const url = $link.attr("href") || "";
          const title = $link.text().trim() || $article.find("h2, h3").text().trim();
          const snippet = $article.find(".entry-summary, .excerpt, p").first().text().trim();

          if (title && url && url.includes("fratellowatches.com")) {
            results.push({
              title,
              url,
              snippet: snippet || null,
              source: source.name,
            });
            resultsFound++;
          }
        });
      }

      if (source.name === "Monochrome") {
        // Monochrome uses article elements
        $("article, .post").each((_, element) => {
          if (resultsFound >= 2) return false;

          const $article = $(element);
          const $link = $article.find("a[rel='bookmark'], h2 a, h3 a, .entry-title a").first();
          const url = $link.attr("href") || "";
          const title = $link.text().trim() || $article.find("h2, h3, .entry-title").text().trim();
          const snippet = $article.find(".entry-content, .excerpt, p").first().text().trim();

          if (title && url && url.includes("monochrome-watches.com")) {
            results.push({
              title,
              url,
              snippet: snippet || null,
              source: source.name,
            });
            resultsFound++;
          }
        });
      }

      if (source.name === "SJX") {
        // SJX uses article elements
        $("article, .post-item, .search-result").each((_, element) => {
          if (resultsFound >= 2) return false;

          const $article = $(element);
          const $link = $article.find("a[rel='bookmark'], h2 a, h3 a, .post-title a").first();
          const url = $link.attr("href") || "";
          const title = $link.text().trim() || $article.find("h2, h3, .post-title").text().trim();
          const snippet = $article.find(".post-excerpt, .excerpt, p").first().text().trim();

          if (title && url && url.includes("watchesbysjx.com")) {
            results.push({
              title,
              url,
              snippet: snippet || null,
              source: source.name,
            });
            resultsFound++;
          }
        });
      }

      console.log(`[Background API] Found ${resultsFound} results from ${source.name}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Background API] Error searching ${source.name}:`, errorMsg);
      continue;
    }
  }

  console.log(`[Background API] Total results: ${results.length}`);

  return NextResponse.json(results);
}
