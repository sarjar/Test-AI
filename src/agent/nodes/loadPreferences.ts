import { WorkflowState, UserPreferences } from '../types';

const loadPreferencesNode = async ({ state }: { state: WorkflowState }) => {
  try {
    console.log('loadPreferencesNode input:', state);

    // Get input from either researchRequest or userInput
    const input = state.researchRequest || (state.userInput ? JSON.parse(state.userInput) : null);
    
    if (!input) {
      console.error('No input data available');
      return {
        ...state,
        status: "error",
        error: "No input data available"
      };
    }

    // Validate required fields
    if (!input.sectors || !input.regions || !input.yieldRange) {
      console.error('Missing required fields: sectors, regions, or yieldRange');
      return {
        ...state,
        status: "error",
        error: "Missing required fields: sectors, regions, or yieldRange"
      };
    }

    const preferences: UserPreferences = {
      sectors: input.sectors,
      regions: input.regions,
      yieldMin: input.yieldRange[0],
      yieldMax: input.yieldRange[1],
    };

    console.log('Created preferences:', preferences);
    return {
      ...state,
      preferences,
      status: "generate_search_terms",
    };
  } catch (error) {
    console.error('Error in loadPreferencesNode:', error);
    return {
      ...state,
      status: "error",
      error: error instanceof Error ? error.message : "Failed to load preferences"
    };
  }
};

export default loadPreferencesNode;
