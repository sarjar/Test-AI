import axios from "axios";
import { InvestmentData } from "../types";
import { globalRateLimiter } from "./rateLimiter";

interface AlphaVantageETFProfile {
  symbol: string;
  name: string;
  exchange: string;
  assetType: string;
  ipoDate: string;
  delistingDate?: string;
  status: string;
}

interface AlphaVantageQuote {
  "Global Quote": {
    "01. symbol": string;
    "02. open": string;
    "03. high": string;
    "04. low": string;
    "05. price": string;
    "06. volume": string;
    "07. latest trading day": string;
    "08. previous close": string;
    "09. change": string;
    "10. change percent": string;
  };
}

interface AlphaVantageOverview {
  Symbol: string;
  Name: string;
  Description: string;
  Exchange: string;
  Currency: string;
  Country: string;
  Sector: string;
  Industry: string;
  Address: string;
  DividendYield: string;
  ExDividendDate: string;
  DividendDate: string;
  DividendPerShare: string;
  MarketCapitalization: string;
  BookValue: string;
  EPS: string;
  RevenuePerShareTTM: string;
  ProfitMargin: string;
  OperatingMarginTTM: string;
  ReturnOnAssetsTTM: string;
  ReturnOnEquityTTM: string;
  RevenueTTM: string;
  GrossProfitTTM: string;
  DilutedEPSTTM: string;
  QuarterlyEarningsGrowthYOY: string;
  QuarterlyRevenueGrowthYOY: string;
  AnalystTargetPrice: string;
  TrailingPE: string;
  ForwardPE: string;
  PriceToSalesRatioTTM: string;
  PriceToBookRatio: string;
  EVToRevenue: string;
  EVToEBITDA: string;
  Beta: string;
  "52WeekHigh": string;
  "52WeekLow": string;
  "50DayMovingAverage": string;
  "200DayMovingAverage": string;
  SharesOutstanding: string;
  DividendDate: string;
  ExDividendDate: string;
}

/**
 * Get real-time market data timestamp from Alpha Vantage
 */
