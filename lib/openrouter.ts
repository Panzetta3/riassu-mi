import { getActiveKeyWithId, markKeyFailed, markKeySuccess } from './api-keys'
import type { DetailLevel } from '@/components/detail-level-selector'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'meta-llama/llama-3.2-3b-instruct:free'
const MAX_RETRIES = 3

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
