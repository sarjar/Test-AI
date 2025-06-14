import { WorkflowState } from "../types";
import getOpenAIClient from "../tools/openAIClient";

/**
 * Generate Search Terms Node
 *
 * Creates optimized search queries based on user preferences
 * Uses OpenAI to generate relevant search terms for data scraping
 */

const generateSearchTermsNode = async (
  state: WorkflowState,
): Promise<WorkflowState> => {
  try {
    if (!state.preferences) {
      return { ...state, status: "error", error: "Preferences not loaded" };
    }

    // Check if OpenAI API key is available before proceeding
    if (!process.env.OPENAI_API_KEY) {
      const fallbackSearchTerms = [
        {
          query: `high dividend ETFs ${state.preferences.sectors.join(" ")}`,
          source: "fallback",
        },
        {
          query: `dividend yield ETFs ${state.preferences.regions.join(" ")}`,
          source: "fallback",
        },
        {
          query: `${state.preferences.yieldMin}% dividend ETFs`,
          source: "fallback",
        },
      ];
      return {
        ...state,
        searchTerms: fallbackSearchTerms,
        status: "scrape_data",
      };
    }

    const llm = getOpenAIClient();

    const investmentTypeText = state.preferences.investmentTypes.join(" and ");
    const prompt = `Generate 3-4 optimized search terms for finding real-time high dividend ${investmentTypeText} data based on these preferences:
    - Investment Types: ${state.preferences.investmentTypes.join(", ")}
    - Sectors: ${state.preferences.sectors.join(", ")}
    - Regions: ${state.preferences.regions.join(", ")}
    - Yield Range: ${state.preferences.yieldMin}% to ${state.preferences.yieldMax}%
    ${state.preferences.marketCapRange ? `- Market Cap Range: ${state.preferences.marketCapRange[0]}B to ${state.preferences.marketCapRange[1]}B` : ""}
    ${state.preferences.peRatioMax ? `- Max P/E Ratio: ${state.preferences.peRatioMax}` : ""}
    
    Focus on terms that work well with financial APIs like Alpha Vantage for real-time market data. Use specific symbols and sector keywords that financial data providers recognize.
    
    Format each search term on a new line.`;

    const response = await llm.invoke(prompt);

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

    const searchTerms = responseContent
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean)
      .map((term: string) => ({
        query: term,
        source: "llm",
      }));

    if (searchTerms.length === 0) {
      return {
        ...state,
        status: "error",
        error: "Failed to generate valid search terms",
      };
    }

    return { ...state, searchTerms, status: "scrape_data" };
  } catch (error) {
    let errorMessage = "Unknown error in generateSearchTermsNode";

    if (error instanceof Error && error.message) {
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

export default generateSearchTermsNode;
