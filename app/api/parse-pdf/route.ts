import { NextRequest, NextResponse } from 'next/server'
import { extractText, PDFExtractionError } from '@/lib/pdf-parser'
import { parsePageRanges } from '@/lib/utils'
import { del } from '@vercel/blob'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
const PAGES_PER_GROUP = 4

interface PageGroup {
  pageRange: string
  text: string
  firstPage: number
  lastPage: number
}

interface ParsePdfResponse {
  groups: PageGroup[]
  totalGroups: number
  pdfName: string
}

interface ErrorResponse {
  error: string
}

/**
 * POST /api/parse-pdf
 *
 * Extracts text from a PDF and returns page groups ready for summarization.
 * Each group contains up to 4 pages of text.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ParsePdfResponse | ErrorResponse>> {
  try {
    const formData = await request.formData()

    const blobUrl = formData.get('blobUrl')
    const file = formData.get('file')

    let buffer: Buffer
    let pdfName: string

    if (blobUrl && typeof blobUrl === 'string') {
      const fileName = formData.get('fileName')
      if (!fileName || typeof fileName !== 'string') {
        return NextResponse.json(
          { error: 'Nome file richiesto quando si usa blob storage' },
          { status: 400 }
        )
      }

      pdfName = fileName

      try {
        const response = await fetch(blobUrl)
        if (!response.ok) {
          throw new Error('Failed to fetch blob')
        }
        const arrayBuffer = await response.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)

        // Clean up blob after fetching
        await del(blobUrl)
      } catch (error) {
        console.error('Error fetching blob:', error)
        return NextResponse.json(
          { error: 'Errore nel recupero del file' },
          { status: 500 }
        )
      }
    } else if (file && file instanceof File) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        return NextResponse.json(
          { error: 'Il file deve essere un PDF' },
          { status: 400 }
        )
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Il file supera la dimensione massima di 2GB' },
          { status: 400 }
        )
      }

      pdfName = file.name
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      return NextResponse.json(
        { error: 'File PDF o blob URL richiesto' },
        { status: 400 }
      )
    }

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

    // Check if there's any text
    const hasText = pages.some(p => p.text.trim().length > 0)
    if (!hasText) {
      return NextResponse.json(
        { error: 'Il PDF non contiene testo estraibile' },
        { status: 400 }
      )
    }

    // Filter empty pages and group
    const nonEmptyPages = pages.filter(p => p.text.trim().length > 0)
    const groups: PageGroup[] = []

    for (let i = 0; i < nonEmptyPages.length; i += PAGES_PER_GROUP) {
      const group = nonEmptyPages.slice(i, i + PAGES_PER_GROUP)
      const pageNumbers = group.map(p => p.pageNumber)
      const firstPage = pageNumbers[0]
      const lastPage = pageNumbers[pageNumbers.length - 1]
      const pageRange = firstPage === lastPage ? `Pagina ${firstPage}` : `Pagine ${firstPage}-${lastPage}`
      const text = group.map(p => p.text).filter(t => t.length > 0).join('\n\n')

      groups.push({ pageRange, text, firstPage, lastPage })
    }

    console.log(`Parsed PDF "${pdfName}": ${nonEmptyPages.length} pages -> ${groups.length} groups`)

    return NextResponse.json({
      groups,
      totalGroups: groups.length,
      pdfName
    })

  } catch (error) {
    console.error('Error in parse-pdf API:', error)
    return NextResponse.json(
      { error: 'Errore interno del server. Riprova più tardi.' },
      { status: 500 }
    )
  }
}
