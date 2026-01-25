import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateQuiz, OpenRouterError, QuizQuestion } from '@/lib/openrouter'

interface QuizResponse {
  quizId: string
  questions: QuizQuestion[]
}

interface ErrorResponse {
  error: string
}

/**
 * POST /api/quiz
 *
 * Generates a quiz based on an existing summary.
 *
 * Request body (JSON):
 * - summaryId: string (required) - The ID of the summary to generate quiz from
 *
 * Response:
 * - 200: { quizId: string, questions: QuizQuestion[] }
 * - 400: { error: string } - Invalid request
 * - 404: { error: string } - Summary not found
 * - 500: { error: string } - Server error
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<QuizResponse | ErrorResponse>> {
  try {
    // Parse the JSON body
    let body: { summaryId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Corpo della richiesta non valido' },
        { status: 400 }
      )
    }

    // Validate summaryId
    const { summaryId } = body
    if (!summaryId || typeof summaryId !== 'string') {
      return NextResponse.json(
        { error: 'ID del riassunto richiesto' },
        { status: 400 }
      )
    }

    // Fetch the summary from database
    const summary = await prisma.summary.findUnique({
      where: { id: summaryId }
    })

    if (!summary) {
      return NextResponse.json(
        { error: 'Riassunto non trovato' },
        { status: 404 }
      )
    }

    // Check if summary has enough content for quiz generation
    if (!summary.content || summary.content.trim().length < 100) {
      return NextResponse.json(
        { error: 'Il riassunto è troppo breve per generare un quiz' },
        { status: 400 }
      )
    }

    // Generate quiz using OpenRouter
    let questions: QuizQuestion[]
    try {
      questions = await generateQuiz(summary.content)
    } catch (error) {
      if (error instanceof OpenRouterError) {
        return NextResponse.json(
          { error: `Errore nella generazione del quiz: ${error.message}` },
          { status: 500 }
        )
      }
      throw error
    }

    // Save quiz to database (questions stored as JSON string)
    const quiz = await prisma.quiz.create({
      data: {
        summary_id: summaryId,
        questions: JSON.stringify(questions)
      }
    })

    return NextResponse.json({
      quizId: quiz.id,
      questions
    })

  } catch (error) {
    console.error('Error in quiz API:', error)

    return NextResponse.json(
      { error: 'Errore interno del server. Riprova più tardi.' },
      { status: 500 }
    )
  }
}
