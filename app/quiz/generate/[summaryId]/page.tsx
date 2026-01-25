"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@/components/ui";

export default function QuizGeneratePage() {
  const router = useRouter();
  const params = useParams();
  const summaryId = params.summaryId as string;

  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    async function generateQuiz() {
      try {
        const response = await fetch("/api/quiz", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ summaryId }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Errore nella generazione del quiz");
          setIsGenerating(false);
          return;
        }

        // Redirect to the quiz page
        router.replace(`/quiz/${data.quizId}`);
      } catch (err) {
        console.error("Quiz generation error:", err);
        setError("Errore di connessione. Riprova più tardi.");
        setIsGenerating(false);
      }
    }

    if (summaryId) {
      generateQuiz();
    }
  }, [summaryId, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-md">
          <div className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                <svg
                  className="h-8 w-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 text-center text-xl font-bold text-gray-900 dark:text-white">
              Errore nella Generazione
            </h1>
            <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
              {error}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={`/summary/${summaryId}`}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Torna al Riassunto
              </Link>
              <button
                onClick={() => {
                  setError(null);
                  setIsGenerating(true);
                  window.location.reload();
                }}
                className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                Riprova
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-md">
        <div className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800">
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Spinner with pulsing animation */}
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20" />
              <Spinner size="lg" />
            </div>

            {/* Message */}
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Generando il Quiz...
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                L&apos;intelligenza artificiale sta creando le domande basate sul tuo riassunto
              </p>
            </div>

            {/* Helpful tip */}
            <div className="max-w-md rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
              <p className="text-center text-xs text-blue-700 dark:text-blue-300">
                Non chiudere questa pagina. Il processo potrebbe richiedere alcuni istanti.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
