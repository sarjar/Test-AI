import axios, { AxiosRequestConfig } from "axios";
import * as cheerio from "cheerio";
import { ETFData } from "../types";
import { globalRateLimiter } from "./rateLimiter";

const commonHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Cache-Control": "no-cache",
  "Upgrade-Insecure-Requests": "1",
};

async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  let lastError: Error;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError!;
}

const scrapeYahooFinance = async (query: string): Promise<ETFData[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

  try {
    // Apply rate limiting
    await globalRateLimiter.waitIfNeeded("yahoo-finance");

    const searchUrl = `https://finance.yahoo.com/lookup/all?s=${encodeURIComponent(query)}&t=E&m=ALL&b=0`;
    const config: AxiosRequestConfig = {
      headers: commonHeaders,
      timeout: 20000,
      signal: controller.signal,
      validateStatus: (status) => status < 500,
      maxContentLength: 10 * 1024 * 1024, // 10MB
      maxBodyLength: 10 * 1024 * 1024, // 10MB
      maxHeaderSize: 16384, // 16KB header limit
      decompress: true,
    };

    const searchResponse = await retryRequest(() =>
      axios.get(searchUrl, config),
    );

    if (searchResponse.status >= 400) {
      return [];
    }

    if (!searchResponse.data || typeof searchResponse.data !== "string") {
      return [];
    }

    const $ = cheerio.load(searchResponse.data);
    const results: ETFData[] = [];
    const tickers: string[] = [];

    $("table tbody tr").each((i, element) => {
      if (i < 5) {
        // Limit to first 5 results
        const ticker = $(element).find("td:first-child").text().trim();
        if (ticker && ticker.length <= 10) {
          // Basic validation
          tickers.push(ticker);
        }
      }
    });

    // Found tickers to analyze

    for (const ticker of tickers) {
      try {
        // Rate limit individual ticker requests
        await globalRateLimiter.waitIfNeeded("yahoo-finance-ticker");

        const quoteUrl = `https://finance.yahoo.com/quote/${ticker}`;
        const quoteResponse = await retryRequest(() =>
          axios.get(quoteUrl, config),
        );

        if (quoteResponse.status >= 400) {
          continue;
        }

        const $quote = cheerio.load(quoteResponse.data);
        const title = $quote("h1").text().trim();
        const yieldText = $quote(
          'div[data-test="quote-summary-stats"] td:contains("Dividend Yield")',
        )
          .next()
          .text()
          .trim();
        const dividendYield = parseFloat(yieldText.replace(/[%,]/g, ""));

        if (title && !isNaN(dividendYield) && dividendYield > 0) {
          results.push({
            name: title.includes(ticker) ? title : `${title} (${ticker})`,
            symbol: ticker,
            dividendYield,
            sector: "Unknown", // Yahoo Finance doesn't easily provide sector info
            source: "Yahoo Finance",
            timestamp: new Date().toISOString(),
          });
        }

        // Longer delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        // Skip ticker on error
      }
    }

    return results;
  } catch (error) {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
};

export default scrapeYahooFinance;
