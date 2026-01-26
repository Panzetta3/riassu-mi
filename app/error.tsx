"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 dark:from-gray-900 dark:to-gray-950">
      <div className="text-center">
        {/* Error Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            className="h-12 w-12 text-red-500 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Si è verificato un errore
        </h1>

        {/* Description */}
        <p className="mt-4 max-w-md text-gray-600 dark:text-gray-400">
          Qualcosa è andato storto. Riprova o torna alla homepage.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button variant="primary" onClick={reset} className="px-6 py-3">
            Riprova
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3"
          >
            Torna alla Homepage
          </Button>
        </div>
      </div>
    </div>
  );
}
