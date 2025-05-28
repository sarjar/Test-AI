import { END, StateGraph } from "@langchain/langgraph";
import { ResearchRequest, WorkflowState } from './types';
import guardIntentNode from './nodes/guardIntent';
import loadPreferencesNode from './nodes/loadPreferences';
import generateSearchTermsNode from './nodes/generateSearchTerms';
import scrapeDataNode from './nodes/scrapeData';
import summarizeDataNode from './nodes/summarizeData';
import formatReportNode from './nodes/formatReport';
import generalChatNode from './nodes/generalChat';

// -----------------------------------------------------------------------------
// Modular Workflow Paths for Dividend Investment Research Platform
// -----------------------------------------------------------------------------
//
// This graph supports two main workflows, triggered by the type of input:
//
// 1. Research Report Workflow (triggered by /api/research):
//    - Path: guard_intent -> load_preferences -> generate_search_terms -> scrape_data -> summarize_data -> format_report -> END
//    - Input: JSON object with { sectors, regions, yieldRange }
//    - Output: Structured research report for display in the Results tab.
//
// 2. AI Consultant Workflow (triggered by /api/chat):
//    - Path: guard_intent -> general_chat -> END
//    - Input: String query (user question)
//    - Output: Natural language answer for the AI Consultant chat.
//
// The guardIntentNode inspects the input and sets the workflow status to route to the correct path.
// The API endpoints /api/research and /api/chat send the appropriate input to trigger the correct workflow.
//
// -----------------------------------------------------------------------------

// Error handling nodes
const handleErrorNode = async (state: WorkflowState): Promise<WorkflowState> => {
  return {
    ...state,
    error: state.error || "An unexpected error occurred",
    status: "error"
  };
};

// Define the state annotation using the modern LangGraph approach
const workflowGraph = new StateGraph<WorkflowState>({
  channels: {
    state: {
      value: (prev, curr) => ({
        ...prev,
        ...curr,
        userInput: curr?.userInput ?? prev?.userInput,
        researchRequest: curr?.researchRequest ?? prev?.researchRequest,
        status: curr?.status ?? prev?.status,
        error: curr?.error ?? prev?.error,
        preferences: curr?.preferences ?? prev?.preferences,
        searchTerms: curr?.searchTerms ?? prev?.searchTerms,
        scrapedData: curr?.scrapedData ?? prev?.scrapedData,
        summary: curr?.summary ?? prev?.summary,
        report: curr?.report ?? prev?.report,
        inputType: curr?.inputType ?? prev?.inputType
      })
    }
  }
});

// Add main workflow nodes
workflowGraph.addNode("guard_intent", guardIntentNode);
workflowGraph.addNode("load_preferences", loadPreferencesNode);
workflowGraph.addNode("generate_search_terms", generateSearchTermsNode);
workflowGraph.addNode("scrape_data", scrapeDataNode);
workflowGraph.addNode("summarize_data", summarizeDataNode);
workflowGraph.addNode("format_report", formatReportNode);
workflowGraph.addNode("general_chat", generalChatNode);
workflowGraph.addNode("handle_error", handleErrorNode);

// Set the entry point
workflowGraph.setEntryPoint("guard_intent");

// Add edges for research path
workflowGraph.addConditionalEdges(
  "guard_intent",
  (state: WorkflowState) => {
    console.log("Guard intent routing decision for state:", state);
    if (state.status === "error") return "handle_error";
    if (state.status === "general_chat") return "general_chat";
    return "load_preferences";
  },
  {
    error: "handle_error",
    general_chat: "general_chat",
    load_preferences: "load_preferences"
  }
);

workflowGraph.addConditionalEdges(
  "load_preferences",
  (state: WorkflowState) => {
    console.log("Load preferences routing decision for state:", state);
    return state.status === "error" ? "handle_error" : "generate_search_terms";
  },
  {
    error: "handle_error",
    generate_search_terms: "generate_search_terms"
  }
);

workflowGraph.addConditionalEdges(
  "generate_search_terms",
  (state: WorkflowState) => {
    console.log("Generate search terms routing decision for state:", state);
    return state.status === "error" ? "handle_error" : "scrape_data";
  },
  {
    error: "handle_error",
    scrape_data: "scrape_data"
  }
);

workflowGraph.addConditionalEdges(
  "scrape_data",
  (state: WorkflowState) => {
    console.log("Scrape data routing decision for state:", state);
    return state.status === "error" ? "handle_error" : "summarize_data";
  },
  {
    error: "handle_error",
    summarize_data: "summarize_data"
  }
);

workflowGraph.addConditionalEdges(
  "summarize_data",
  (state: WorkflowState) => {
    console.log("Summarize data routing decision for state:", state);
    return state.status === "error" ? "handle_error" : "format_report";
  },
  {
    error: "handle_error",
    format_report: "format_report"
  }
);

workflowGraph.addConditionalEdges(
  "format_report",
  (state: WorkflowState) => {
    console.log("Format report routing decision for state:", state);
    return state.status === "error" ? "handle_error" : "complete";
  },
  {
    error: "handle_error",
    complete: END
  }
);

// Add edges for chat path
workflowGraph.addConditionalEdges(
  "general_chat",
  (state: WorkflowState) => {
    console.log("General chat routing decision for state:", state);
    return state.status === "error" ? "handle_error" : "complete";
  },
  {
    error: "handle_error",
    complete: END
  }
);

// Add error handling edge
workflowGraph.addEdge("handle_error", END);

const compiledGraph = workflowGraph.compile();

export async function runAgentWorkflow(request: string | ResearchRequest) {
  console.log("Running agent workflow with input:", request);

  const initialState: WorkflowState = {
    userInput: typeof request === 'string' ? request : undefined,
    researchRequest: typeof request === 'string' ? undefined : request,
    status: "start"
  };

  console.log("Initial state:", initialState);
  try {
    const result = await compiledGraph.invoke({ state: initialState });
    console.log("CompiledGraph result:", result);
    return result;
  } catch (error) {
    console.error("Error in runAgentWorkflow:", error);
    return {
      state: {
        ...initialState,
        status: "error" as const,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    };
  }
}