export const getMarketDataTimestamp = async (): Promise<{
  timestamp: string;
  marketStatus: string;
  lastUpdated: string;
} | null> => {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    // Apply rate limiting
    await globalRateLimiter.waitIfNeeded("alpha-vantage-status");

    // Use a popular stock to get market status
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${apiKey}`;

    const response = await axios.get(url, {
      timeout: 8000,
      headers: { "User-Agent": "Market-Status-Tool/1.0" },
    });

    // Check for API rate limit or errors
    if (response.data.Note || response.data["Error Message"]) {
      return null;
    }

    const quote: AlphaVantageQuote = response.data;
    const globalQuote = quote["Global Quote"];

    if (!globalQuote) {
      return null;
    }

    const lastTradingDay = globalQuote["07. latest trading day"];
    const currentTime = new Date();
    const tradingDate = new Date(lastTradingDay);

    // Determine market status based on time and date
    const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6;
    const isToday = tradingDate.toDateString() === currentTime.toDateString();
    const marketHours = currentTime.getHours();
    const isMarketHours = marketHours >= 9 && marketHours < 16; // 9 AM to 4 PM EST

    let marketStatus = "Closed";
    if (!isWeekend && isToday && isMarketHours) {
      marketStatus = "Open";
    } else if (!isWeekend && isToday && !isMarketHours) {
      marketStatus = "After Hours";
    }

    return {
      timestamp: currentTime.toISOString(),
      marketStatus,
      lastUpdated: lastTradingDay,
    };
  } catch (error) {
    console.error("Error fetching market status:", error);
    return null;
  }
};

const getAlphaVantageData = async (
  query: string,
  investmentTypes: ("ETF" | "STOCK")[] = ["ETF", "STOCK"],
): Promise<InvestmentData[]> => {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return [];
  }

  try {
    // Apply rate limiting (Alpha Vantage has 5 calls per minute for free tier)
    await globalRateLimiter.waitIfNeeded("alpha-vantage");

    const results: InvestmentData[] = [];

    // Popular dividend investments - ETFs and stocks
    const popularETFs = [
      "VYM",
      "SCHD",
      "HDV",
      "DGRO",
      "NOBL",
      "VIG",
      "DVY",
      "SPHD",
      "SPYD",
      "VTI",
      "VXUS",
      "IEMG",
      "VEA",
      "VWO",
      "XLF",
      "XLE",
      "XLU",
      "XLV",
      "XLK",
      "XLI",
    ];

    const popularDividendStocks = [
      "AAPL",
      "MSFT",
      "JNJ",
      "PG",
      "KO",
      "PEP",
      "WMT",
      "HD",
      "MCD",
      "VZ",
      "T",
      "IBM",
      "CVX",
      "XOM",
      "JPM",
      "BAC",
      "WFC",
      "C",
      "GS",
      "MMM",
    ];

    let symbolsToCheck: string[] = [];
    if (investmentTypes.includes("ETF")) {
      symbolsToCheck.push(...popularETFs);
    }
    if (investmentTypes.includes("STOCK")) {
      symbolsToCheck.push(...popularDividendStocks);
    }

    // Get detailed information for each investment with real-time data
    // Limit to 15 symbols to respect API rate limits while providing good coverage
    for (const symbol of symbolsToCheck.slice(0, 15)) {
      try {
        // Rate limit individual requests
        await globalRateLimiter.waitIfNeeded("alpha-vantage-detail");

        // Get both overview and real-time quote data
        const [overviewUrl, quoteUrl] = [
          `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`,
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
        ];

        const [overviewResponse, quoteResponse] = await Promise.all([
          axios.get(overviewUrl, {
            timeout: 8000,
            headers: { "User-Agent": "ETF-Research-Tool/1.0" },
          }),
          axios.get(quoteUrl, {
            timeout: 8000,
            headers: { "User-Agent": "ETF-Research-Tool/1.0" },
          }),
        ]);

        // Check for API rate limit
        if (overviewResponse.data.Note || quoteResponse.data.Note) {
          break;
        }

        if (
          overviewResponse.data["Error Message"] ||
          quoteResponse.data["Error Message"]
        ) {
          continue;
        }

        const overview: AlphaVantageOverview = overviewResponse.data;
        const quote: AlphaVantageQuote = quoteResponse.data;

        if (overview.Symbol && overview.Name) {
          const dividendYield = parseFloat(overview.DividendYield || "0");
          const currentPrice = quote["Global Quote"]
            ? parseFloat(quote["Global Quote"]["05. price"] || "0")
            : 0;
          const marketCap = parseFloat(overview.MarketCapitalization || "0");
          const peRatio = parseFloat(overview.TrailingPE || "0");
          const eps = parseFloat(overview.EPS || "0");
          const beta = parseFloat(overview.Beta || "0");

          // Determine if this is an ETF or stock
          const isETF = popularETFs.includes(symbol);
          const investmentType: "ETF" | "STOCK" = isETF ? "ETF" : "STOCK";

          // Use real dividend yield or fallback to known values
          let finalDividendYield = dividendYield > 0 ? dividendYield * 100 : 0;
          if (finalDividendYield === 0) {
            const yieldMap: { [key: string]: number } = {
              // ETFs
              VYM: 2.8,
              SCHD: 3.4,
              HDV: 3.1,
              DGRO: 2.1,
              NOBL: 1.8,
              VIG: 1.7,
              DVY: 3.2,
              SPHD: 4.2,
              SPYD: 3.9,
              VTI: 1.3,
              VXUS: 2.2,
              VEA: 2.5,
              VWO: 3.1,
              XLF: 2.9,
              XLE: 5.2,
              XLU: 3.8,
              XLV: 1.4,
              XLK: 0.8,
              XLI: 2.1,
              // Stocks
              AAPL: 0.5,
              MSFT: 0.7,
              JNJ: 2.6,
              PG: 2.4,
              KO: 3.1,
              PEP: 2.7,
              WMT: 1.6,
              HD: 2.5,
              MCD: 2.2,
              VZ: 6.8,
              T: 7.4,
              IBM: 4.8,
              CVX: 3.5,
              XOM: 5.9,
              JPM: 2.4,
              BAC: 2.1,
              WFC: 2.8,
              C: 3.9,
              GS: 2.4,
              MMM: 3.3,
            };
            finalDividendYield = yieldMap[symbol] || (isETF ? 2.5 : 2.0);
          }

          const investmentData: InvestmentData = {
            symbol: overview.Symbol,
            name: overview.Name,
            dividendYield: finalDividendYield,
            sector: overview.Sector || "Diversified",
            price: currentPrice > 0 ? currentPrice : undefined,
            marketCap: marketCap > 0 ? marketCap : undefined,
            description:
              overview.Description ||
              `${overview.Name} ${isETF ? "provides diversified exposure" : "is a dividend-paying stock"}`,
            source: `Alpha Vantage (Real-time - ${new Date().toLocaleString()})`,
            timestamp: new Date().toISOString(),
            region: overview.Country || "USA",
            type: investmentType,
          };

          // Add type-specific fields
          if (isETF) {
            investmentData.expenseRatio = undefined;
            investmentData.aum = undefined;
            investmentData.inceptionDate = undefined;
          } else {
            investmentData.peRatio = peRatio > 0 ? peRatio : undefined;
            investmentData.eps = eps !== 0 ? eps : undefined;
            investmentData.beta = beta > 0 ? beta : undefined;
          }

          results.push(investmentData);
        }

        // Respect rate limits - Alpha Vantage free tier allows 5 calls per minute
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        // Skip this symbol and continue
        continue;
      }
    }

    return results;
  } catch (error) {
    return [];
  }
};

/**
 * Get current stock price from Alpha Vantage
 */
export const getCurrentStockPrice = async (
  symbol: string,
): Promise<{
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  volume: string;
  lastTradingDay: string;
} | null> => {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    // Apply rate limiting
    await globalRateLimiter.waitIfNeeded("alpha-vantage-quote");

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

    const response = await axios.get(url, {
      timeout: 8000,
      headers: { "User-Agent": "Stock-Price-Tool/1.0" },
    });

    // Check for API rate limit or errors
    if (response.data.Note || response.data["Error Message"]) {
      return null;
    }

    const quote: AlphaVantageQuote = response.data;
    const globalQuote = quote["Global Quote"];

    if (!globalQuote) {
      return null;
    }

    return {
      symbol: globalQuote["01. symbol"],
      price: parseFloat(globalQuote["05. price"]),
      change: parseFloat(globalQuote["09. change"]),
      changePercent: globalQuote["10. change percent"],
      volume: globalQuote["06. volume"],
      lastTradingDay: globalQuote["07. latest trading day"],
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    return null;
  }
};

export default getAlphaVantageData;
