import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuizResults } from "./quiz-results";
import type { QuizQuestion } from "@/lib/openrouter";

interface QuizResultsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ answers?: string }>;
}

export default async function QuizResultsPage({
  params,
  searchParams,
}: QuizResultsPageProps) {
  const { id } = await params;
  const { answers: answersParam } = await searchParams;

  // Parse answers from URL
  let userAnswers: (string | null)[];
  try {
    userAnswers = answersParam ? JSON.parse(decodeURIComponent(answersParam)) : [];
  } catch {
    userAnswers = [];
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      summary: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  // Parse the questions from JSON string
  let questions: QuizQuestion[];
  try {
    questions = JSON.parse(quiz.questions);
  } catch {
    notFound();
  }

  // Validate that answers array matches questions length
  if (userAnswers.length !== questions.length) {
    // Pad with nulls or truncate
    userAnswers = questions.map((_, i) => userAnswers[i] ?? null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-3xl">
        <QuizResults
          quizId={quiz.id}
          questions={questions}
          userAnswers={userAnswers}
          summaryId={quiz.summary?.id || ""}
          summaryTitle={quiz.summary?.title || "Quiz"}
        />
      </div>
    </div>
  );
}
