import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSummary, OpenRouterError } from '@/lib/openrouter'
import { getSession } from '@/lib/auth'
import type { DetailLevel } from '@/components/detail-level-selector'

const MAX_TEXT_LENGTH = 100000 // 100KB of text
const VALID_DETAIL_LEVELS: DetailLevel[] = ['brief', 'medium', 'detailed']

interface SummarizeResponse {
  summaryId: string
  content: string
}

interface ErrorResponse {
  error: string
}

/**
 * POST /api/summarize-text
 *
 * Accepts raw text (from OCR) and generates a summary using AI.
 *
 * Request body (JSON):
 * - text: string (required) - The text to summarize
 * - detailLevel: "brief" | "medium" | "detailed" (required)
 * - title: string (optional) - Title for the summary
 *
 * Response:
 * - 200: { summaryId: string, content: string }
 * - 400: { error: string } - Invalid request
 * - 500: { error: string } - Server error
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SummarizeResponse | ErrorResponse>> {
  try {
    const body = await request.json()

    // Validate text
    const text = body.text
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Testo richiesto' },
        { status: 400 }
      )
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: 'Il testo supera la dimensione massima consentita' },
        { status: 400 }
      )
    }

    const trimmedText = text.trim()
    if (!trimmedText) {
      return NextResponse.json(
        { error: 'Il testo non può essere vuoto' },
        { status: 400 }
      )
    }

    // Validate detail level
    const detailLevel = body.detailLevel
    if (!detailLevel || !VALID_DETAIL_LEVELS.includes(detailLevel)) {
      return NextResponse.json(
        { error: 'Livello di dettaglio non valido. Usa: brief, medium, o detailed' },
        { status: 400 }
      )
    }

    // Get optional title
    const title = body.title && typeof body.title === 'string'
      ? body.title
      : 'Foto scansionata'

    // Generate summary using OpenRouter
    let summaryContent: string
    try {
      summaryContent = await generateSummary(trimmedText, detailLevel)
    } catch (error) {
      if (error instanceof OpenRouterError) {
        return NextResponse.json(
          { error: `Errore nella generazione del riassunto: ${error.message}` },
          { status: 500 }
        )
      }
      throw error
    }

    // Get current user session (if logged in)
    const session = await getSession()

    // Save summary to database
    const summary = await prisma.summary.create({
      data: {
        title,
        content: summaryContent,
        detail_level: detailLevel,
        pdf_name: `${title}.jpg`,
        user_id: session?.id ?? null
      }
    })

    return NextResponse.json({
      summaryId: summary.id,
      content: summaryContent
    })

  } catch (error) {
    console.error('Error in summarize-text API:', error)

    return NextResponse.json(
      { error: 'Errore interno del server. Riprova più tardi.' },
      { status: 500 }
    )
  }
}
