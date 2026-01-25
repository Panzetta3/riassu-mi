"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";
import type { QuizQuestion } from "@/lib/openrouter";

interface QuizInterfaceProps {
  quizId: string;
  questions: QuizQuestion[];
  summaryId: string;
  summaryTitle: string;
}

export function QuizInterface({
  quizId,
  questions,
  summaryId,
  summaryTitle,
}: QuizInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(
    new Array(questions.length).fill(null)
  );

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const totalQuestions = questions.length;

  const handleSelectAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const answeredCount = answers.filter((a) => a !== null).length;
  const allAnswered = answeredCount === totalQuestions;

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/summary/${summaryId}`}
          className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Torna al Riassunto
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quiz: {summaryTitle}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Rispondi alle domande per verificare la tua comprensione
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Domanda {currentIndex + 1} di {totalQuestions}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {answeredCount} risposte date
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* Question type badge */}
          <div className="mb-4">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                currentQuestion.type === "multiple_choice"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
              }`}
            >
              {currentQuestion.type === "multiple_choice"
                ? "Scelta multipla"
                : "Vero / Falso"}
            </span>
          </div>

          {/* Question text */}
          <h2 className="mb-6 text-lg font-medium text-gray-900 dark:text-white">
            {currentQuestion.question}
          </h2>

          {/* Answer options */}
          <div className="space-y-3">
            {currentQuestion.type === "multiple_choice" &&
              currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(option)}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    selectedAnswer === option
                      ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                        selectedAnswer === option
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span
                      className={`${
                        selectedAnswer === option
                          ? "font-medium text-blue-900 dark:text-blue-100"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {option}
                    </span>
                  </div>
                </button>
              ))}

            {currentQuestion.type === "true_false" && (
              <>
                <button
                  onClick={() => handleSelectAnswer("Vero")}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    selectedAnswer === "Vero"
                      ? "border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-900/20"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        selectedAnswer === "Vero"
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                      }`}
                    >
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
                    </span>
                    <span
                      className={`font-medium ${
                        selectedAnswer === "Vero"
                          ? "text-green-900 dark:text-green-100"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      Vero
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => handleSelectAnswer("Falso")}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    selectedAnswer === "Falso"
                      ? "border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        selectedAnswer === "Falso"
                          ? "bg-red-600 text-white"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                      }`}
                    >
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
                    </span>
                    <span
                      className={`font-medium ${
                        selectedAnswer === "Falso"
                          ? "text-red-900 dark:text-red-100"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      Falso
                    </span>
                  </div>
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="px-6"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Indietro
        </Button>

        {currentIndex < totalQuestions - 1 ? (
          <Button variant="primary" onClick={goToNext} className="px-6">
            Avanti
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
        ) : (
          <Link
            href={`/quiz/${quizId}/results?answers=${encodeURIComponent(
              JSON.stringify(answers)
            )}`}
          >
            <Button
              variant="primary"
              disabled={!allAnswered}
              className="px-6"
              title={
                !allAnswered
                  ? `Rispondi a tutte le domande (${answeredCount}/${totalQuestions})`
                  : undefined
              }
            >
              Verifica Risposte
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </Button>
          </Link>
        )}
      </div>

      {/* Question dots navigation */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-3 w-3 rounded-full transition-all ${
              index === currentIndex
                ? "scale-125 bg-blue-600"
                : answers[index] !== null
                ? "bg-green-500"
                : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
            }`}
            title={`Domanda ${index + 1}${
              answers[index] !== null ? " (risposta data)" : ""
            }`}
          />
        ))}
      </div>
    </>
  );
}
