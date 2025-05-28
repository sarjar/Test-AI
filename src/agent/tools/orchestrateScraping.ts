import { UserPreferences, ETFData } from '../types';
import scrapeGoBankingRates from './scrapeGoBankingRates';
import scrapeYahooFinance from './scrapeYahooFinance';
import scrapeSeekingAlpha from './scrapeSeekingAlpha';

interface ScrapingTask {
  source: string;
  priority: number;
  query: string;
}

const orchestrateScraping = async (
  query: string,
  preferences: UserPreferences
): Promise<ETFData[]> => {
  console.log('Starting scraping orchestration for query:', query);
  const tasks: ScrapingTask[] = [
    { source: 'GoBankingRates', priority: 1, query },
    { source: 'YahooFinance', priority: 2, query },
    { source: 'SeekingAlpha', priority: 3, query }
  ];

  const results: ETFData[] = [];
  const errors: string[] = [];

  // Try each source in sequence
  for (const task of tasks) {
    try {
      console.log(`Scraping from ${task.source}...`);
      let sourceResults: ETFData[] = [];
      
      switch (task.source) {
        case 'GoBankingRates':
          sourceResults = await scrapeGoBankingRates(task.query);
          break;
        case 'YahooFinance':
          sourceResults = await scrapeYahooFinance(task.query);
          break;
        case 'SeekingAlpha':
          sourceResults = await scrapeSeekingAlpha(task.query);
          break;
        default:
          throw new Error(`Unknown source: ${task.source}`);
      }

      // Filter results based on preferences with case-insensitive matching
      const filteredResults = sourceResults.filter(etf => {
        const normalizedSectors = preferences.sectors.map(s => s.toLowerCase());
        const normalizedRegions = preferences.regions.map(r => r.toLowerCase());
        
        const matchesSector = normalizedSectors.includes(etf.sector.toLowerCase());
        const matchesRegion = !etf.region || normalizedRegions.includes(etf.region.toLowerCase());
        const matchesYield = etf.dividendYield >= preferences.yieldMin && etf.dividendYield <= preferences.yieldMax;
        
        return matchesSector && matchesRegion && matchesYield;
      });

      console.log(`Found ${filteredResults.length} matching results from ${task.source}`);
      results.push(...filteredResults);
    } catch (error) {
      const errorMessage = `Error scraping ${task.source}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      errors.push(errorMessage);
    }
  }

  // Remove duplicates based on symbol
  const uniqueResults = results.filter((etf, index, self) => 
    index === self.findIndex(e => e.symbol === etf.symbol)
  );

  if (errors.length > 0) {
    console.warn('Scraping completed with errors:', errors);
  }

  console.log(`Scraping completed. Total unique results: ${uniqueResults.length}`);
  return uniqueResults;
};

export default orchestrateScraping; 