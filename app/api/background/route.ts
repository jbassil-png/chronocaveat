// Force Node runtime so console.log and Cheerio work reliably
export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Publisher search endpoints
const SOURCES = [
  {
    name: "Hodinkee",
    buildUrl: (q: string) =>
      `https://www.hodinkee.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Fratello",
    buildUrl: (q: string) =>
      `https://www.fratellowatches.com/?s=${encodeURIComponent(q)}`,
  },
  {
    name: "Monochrome",
    buildUrl: (q: string) =>
      `https://monochrome-watches.com/?s=${encodeURIComponent(q)}`,
  },
  {
    name: "SJX",
    buildUrl: (q: string) =>
      `https://watchesbysjx.com/?s=${encodeURIComponent(q)}`,
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

  if (!brand && !model) {
    return NextResponse.json(
      { error: "Missing brand or model" },
      { status: 400 }
    );
  }

  const query = `${brand} ${model}`.trim();
  const results: any[] = [];

  for (const source of SOURCES) {
    try {
      const searchUrl = source.buildUrl(query);
      const html = await fetchViaZyte(searchUrl);
      const $ = cheerio.load(html);
      const siteResults: any[] = [];

      // Site-specific selectors
      if (source.name === "Hodinkee") {
        $(".product-card.article-card").slice(0, 2).each((i, el) => {
          const $card = $(el);
          const title = $card.find("h2.article-title").text().trim();
          const $link = $card.find("a.product-card-content").first();
          const url = $link.attr("href") || "";
          const snippet = $card.find("p.article-meta").text().trim();

          if (title && url) {
            siteResults.push({
              title,
              url: url.startsWith("http")
                ? url
                : `https://www.hodinkee.com${url}`,
              snippet: snippet || null,
              source: "Hodinkee",
            });
          }
        });
      }

      if (source.name === "Fratello") {
        $("a.post-tile-box")
          .slice(0, 2)
          .each((_, el) => {
            const $link = $(el);
            const url = $link.attr("href") || "";
            const title = $link.find("span.h2").text().trim();
            const snippet = $link.find(".post-list-meta").text().trim();

            if (title && url) {
              siteResults.push({
                title,
                url,
                snippet: snippet || null,
                source: "Fratello",
              });
            }
          });
      }

      if (source.name === "Monochrome") {
        $("article.post-card")
          .slice(0, 2)
          .each((_, el) => {
            const $article = $(el);
            const $link = $article.find("a").first();
            const url = $link.attr("href") || "";
            const title = $article.find("h3.post-card__title").text().trim();
            const author = $article.find(".post-card__author").text().trim();

            if (title && url) {
              siteResults.push({
                title,
                url,
                snippet: author || null,
                source: "Monochrome",
              });
            }
          });
      }

      if (source.name === "SJX") {
        $("div[class^='brand-']")
          .slice(0, 2)
          .each((_, el) => {
            const $div = $(el);
            const title = $div.find("h2 a").text().trim();
            const url = $div.find("h2 a").attr("href") || "";
            const snippet = $div.find("span").first().text().trim();
            const date = $div.find("footer span").first().text().trim();

            if (title && url) {
              siteResults.push({
                title,
                url,
                snippet: date || snippet || null,
                source: "SJX",
              });
            }
          });
      }

      results.push(...siteResults);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`Error scraping ${source.name}:`, errorMsg);
      continue;
    }
  }

  return NextResponse.json(results);
}
