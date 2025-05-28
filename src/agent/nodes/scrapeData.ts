import { WorkflowState, ETFData } from '../types';
import orchestrateScraping from '../tools/orchestrateScraping';

const scrapeDataNode = async ({ state }: { state: WorkflowState }) => {
  try {
    console.log('scrapeDataNode input:', state);
    if (!state.searchTerms || !state.preferences) {
      console.error('Missing search terms or preferences');
      return { ...state, status: "error", error: "Missing search terms or preferences" };
    }

    console.log('Starting data scraping with search terms:', state.searchTerms);
    const allData: ETFData[] = [];
    const errors: string[] = [];

    for (const term of state.searchTerms) {
      try {
        console.log(`Scraping data for term: ${term.query}`);
        const results = await orchestrateScraping(term.query, state.preferences);
        console.log(`Found ${results.length} results for term: ${term.query}`);
        allData.push(...results);
      } catch (error) {
        const errorMessage = `Error scraping term "${term.query}": ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }

    if (allData.length === 0) {
      console.error('No real-time data found from any source');
      const errorMessage = errors.length > 0 
        ? `No ETF data found. Encountered errors: ${errors.join('; ')}`
        : 'No ETF data found matching your criteria. This could be due to very specific search terms or temporary data source issues. Please try adjusting your preferences or try again later.';
      
      return { 
        ...state, 
        status: "error", 
        error: errorMessage
      };
    }

    if (errors.length > 0) {
      console.warn('Scraping completed with some errors:', errors);
    }

    // Remove duplicates based on symbol across all search terms
    const uniqueData = allData.filter((etf, index, self) => 
      index === self.findIndex(e => e.symbol === etf.symbol)
    );

    console.log(`Scraping completed. Total unique results: ${uniqueData.length}`);
    return { ...state, scrapedData: uniqueData, status: "summarize_data" };
  } catch (error) {
    return {
      ...state,
      status: "error",
      error: error instanceof Error && error.message ? error.message : "Unknown error in scrapeDataNode"
    };
  }
};

export default scrapeDataNode; 