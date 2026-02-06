import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import type { DetailLevel } from '@/components/detail-level-selector'

export const dynamic = 'force-dynamic'

const VALID_DETAIL_LEVELS: DetailLevel[] = ['brief', 'medium', 'detailed']

interface SaveSummaryResponse {
  summaryId: string
}

interface ErrorResponse {
  error: string
}

/**
 * POST /api/save-summary
 *
 * Saves a completed summary to the database.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveSummaryResponse | ErrorResponse>> {
  try {
    const body = await request.json()
    const { content, detailLevel, pdfName } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Contenuto richiesto' },
        { status: 400 }
      )
    }

    if (!detailLevel || !VALID_DETAIL_LEVELS.includes(detailLevel)) {
      return NextResponse.json(
        { error: 'Livello di dettaglio non valido' },
        { status: 400 }
      )
    }

    if (!pdfName || typeof pdfName !== 'string') {
      return NextResponse.json(
        { error: 'Nome PDF richiesto' },
        { status: 400 }
      )
    }

    const title = pdfName.replace(/\.pdf$/i, '')

    // Get current user session (if logged in)
    let session = null
    try {
      session = await getSession()
    } catch {
      // Ignore session errors, treat as guest
    }

    const summary = await prisma.summary.create({
      data: {
        title,
        content,
        detail_level: detailLevel,
        pdf_name: pdfName,
        user_id: session?.id ?? null
      }
    })

    return NextResponse.json({
      summaryId: summary.id
    })

  } catch (error) {
    console.error('Error in save-summary API:', error)
    return NextResponse.json(
      { error: 'Errore nel salvataggio del riassunto.' },
      { status: 500 }
    )
  }
}
