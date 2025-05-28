import axios, { AxiosRequestConfig } from "axios";
import * as cheerio from "cheerio";
import { ETFData } from '../types';
import { globalRateLimiter } from './rateLimiter';

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
        console.log(`Yahoo Finance retry attempt ${i + 1} after error:`, error instanceof Error ? error.message : error);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError!;
}

const scrapeYahooFinance = async (query: string): Promise<ETFData[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
  
  try {
    // Apply rate limiting
    await globalRateLimiter.waitIfNeeded('yahoo-finance');
    
    const searchUrl = `https://finance.yahoo.com/lookup/all?s=${encodeURIComponent(query)}&t=E&m=ALL&b=0`;
    const config: AxiosRequestConfig = {
      headers: commonHeaders,
      timeout: 10000,
      signal: controller.signal,
      validateStatus: (status) => status < 500,
    };
    
    const searchResponse = await retryRequest(() => axios.get(searchUrl, config));
    
    if (searchResponse.status >= 400) {
      throw new Error(`HTTP ${searchResponse.status}: ${searchResponse.statusText}`);
    }
    
    const $ = cheerio.load(searchResponse.data);
    const results: ETFData[] = [];
    const tickers: string[] = [];
    
    $('table tbody tr').each((i, element) => {
      if (i < 5) { // Limit to first 5 results
        const ticker = $(element).find('td:first-child').text().trim();
        if (ticker && ticker.length <= 10) { // Basic validation
          tickers.push(ticker);
        }
      }
    });
    
    console.log(`Yahoo Finance: Found ${tickers.length} tickers to analyze`);
    
    for (const ticker of tickers) {
      try {
        // Rate limit individual ticker requests
        await globalRateLimiter.waitIfNeeded('yahoo-finance-ticker');
        
        const quoteUrl = `https://finance.yahoo.com/quote/${ticker}`;
        const quoteResponse = await retryRequest(() => axios.get(quoteUrl, config));
        
        if (quoteResponse.status >= 400) {
          console.warn(`Failed to fetch ${ticker}: HTTP ${quoteResponse.status}`);
          continue;
        }
        
        const $quote = cheerio.load(quoteResponse.data);
        const title = $quote('h1').text().trim();
        const yieldText = $quote('div[data-test="quote-summary-stats"] td:contains("Dividend Yield")').next().text().trim();
        const dividendYield = parseFloat(yieldText.replace(/[%,]/g, ""));
        
        if (title && !isNaN(dividendYield) && dividendYield > 0) {
          results.push({
            name: title.includes(ticker) ? title : `${title} (${ticker})`,
            symbol: ticker,
            dividendYield,
            sector: "Unknown", // Yahoo Finance doesn't easily provide sector info
            source: "Yahoo Finance",
            timestamp: new Date().toISOString()
          });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error fetching details for ${ticker}:`, error instanceof Error ? error.message : error);
      }
    }
    
    console.log(`Yahoo Finance: Found ${results.length} ETFs with dividend data`);
    return results;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.error('Yahoo Finance request was cancelled due to timeout');
    } else {
      console.error(`Error scraping Yahoo Finance:`, error instanceof Error ? error.message : error);
    }
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
};

export default scrapeYahooFinance; 