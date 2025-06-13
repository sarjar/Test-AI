// Set LangChain configuration
process.env.LANGCHAIN_CALLBACKS_BACKGROUND = "true";

// Validate required environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_KEY",
  "OPENAI_API_KEY",
] as const;

// Optional environment variables for enhanced features
const optionalEnvVars = [
  "ALPHA_VANTAGE_API_KEY",
  "FINANCIAL_DATASET_API_KEY",
  "MAX_DOCUMENT_SIZE_MB",
  "CHUNK_SIZE",
  "CHUNK_OVERLAP",
  "RESEND_API_KEY",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
    projectId: process.env.SUPABASE_PROJECT_ID,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  apis: {
    alphaVantage: process.env.ALPHA_VANTAGE_API_KEY,
    financialDataset: process.env.FINANCIAL_DATASET_API_KEY,
  },
  documents: {
    maxSizeMB: parseInt(process.env.MAX_DOCUMENT_SIZE_MB || "50"),
    chunkSize: parseInt(process.env.CHUNK_SIZE || "1000"),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || "200"),
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
} as const;
