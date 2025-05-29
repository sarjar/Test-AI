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

    const prompt = `Generate 3-5 specific search terms for finding current high dividend ETFs with real-time market data based on these preferences:
    - Sectors: ${state.preferences.sectors.join(", ")}
    - Regions: ${state.preferences.regions.join(", ")}
    - Yield Range: ${state.preferences.yieldMin}% to ${state.preferences.yieldMax}%
    
    Focus on terms that will help find live, current market data for dividend ETFs. Include terms that financial data sources would use for real-time ETF information.
    
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
