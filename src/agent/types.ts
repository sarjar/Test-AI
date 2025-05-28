export interface UserPreferences {
  sectors: string[];
  regions: string[];
  yieldMin: number;
  yieldMax: number;
}

export interface SearchTerm {
  query: string;
  source: string;
}

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

export interface SummaryReport {
  title?: string;
  summary: string;
  topPicks: ETFData[];
  timestamp: string;
  metadata?: {
    totalETFsAnalyzed: number;
    averageYield: number;
    topSectors: string[];
    dataQuality: 'high' | 'medium' | 'low';
  };
}

export interface ResearchRequest {
  sectors: string[];
  regions: string[];
  yieldRange: [number, number];
  timestamp: string;
}

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

export type InputType = "research" | "general";

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

// Validation functions
export const isValidYieldRange = (range: any): range is [number, number] => {
  return Array.isArray(range) && 
         range.length === 2 && 
         typeof range[0] === 'number' && 
         typeof range[1] === 'number' &&
         range[0] >= 0 && 
         range[1] >= range[0] && 
         range[1] <= 100;
};

export const isValidSectors = (sectors: any): sectors is string[] => {
  return Array.isArray(sectors) && 
         sectors.length > 0 && 
         sectors.every(s => typeof s === 'string' && s.trim().length > 0);
};

export const isValidRegions = (regions: any): regions is string[] => {
  return Array.isArray(regions) && 
         regions.length > 0 && 
         regions.every(r => typeof r === 'string' && r.trim().length > 0);
}; 