import { WorkflowState } from "../types";
import getOpenAIClient from "../tools/openAIClient";
import { getCurrentStockPrice } from "../tools/alphaVantage";

/**
 * General chat node for AI consultant functionality
 * Handles user queries about finance and investment topics with real-time stock data
 */

// System prompt for AI financial consultant
const systemPrompt = `You are a helpful, friendly AI financial consultant specializing in dividend ETFs, individual dividend-paying stocks, and investment strategies.

You have access to real-time stock price data through Alpha Vantage. When users ask about specific stock prices, you can provide current market data including price, change, and volume information.

Provide clear, actionable investment advice and insights. Keep your responses conversational and helpful, focusing on practical guidance for dividend investing. Be specific about investment recommendations when appropriate, but always remind users to do their own research and consider their risk tolerance.

IMPORTANT: Limit your response to a maximum of 3 sentences. Be concise while delivering current, actionable information.`;

/**
 * Extract stock symbols from user input
 */
function extractStockSymbols(input: string): string[] {
  const symbols: string[] = [];

  // Common patterns for stock symbols
  const symbolPatterns = [
    /\b([A-Z]{1,5})\b/g, // 1-5 letter uppercase words
    /\$([A-Z]{1,5})\b/g, // Dollar sign prefix
    /\b([A-Z]{1,5})\s*(?:stock|price|quote)/gi, // Symbol followed by stock/price/quote
  ];

  for (const pattern of symbolPatterns) {
    const matches = input.match(pattern);
    if (matches) {
      symbols.push(
        ...matches.map((match) =>
          match
            .replace(/\$|\s*(stock|price|quote)/gi, "")
            .trim()
            .toUpperCase(),
        ),
      );
    }
  }

  // Also check for common stock names
  const stockNameMap: { [key: string]: string } = {
    apple: "AAPL",
    microsoft: "MSFT",
    google: "GOOGL",
    alphabet: "GOOGL",
    amazon: "AMZN",
    tesla: "TSLA",
    meta: "META",
    facebook: "META",
    netflix: "NFLX",
    nvidia: "NVDA",
    "coca cola": "KO",
    johnson: "JNJ",
    walmart: "WMT",
    disney: "DIS",
    boeing: "BA",
    intel: "INTC",
    cisco: "CSCO",
    oracle: "ORCL",
    salesforce: "CRM",
    adobe: "ADBE",
  };

  const lowerInput = input.toLowerCase();
  for (const [name, symbol] of Object.entries(stockNameMap)) {
    if (lowerInput.includes(name)) {
      symbols.push(symbol);
    }
  }

  // Filter out common words that aren't stock symbols
  const commonWords = [
    "THE",
    "AND",
    "FOR",
    "ARE",
    "BUT",
    "NOT",
    "YOU",
    "ALL",
    "CAN",
    "HER",
    "WAS",
    "ONE",
    "OUR",
    "HAD",
    "WHAT",
    "PRICE",
    "STOCK",
    "ETF",
    "GET",
    "HOW",
    "MUCH",
    "COST",
    "VALUE",
    "WORTH",
    "TODAY",
    "NOW",
    "CURRENT",
  ];

  return [
    ...new Set(
      symbols.filter(
        (symbol) =>
          symbol.length >= 1 &&
          symbol.length <= 5 &&
          !commonWords.includes(symbol.toUpperCase()),
      ),
    ),
  ];
}

/**
 * Check if user is asking about stock prices
 */
function isStockPriceQuery(input: string): boolean {
  const priceKeywords = [
    "price",
    "cost",
    "trading",
    "current",
    "quote",
    "value",
    "worth",
    "market price",
    "stock price",
    "how much",
    "what's",
    "whats",
    "show me",
    "get me",
    "find",
    "lookup",
    "check",
    "real time",
    "realtime",
    "live",
    "today",
    "now",
    "latest",
  ];

  const normalizedInput = input.toLowerCase();
  return (
    priceKeywords.some((keyword) => normalizedInput.includes(keyword)) ||
    /\$[A-Z]{1,5}/.test(input)
  );
}

// Common greeting patterns for detection
const greetings = [
  "hi",
  "hello",
  "hey",
  "good morning",
  "good afternoon",
  "good evening",
  "greetings",
];

// Financial keywords for topic detection
const financeKeywords = [
  "etf",
  "dividend",
  "stock",
  "investment",
  "portfolio",
  "yield",
  "finance",
  "financial",
  "market",
  "strategy",
  "advisor",
  "consultant",
  "trading",
  "broker",
  "fund",
  "equity",
  "bond",
  "asset",
  "return",
  "profit",
  "loss",
  "risk",
  "diversification",
  "allocation",
  "retirement",
  "401k",
  "ira",
  "roth",
  "pension",
  "savings",
  "wealth",
  "money",
  "capital",
  "income",
  "expense",
  "budget",
  "tax",
  "inflation",
  "recession",
  "bull market",
  "bear market",
  "volatility",
  "liquidity",
  "sector",
  "industry",
];

// Follow-up suggestions for user engagement
const suggestions = [
  "Would you like to know about top dividend ETFs?",
  "Ask me about building a dividend portfolio!",
  "Curious about dividend growth strategies?",
  "Want to explore sector-specific dividend investments?",
  "Need help with dividend yield analysis?",
  "Interested in REIT dividend opportunities?",
];

/**
 * Get a random follow-up suggestion for user engagement
 */
