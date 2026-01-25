import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuizInterface } from "./quiz-interface";
import type { QuizQuestion } from "@/lib/openrouter";

interface QuizPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params;

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-2xl">
        <QuizInterface
          quizId={quiz.id}
          questions={questions}
          summaryId={quiz.summary?.id || ""}
          summaryTitle={quiz.summary?.title || "Quiz"}
        />
      </div>
    </div>
  );
}
