import { WorkflowState } from '../types';
import getOpenAIClient from '../tools/openAIClient';

const generateSearchTermsNode = async ({ state }: { state: WorkflowState }) => {
  try {
    console.log('generateSearchTermsNode input:', state);
    if (!state.preferences) {
      console.error('Preferences not loaded');
      return { ...state, status: "error", error: "Preferences not loaded" };
    }

    console.log('Generating search terms with preferences:', state.preferences);
    const llm = getOpenAIClient();
    
    const prompt = `Generate 3-5 specific search terms for finding current high dividend ETFs with real-time market data based on these preferences:
    - Sectors: ${state.preferences.sectors.join(', ')}
    - Regions: ${state.preferences.regions.join(', ')}
    - Yield Range: ${state.preferences.yieldMin}% to ${state.preferences.yieldMax}%
    
    Focus on terms that will help find live, current market data for dividend ETFs. Include terms that financial data sources would use for real-time ETF information.
    
    Format each search term on a new line.`;

    console.log('Sending prompt to OpenAI for search term generation');
    const response = await llm.invoke(prompt);
    console.log('LLM response:', response);

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

    const searchTerms = responseContent
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean)
      .map((term: string) => ({
        query: term,
        source: "llm",
      }));

    console.log('Generated search terms for real-time data:', searchTerms);
    
    if (searchTerms.length === 0) {
      return { 
        ...state, 
        status: "error", 
        error: "Failed to generate valid search terms" 
      };
    }

    return { ...state, searchTerms, status: "scrape_data" };
  } catch (error) {
    console.error('Error in generateSearchTermsNode:', error);
    
    let errorMessage = "Unknown error in generateSearchTermsNode";
    
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

export default generateSearchTermsNode; 