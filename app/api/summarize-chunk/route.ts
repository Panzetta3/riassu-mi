import { NextRequest, NextResponse } from 'next/server'
import { generateSummary, OpenRouterError } from '@/lib/openrouter'
import type { DetailLevel } from '@/components/detail-level-selector'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const VALID_DETAIL_LEVELS: DetailLevel[] = ['brief', 'medium', 'detailed']

interface SummarizeChunkResponse {
  summary: string
}

interface ErrorResponse {
  error: string
}

/**
 * POST /api/summarize-chunk
 *
 * Summarizes a single text chunk using OpenRouter AI.
 * Designed to be called multiple times from the client for each page group.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SummarizeChunkResponse | ErrorResponse>> {
  try {
    const body = await request.json()
    const { text, detailLevel } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Testo richiesto' },
        { status: 400 }
      )
    }

    if (!detailLevel || !VALID_DETAIL_LEVELS.includes(detailLevel)) {
      return NextResponse.json(
        { error: 'Livello di dettaglio non valido' },
        { status: 400 }
      )
    }

    const summary = await generateSummary(text, detailLevel)

    return NextResponse.json({ summary })

  } catch (error) {
    if (error instanceof OpenRouterError) {
      return NextResponse.json(
        { error: `Errore nella generazione del riassunto: ${error.message}` },
        { status: 500 }
      )
    }

    console.error('Error in summarize-chunk API:', error)
    return NextResponse.json(
      { error: 'Errore interno del server. Riprova più tardi.' },
      { status: 500 }
    )
  }
}
