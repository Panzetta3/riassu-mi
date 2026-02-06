import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractText, PDFExtractionError } from '@/lib/pdf-parser'
import { generateSummaryByPageGroups, OpenRouterError } from '@/lib/openrouter'
import { parsePageRanges } from '@/lib/utils'
import { getSession } from '@/lib/auth'
import type { DetailLevel } from '@/components/detail-level-selector'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Extend timeout for Vercel (Pro plan only, ignored on Hobby)
export const maxDuration = 60

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
const VALID_DETAIL_LEVELS: DetailLevel[] = ['brief', 'medium', 'detailed']

interface SummarizeResponse {
  summaryId: string
}

interface ErrorResponse {
  error: string
}

/**
 * POST /api/summarize
 *
 * Accepts a PDF file and generates a summary using AI.
 *
 * Request body (FormData):
 * - file: PDF file (required)
 * - excludePages: string with page ranges to exclude (optional, e.g., "1-3, 5")
 * - detailLevel: "brief" | "medium" | "detailed" (required)
 *
 * Response:
 * - 200: { summaryId: string }
 * - 400: { error: string } - Invalid request
 * - 500: { error: string } - Server error
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SummarizeResponse | ErrorResponse>> {
  try {
    // Parse the multipart form data
    const formData = await request.formData()

    // Get the PDF file
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'File PDF richiesto' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Il file deve essere un PDF' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Il file supera la dimensione massima di 2GB' },
        { status: 400 }
      )
    }

    // Get detail level
    const detailLevelParam = formData.get('detailLevel')
    if (!detailLevelParam || typeof detailLevelParam !== 'string') {
      return NextResponse.json(
        { error: 'Livello di dettaglio richiesto' },
        { status: 400 }
      )
    }

    if (!VALID_DETAIL_LEVELS.includes(detailLevelParam as DetailLevel)) {
      return NextResponse.json(
        { error: 'Livello di dettaglio non valido. Usa: brief, medium, o detailed' },
        { status: 400 }
      )
    }

    const detailLevel = detailLevelParam as DetailLevel

    // Get excluded pages (optional)
    const excludePagesParam = formData.get('excludePages')
    let excludePages: number[] = []

    if (excludePagesParam && typeof excludePagesParam === 'string') {
      const parseResult = parsePageRanges(excludePagesParam)
      if (parseResult.error) {
        return NextResponse.json(
          { error: parseResult.error },
          { status: 400 }
        )
      }
      excludePages = parseResult.pages
    }

    // Read the file content
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF
    let pages
    try {
      pages = await extractText(buffer, excludePages)
    } catch (error) {
      if (error instanceof PDFExtractionError) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      throw error
    }

    // Check if there's any text to summarize
    const hasText = pages.some(p => p.text.trim().length > 0)

    if (!hasText) {
      return NextResponse.json(
        { error: 'Il PDF non contiene testo estraibile' },
        { status: 400 }
      )
    }

    // Generate summary using OpenRouter with page-based chunking (groups of 4 pages)
    let summaryContent: string
    try {
      summaryContent = await generateSummaryByPageGroups(pages, detailLevel, 4)
    } catch (error) {
      if (error instanceof OpenRouterError) {
        // Return a user-friendly error message
        return NextResponse.json(
          { error: `Errore nella generazione del riassunto: ${error.message}` },
          { status: 500 }
        )
      }
      throw error
    }

    // Create a title from the PDF filename
    const pdfName = file.name
    const title = pdfName.replace(/\.pdf$/i, '')

    // Get current user session (if logged in)
    let session = null
    try {
      session = await getSession()
    } catch {
      // Ignore session errors, treat as guest
    }

    // Save summary to database (user_id is set if user is logged in, null for guests)
    const summary = await prisma.summary.create({
      data: {
        title,
        content: summaryContent,
        detail_level: detailLevel,
        pdf_name: pdfName,
        user_id: session?.id ?? null
      }
    })

    return NextResponse.json({
      summaryId: summary.id
    })

  } catch (error) {
    console.error('Error in summarize API:', error)

    return NextResponse.json(
      { error: 'Errore interno del server. Riprova più tardi.' },
      { status: 500 }
    )
  }
}
