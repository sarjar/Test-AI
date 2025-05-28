import { WorkflowState, isValidYieldRange, isValidSectors, isValidRegions } from '../types';

const guardIntentNode = async ({ state }: { state: WorkflowState }) => {
  try {
    console.log('guardIntentNode input:', state);
    
    // Check for direct research request first
    if (state.researchRequest) {
      const { sectors, regions, yieldRange } = state.researchRequest;
      
      if (!isValidSectors(sectors)) {
        console.error('Invalid sectors: must be non-empty array of strings');
        return { 
          ...state, 
          status: "error", 
          error: "Invalid sectors: must be non-empty array of strings",
          inputType: undefined 
        };
      }
      
      if (!isValidRegions(regions)) {
        console.error('Invalid regions: must be non-empty array of strings');
        return { 
          ...state, 
          status: "error", 
          error: "Invalid regions: must be non-empty array of strings",
          inputType: undefined 
        };
      }
      
      if (!isValidYieldRange(yieldRange)) {
        console.error('Invalid yield range: must be [min, max] where 0 <= min <= max <= 100');
        return { 
          ...state, 
          status: "error", 
          error: "Invalid yield range: must be [min, max] where 0 <= min <= max <= 100",
          inputType: undefined 
        };
      }
      
      return { 
        ...state, 
        status: "load_preferences", 
        inputType: "research" 
      };
    }

    // Handle user input if present
    if (state.userInput) {
      const trimmedInput = state.userInput.trim();
      
      if (!trimmedInput) {
        return { 
          ...state, 
          status: "error", 
          error: "Empty user input",
          inputType: undefined 
        };
      }
      
      // Try to parse as JSON first
      try {
        const input = JSON.parse(trimmedInput);
        console.log('Parsed input in guardIntentNode:', input);

        // Check if this is a research request
        if (input.sectors && input.regions && input.yieldRange) {
          if (!isValidSectors(input.sectors)) {
            return { 
              ...state, 
              status: "error", 
              error: "Invalid sectors: must be non-empty array of strings",
              inputType: undefined 
            };
          }
          
          if (!isValidRegions(input.regions)) {
            return { 
              ...state, 
              status: "error", 
              error: "Invalid regions: must be non-empty array of strings",
              inputType: undefined 
            };
          }
          
          if (!isValidYieldRange(input.yieldRange)) {
            return { 
              ...state, 
              status: "error", 
              error: "Invalid yield range: must be [min, max] where 0 <= min <= max <= 100",
              inputType: undefined 
            };
          }
          
          return { 
            ...state, 
            status: "load_preferences", 
            inputType: "research" 
          };
        }
      } catch (e) {
        // If JSON parsing fails, treat as general chat input
        return { 
          ...state, 
          status: "general_chat", 
          inputType: "general"
        };
      }
    }

    return { 
      ...state, 
      status: "error", 
      error: "No valid input provided",
      inputType: undefined 
    };
  } catch (error) {
    console.error('Error in guardIntentNode:', error);
    return {
      ...state,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error in guard intent",
      inputType: undefined
    };
  }
};

export default guardIntentNode; 