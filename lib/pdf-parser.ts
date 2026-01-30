import { PDFParse } from 'pdf-parse'
import Tesseract from 'tesseract.js'
import { pdf } from 'pdf-to-img'

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
 * Extract text from PDF pages using OCR (Tesseract.js)
 * Uses pdf-to-img to convert PDF pages to images
 */
async function extractTextWithOCR(
  buffer: Buffer | Uint8Array,
  pagesToParse: number[]
): Promise<PageText[]> {
  const data = buffer instanceof Buffer ? buffer : Buffer.from(buffer)

  const pages: PageText[] = []
  const pageSet = new Set(pagesToParse)

  let pageNum = 0

  // pdf-to-img returns an async iterator of page images
  const document = await pdf(data, { scale: 2.0 })

  for await (const image of document) {
    pageNum++

    // Skip pages not in our list
    if (!pageSet.has(pageNum)) {
      continue
    }

    try {
      console.log(`OCR processing page ${pageNum}...`)

      // Run OCR on the image buffer
      const result = await Tesseract.recognize(image, 'ita+eng', {
        logger: () => {} // Suppress progress logs
      })

      pages.push({
        pageNumber: pageNum,
        text: result.data.text.trim()
      })

      console.log(`OCR page ${pageNum} completed, extracted ${result.data.text.length} chars`)
    } catch (error) {
      console.error(`OCR failed for page ${pageNum}:`, error)
      pages.push({
        pageNumber: pageNum,
        text: ''
      })
    }
  }

  // Sort pages by page number
  pages.sort((a, b) => a.pageNumber - b.pageNumber)

  return pages
}

/**
 * Extracts text from a PDF buffer, returning an array of { pageNumber, text } for each page.
 * Supports excluding specific pages via the excludePages parameter.
 * Falls back to OCR if the PDF contains scanned images instead of text.
 *
 * @param buffer - The PDF file as a Buffer or Uint8Array
 * @param excludePages - Optional array of page numbers to exclude (1-indexed)
 * @returns Array of { pageNumber, text } for each extracted page
 * @throws PDFExtractionError if the PDF has no extractable text even with OCR
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
    let pages: PageText[] = textResult.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text.trim()
    }))

    // Check if any extractable text was found
    const hasText = pages.some(page => page.text.length > 0)

    // If no text found, try OCR
    if (!hasText) {
      console.log('No text found in PDF, attempting OCR...')
      await parser.destroy() // Clean up before OCR

      pages = await extractTextWithOCR(buffer, pagesToParse)

      const hasOcrText = pages.some(page => page.text.length > 0)
      if (!hasOcrText) {
        throw new PDFExtractionError(
          'Impossibile estrarre testo dal PDF. Il documento potrebbe essere protetto o contenere solo immagini non riconoscibili.'
        )
      }

      return pages
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

    let pages: PageText[] = textResult.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text.trim()
    }))

    const hasText = pages.some(page => page.text.length > 0)

    // If no text found, try OCR
    if (!hasText) {
      console.log('No text found in PDF, attempting OCR...')
      await parser.destroy()

      pages = await extractTextWithOCR(buffer, pagesToParse)

      const hasOcrText = pages.some(page => page.text.length > 0)
      if (!hasOcrText) {
        throw new PDFExtractionError(
          'Impossibile estrarre testo dal PDF. Il documento potrebbe essere protetto o contenere solo immagini non riconoscibili.'
        )
      }

      return {
        pages,
        totalPages
      }
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
