// This endpoint triggers the Research Report workflow (research path)
// Input: { sectors: string[], regions: string[], yieldRange: [number, number] }
// Output: { report, metadata }

import { NextRequest, NextResponse } from "next/server";
import { runAgentWorkflow } from "@/agent/graph";
import { ResearchRequest } from "@/agent/types";

export async function POST(req: Request) {
  try {
    const { sectors, regions, yieldRange } = await req.json();

    // Validate input
    if (!sectors || !regions || !yieldRange) {
      return NextResponse.json(
        { error: "Sectors, regions, and yield range are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(sectors) || !Array.isArray(regions)) {
      return NextResponse.json(
        { error: "Sectors and regions must be arrays" },
        { status: 400 }
      );
    }

    if (!Array.isArray(yieldRange) || yieldRange.length !== 2) {
      return NextResponse.json(
        { error: "Yield range must be an array with two numbers" },
        { status: 400 }
      );
    }

    // Format the input for the workflow
    const researchRequest: ResearchRequest = {
      sectors: sectors as string[],
      regions: regions as string[],
      yieldRange: yieldRange as [number, number],
      timestamp: new Date().toISOString()
    };

    // Run the workflow (Research Report path)
    const result = await runAgentWorkflow(researchRequest);

    // Log the full workflow result for debugging
    console.log("Workflow result:", result);

    // Handle workflow errors
    if (!result || result.status === "error" || !result.report) {
      console.error("Workflow error:", result?.error);
      return NextResponse.json(
        { 
          error: "Failed to generate research report",
          details: result?.error || "No report generated"
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      report: result.report,
      metadata: {
        timestamp: researchRequest.timestamp
      }
    });
  } catch (error) {
    console.error("Error in research API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
