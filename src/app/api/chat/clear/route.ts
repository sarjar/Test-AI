// API endpoint to clear chat history for the authenticated user
// DELETE /api/chat/clear
// Removes all chat history entries from the database for the current user

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Delete all chat history for the user
    const { error: deleteError } = await supabase
      .from("chat_history")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting chat history:", deleteError);
      return NextResponse.json(
        { error: "Failed to clear chat history" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Chat history cleared successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Clear chat history API error:", error);
    return NextResponse.json(
      {
        error: `Failed to clear chat history: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 },
    );
  }
}
