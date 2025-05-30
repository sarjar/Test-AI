/**
 * AI Consultant Chat API Endpoint
 *
 * Handles general chat queries for investment advice and financial consultation
 * Triggers the AI Consultant workflow (general chat path)
 *
 * @route POST /api/chat
 * @body { query: string } - User's question or message
 * @returns { summary: string, topPicks: ETFData[], timestamp: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { runAgentWorkflow } from "@/agent/graph";
import { createClient } from "../../../../supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user (optional for chat)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Get the query from the request body
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 },
      );
    }

    // Run the agent workflow (AI Consultant path)
    const result = await runAgentWorkflow(query);

    // Extract and format the relevant chat response
    const chatResponse = result?.report
      ? {
          summary: formatChatResponse(result.report.summary),
          topPicks: result.report.topPicks,
          timestamp: result.report.timestamp,
        }
      : null;

    /**
     * Format and clean AI response text for better readability
     * Removes markdown formatting and limits response length
     */
    function formatChatResponse(text: string): string {
      if (!text) return "";

      let formatted = text.trim();

      // Remove unnecessary characters and clean up formatting
      formatted = formatted
        .replace(/\*\*/g, "") // Remove markdown bold markers
        .replace(/\*([^*]+)\*/g, "$1") // Remove single asterisk emphasis
        .replace(/#{1,6}\s*/g, "") // Remove markdown headers
        .replace(/\n{3,}/g, "\n\n") // Limit consecutive newlines to 2
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .replace(/\n\s+/g, "\n") // Remove spaces after newlines
        .trim();

      // Limit to approximately 300 tokens (roughly 1200 characters)
      const maxLength = 1200;
      if (formatted.length > maxLength) {
        // Find the last complete sentence within the limit
        const truncated = formatted.substring(0, maxLength);
        const lastSentence = truncated.lastIndexOf(".");
        if (lastSentence > maxLength * 0.7) {
          formatted = truncated.substring(0, lastSentence + 1);
        } else {
          formatted = truncated + "...";
        }
      }

      return formatted;
    }

    // Store the chat history in Supabase (optional, only if summary exists and user is authenticated)
    if (chatResponse && chatResponse.summary && user && !authError) {
      try {
        const { error: dbError } = await supabase.from("chat_history").insert({
          user_id: user.id,
          query: query,
          response: chatResponse.summary,
          created_at: new Date().toISOString(),
        });
        if (dbError) {
          console.warn("Chat history not saved:", dbError.message);
        }
      } catch (err) {
        console.warn("Failed to save chat history:", err);
      }
    }

    if (!chatResponse) {
      return NextResponse.json(
        { error: "No response generated by AI Consultant" },
        { status: 500 },
      );
    }

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: `Failed to process chat request: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 },
    );
  }
}
