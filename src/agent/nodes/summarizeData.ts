import { WorkflowState } from '../types';
import getOpenAIClient from '../tools/openAIClient';

const summarizeDataNode = async ({ state }: { state: WorkflowState }) => {
  try {
    console.log('summarizeDataNode input:', state);
    if (!state.scrapedData) {
      console.error('No data to summarize');
      return { ...state, status: "error", error: "No data to summarize" };
    }

    console.log('Summarizing data:', state.scrapedData);
    const llm = getOpenAIClient();
    
    const prompt = `You are a financial analyst specializing in real-time market data analysis. Analyze this current ETF data and provide investment recommendations based on live market conditions. Emphasize that this analysis is based on real-time market data and current dividend yields.

ETF Data: ${JSON.stringify(state.scrapedData)}

Please provide:
1. A summary of the current market opportunities
2. Analysis of dividend yields and trends
3. Investment recommendations based on this real-time data
4. Risk considerations for the current market environment

Focus on the fact that this is live, current market data and analysis.`;

    console.log('Sending prompt to OpenAI for real-time analysis');
    const response = await llm.invoke(prompt);
    console.log('Received summary from OpenAI:', response);

    // Handle different response structures from LangChain ChatOpenAI
    let responseContent: string;
    
    if (typeof response === 'string') {
      responseContent = response;
    } else if (response && typeof response === 'object' && 'content' in response) {
      // Handle AIMessage structure from LangChain
      responseContent = typeof response.content === 'string' 
        ? response.content 
        : String(response.content);
    } else {
      // Fallback: convert whatever we got to string
      responseContent = String(response);
    }

    if (!responseContent || responseContent.trim() === '') {
      throw new Error('Empty response from OpenAI');
    }

    const topPicks = (state.scrapedData ?? [])
      .filter(etf => etf.dividendYield !== undefined)
      .sort((a, b) => b.dividendYield - a.dividendYield)
      .slice(0, 5);

    console.log('Generated top picks from real-time data:', topPicks);
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
    console.error('Error in summarizeDataNode:', error);
    
    let errorMessage = "Unknown error in summarizeDataNode";
    
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return {
      ...state,
      status: "error",
      error: errorMessage
    };
  }
};

export default summarizeDataNode; 