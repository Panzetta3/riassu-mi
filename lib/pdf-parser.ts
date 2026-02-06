// @ts-expect-error - pdf-parse v1 doesn't have types
import pdfParse from 'pdf-parse'

export interface PageText {
  pageNumber: number
  text: string
}

export interface ExtractTextResult {
  pages: PageText[]
  totalPages: number
}

export class PDFExtractionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PDFExtractionError'
  }
}

/**
 * Extracts text from a PDF buffer using pdf-parse v1 (serverless compatible).
 * Returns an array of { pageNumber, text } for each page.
 *
 * @param buffer - The PDF file as a Buffer or Uint8Array
 * @param excludePages - Optional array of page numbers to exclude (1-indexed)
 * @returns Array of { pageNumber, text } for each extracted page
 * @throws PDFExtractionError if the PDF has no extractable text
 */
export async function extractText(
  buffer: Buffer | Uint8Array,
  excludePages?: number[]
): Promise<PageText[]> {
  const data = buffer instanceof Buffer ? buffer : Buffer.from(buffer)

  try {
    // pdf-parse v1 extracts all text and gives page count
    // We use the pagerender option to get text per page
    const pages: PageText[] = []
    const excludeSet = new Set(excludePages || [])

    const result = await pdfParse(data, {
      // Custom page render function to capture text per page
      pagerender: async (pageData: any) => {
        const textContent = await pageData.getTextContent()
        const text = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim()
        return text
      }
    })

    // pdf-parse returns all text joined, but we need per-page
    // Re-parse to get individual pages
    const totalPages = result.numpages

    if (totalPages === 0) {
      throw new PDFExtractionError('PDF document has no pages')
    }

    // Parse again with page tracking
    let currentPage = 0
    await pdfParse(data, {
      pagerender: async (pageData: any) => {
        currentPage++
        if (excludeSet.has(currentPage)) {
          return '' // Skip excluded pages
        }
        const textContent = await pageData.getTextContent()
        const text = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim()
        pages.push({
          pageNumber: currentPage,
          text
        })
        return text
      }
    })

    // Check if we have any pages to process
    if (pages.length === 0) {
      throw new PDFExtractionError('All pages were excluded from extraction')
    }

    // Check if any extractable text was found
    const hasText = pages.some(page => page.text.length > 0)

    if (!hasText) {
      throw new PDFExtractionError(
        'Il PDF non contiene testo estraibile. Potrebbe essere un documento scansionato o protetto.'
      )
    }

    return pages
  } catch (error) {
    if (error instanceof PDFExtractionError) {
      throw error
    }

    console.error('PDF extraction error:', error)
    throw new PDFExtractionError(
      `Errore durante l'estrazione del testo dal PDF: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
    )
  }
}

/**
 * Extracts text from a PDF buffer and returns both the pages and total page count.
 */
export async function extractTextWithInfo(
  buffer: Buffer | Uint8Array,
  excludePages?: number[]
): Promise<ExtractTextResult> {
  const data = buffer instanceof Buffer ? buffer : Buffer.from(buffer)

  try {
    const result = await pdfParse(data)
    const totalPages = result.numpages
    const pages = await extractText(buffer, excludePages)

    return {
      pages,
      totalPages
    }
  } catch (error) {
    if (error instanceof PDFExtractionError) {
      throw error
    }

    console.error('PDF extraction error:', error)
    throw new PDFExtractionError(
      `Errore durante l'estrazione del testo dal PDF: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
    )
  }
}

/**
 * Gets the total number of pages in a PDF without extracting text.
 */
export async function getPageCount(buffer: Buffer | Uint8Array): Promise<number> {
  const data = buffer instanceof Buffer ? buffer : Buffer.from(buffer)

  try {
    const result = await pdfParse(data)
    return result.numpages
  } catch (error) {
    console.error('Error getting page count:', error)
    throw new PDFExtractionError(
      `Errore durante il conteggio delle pagine: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
    )
  }
}
