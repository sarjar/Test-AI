import axios, { AxiosRequestConfig } from "axios";
import * as cheerio from "cheerio";
import { ETFData } from '../types';

const commonHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
};

async function retryRequest<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        console.log(`Retry attempt ${i + 1} after error:`, error instanceof Error ? error.message : error);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError!;
}

const scrapeGoBankingRates = async (query: string): Promise<ETFData[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
    const url = "https://www.gobankingrates.com/investing/funds/best-high-dividend-etf/";
    const config: AxiosRequestConfig = {
      headers: commonHeaders,
      timeout: 10000,
      signal: controller.signal,
      validateStatus: (status) => status < 500, // Accept 4xx errors but retry on 5xx
    };
    
    const response = await retryRequest(() => axios.get(url, config));
    
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const $ = cheerio.load(response.data);
    const results: ETFData[] = [];
    
    $("table tbody tr").each((i, element) => {
      try {
        const title = $(element).find("td:nth-child(1)").text().trim();
        const ticker = $(element).find("td:nth-child(2)").text().trim();
        const yieldText = $(element).find("td:nth-child(3)").text().trim();
        const dividendYield = parseFloat(yieldText.replace(/[%,]/g, ""));
        
        if (title && ticker && !isNaN(dividendYield) && dividendYield > 0) {
          const sectorElement = $(element).find("td:nth-child(4)");
          const sector = sectorElement.length ? sectorElement.text().trim() : "Unknown";
          const regionElement = $(element).find("td:nth-child(5)");
          const region = regionElement.length ? regionElement.text().trim() : undefined;
          
          results.push({
            name: title.includes(ticker) ? title : `${title} (${ticker})`,
            symbol: ticker,
            dividendYield,
            sector: sector || "Unknown",
            region,
            source: "GoBankingRates",
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error(`Error parsing table row ${i}:`, err);
      }
    });
    
    console.log(`GoBankingRates: Found ${results.length} ETFs`);
    return results;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.error('GoBankingRates request was cancelled due to timeout');
    } else {
      console.error(`Error scraping GoBankingRates:`, error instanceof Error ? error.message : error);
    }
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
};

export default scrapeGoBankingRates; 