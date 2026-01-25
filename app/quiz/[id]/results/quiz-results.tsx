"use client";

import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";
import type { QuizQuestion } from "@/lib/openrouter";
import { generateQuizPdf } from "@/lib/pdf-generator";

interface QuizResultsProps {
  quizId: string;
  questions: QuizQuestion[];
  userAnswers: (string | null)[];
  summaryId: string;
  summaryTitle: string;
  createdAt: Date;
}

export function QuizResults({
  quizId,
  questions,
  userAnswers,
  summaryId,
  summaryTitle,
  createdAt,
}: QuizResultsProps) {
  const handleDownloadPdf = () => {
    generateQuizPdf({
      title: summaryTitle,
      createdAt,
      questions,
    });
  };
  // Calculate score
  const results = questions.map((question, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = userAnswer === question.correctAnswer;
    return {
      question,
      userAnswer,
      isCorrect,
    };
  });

  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalQuestions = questions.length;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

  // Determine score message and color
  const getScoreInfo = () => {
    if (scorePercentage >= 80) {
      return {
        message: "Ottimo lavoro!",
        description: "Hai dimostrato un'eccellente comprensione del materiale.",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        borderColor: "border-green-500",
      };
    } else if (scorePercentage >= 60) {
      return {
        message: "Buon risultato!",
        description: "Hai una buona comprensione, ma c'è spazio per migliorare.",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        borderColor: "border-yellow-500",
      };
    } else {
      return {
        message: "Continua a studiare!",
        description: "Rileggi il riassunto e riprova il quiz per migliorare.",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/30",
        borderColor: "border-red-500",
      };
    }
  };

  const scoreInfo = getScoreInfo();

  return (
    <>
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Risultati Quiz
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{summaryTitle}</p>
      </div>

      {/* Score Card */}
      <Card className={`mb-8 border-2 ${scoreInfo.borderColor}`}>
        <CardContent className={`p-8 ${scoreInfo.bgColor}`}>
          <div className="text-center">
            <div className={`text-6xl font-bold ${scoreInfo.color}`}>
              {correctCount}/{totalQuestions}
            </div>
            <div className="mt-2 text-2xl font-medium text-gray-700 dark:text-gray-300">
              {scorePercentage}%
            </div>
            <div className={`mt-4 text-xl font-semibold ${scoreInfo.color}`}>
              {scoreInfo.message}
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {scoreInfo.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <div className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Riepilogo Domande
        </h2>
        {results.map((result, index) => (
          <Card
            key={index}
            className={`border-l-4 ${
              result.isCorrect
                ? "border-l-green-500"
                : "border-l-red-500"
            }`}
          >
            <CardContent className="p-4">
              {/* Question header with result indicator */}
              <div className="mb-3 flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
                    result.isCorrect ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {result.isCorrect ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Domanda {index + 1}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        result.question.type === "multiple_choice"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      }`}
                    >
                      {result.question.type === "multiple_choice"
                        ? "Scelta multipla"
                        : "Vero / Falso"}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {result.question.question}
                  </p>
                </div>
              </div>

              {/* Answer details */}
              <div className="ml-11 space-y-2">
                {/* User's answer */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    La tua risposta:
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      result.isCorrect
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {result.userAnswer || "Nessuna risposta"}
                  </span>
                </div>

                {/* Correct answer (only shown if wrong) */}
                {!result.isCorrect && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Risposta corretta:
                    </span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {result.question.correctAnswer}
                    </span>
                  </div>
                )}

                {/* Explanation (only shown if wrong) */}
                {!result.isCorrect && result.question.explanation && (
                  <div className="mt-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <div className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Spiegazione:
                        </span>
                        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                          {result.question.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Link href={`/quiz/${quizId}`}>
          <Button variant="primary" className="w-full sm:w-auto">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Ripeti Quiz
          </Button>
        </Link>
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={handleDownloadPdf}
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Scarica Quiz
        </Button>
        <Link href={`/summary/${summaryId}`}>
          <Button variant="secondary" className="w-full sm:w-auto">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Torna al Riassunto
          </Button>
        </Link>
      </div>
    </>
  );
}
