import { getActiveKeyWithId, markKeyFailed, markKeySuccess } from './api-keys'
import type { DetailLevel } from '@/components/detail-level-selector'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'meta-llama/llama-3.2-3b-instruct:free'
const MAX_RETRIES = 3
const DEFAULT_MAX_TOKENS = 3000 // Safe limit for free models

/**
 * Error thrown when all API keys have been exhausted or other OpenRouter errors occur
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message)
    this.name = 'OpenRouterError'
  }
}

/**
 * Get the system prompt for summarization based on detail level
 */
function getSystemPrompt(detailLevel: DetailLevel): string {
  const basePrompt = `Sei un assistente specializzato nel creare riassunti di materiale di studio.
Il tuo compito è analizzare il testo fornito e creare un riassunto chiaro e ben strutturato.
Rispondi sempre nella stessa lingua del testo fornito.
Usa il formato Markdown per la formattazione (titoli, liste, grassetto, ecc.).`

  switch (detailLevel) {
    case 'brief':
      return `${basePrompt}

LIVELLO DI DETTAGLIO: BREVE
- Crea bullet points dei concetti chiave
- Mantieni il riassunto conciso e diretto
- Evidenzia solo le informazioni essenziali
- Usa liste puntate per organizzare i concetti
- Non aggiungere spiegazioni dettagliate`

    case 'medium':
      return `${basePrompt}

LIVELLO DI DETTAGLIO: MEDIO
- Crea 1-2 paragrafi per ogni sezione principale
- Bilancia sintesi e completezza
- Includi i concetti principali con brevi spiegazioni
- Usa sottotitoli per organizzare il contenuto
- Mantieni un buon equilibrio tra brevità e chiarezza`

    case 'detailed':
      return `${basePrompt}

LIVELLO DI DETTAGLIO: DETTAGLIATO
- Fornisci spiegazioni complete con esempi
- Approfondisci ogni concetto importante
- Includi definizioni e contestualizzazioni
- Usa esempi pratici quando possibile
- Crea un riassunto esaustivo che copra tutti gli aspetti del materiale`

    default:
      return basePrompt
  }
}

/**
 * Get the user prompt for summarization
 */
function getUserPrompt(text: string): string {
  return `Riassumi il seguente testo di studio:

---
${text}
---

Crea un riassunto ben strutturato in formato Markdown.`
}

/**
 * Get the user prompt for combining partial summaries
 */
function getCombinePrompt(summaries: string[]): string {
  const combinedSummaries = summaries
    .map((s, i) => `--- PARTE ${i + 1} ---\n${s}`)
    .join('\n\n')

  return `Combina i seguenti riassunti parziali in un unico riassunto coerente e ben strutturato.
Elimina ripetizioni, unifica le sezioni simili e crea un documento fluido.
Mantieni il formato Markdown.

${combinedSummaries}

Crea un riassunto unificato e ben strutturato.`
}

/**
 * Estimate the number of tokens in a text.
 * Uses a simple heuristic: ~4 characters per token for most languages.
 * This is a rough estimate but works well for practical purposes.
 */
export function estimateTokens(text: string): number {
  // Average ~4 characters per token for mixed content
  // This is conservative and works for most Latin-based languages
  return Math.ceil(text.length / 4)
}

/**
 * Splits text into chunks of approximately maxTokens each.
 * Tries to split at paragraph boundaries for better coherence.
 *
 * @param text - The text to split into chunks
 * @param maxTokens - Maximum tokens per chunk (default: 3000)
 * @returns Array of text chunks
 */
