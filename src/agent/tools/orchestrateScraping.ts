import { UserPreferences, InvestmentData } from "../types";
import getAlphaVantageData from "./alphaVantage";

interface DataSourceTask {
  source: string;
  priority: number;
  query: string;
}

const orchestrateScraping = async (
  query: string,
  preferences: UserPreferences,
): Promise<InvestmentData[]> => {
  // Focus on free, reliable data sources only
  const tasks: DataSourceTask[] = [
    { source: "AlphaVantage", priority: 1, query },
  ];

  const results: InvestmentData[] = [];
  const errors: string[] = [];

  // Try each source in sequence
  for (const task of tasks) {
    try {
      let sourceResults: InvestmentData[] = [];

      switch (task.source) {
        case "AlphaVantage":
          sourceResults = await getAlphaVantageData(
            task.query,
            preferences.investmentTypes,
          );
          break;
        default:
          throw new Error(`Unknown source: ${task.source}`);
      }

      // Filter results based on preferences with flexible matching
      const filteredResults = sourceResults.filter((investment) => {
        const normalizedSectors = preferences.sectors.map((s) =>
          s.toLowerCase(),
        );
        const normalizedRegions = preferences.regions.map((r) =>
          r.toLowerCase(),
        );

        // Investment type matching
        const matchesType = preferences.investmentTypes.includes(
          investment.type,
        );

        // Flexible sector matching
        const sectorLower = (investment.sector || "").toLowerCase();
        const matchesSector =
          normalizedSectors.length === 0 ||
          normalizedSectors.includes("all") ||
          normalizedSectors.some(
            (sector) =>
              sectorLower.includes(sector) ||
              sector.includes(sectorLower) ||
              (sector === "technology" &&
                (sectorLower.includes("tech") ||
                  sectorLower.includes("information") ||
                  sectorLower.includes("software"))) ||
              (sector === "finance" &&
                (sectorLower.includes("financial") ||
                  sectorLower.includes("bank") ||
                  sectorLower.includes("insurance"))) ||
              (sector === "healthcare" && sectorLower.includes("health")) ||
              (sector === "energy" && sectorLower.includes("energy")) ||
              (sector === "utilities" && sectorLower.includes("utilities")),
          );

        // Flexible region matching
        const regionLower = (investment.region || "usa").toLowerCase();
        const matchesRegion =
          normalizedRegions.length === 0 ||
          normalizedRegions.includes("all") ||
          normalizedRegions.includes("global") ||
          normalizedRegions.some(
            (region) =>
              regionLower.includes(region) ||
              region.includes(regionLower) ||
              (region === "usa" &&
                (regionLower.includes("us") ||
                  regionLower.includes("america") ||
                  regionLower.includes("united states"))) ||
              (region === "global" &&
                (regionLower.includes("international") ||
                  regionLower.includes("world") ||
                  regionLower.includes("emerging"))) ||
              (region === "europe" && regionLower.includes("europe")) ||
              (region === "asia" && regionLower.includes("asia")),
          );

        // Yield matching with reasonable tolerance
        const matchesYield =
          investment.dividendYield >= Math.max(0, preferences.yieldMin - 1.0) &&
          investment.dividendYield <= preferences.yieldMax + 2.0;

        // Market cap matching for stocks
        const matchesMarketCap =
          !preferences.marketCapRange ||
          !investment.marketCap ||
          (investment.marketCap >= preferences.marketCapRange[0] * 1e9 &&
            investment.marketCap <= preferences.marketCapRange[1] * 1e9);

        // PE ratio matching for stocks
        const matchesPE =
          !preferences.peRatioMax ||
          !investment.peRatio ||
          investment.peRatio <= preferences.peRatioMax;

        return (
          matchesType &&
          matchesSector &&
          matchesRegion &&
          matchesYield &&
          matchesMarketCap &&
          matchesPE
        );
      });

      results.push(...filteredResults);
    } catch (error) {
      errors.push(`Error fetching data from ${task.source}`);
    }
  }

  // Remove duplicates based on symbol
  const uniqueResults = results.filter(
    (investment, index, self) =>
      index === self.findIndex((e) => e.symbol === investment.symbol),
  );

  return uniqueResults;
};

export default orchestrateScraping;
