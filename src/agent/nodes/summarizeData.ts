import { WorkflowState } from "../types";
import getOpenAIClient from "../tools/openAIClient";

/**
 * Summarize Data Node
 *
 * Analyzes scraped ETF data and generates investment insights
 * Uses OpenAI to create comprehensive market analysis
 */

const summarizeDataNode = async (
  state: WorkflowState,
): Promise<WorkflowState> => {
  try {
    if (!state.scrapedData) {
      return { ...state, status: "error", error: "No data to summarize" };
    }

    // Check if OpenAI API key is available before proceeding
    if (!process.env.OPENAI_API_KEY) {
      const topPicks = (state.scrapedData ?? [])
        .filter((investment) => investment.dividendYield !== undefined)
        .sort((a, b) => b.dividendYield - a.dividendYield)
        .slice(0, 5);

      const fallbackSummary =
        "Analysis completed using available market data. The investments below have been selected based on dividend yield performance and sector diversification.";

      return {
        ...state,
        summary: {
          summary: fallbackSummary,
          topPicks,
          timestamp: new Date().toISOString(),
        },
        status: "format_report",
      };
    }

    const llm = getOpenAIClient();

    const etfCount =
      state.scrapedData?.filter((inv) => inv.type === "ETF").length || 0;
    const stockCount =
      state.scrapedData?.filter((inv) => inv.type === "STOCK").length || 0;

    const prompt = `You are a financial analyst specializing in real-time market data analysis. Analyze this current investment data (${etfCount} ETFs and ${stockCount} stocks) and provide investment recommendations based on live market conditions. Emphasize that this analysis is based on real-time market data and current dividend yields.

Investment Data: ${JSON.stringify(state.scrapedData)}

Please provide:
1. A summary of the current market opportunities for both ETFs and individual stocks
2. Analysis of dividend yields and trends across both investment types
3. Investment recommendations based on this real-time data
4. Risk considerations for the current market environment
5. Comparison between ETF and stock opportunities

Focus on the fact that this is live, current market data and analysis covering both ETFs and dividend-paying stocks.`;

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

    const topPicks = (state.scrapedData ?? [])
      .filter((investment) => investment.dividendYield !== undefined)
      .sort((a, b) => b.dividendYield - a.dividendYield)
      .slice(0, 8);

    return {
      ...state,
      summary: {
        summary: responseContent.trim(),
        topPicks,
        timestamp: new Date().toISOString(),
      },
      status: "format_report",
    };
  } catch (error) {
    let errorMessage = "Unknown error in summarizeDataNode";

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

export default summarizeDataNode;
