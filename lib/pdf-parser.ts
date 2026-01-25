import { PDFParse } from 'pdf-parse'

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
 * Extracts text from a PDF buffer, returning an array of { pageNumber, text } for each page.
 * Supports excluding specific pages via the excludePages parameter.
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
  const data = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer

  const parser = new PDFParse({ data })

  try {
    // First, get the total number of pages
    const info = await parser.getInfo()
    const totalPages = info.total

    if (totalPages === 0) {
      throw new PDFExtractionError('PDF document has no pages')
    }

    // Calculate which pages to include (all pages minus excluded ones)
    const excludeSet = new Set(excludePages || [])
    const pagesToParse: number[] = []

    for (let i = 1; i <= totalPages; i++) {
      if (!excludeSet.has(i)) {
        pagesToParse.push(i)
      }
    }

    if (pagesToParse.length === 0) {
      throw new PDFExtractionError('All pages were excluded from extraction')
    }

    // Extract text from the selected pages
    const textResult = await parser.getText({
      partial: pagesToParse,
      pageJoiner: '' // Don't add page markers, we'll handle pages individually
    })

    // Map the results to our format
    const pages: PageText[] = textResult.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text.trim()
    }))

    // Check if any extractable text was found
    const hasText = pages.some(page => page.text.length > 0)
    if (!hasText) {
      throw new PDFExtractionError(
        'PDF does not contain extractable text. The PDF may be scanned images or have protected content.'
      )
    }

    return pages
  } finally {
    // Clean up the parser
    await parser.destroy()
  }
}

/**
 * Extracts text from a PDF buffer and returns both the pages and total page count.
 * This is useful when you need to know how many pages were in the original document.
 *
 * @param buffer - The PDF file as a Buffer or Uint8Array
 * @param excludePages - Optional array of page numbers to exclude (1-indexed)
 * @returns Object with pages array and totalPages count
 */
export async function extractTextWithInfo(
  buffer: Buffer | Uint8Array,
  excludePages?: number[]
): Promise<ExtractTextResult> {
  const data = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer

  const parser = new PDFParse({ data })

  try {
    const info = await parser.getInfo()
    const totalPages = info.total

    if (totalPages === 0) {
      throw new PDFExtractionError('PDF document has no pages')
    }

    const excludeSet = new Set(excludePages || [])
    const pagesToParse: number[] = []

    for (let i = 1; i <= totalPages; i++) {
      if (!excludeSet.has(i)) {
        pagesToParse.push(i)
      }
    }

    if (pagesToParse.length === 0) {
      throw new PDFExtractionError('All pages were excluded from extraction')
    }

    const textResult = await parser.getText({
      partial: pagesToParse,
      pageJoiner: ''
    })

    const pages: PageText[] = textResult.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text.trim()
    }))

    const hasText = pages.some(page => page.text.length > 0)
    if (!hasText) {
      throw new PDFExtractionError(
        'PDF does not contain extractable text. The PDF may be scanned images or have protected content.'
      )
    }

    return {
      pages,
      totalPages
    }
  } finally {
    await parser.destroy()
  }
}

/**
 * Gets the total number of pages in a PDF without extracting text.
 *
 * @param buffer - The PDF file as a Buffer or Uint8Array
 * @returns The total number of pages
 */
export async function getPageCount(buffer: Buffer | Uint8Array): Promise<number> {
  const data = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer

  const parser = new PDFParse({ data })

  try {
    const info = await parser.getInfo()
    return info.total
  } finally {
    await parser.destroy()
  }
}
