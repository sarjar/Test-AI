import axios from "axios";
import * as cheerio from "cheerio";
import { ETFData } from "../types";

const commonHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  Connection: "keep-alive",
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

const scrapeSeekingAlpha = async (query: string): Promise<ETFData[]> => {
  try {
    const url = `https://seekingalpha.com/etf/${encodeURIComponent(query)}`;
    const response = await retryRequest(() =>
      axios.get(url, { headers: commonHeaders, timeout: 10000 }),
    );
    const $ = cheerio.load(response.data);
    const results: ETFData[] = [];

    // Look for ETF data in the page
    $('div[data-test-id="etf-info"]').each((i, element) => {
      try {
        const title = $(element).find("h1").text().trim();
        const ticker = $(element)
          .find('span[data-test-id="symbol"]')
          .text()
          .trim();
        const yieldText = $(element)
          .find('div:contains("Dividend Yield")')
          .next()
          .text()
          .trim();
        const dividendYield = parseFloat(yieldText.replace("%", ""));

        if (title && ticker && !isNaN(dividendYield)) {
          results.push({
            name: `${title} (${ticker})`,
            symbol: ticker,
            dividendYield,
            sector: "Unknown",
            source: "Seeking Alpha",
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        // Skip invalid data
      }
    });

    return results;
  } catch (error) {
    return [];
  }
};

export default scrapeSeekingAlpha;