function getRandomSuggestion(): string {
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

/**
 * Limit response to maximum 3 sentences
 */
function limitToThreeSentences(text: string): string {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length <= 3) {
    return text;
  }
  return sentences.slice(0, 3).join(". ") + ".";
}

/**
 * Check if user input is a greeting
 */
function isGreeting(input: string): boolean {
  const normalizedInput = input.toLowerCase().trim();
  return greetings.some(
    (greet) =>
      normalizedInput === greet ||
      normalizedInput.startsWith(greet + " ") ||
      normalizedInput.startsWith(greet + ",") ||
      normalizedInput.startsWith(greet + "!"),
  );
}

/**
 * Check if user input is finance-related
 */
function isFinanceRelated(input: string): boolean {
  const normalizedInput = input.toLowerCase();
  return financeKeywords.some((keyword) => normalizedInput.includes(keyword));
}

/**
 * Sanitize user input by trimming and normalizing whitespace
 */
function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

const generalChatNode = async (
  state: WorkflowState,
): Promise<WorkflowState> => {
  try {
    if (!state.userInput) {
      return {
        ...state,
        status: "error",
        error: "No user input provided",
      };
    }

    const sanitizedInput = sanitizeInput(state.userInput);

    if (!sanitizedInput) {
      return {
        ...state,
        status: "error",
        error: "Empty user input after sanitization",
      };
    }

    // Handle greetings/small talk
    if (isGreeting(sanitizedInput)) {
      return {
        ...state,
        report: {
          title: "AI Financial Consultant",
          summary: `Hello! I'm your AI financial consultant with real-time market data access. I can help you with dividend ETFs, stock analysis, and provide live stock prices. Just ask me about any stock symbol (like AAPL, MSFT) or company name! ${getRandomSuggestion()}`,
          topPicks: [],
          timestamp: new Date().toISOString(),
        },
        status: "complete",
      };
    }

    // Check if the query is finance-related or contains stock symbols
    const hasStockSymbols = extractStockSymbols(sanitizedInput).length > 0;
    if (!isFinanceRelated(sanitizedInput) && !hasStockSymbols) {
      return {
        ...state,
        report: {
          title: "AI Financial Consultant",
          summary: `I specialize in dividend investing with real-time market data access. Try asking me about stock prices (e.g., "What's AAPL price?"), dividend ETFs, or investment strategies. ${getRandomSuggestion()}`,
          topPicks: [],
          timestamp: new Date().toISOString(),
        },
        status: "complete",
      };
    }

    // Check if user is asking about stock prices and extract symbols
    let stockPriceData: string = "";
    if (isStockPriceQuery(sanitizedInput)) {
      const symbols = extractStockSymbols(sanitizedInput);

      if (symbols.length > 0) {
        console.log(
          `Fetching real-time prices for symbols: ${symbols.join(", ")}`,
        );

        const pricePromises = symbols.slice(0, 5).map(async (symbol) => {
          try {
            const priceInfo = await getCurrentStockPrice(symbol);
            if (priceInfo) {
              const changeColor = priceInfo.change >= 0 ? "📈" : "📉";
              const changeSign = priceInfo.change >= 0 ? "+" : "";
              return `${changeColor} ${priceInfo.symbol}: ${priceInfo.price.toFixed(2)} (${changeSign}${priceInfo.change.toFixed(2)} | ${priceInfo.changePercent}) | Vol: ${parseInt(priceInfo.volume).toLocaleString()} | ${priceInfo.lastTradingDay}`;
            }
            return `❌ ${symbol}: Price data not available`;
          } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error);
            return `⚠️ ${symbol}: Price data temporarily unavailable`;
          }
        });

        try {
          const priceResults = await Promise.all(pricePromises);
          const timestamp = new Date().toLocaleString();
          stockPriceData = `\n\n🔴 LIVE MARKET DATA (${timestamp}):\n${priceResults.join("\n")}\n\n💡 Data provided by Alpha Vantage`;
        } catch (error) {
          console.error("Error fetching stock prices:", error);
          stockPriceData =
            "\n\n⚠️ Note: Unable to fetch real-time stock price data at the moment. Please try again.";
        }
      }
    }

    // Build prompt for OpenAI with stock price data if available
    const contextualPrompt = `${systemPrompt}\n\nUser Question: ${sanitizedInput}${stockPriceData}`;

    const llm = getOpenAIClient();
    console.log("Sending prompt to OpenAI for general chat");

    const response = await llm.invoke(contextualPrompt);

    // Handle different response structures from LangChain ChatOpenAI
    let responseContent: string;

    if (typeof response === "string") {
      responseContent = response;
    } else if (
      response &&
      typeof response === "object" &&
      "content" in response
    ) {
      responseContent =
        typeof response.content === "string"
          ? response.content
          : String(response.content);
    } else {
      responseContent = String(response);
    }

    if (!responseContent || responseContent.trim() === "") {
      throw new Error("Empty response from OpenAI");
    }

    // Limit response to 3 sentences and add follow-up suggestion
    let finalResponse = limitToThreeSentences(responseContent.trim());
    finalResponse += ` ${getRandomSuggestion()}`;

    return {
      ...state,
      report: {
        title: "AI Financial Consultant",
        summary: finalResponse,
        topPicks: [],
        timestamp: new Date().toISOString(),
      },
      status: "complete",
    };
  } catch (error) {
    console.error("Error in generalChatNode:", error);

    let errorMessage = "Failed to process your request";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return {
      ...state,
      status: "error",
      error: errorMessage,
    };
  }
};

export default generalChatNode;
