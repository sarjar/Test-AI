"use server";

import { trackAuthEvent } from "@/utils/analytics";
import { checkRateLimit } from "@/utils/rate-limit";
import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { createServiceClient } from "../../supabase/service";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();
  const serviceClient = await createServiceClient();
  const headersList = await headers();
  const origin = headersList.get("origin");

  // Input validation
  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Please enter a valid email address",
    );
  }

  if (fullName.trim().length < 2) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Please enter your full name (at least 2 characters)",
    );
  }

  if (password.length < 8) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Password must be at least 8 characters long",
    );
  }

  // Password strength validation
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    );
  }

  // Check rate limit
  const rateLimit = await checkRateLimit("sign_up", email);
  if (!rateLimit.allowed) {
    await trackAuthEvent({
      type: "sign_up",
      email,
      success: false,
      error: "Rate limit exceeded",
      metadata: { remaining: rateLimit.remaining, resetAt: rateLimit.resetAt },
    });
    return encodedRedirect(
      "error",
      "/sign-up",
      `Too many sign-up attempts. Please try again in ${Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000)} minutes.`,
    );
  }

  try {
    // Step 1: Sign up the user
    const {
      data: { user },
      error: signUpError,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          full_name: fullName,
          email: email,
        },
      },
    });

    if (signUpError) {
      await trackAuthEvent({
        type: "sign_up",
        email,
        success: false,
        error: signUpError.message,
        metadata: { code: signUpError.code },
      });
      console.error("Sign up error:", {
        code: signUpError.code,
        message: signUpError.message,
        status: signUpError.status,
      });
      return redirect(
        `/sign-up?error=${encodeURIComponent(signUpError.message)}`,
      );
    }

    if (!user) {
      await trackAuthEvent({
        type: "sign_up",
        email,
        success: false,
        error: "No user returned",
      });
      console.error("No user returned after sign up");
      return redirect("/sign-up?error=Failed to create user account");
    }

    // Step 2: Create user profile manually if it doesn't exist
    const { data: profile, error: profileError } = await serviceClient
      .from("users")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error checking user profile:", {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
      });
    }

    if (!profile) {
      // Create the profile manually using service role
      const { error: insertError } = await serviceClient.from("users").insert({
        id: user.id,
        user_id: user.id,
        email: email,
        full_name: fullName,
        name: fullName,
        token_identifier: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Error creating user profile:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
        });

        // If profile creation fails, we should still allow the sign-up to succeed
        // but log the error for monitoring
        await trackAuthEvent({
          type: "sign_up",
          userId: user.id,
          email,
          success: true,
          error: "Profile creation failed",
          metadata: {
            profileCreated: false,
            error: insertError.message,
            code: insertError.code,
          },
        });
      } else {
        console.log("User profile created manually:", {
          userId: user.id,
          email: email,
          name: fullName,
        });

        await trackAuthEvent({
          type: "sign_up",
          userId: user.id,
          email,
          success: true,
          metadata: { profileCreated: true },
        });
      }
    }

    return redirect(
      "/sign-up?success=Thanks for signing up! Please check your email for a verification link.",
    );
  } catch (err) {
    await trackAuthEvent({
      type: "sign_up",
      email,
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    console.error("Unexpected error during sign up:", err);
    return redirect(
      "/sign-up?error=An unexpected error occurred. Please try again.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  // Input validation
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Please enter a valid email address" };
  }

  // Check rate limit
  const rateLimit = await checkRateLimit("sign_in", email);
  if (!rateLimit.allowed) {
    await trackAuthEvent({
      type: "sign_in",
      email,
      success: false,
      error: "Rate limit exceeded",
      metadata: { remaining: rateLimit.remaining, resetAt: rateLimit.resetAt },
    });
    return {
      error: `Too many sign-in attempts. Please try again in ${Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000)} minutes.`,
    };
  }

  try {
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      },
    );

    if (signInError) {
      await trackAuthEvent({
        type: "sign_in",
        email,
        success: false,
        error: signInError.message,
        metadata: { code: signInError.code },
      });
      console.error("Sign in error:", {
        code: signInError.code,
        message: signInError.message,
        status: signInError.status,
      });

      let errorMessage =
        "The email or password you entered is incorrect. Please try again.";

      // Handle specific error cases based on error code first
      switch (signInError.code) {
        case "email_not_confirmed":
          errorMessage =
            "Please verify your email before signing in. Check your inbox for a verification link.";
          break;
        case "too_many_requests":
          errorMessage =
            "Too many sign-in attempts. Please try again in a few minutes.";
          break;
        case "user_not_found":
          errorMessage =
            "No account found with this email address. Please check your email or sign up for a new account.";
          break;
        case "invalid_credentials":
          errorMessage =
            "The email or password you entered is incorrect. Please try again.";
          break;
        case "signup_disabled":
          errorMessage =
            "Account registration is currently disabled. Please contact support.";
          break;
        default:
          // Fallback to message content checks for cases without specific error codes
          if (
            signInError.message.toLowerCase().includes("email not confirmed")
          ) {
            errorMessage =
              "Please verify your email before signing in. Check your inbox for a verification link.";
          } else if (
            signInError.message.toLowerCase().includes("too many requests")
          ) {
            errorMessage =
              "Too many sign-in attempts. Please try again in a few minutes.";
          } else if (
            signInError.message.toLowerCase().includes("user not found")
          ) {
            errorMessage =
              "No account found with this email address. Please check your email or sign up for a new account.";
          } else if (
            signInError.message
              .toLowerCase()
              .includes("invalid login credentials")
          ) {
            errorMessage =
              "The email or password you entered is incorrect. Please try again.";
          }
          break;
      }

      return { error: errorMessage };
    }

    if (!data.user) {
      await trackAuthEvent({
        type: "sign_in",
        email,
        success: false,
        error: "No user returned",
      });
      console.error("No user returned after sign in");
      return encodedRedirect("error", "/sign-in", "Failed to sign in");
    }

    // Verify user profile exists - use maybeSingle() to avoid errors when no profile exists
    try {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error checking user profile during sign in:", {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
        });
      }

      if (!profile) {
        console.warn("User profile not found during sign in:", data.user.id);
      }

      await trackAuthEvent({
        type: "sign_in",
        userId: data.user.id,
        email,
        success: true,
        metadata: { profileFound: !!profile },
      });
    } catch (profileErr) {
      // Don't fail sign-in if profile check fails
      console.warn(
        "Profile check failed, continuing with sign-in:",
        profileErr,
      );
      await trackAuthEvent({
        type: "sign_in",
        userId: data.user.id,
        email,
        success: true,
        metadata: { profileFound: false, profileError: true },
      });
    }

    return redirect("/dashboard");
  } catch (err) {
    // Handle Next.js redirect errors properly
    if (
      err instanceof Error &&
      (err.message === "NEXT_REDIRECT" || err.message.includes("NEXT_REDIRECT"))
    ) {
      throw err; // Re-throw redirect errors
    }

    // Handle redirect digest errors from Next.js
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof err.digest === "string" &&
      err.digest.includes("NEXT_REDIRECT")
    ) {
      throw err; // Re-throw redirect errors
    }

    await trackAuthEvent({
      type: "sign_in",
      email,
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    console.error("Unexpected error during sign in:", err);
    return encodedRedirect(
      "error",
      "/sign-in",
      "An unexpected error occurred. Please try again.",
    );
  }
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  // Check rate limit
  const rateLimit = await checkRateLimit("password_reset", email);
  if (!rateLimit.allowed) {
    await trackAuthEvent({
      type: "password_reset",
      email,
      success: false,
      error: "Rate limit exceeded",
      metadata: { remaining: rateLimit.remaining, resetAt: rateLimit.resetAt },
    });
    return encodedRedirect(
      "error",
      "/forgot-password",
      `Too many password reset attempts. Please try again in ${Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000)} minutes.`,
    );
  }

  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
      },
    );

    if (resetError) {
      await trackAuthEvent({
        type: "password_reset",
        email,
        success: false,
        error: resetError.message,
        metadata: { code: resetError.code },
      });
      console.error("Password reset error:", {
        code: resetError.code,
        message: resetError.message,
        status: resetError.status,
      });

      let errorMessage = resetError.message;
      if (resetError.message.includes("User not found")) {
        errorMessage = "No account found with this email address";
      }

      return encodedRedirect("error", "/forgot-password", errorMessage);
    }

    await trackAuthEvent({
      type: "password_reset",
      email,
      success: true,
    });

    if (callbackUrl) {
      return redirect(callbackUrl);
    }

    return encodedRedirect(
      "success",
      "/forgot-password",
      "Check your email for a link to reset your password.",
    );
  } catch (err) {
    await trackAuthEvent({
      type: "password_reset",
      email,
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    console.error("Unexpected error during password reset:", err);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "An unexpected error occurred. Please try again.",
    );
  }
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  try {
    if (!password || !confirmPassword) {
      return encodedRedirect(
        "error",
        "/protected/reset-password",
        "Password and confirm password are required",
      );
    }

    if (password !== confirmPassword) {
      return encodedRedirect(
        "error",
        "/protected/reset-password",
        "Passwords do not match",
      );
    }

    const {
      data: { user },
      error: updateError,
    } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      await trackAuthEvent({
        type: "password_update",
        userId: user?.id,
        email: user?.email,
        success: false,
        error: updateError.message,
        metadata: { code: updateError.code },
      });
      console.error("Password update error:", {
        code: updateError.code,
        message: updateError.message,
        status: updateError.status,
      });

      let errorMessage = updateError.message;
      if (updateError.message.includes("Password should be at least")) {
        errorMessage = "Password must be at least 8 characters long";
      }

      return encodedRedirect(
        "error",
        "/protected/reset-password",
        errorMessage,
      );
    }

    await trackAuthEvent({
      type: "password_update",
      userId: user?.id,
      email: user?.email,
      success: true,
    });

    return encodedRedirect(
      "success",
      "/protected/reset-password",
      "Password updated successfully",
    );
  } catch (err) {
    await trackAuthEvent({
      type: "password_update",
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    console.error("Unexpected error during password update:", err);
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "An unexpected error occurred. Please try again.",
    );
  }
};

export const signOutAction = async () => {
  const supabase = await createClient();

  try {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      await trackAuthEvent({
        type: "sign_out",
        success: false,
        error: signOutError.message,
        metadata: { code: signOutError.code },
      });
      console.error("Sign out error:", {
        code: signOutError.code,
        message: signOutError.message,
        status: signOutError.status,
      });
    } else {
      await trackAuthEvent({
        type: "sign_out",
        success: true,
      });
    }

    return redirect("/sign-in");
  } catch (err) {
    await trackAuthEvent({
      type: "sign_out",
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    console.error("Unexpected error during sign out:", err);
    return redirect("/sign-in");
  }
};
