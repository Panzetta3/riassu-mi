import * as pdfjsLib from 'pdfjs-dist'
import Tesseract from 'tesseract.js'

// Set worker path for pdf.js
if (typeof window === 'undefined') {
  // Server-side
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

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
 * For scanned PDFs without embedded text
 */
async function extractTextWithOCR(
  buffer: Buffer | Uint8Array,
  pagesToParse: number[]
): Promise<PageText[]> {
  // For now, we'll skip OCR on server-side as it's too heavy
  // OCR should be done client-side for images
  console.log('OCR extraction not implemented for server-side PDFs')
  return []
}

/**
 * Extracts text from a PDF buffer using pdf.js, returning an array of { pageNumber, text } for each page.
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

  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      standardFontDataUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`,
    })

    const pdfDocument = await loadingTask.promise

    const totalPages = pdfDocument.numPages

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

    // Extract text from each page
    const pages: PageText[] = []

    for (const pageNum of pagesToParse) {
      try {
        const page = await pdfDocument.getPage(pageNum)
        const textContent = await page.getTextContent()

        // Combine all text items into a single string
        const pageText = textContent.items
          .map((item: any) => {
            if ('str' in item) {
              return item.str
            }
            return ''
          })
          .join(' ')
          .trim()

        pages.push({
          pageNumber: pageNum,
          text: pageText
        })

        // Clean up page resources
        page.cleanup()
      } catch (error) {
        console.error(`Failed to extract text from page ${pageNum}:`, error)
        pages.push({
          pageNumber: pageNum,
          text: ''
        })
      }
    }

    // Clean up document
    await pdfDocument.destroy()

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

  try {
    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      standardFontDataUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`,
    })

    const pdfDocument = await loadingTask.promise
    const totalPages = pdfDocument.numPages

    if (totalPages === 0) {
      await pdfDocument.destroy()
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
      await pdfDocument.destroy()
      throw new PDFExtractionError('All pages were excluded from extraction')
    }

    const pages: PageText[] = []

    for (const pageNum of pagesToParse) {
      try {
        const page = await pdfDocument.getPage(pageNum)
        const textContent = await page.getTextContent()

        const pageText = textContent.items
          .map((item: any) => {
            if ('str' in item) {
              return item.str
            }
            return ''
          })
          .join(' ')
          .trim()

        pages.push({
          pageNumber: pageNum,
          text: pageText
        })

        page.cleanup()
      } catch (error) {
        console.error(`Failed to extract text from page ${pageNum}:`, error)
        pages.push({
          pageNumber: pageNum,
          text: ''
        })
      }
    }

    await pdfDocument.destroy()

    const hasText = pages.some(page => page.text.length > 0)

    if (!hasText) {
      throw new PDFExtractionError(
        'Il PDF non contiene testo estraibile. Potrebbe essere un documento scansionato o protetto.'
      )
    }

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
 *
 * @param buffer - The PDF file as a Buffer or Uint8Array
 * @returns The total number of pages
 */
export async function getPageCount(buffer: Buffer | Uint8Array): Promise<number> {
  const data = buffer instanceof Buffer ? new Uint8Array(buffer) : buffer

  try {
    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
    })

    const pdfDocument = await loadingTask.promise
    const totalPages = pdfDocument.numPages

    await pdfDocument.destroy()

    return totalPages
  } catch (error) {
    console.error('Error getting page count:', error)
    throw new PDFExtractionError(
      `Errore durante il conteggio delle pagine: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
    )
  }
}
