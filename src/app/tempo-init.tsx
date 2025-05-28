"use client";
// Import the dev tools and initialize them
import { useEffect } from "react";

export function TempoInit() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    // Check if we're in the Tempo environment before attempting to initialize
    if (!process.env.NEXT_PUBLIC_TEMPO) return;

    // Wait for Next.js to be fully initialized with retry mechanism
    const checkAndInitTempo = async (retryCount = 0) => {
      try {
        // Only import tempo-devtools when needed
        const { TempoDevtools } = await import("tempo-devtools");

        // Initialize with a safe mode that doesn't rely on build manifest
        TempoDevtools.init({
          safeMode: true,
          disableBuildManifest: true,
          skipFileChecks: true,
        });

        console.log("Tempo initialized successfully in safe mode");
      } catch (error) {
        console.warn(
          `Error initializing Tempo (attempt ${retryCount + 1}):`,
          error,
        );

        // Retry with exponential backoff up to 5 times
        if (retryCount < 5) {
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
          console.log(`Retrying in ${backoffTime}ms...`);
          setTimeout(() => checkAndInitTempo(retryCount + 1), backoffTime);
        }
      }
    };

    // Delay initialization to ensure Next.js is ready (increased initial delay)
    const initialDelay = setTimeout(checkAndInitTempo, 5000);

    return () => clearTimeout(initialDelay);
  }, []);

  return null;
}
