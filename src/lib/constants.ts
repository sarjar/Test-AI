/**
 * Application Constants
 *
 * Centralized configuration values used throughout the application
 */

// API Configuration
export const API_ENDPOINTS = {
  CHAT: "/api/chat",
  CHAT_CLEAR: "/api/chat/clear",
  RESEARCH: "/api/research",
  MARKET_STATUS: "/api/market-status",
} as const;

// Chat Configuration
export const CHAT_CONFIG = {
  MAX_HISTORY_ITEMS: 10,
  RESPONSE_MAX_LENGTH: 1200,
  TYPING_INDICATOR_DELAY: 500,
} as const;

// Investment Preferences
export const INVESTMENT_OPTIONS = {
  TYPES: [
    { id: "ETF", label: "ETFs" },
    { id: "STOCK", label: "Individual Stocks" },
  ],
  SECTORS: [
    { id: "technology", label: "Technology" },
    { id: "energy", label: "Energy" },
    { id: "finance", label: "Finance" },
    { id: "healthcare", label: "Healthcare" },
    { id: "consumer", label: "Consumer Goods" },
    { id: "utilities", label: "Utilities" },
    { id: "realestate", label: "Real Estate" },
  ],
  REGIONS: [
    { id: "usa", label: "USA" },
    { id: "europe", label: "Europe" },
    { id: "asia", label: "Asia" },
    { id: "global", label: "Global" },
    { id: "emerging", label: "Emerging Markets" },
  ],
  YIELD_RANGE: {
    MIN: 0,
    MAX: 15,
    STEP: 0.5,
    DEFAULT: [2, 8] as [number, number],
  },
  MARKET_CAP_RANGE: {
    MIN: 0.1, // $100M
    MAX: 3000, // $3T
    STEP: 0.1,
    DEFAULT: [1, 500] as [number, number], // $1B to $500B
  },
  PE_RATIO: {
    MIN: 5,
    MAX: 50,
    STEP: 1,
    DEFAULT: 25,
  },
} as const;

// UI Messages
export const UI_MESSAGES = {
  WELCOME:
    "Hello! I'm your dividend investment consultant with real-time market data access. Ask me about dividend ETFs, individual dividend-paying stocks, current stock prices, and investment strategies.",
  LOADING: "Thinking...",
  ERROR_GENERIC: "Sorry, there was an error processing your request.",
  CLEAR_HISTORY_CONFIRM:
    "Are you sure you want to clear all chat history? This action cannot be undone.",
  DIVIDEND_YIELD_TOOLTIP:
    "The annual dividend payment expressed as a percentage of the investment price. Higher yields may indicate better income potential but could also suggest higher risk.",
  MARKET_CAP_TOOLTIP:
    "Market capitalization represents the total value of a company's shares. Large-cap stocks (>$10B) are typically more stable, while small-cap stocks (<$2B) may offer higher growth potential.",
  PE_RATIO_TOOLTIP:
    "Price-to-Earnings ratio compares a stock's price to its earnings per share. Lower P/E ratios may indicate undervalued stocks, while higher ratios suggest growth expectations.",
} as const;
