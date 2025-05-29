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
} as const;

// Chat Configuration
export const CHAT_CONFIG = {
  MAX_HISTORY_ITEMS: 10,
  RESPONSE_MAX_LENGTH: 1200,
  TYPING_INDICATOR_DELAY: 500,
} as const;

// Investment Preferences
export const INVESTMENT_OPTIONS = {
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
} as const;

// UI Messages
export const UI_MESSAGES = {
  WELCOME:
    "Hello! I'm your investment research assistant. Ask me about dividend ETFs, stocks, or investment strategies.",
  LOADING: "Thinking...",
  ERROR_GENERIC: "Sorry, there was an error processing your request.",
  CLEAR_HISTORY_CONFIRM:
    "Are you sure you want to clear all chat history? This action cannot be undone.",
  DIVIDEND_YIELD_TOOLTIP:
    "The annual dividend payment expressed as a percentage of the stock price. Higher yields may indicate better income potential but could also suggest higher risk.",
} as const;
