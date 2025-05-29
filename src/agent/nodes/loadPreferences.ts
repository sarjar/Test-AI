import { WorkflowState, UserPreferences } from "../types";

/**
 * Load Preferences Node
 *
 * Extracts and validates user preferences from research requests
 * Converts input data into structured UserPreferences format
 */

const loadPreferencesNode = async (
  state: WorkflowState,
): Promise<WorkflowState> => {
  try {
    // Get input from either researchRequest or userInput
    const input =
      state.researchRequest ||
      (state.userInput ? JSON.parse(state.userInput) : null);

    if (!input) {
      return {
        ...state,
        status: "error",
        error: "No input data available",
      };
    }

    // Validate required fields
    if (!input.sectors || !input.regions || !input.yieldRange) {
      return {
        ...state,
        status: "error",
        error: "Missing required fields: sectors, regions, or yieldRange",
      };
    }

    const preferences: UserPreferences = {
      sectors: input.sectors,
      regions: input.regions,
      yieldMin: input.yieldRange[0],
      yieldMax: input.yieldRange[1],
    };

    return {
      ...state,
      preferences,
      status: "generate_search_terms",
    };
  } catch (error) {
    return {
      ...state,
      status: "error",
      error:
        error instanceof Error ? error.message : "Failed to load preferences",
    };
  }
};

export default loadPreferencesNode;
