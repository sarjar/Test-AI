import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import axios from "axios";
import * as pdfParse from "pdf-parse";

/**
 * Document Loader Tool for RAG Implementation
 *
 * Handles loading and processing documents from URLs
 * Supports PDF files and text content extraction
 */

export interface DocumentChunk {
  content: string;
  metadata: {
    source: string;
    page?: number;
    chunk: number;
    timestamp: string;
  };
}

export interface DocumentLoaderConfig {
  chunkSize: number;
  chunkOverlap: number;
  maxDocumentSizeMB: number;
}

const DEFAULT_CONFIG: DocumentLoaderConfig = {
  chunkSize: parseInt(process.env.CHUNK_SIZE || "1000"),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || "200"),
  maxDocumentSizeMB: parseInt(process.env.MAX_DOCUMENT_SIZE_MB || "50"),
};

/**
 * Check if URL is a valid document URL
 */
export function isValidDocumentUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const supportedExtensions = [".pdf", ".txt", ".md"];
    const pathname = urlObj.pathname.toLowerCase();

    return (
      supportedExtensions.some((ext) => pathname.endsWith(ext)) ||
      pathname.includes(".pdf") || // Handle URLs with query params
      urlObj.hostname.includes("vanguard.com") ||
      urlObj.hostname.includes("blackrock.com") ||
      urlObj.hostname.includes("fidelity.com")
    );
  } catch {
    return false;
  }
}

/**
 * Load and process document from URL
 */
export async function loadDocumentFromUrl(
  url: string,
  config: Partial<DocumentLoaderConfig> = {},
): Promise<DocumentChunk[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!isValidDocumentUrl(url)) {
    throw new Error("Invalid or unsupported document URL");
  }

  try {
    console.log(`Loading document from: ${url}`);

    // Fetch the document
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: finalConfig.maxDocumentSizeMB * 1024 * 1024,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; InvestmentBot/1.0)",
      },
    });

    const buffer = Buffer.from(response.data);
    let textContent: string;
    let metadata: any = {
      source: url,
      timestamp: new Date().toISOString(),
    };

    // Process based on content type
    const contentType = response.headers["content-type"] || "";

    if (contentType.includes("pdf") || url.toLowerCase().includes(".pdf")) {
      console.log("Processing PDF document...");
      const pdfData = await pdfParse(buffer);
      textContent = pdfData.text;
      metadata.pages = pdfData.numpages;
      metadata.info = pdfData.info;
    } else {
      // Assume text content
      textContent = buffer.toString("utf-8");
    }

    if (!textContent || textContent.trim().length === 0) {
      throw new Error("No text content extracted from document");
    }

    console.log(`Extracted ${textContent.length} characters from document`);

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: finalConfig.chunkSize,
      chunkOverlap: finalConfig.chunkOverlap,
      separators: ["\n\n", "\n", ".", " ", ""],
    });

    const documents = await textSplitter.createDocuments(
      [textContent],
      [metadata],
    );

    // Convert to DocumentChunk format
    const chunks: DocumentChunk[] = documents.map((doc, index) => ({
      content: doc.pageContent,
      metadata: {
        source: url,
        chunk: index,
        timestamp: new Date().toISOString(),
        ...doc.metadata,
      },
    }));

    console.log(`Created ${chunks.length} document chunks`);
    return chunks;
  } catch (error) {
    console.error("Error loading document:", error);

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new Error(
          "Document download timeout. Please try a smaller file.",
        );
      } else if (error.response?.status === 404) {
        throw new Error("Document not found at the provided URL.");
      } else if (error.response?.status === 403) {
        throw new Error(
          "Access denied to the document. Please check the URL permissions.",
        );
      }
    }

    throw new Error(
      `Failed to load document: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Extract key information from financial documents
 */
export function extractFinancialInfo(content: string): {
  fundName?: string;
  ticker?: string;
  expenseRatio?: string;
  dividendYield?: string;
  aum?: string;
  strategy?: string;
} {
  const info: any = {};

  // Extract fund name (usually in title or first few lines)
  const nameMatch = content.match(
    /(?:Fund Name|Product Name|ETF Name)[:\s]+([^\n]+)/i,
  );
  if (nameMatch) info.fundName = nameMatch[1].trim();

  // Extract ticker symbol
  const tickerMatch = content.match(
    /(?:Ticker|Symbol|ISIN)[:\s]+([A-Z0-9]{2,10})/i,
  );
  if (tickerMatch) info.ticker = tickerMatch[1].trim();

  // Extract expense ratio
  const expenseMatch = content.match(
    /(?:Expense Ratio|Annual Fee|Management Fee)[:\s]+([0-9.]+%?)/i,
  );
  if (expenseMatch) info.expenseRatio = expenseMatch[1].trim();

  // Extract dividend yield
  const yieldMatch = content.match(
    /(?:Dividend Yield|Distribution Yield|Yield)[:\s]+([0-9.]+%?)/i,
  );
  if (yieldMatch) info.dividendYield = yieldMatch[1].trim();

  // Extract AUM
  const aumMatch = content.match(
    /(?:Assets Under Management|AUM|Net Assets)[:\s]+([^\n]+)/i,
  );
  if (aumMatch) info.aum = aumMatch[1].trim();

  // Extract investment strategy (first paragraph mentioning strategy/objective)
  const strategyMatch = content.match(
    /(?:Investment Objective|Strategy|Approach)[:\s]*([^\n.]{50,200})/i,
  );
  if (strategyMatch) info.strategy = strategyMatch[1].trim();

  return info;
}
