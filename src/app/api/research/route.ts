/**
 * Research Report API Endpoint
 *
 * Triggers the Research Report workflow for generating investment analysis
 * Processes user preferences and returns comprehensive ETF recommendations
 *
 * @route POST /api/research
 * @body { sectors: string[], regions: string[], yieldRange: [number, number] }
 * @returns { report: SummaryReport, status: string, metadata: object }
 */

import { NextRequest, NextResponse } from "next/server";
import { runAgentWorkflow } from "@/agent/graph";
import { ResearchRequest, WorkflowState } from "@/agent/types";

export async function POST(req: Request) {
  try {
    const { sectors, regions, yieldRange } = await req.json();

    // Validate input
    if (!sectors || !regions || !yieldRange) {
      return NextResponse.json(
        { error: "Sectors, regions, and yield range are required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(sectors) || !Array.isArray(regions)) {
      return NextResponse.json(
        { error: "Sectors and regions must be arrays" },
        { status: 400 },
      );
    }

    if (!Array.isArray(yieldRange) || yieldRange.length !== 2) {
      return NextResponse.json(
        { error: "Yield range must be an array with two numbers" },
        { status: 400 },
      );
    }

    // Format the input for the workflow
    const researchRequest: ResearchRequest = {
      sectors: sectors as string[],
      regions: regions as string[],
      yieldRange: yieldRange as [number, number],
      timestamp: new Date().toISOString(),
    };

    // Run the workflow (Research Report path)
    const result = await runAgentWorkflow(researchRequest);

    // Extract the state from the result - handle LangGraph result structure
    let state: WorkflowState;

    if (result && typeof result === "object") {
      // LangGraph returns the final state directly
      state = result as WorkflowState;
    } else if (result === undefined || result === null) {
      return NextResponse.json(
        {
          error: "Workflow execution failed",
          details: "Workflow returned no result",
          status: "error",
        },
        { status: 500 },
      );
    } else {
      console.error("Invalid workflow result structure:", {
        resultType: typeof result,
        result: result,
      });
      return NextResponse.json(
        {
          error: "Invalid workflow result structure",
          details: `Expected object, got ${typeof result}`,
          status: "error",
        },
        { status: 500 },
      );
    }

    // Handle workflow errors
    if (!state) {
      return NextResponse.json(
        {
          error: "Failed to generate research report",
          details: "No valid state found in workflow result",
          status: "error",
        },
        { status: 500 },
      );
    }

    if (state.status === "error" || state.error) {
      return NextResponse.json(
        {
          error: "Failed to generate research report",
          details: state.error || "Workflow returned error status",
          status: "error",
        },
        { status: 400 },
      );
    }

    if (!state.report) {
      // If we have scraped data but no report, try to return what we have
      if (state.scrapedData && state.scrapedData.length > 0) {
        return NextResponse.json({
          error: "Partial data available",
          details: "Report generation failed but data was scraped",
          status: "partial_success",
          scrapedData: state.scrapedData,
          metadata: {
            timestamp: researchRequest.timestamp,
            totalETFsAnalyzed: state.scrapedData.length,
            dataQuality: "partial",
          },
        });
      }

      // Check if we have a summary but no report
      if (state.summary) {
        const fallbackReport = {
          title: "Market Data Analysis",
          summary:
            state.summary.summary ||
            "No data found matching your criteria. This may be due to data source limitations or very specific search requirements.",
          topPicks: state.summary.topPicks || [],
          timestamp: new Date().toISOString(),
          metadata: {
            totalETFsAnalyzed: 0,
            averageYield: 0,
            topSectors: [],
            dataQuality: "low",
          },
        };

        return NextResponse.json({
          report: fallbackReport,
          status: "success",
          metadata: fallbackReport.metadata,
        });
      }

      return NextResponse.json(
        {
          error: "No research report generated",
          details:
            "Workflow completed but no usable data was found. This may be due to data source limitations.",
          status: "error",
        },
        { status: 400 },
      );
    }

    // Return successful result
    return NextResponse.json({
      report: state.report,
      status: "success",
      metadata: {
        timestamp: researchRequest.timestamp,
        totalETFsAnalyzed: state.report?.metadata?.totalETFsAnalyzed || 0,
        averageYield: state.report?.metadata?.averageYield || 0,
        topSectors: state.report?.metadata?.topSectors || [],
        dataQuality: state.report?.metadata?.dataQuality || "unknown",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
