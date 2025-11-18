// Force Node runtime so console.log and Cheerio work reliably
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Trusted watch publishers to search
const PUBLISHERS = [
  { name: "Hodinkee", domain: "hodinkee.com" },
  { name: "Fratello", domain: "fratellowatches.com" },
  { name: "Monochrome", domain: "monochrome-watches.com" },
  { name: "SJX", domain: "watchesbysjx.com" },
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

  // Build search query - use reference if available for specificity
  const searchQuery = reference
    ? `${brand} ${reference}`.trim()
    : `${brand} ${model}`.trim();

  const results: any[] = [];

  // Search each publisher using Google site search
  for (const publisher of PUBLISHERS) {
    try {
      // Use Google site search for better relevance
      const googleQuery = `site:${publisher.domain} ${searchQuery} review`;
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;

      const html = await fetchViaZyte(googleSearchUrl);
      const $ = cheerio.load(html);

      // Parse Google search results
      // Google uses div.g for organic results
      let resultsFound = 0;
      $("div.g").each((_, element) => {
        if (resultsFound >= 2) return false; // Max 2 results per publisher

        const $result = $(element);

        // Extract title from h3
        const title = $result.find("h3").text().trim();

        // Extract URL from the main link
        const $link = $result.find("a").first();
        const url = $link.attr("href") || "";

        // Extract snippet from the description
        const snippet = $result
          .find("div[data-sncf], div.VwiC3b, span.aCOpRe")
          .first()
          .text()
          .trim();

        // Only add if we have both title and valid URL
        if (title && url && url.includes(publisher.domain)) {
          results.push({
            title,
            url,
            snippet: snippet || null,
            source: publisher.name,
          });
          resultsFound++;
        }
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`Error searching ${publisher.name}:`, errorMsg);
      continue;
    }
  }

  return NextResponse.json(results);
}
