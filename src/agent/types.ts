/**
 * User investment preferences for research requests
 */
export interface UserPreferences {
  sectors: string[];
  regions: string[];
  yieldMin: number;
  yieldMax: number;
}

/**
 * Search term for data scraping
 */
export interface SearchTerm {
  query: string;
  source: string;
}

/**
 * ETF data structure from scraping operations
 */
export interface ETFData {
  symbol: string;
  name: string;
  dividendYield: number;
  sector: string;
  price?: number;
  marketCap?: number;
  description?: string;
  source: string;
  timestamp: string;
  region?: string;
  expenseRatio?: number;
  aum?: number; // Assets Under Management
  inceptionDate?: string;
}

/**
 * Summary report generated from analysis
 */
export interface SummaryReport {
  title?: string;
  summary: string;
  topPicks: ETFData[];
  timestamp: string;
  metadata?: {
    totalETFsAnalyzed: number;
    averageYield: number;
    topSectors: string[];
    dataQuality: "high" | "medium" | "low";
  };
}

/**
 * Research request from API endpoints
 */
export interface ResearchRequest {
  sectors: string[];
  regions: string[];
  yieldRange: [number, number];
  timestamp: string;
}

/**
 * Workflow execution status types
 */
export type WorkflowStatus =
  | "start"
  | "error"
  | "retrying"
  | "load_preferences"
  | "preferences"
  | "generate_search_terms"
  | "scrape_data"
  | "summarize_data"
  | "format_report"
  | "general_chat"
  | "complete";

/**
 * Input type classification
 */
export type InputType = "research" | "general";

/**
 * Main workflow state interface
 * Tracks data and status throughout the workflow execution
 */
export interface WorkflowState {
  userInput?: string;
  researchRequest?: ResearchRequest;
  status: WorkflowStatus;
  error?: string;
  preferences?: UserPreferences;
  searchTerms?: SearchTerm[];
  scrapedData?: ETFData[];
  summary?: SummaryReport;
  report?: SummaryReport;
  inputType?: InputType;
}

/**
 * Validation functions for input data
 */

/**
 * Validate yield range format and values
 */
export const isValidYieldRange = (range: any): range is [number, number] => {
  return (
    Array.isArray(range) &&
    range.length === 2 &&
    typeof range[0] === "number" &&
    typeof range[1] === "number" &&
    range[0] >= 0 &&
    range[1] >= range[0] &&
    range[1] <= 100
  );
};

/**
 * Validate sectors array format
 */
export const isValidSectors = (sectors: any): sectors is string[] => {
  return (
    Array.isArray(sectors) &&
    sectors.length > 0 &&
    sectors.every((s) => typeof s === "string" && s.trim().length > 0)
  );
};

/**
 * Validate regions array format
 */
export const isValidRegions = (regions: any): regions is string[] => {
  return (
    Array.isArray(regions) &&
    regions.length > 0 &&
    regions.every((r) => typeof r === "string" && r.trim().length > 0)
  );
};