export function chunkText(text: string, maxTokens: number = DEFAULT_MAX_TOKENS): string[] {
  const totalTokens = estimateTokens(text)

  // If text fits in a single chunk, return as-is
  if (totalTokens <= maxTokens) {
    return [text]
  }

  const chunks: string[] = []
  const maxCharsPerChunk = maxTokens * 4 // Convert tokens back to approximate chars

  // Split by paragraphs first (double newline)
  const paragraphs = text.split(/\n\s*\n/)

  let currentChunk = ''

  for (const paragraph of paragraphs) {
    const paragraphWithSpacing = paragraph.trim()

    if (!paragraphWithSpacing) {
      continue
    }

    // If adding this paragraph would exceed the limit
    if (currentChunk.length + paragraphWithSpacing.length + 2 > maxCharsPerChunk) {
      // If current chunk has content, save it
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }

      // If the paragraph itself is too long, split it by sentences
      if (paragraphWithSpacing.length > maxCharsPerChunk) {
        const sentenceChunks = splitLongParagraph(paragraphWithSpacing, maxCharsPerChunk)
        chunks.push(...sentenceChunks.slice(0, -1))
        currentChunk = sentenceChunks[sentenceChunks.length - 1] || ''
      } else {
        currentChunk = paragraphWithSpacing
      }
    } else {
      // Add paragraph to current chunk
      if (currentChunk) {
        currentChunk += '\n\n' + paragraphWithSpacing
      } else {
        currentChunk = paragraphWithSpacing
      }
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks.length > 0 ? chunks : [text]
}

/**
 * Splits a long paragraph into smaller pieces at sentence boundaries
 */
function splitLongParagraph(paragraph: string, maxChars: number): string[] {
  const chunks: string[] = []
  // Split by sentence endings (. ! ? followed by space or end)
  const sentences = paragraph.split(/(?<=[.!?])\s+/)

  let currentChunk = ''

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length + 1 > maxChars) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }

      // If a single sentence is too long, split by words
      if (sentence.length > maxChars) {
        const wordChunks = splitByWords(sentence, maxChars)
        chunks.push(...wordChunks.slice(0, -1))
        currentChunk = wordChunks[wordChunks.length - 1] || ''
      } else {
        currentChunk = sentence
      }
    } else {
      if (currentChunk) {
        currentChunk += ' ' + sentence
      } else {
        currentChunk = sentence
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

/**
 * Last resort: split by words when even sentences are too long
 */
function splitByWords(text: string, maxChars: number): string[] {
  const chunks: string[] = []
  const words = text.split(/\s+/)

  let currentChunk = ''

  for (const word of words) {
    if (currentChunk.length + word.length + 1 > maxChars) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = word
    } else {
      if (currentChunk) {
        currentChunk += ' ' + word
      } else {
        currentChunk = word
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

interface OpenRouterResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  error?: {
    message: string
    code?: string
  }
}

/**
 * Makes a single API call to OpenRouter
 */
async function callOpenRouter(
  apiKey: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
      'X-Title': 'Riassu.mi'
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4096
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `OpenRouter API error: ${response.status}`

    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message
      }
    } catch {
      // Use default error message
    }

    throw new OpenRouterError(errorMessage, undefined, response.status)
  }

  const data: OpenRouterResponse = await response.json()

  if (data.error) {
    throw new OpenRouterError(data.error.message, data.error.code)
  }

  if (!data.choices || data.choices.length === 0) {
    throw new OpenRouterError('No response from OpenRouter')
  }

  return data.choices[0].message.content
}

/**
 * Generates a summary of the given text using OpenRouter AI.
 * Implements automatic failover between API keys.
 *
 * @param text - The text to summarize
 * @param detailLevel - The level of detail for the summary (brief, medium, detailed)
 * @returns The generated summary in Markdown format
 * @throws OpenRouterError if all API keys fail or other errors occur
 */
export async function generateSummary(
  text: string,
  detailLevel: DetailLevel
): Promise<string> {
  const messages = [
    { role: 'system', content: getSystemPrompt(detailLevel) },
    { role: 'user', content: getUserPrompt(text) }
  ]

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const keyData = await getActiveKeyWithId()

    if (!keyData) {
      throw new OpenRouterError(
        'Nessuna API key disponibile. Contatta l\'amministratore.',
        'NO_API_KEY'
      )
    }

    try {
      const summary = await callOpenRouter(keyData.key, messages)

      // Mark the key as successful
      await markKeySuccess(keyData.id)

      return summary
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Mark the key as failed
      await markKeyFailed(keyData.id)

      // If it's a rate limit or authentication error, try another key
      if (error instanceof OpenRouterError) {
        const status = error.status
        // 401 = auth error, 429 = rate limit, 402 = payment required
        if (status === 401 || status === 429 || status === 402) {
          continue // Try next key
        }
      }

      // For other errors (like network errors), we might still want to retry
      // but after the last attempt, throw the error
      if (attempt === MAX_RETRIES - 1) {
        break
      }
    }
  }

  throw lastError || new OpenRouterError('Impossibile generare il riassunto dopo diversi tentativi')
}

