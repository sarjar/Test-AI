import axios from "axios";
import { ETFData } from "../types";
import { globalRateLimiter } from "./rateLimiter";

interface FinancialDatasetETF {
  symbol: string;
  name: string;
  price: number;
  dividend_yield: number;
  sector: string;
  market_cap: number;
  expense_ratio: number;
  aum: number;
  inception_date: string;
  description: string;
  region: string;
  exchange: string;
}

interface FinancialDatasetResponse {
  data: FinancialDatasetETF[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const getFinancialDatasetAIData = async (query: string): Promise<ETFData[]> => {
  // Generate realistic mock data for testing purposes
  const mockETFs: ETFData[] = [
    {
      symbol: "SCHD",
      name: "Schwab US Dividend Equity ETF",
      dividendYield: 3.45,
      sector: "Finance",
      price: 78.5,
      marketCap: 52000000000,
      description:
        "Tracks an index of US stocks with a record of consistently paying dividends",
      source: "FinancialDataset.ai (Mock)",
      timestamp: new Date().toISOString(),
      region: "USA",
      expenseRatio: 0.06,
      aum: 52000000000,
    },
    {
      symbol: "VYM",
      name: "Vanguard High Dividend Yield ETF",
      dividendYield: 2.85,
      sector: "Finance",
      price: 115.2,
      marketCap: 58000000000,
      description:
        "Seeks to track the performance of the FTSE High Dividend Yield Index",
      source: "FinancialDataset.ai (Mock)",
      timestamp: new Date().toISOString(),
      region: "USA",
      expenseRatio: 0.06,
      aum: 58000000000,
    },
    {
      symbol: "HDV",
      name: "iShares Core High Dividend ETF",
      dividendYield: 3.12,
      sector: "Finance",
      price: 108.75,
      marketCap: 8500000000,
      description:
        "Seeks to track the investment results of an index composed of high dividend paying US equities",
      source: "FinancialDataset.ai (Mock)",
      timestamp: new Date().toISOString(),
      region: "USA",
      expenseRatio: 0.08,
      aum: 8500000000,
    },
    {
      symbol: "SPHD",
      name: "Invesco S&P 500 High Dividend Low Volatility ETF",
      dividendYield: 4.25,
      sector: "Technology",
      price: 45.3,
      marketCap: 2800000000,
      description:
        "Seeks to track the investment results of the S&P 500 Low Volatility High Dividend Index",
      source: "FinancialDataset.ai (Mock)",
      timestamp: new Date().toISOString(),
      region: "USA",
      expenseRatio: 0.3,
      aum: 2800000000,
    },
    {
      symbol: "SPYD",
      name: "SPDR Portfolio S&P 500 High Dividend ETF",
      dividendYield: 3.89,
      sector: "Technology",
      price: 42.15,
      marketCap: 6200000000,
      description:
        "Seeks to provide investment results that correspond to the price and yield performance of the S&P 500 High Dividend Index",
      source: "FinancialDataset.ai (Mock)",
      timestamp: new Date().toISOString(),
      region: "USA",
      expenseRatio: 0.07,
      aum: 6200000000,
    },
    {
      symbol: "VXUS",
      name: "Vanguard Total International Stock ETF",
      dividendYield: 2.45,
      sector: "Finance",
      price: 65.8,
      marketCap: 45000000000,
      description:
        "Seeks to track the performance of the FTSE Global All Cap ex US Index",
      source: "FinancialDataset.ai (Mock)",
      timestamp: new Date().toISOString(),
      region: "Global",
      expenseRatio: 0.08,
      aum: 45000000000,
    },
  ];

  // Add some randomization to make it more realistic
  const results = mockETFs.map((etf) => ({
    ...etf,
    dividendYield: etf.dividendYield + (Math.random() - 0.5) * 0.5, // Add some variance
    price: etf.price ? etf.price + (Math.random() - 0.5) * 5 : undefined,
  }));

  return results;
};

export default getFinancialDatasetAIData;
