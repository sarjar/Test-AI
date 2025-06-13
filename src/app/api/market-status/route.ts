/**
 * Market Status API Endpoint
 *
 * Provides real-time market status information from Alpha Vantage
 * Returns current market status, last trading day, and timestamp
 *
 * @route GET /api/market-status
 * @returns { timestamp: string, marketStatus: string, lastUpdated: string }
 */

import { NextResponse } from "next/server";
import { getMarketDataTimestamp } from "@/agent/tools/alphaVantage";

export async function GET() {
  try {
    const marketData = await getMarketDataTimestamp();

    if (!marketData) {
      return NextResponse.json(
        {
          error: "Unable to fetch market status",
          details: "Alpha Vantage API may be unavailable or rate limited",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(marketData);
  } catch (error) {
    console.error("Market status API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
