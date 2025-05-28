import { WorkflowState } from "../types";
import getOpenAIClient from "../tools/openAIClient";

const systemPrompt = `You are a helpful, friendly AI financial consultant specializing in real-time market analysis. You provide current, up-to-date information about dividend ETFs, stocks, and investment strategies based on live market data. Always emphasize that your recommendations are based on real-time market conditions. If the question is not about finance, politely redirect the user to ask about dividend ETFs, stocks, or investment strategies. Always end with a suggestion for a follow-up question or action.`;

const greetings = [
  "hi",
  "hello",
  "hey",
  "good morning",
  "good afternoon",
  "good evening",
  "greetings",
];

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

const suggestions = [
  "Would you like real-time analysis of the top dividend ETFs?",
  "Ask me about building a diversified portfolio with current market data!",
  "Curious about today's dividend yields and market conditions?",
  "Want live market insights on long-term investment strategies?",
  "Need help comparing ETFs with current market data?",
  "Interested in real-time dividend growth investing opportunities?",
  "Would you like to explore current sector-specific ETF performance?",
];

function getRandomSuggestion(): string {
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

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

function isFinanceRelated(input: string): boolean {
  const normalizedInput = input.toLowerCase();
  return financeKeywords.some((keyword) => normalizedInput.includes(keyword));
}

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
          summary: `Hello! 👋 I'm your AI financial consultant specializing in real-time market analysis. I provide current dividend ETF data, live market insights, and up-to-date investment strategies. How can I help you with today's market opportunities?\n\n${getRandomSuggestion()}`,
          topPicks: [],
          timestamp: new Date().toISOString(),
        },
        status: "complete",
      };
    }

    // Check if the query is finance-related
    if (!isFinanceRelated(sanitizedInput)) {
      return {
        ...state,
        report: {
          title: "AI Financial Consultant",
          summary: `I specialize in real-time financial market analysis, focusing on dividend ETFs, stocks, and current investment strategies. Please ask me something related to finance and investing for the most current market insights.\n\n${getRandomSuggestion()}`,
          topPicks: [],
          timestamp: new Date().toISOString(),
        },
        status: "complete",
      };
    }

    // Use the LLM for finance-related queries
    const llm = getOpenAIClient();
    const prompt = `${systemPrompt}\n\nUser: ${sanitizedInput}`;

    console.log("Sending prompt to OpenAI:", prompt);

    const response = await llm.invoke(prompt);

    console.log("Received response from OpenAI:", response);

    // Handle different response structures from LangChain ChatOpenAI
    let responseContent: string;

    if (typeof response === "string") {
      responseContent = response;
    } else if (
      response &&
      typeof response === "object" &&
      "content" in response
    ) {
      // Handle AIMessage structure from LangChain
      responseContent =
        typeof response.content === "string"
          ? response.content
          : String(response.content);
    } else {
      // Fallback: convert whatever we got to string
      responseContent = String(response);
    }

    if (!responseContent || responseContent.trim() === "") {
      throw new Error("Empty response from OpenAI");
    }

    console.log("Processed response content:", responseContent);

    return {
      ...state,
      report: {
        title: "AI Financial Consultant",
        summary: `${responseContent.trim()}\n\n${getRandomSuggestion()}`,
        topPicks: [],
        timestamp: new Date().toISOString(),
      },
      status: "complete",
    };
  } catch (error) {
    console.error("Error in generalChatNode:", error);

    let errorMessage = "Failed to process general chat";

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
