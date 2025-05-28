import { UserPreferences, ETFData } from "../types";
import getAlphaVantageData from "./alphaVantage";
import getFinancialDatasetAIData from "./financialDatasetAI";
// Legacy scrapers kept as fallback
import scrapeGoBankingRates from "./scrapeGoBankingRates";

interface DataSourceTask {
  source: string;
  priority: number;
  query: string;
}

const orchestrateScraping = async (
  query: string,
  preferences: UserPreferences,
): Promise<ETFData[]> => {
  const tasks: DataSourceTask[] = [
    { source: "AlphaVantage", priority: 1, query },
    { source: "FinancialDatasetAI", priority: 2, query },
    { source: "GoBankingRates", priority: 3, query }, // Fallback scraper
  ];

  const results: ETFData[] = [];
  const errors: string[] = [];

  // Try each source in sequence
  for (const task of tasks) {
    try {
      let sourceResults: ETFData[] = [];

      switch (task.source) {
        case "AlphaVantage":
          sourceResults = await getAlphaVantageData(task.query);
          break;
        case "FinancialDatasetAI":
          sourceResults = await getFinancialDatasetAIData(task.query);
          break;
        case "GoBankingRates":
          sourceResults = await scrapeGoBankingRates(task.query);
          break;
        default:
          throw new Error(`Unknown source: ${task.source}`);
      }

      // Filter results based on preferences with very flexible matching
      const filteredResults = sourceResults.filter((etf) => {
        const normalizedSectors = preferences.sectors.map((s) =>
          s.toLowerCase(),
        );
        const normalizedRegions = preferences.regions.map((r) =>
          r.toLowerCase(),
        );

        // Very flexible sector matching - include if any sector matches or if "all" is specified
        const etfSectorLower = (etf.sector || "").toLowerCase();
        const matchesSector =
          normalizedSectors.length === 0 ||
          normalizedSectors.includes("all") ||
          normalizedSectors.some(
            (sector) =>
              etfSectorLower.includes(sector) ||
              sector.includes(etfSectorLower) ||
              (sector === "technology" &&
                (etfSectorLower.includes("tech") ||
                  etfSectorLower.includes("information") ||
                  etfSectorLower.includes("software"))) ||
              (sector === "finance" &&
                (etfSectorLower.includes("financial") ||
                  etfSectorLower.includes("bank") ||
                  etfSectorLower.includes("insurance"))) ||
              (sector === "healthcare" && etfSectorLower.includes("health")) ||
              (sector === "energy" && etfSectorLower.includes("energy")) ||
              (sector === "utilities" && etfSectorLower.includes("utilities")),
          ) ||
          // If no specific sector preferences, include all ETFs
          normalizedSectors.length === 0;

        // Very flexible region matching - include USA, Global, and international
        const etfRegionLower = (etf.region || "usa").toLowerCase();
        const matchesRegion =
          normalizedRegions.length === 0 ||
          normalizedRegions.includes("all") ||
          normalizedRegions.includes("global") ||
          normalizedRegions.some(
            (region) =>
              etfRegionLower.includes(region) ||
              region.includes(etfRegionLower) ||
              (region === "usa" &&
                (etfRegionLower.includes("us") ||
                  etfRegionLower.includes("america") ||
                  etfRegionLower.includes("united states"))) ||
              (region === "global" &&
                (etfRegionLower.includes("international") ||
                  etfRegionLower.includes("world") ||
                  etfRegionLower.includes("emerging"))) ||
              (region === "europe" && etfRegionLower.includes("europe")) ||
              (region === "asia" && etfRegionLower.includes("asia")),
          ) ||
          // If no specific region preferences, include all ETFs
          normalizedRegions.length === 0;

        // More generous yield matching with wider tolerance
        const matchesYield =
          etf.dividendYield >= Math.max(0, preferences.yieldMin - 1.5) &&
          etf.dividendYield <= preferences.yieldMax + 3.0;

        return matchesSector && matchesRegion && matchesYield;
      });

      results.push(...filteredResults);
    } catch (error) {
      errors.push(`Error fetching data from ${task.source}`);
    }
  }

  // Remove duplicates based on symbol
  const uniqueResults = results.filter(
    (etf, index, self) =>
      index === self.findIndex((e) => e.symbol === etf.symbol),
  );

  // Data collection completed
  return uniqueResults;
};

export default orchestrateScraping;
