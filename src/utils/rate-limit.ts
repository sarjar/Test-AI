import { createServiceClient } from "../../supabase/service";

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_ATTEMPTS = {
  sign_in: 5,
  sign_up: 3,
  password_reset: 3,
};

// Clean up rate limits older than 24 hours
const CLEANUP_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function cleanupRateLimits() {
  const supabase = await createServiceClient();
  const cutoff = new Date(Date.now() - CLEANUP_WINDOW);

  try {
    const { error } = await supabase
      .from("rate_limits")
      .delete()
      .lt("created_at", cutoff.toISOString());

    if (error) {
      console.error("Failed to cleanup rate limits:", error);
    }
  } catch (err) {
    console.error("Unexpected error during rate limit cleanup:", err);
  }
}

export async function checkRateLimit(
  action: "sign_in" | "sign_up" | "password_reset",
  identifier: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  try {
    const serviceClient = await createServiceClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW);

    // First, ensure the rate_limits table exists
    try {
      await serviceClient.rpc("ensure_rate_limits_table");
    } catch (tableError) {
      console.error("Error ensuring rate_limits table:", tableError);
      // If we can't create the table, allow the request to proceed
      return {
        allowed: true,
        remaining: MAX_ATTEMPTS[action],
        resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW),
      };
    }

    // Clean up old rate limits
    try {
      await serviceClient
        .from("rate_limits")
        .delete()
        .lt("created_at", windowStart.toISOString());
    } catch (cleanupError) {
      console.error("Error cleaning up old rate limits:", cleanupError);
      // Continue even if cleanup fails
    }

    // Count recent attempts
    const { data: attempts, error: countError } = await serviceClient
      .from("rate_limits")
      .select("created_at")
      .eq("action", action)
      .eq("identifier", identifier)
      .gte("created_at", windowStart.toISOString());

    if (countError) {
      console.error("Error checking rate limit:", countError);
      // If we can't check the rate limit, allow the request to proceed
      return {
        allowed: true,
        remaining: MAX_ATTEMPTS[action],
        resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW),
      };
    }

    const attemptCount = attempts?.length || 0;
    const remaining = Math.max(0, MAX_ATTEMPTS[action] - attemptCount);
    const allowed = remaining > 0;

    // Record this attempt
    if (allowed) {
      try {
        await serviceClient.from("rate_limits").insert({
          action,
          identifier,
          created_at: now.toISOString(),
        });
      } catch (insertError) {
        console.error("Error recording rate limit attempt:", insertError);
        // Continue even if recording fails
      }
    }

    return {
      allowed,
      remaining,
      resetAt: new Date(windowStart.getTime() + RATE_LIMIT_WINDOW),
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // If anything goes wrong, allow the request to proceed
    const now = new Date();
    return {
      allowed: true,
      remaining: MAX_ATTEMPTS[action],
      resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW),
    };
  }
}