/**
 * Progress callback type for tracking chunking progress
 */
export type ChunkProgressCallback = (current: number, total: number) => void

/**
 * Generates a summary with automatic chunking for long texts.
 * If the text exceeds the token limit, it will be split into chunks,
 * each chunk will be summarized separately, and then combined into a final summary.
 *
 * @param text - The text to summarize
 * @param detailLevel - The level of detail for the summary (brief, medium, detailed)
 * @param maxTokens - Maximum tokens per chunk (default: 3000)
 * @param onProgress - Optional callback for progress updates
 * @returns The generated summary in Markdown format
 * @throws OpenRouterError if API calls fail
 */
export async function generateSummaryWithChunking(
  text: string,
  detailLevel: DetailLevel,
  maxTokens: number = DEFAULT_MAX_TOKENS,
  onProgress?: ChunkProgressCallback
): Promise<string> {
  const chunks = chunkText(text, maxTokens)

  // If only one chunk, use regular summary
  if (chunks.length === 1) {
    if (onProgress) {
      onProgress(1, 1)
    }
    return generateSummary(text, detailLevel)
  }

  // Generate summary for each chunk
  const partialSummaries: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    if (onProgress) {
      onProgress(i + 1, chunks.length)
    }

    const partialSummary = await generateSummary(chunks[i], detailLevel)
    partialSummaries.push(partialSummary)
  }

  // Combine partial summaries into a final summary
  const combinedText = partialSummaries.join('\n\n')

  // If combined summaries are small enough, return them directly
  if (estimateTokens(combinedText) <= maxTokens * 1.5) {
    return combinedText
  }

  // Otherwise, use AI to combine and clean up the summaries
  const combineMessages = [
    {
      role: 'system',
      content: `Sei un assistente specializzato nel combinare riassunti.
Mantieni il formato Markdown e la lingua originale del contenuto.
Non aggiungere nuove informazioni, solo unifica e riorganizza il contenuto esistente.`
    },
    { role: 'user', content: getCombinePrompt(partialSummaries) }
  ]

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const keyData = await getActiveKeyWithId()

    if (!keyData) {
      throw new OpenRouterError(
        'Nessuna API key disponibile. Contatta l\'amministratore.',
        'NO_API_KEY'
      )
    }

    try {
      const finalSummary = await callOpenRouter(keyData.key, combineMessages)
      await markKeySuccess(keyData.id)
      return finalSummary
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      await markKeyFailed(keyData.id)

      if (error instanceof OpenRouterError) {
        const status = error.status
        if (status === 401 || status === 429 || status === 402) {
          continue
        }
      }

      if (attempt === MAX_RETRIES - 1) {
        break
      }
    }
  }

  // If combining fails, return the concatenated partial summaries
  // This is a fallback to ensure the user gets something useful
  if (lastError) {
    console.error('Failed to combine summaries, returning concatenated version:', lastError)
    return partialSummaries.join('\n\n---\n\n')
  }

  throw lastError || new OpenRouterError('Impossibile combinare i riassunti')
}
