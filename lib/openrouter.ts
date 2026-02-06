import { getActiveKeyWithId, markKeyFailed, markKeySuccess } from './api-keys'
import type { DetailLevel } from '@/components/detail-level-selector'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

/**
 * Quiz question types
 */
export type QuizQuestionType = 'multiple_choice' | 'true_false'

/**
 * Quiz question structure
 */
export interface QuizQuestion {
  question: string
  type: QuizQuestionType
  options?: string[] // Only for multiple_choice (4 options)
  correctAnswer: string
  explanation: string
}

const MODEL = 'google/gemma-3-4b-it:free'
const RETRIES_PER_KEY = 3      // Tentativi per ogni chiave API
const MAX_KEYS_TO_TRY = 5      // Numero massimo di chiavi da provare
const RETRY_DELAY_MS = 3000    // 3 secondi tra un tentativo e l'altro

/**
 * Helper to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

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

Requisiti:
- Crea bullet points (elenchi puntati) dei concetti chiave
- Ogni punto deve essere una frase completa e comprensibile
- Includi almeno 8-12 punti principali
- Raggruppa i punti per argomento con sottotitoli (##)
- Mantieni il riassunto conciso ma completo nei concetti essenziali
- Evidenzia i termini chiave in grassetto`

    case 'medium':
      return `${basePrompt}

LIVELLO DI DETTAGLIO: MEDIO

Requisiti:
- Crea 2-3 paragrafi per ogni sezione principale
- Ogni paragrafo deve avere 3-4 frasi
- Includi i concetti principali con spiegazioni chiare
- Bilancia sintesi e completezza - non essere troppo breve
- Usa sottotitoli (##, ###) per organizzare il contenuto
- Evidenzia i termini chiave in grassetto
- Il riassunto deve coprire tutti gli argomenti importanti del testo`

    case 'detailed':
      return `${basePrompt}

LIVELLO DI DETTAGLIO: DETTAGLIATO (MASSIMA LUNGHEZZA)

IMPORTANTE: Il riassunto deve essere LUNGO e COMPLETO. Non abbreviare!

Requisiti di lunghezza:
- Il riassunto deve essere lungo almeno il 40-50% del testo originale
- Ogni sezione principale deve avere 4-6 paragrafi
- Ogni paragrafo deve avere 4-6 frasi complete
- Non saltare nessun concetto importante

Contenuto richiesto:
- Fornisci spiegazioni COMPLETE e APPROFONDITE per ogni concetto
- Includi definizioni dettagliate di tutti i termini importanti
- Aggiungi esempi pratici e casi d'uso quando possibile
- Spiega le relazioni tra i diversi concetti
- Includi contesto storico o teorico se rilevante
- Approfondisci le implicazioni e le conseguenze dei concetti

Struttura:
- Usa titoli (##) e sottotitoli (###) per organizzare il contenuto
- Crea sezioni ben definite per ogni argomento principale
- Usa liste puntate per elencare dettagli specifici
- Usa grassetto per evidenziare termini chiave
- Includi una breve introduzione e conclusione

NON ABBREVIARE. Scrivi tutto il contenuto necessario per una comprensione completa.`  

    default:
      return basePrompt
  }
}

/**
 * Get the user prompt for summarization (includes system instructions for compatibility)
 */
function getUserPrompt(text: string, detailLevel: DetailLevel): string {
  const systemInstructions = getSystemPrompt(detailLevel)

  return `${systemInstructions}

---

TESTO DA RIASSUMERE:

${text}

---

Crea il riassunto in formato Markdown seguendo le istruzioni sopra.`
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
    let errorCode: string | undefined

    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message
      }
      if (errorJson.error?.code) {
        errorCode = errorJson.error.code
      }
    } catch {
      // Use default error message
    }

    console.error(`OpenRouter error ${response.status}: ${errorMessage}`)
    throw new OpenRouterError(errorMessage, errorCode, response.status)
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
 * Implements automatic failover between API keys with retry logic:
 * - Try each key up to RETRIES_PER_KEY times (3)
 * - Wait RETRY_DELAY_MS (3 seconds) between attempts
 * - If all attempts fail for a key, move to the next key
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
    { role: 'user', content: getUserPrompt(text, detailLevel) }
  ]

  let lastError: Error | null = null
  const triedKeyIds = new Set<string>()

  // Try up to MAX_KEYS_TO_TRY different API keys
  for (let keyAttempt = 0; keyAttempt < MAX_KEYS_TO_TRY; keyAttempt++) {
    const keyData = await getActiveKeyWithId()

    if (!keyData) {
      throw new OpenRouterError(
        'Nessuna API key disponibile. Contatta l\'amministratore.',
        'NO_API_KEY'
      )
    }

    // Skip if we already tried this key
    if (triedKeyIds.has(keyData.id)) {
      console.log(`Key ${keyData.id} already tried, skipping...`)
      continue
    }

    triedKeyIds.add(keyData.id)
    console.log(`Trying API key ${keyAttempt + 1}/${MAX_KEYS_TO_TRY} (ID: ${keyData.id.slice(-6)})`)

    // Try this key up to RETRIES_PER_KEY times
    for (let retry = 0; retry < RETRIES_PER_KEY; retry++) {
      try {
        console.log(`  Attempt ${retry + 1}/${RETRIES_PER_KEY}...`)
        const summary = await callOpenRouter(keyData.key, messages)

        // Success! Mark the key as successful
        await markKeySuccess(keyData.id)
        console.log(`  Success!`)
        return summary

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        const status = error instanceof OpenRouterError ? error.status : undefined

        console.log(`  Failed (${status || 'network error'}): ${lastError.message.slice(0, 100)}`)

        // If not the last retry for this key, wait and try again
        if (retry < RETRIES_PER_KEY - 1) {
          console.log(`  Waiting ${RETRY_DELAY_MS / 1000}s before retry...`)
          await delay(RETRY_DELAY_MS)
          continue
        }

        // All retries for this key failed, mark it as failed and move to next key
        console.log(`  All ${RETRIES_PER_KEY} attempts failed for this key, trying next...`)
        await markKeyFailed(keyData.id, true)
        break // Exit retry loop, move to next key
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
 * Page text interface for page-based summarization
 */
export interface PageText {
  pageNumber: number
  text: string
}

/**
 * Groups pages into chunks of specified size.
 * Example: 6 pages with groupSize=4 => [[1,2,3,4], [5,6]]
 *
 * @param pages - Array of pages with text
 * @param groupSize - Number of pages per group (default: 4)
 * @returns Array of page groups, each group is an array of pages
 */
function groupPagesBySize(pages: PageText[], groupSize: number = 4): PageText[][] {
  const groups: PageText[][] = []

  for (let i = 0; i < pages.length; i += groupSize) {
    groups.push(pages.slice(i, i + groupSize))
  }

  return groups
}

/**
 * Combines pages in a group into a single text string
 */
function combinePageGroupText(pages: PageText[]): string {
  return pages
    .map(p => p.text)
    .filter(t => t.length > 0)
    .join('\n\n')
}

/**
 * Generates a summary with page-based chunking.
 * Splits the PDF into groups of 4 pages and summarizes each group separately.
 * Returns all summaries concatenated with page range headers (NO combining/unifying).
 *
 * @param pages - Array of pages with their text content
 * @param detailLevel - The level of detail for the summary (brief, medium, detailed)
 * @param pagesPerGroup - Number of pages per group (default: 4)
 * @param onProgress - Optional callback for progress updates
 * @returns The generated summaries in Markdown format, separated by page headers
 * @throws OpenRouterError if API calls fail
 */
export async function generateSummaryByPageGroups(
  pages: PageText[],
  detailLevel: DetailLevel,
  pagesPerGroup: number = 4,
  onProgress?: ChunkProgressCallback
): Promise<string> {
  // Filter out empty pages
  const nonEmptyPages = pages.filter(p => p.text.trim().length > 0)

  if (nonEmptyPages.length === 0) {
    throw new OpenRouterError('Nessun testo da riassumere', 'EMPTY_TEXT')
  }

  // Group pages
  const pageGroups = groupPagesBySize(nonEmptyPages, pagesPerGroup)

  console.log(`Splitting ${nonEmptyPages.length} pages into ${pageGroups.length} groups of up to ${pagesPerGroup} pages each`)

  // If only one group, use regular summary
  if (pageGroups.length === 1) {
    if (onProgress) {
      onProgress(1, 1)
    }
    const fullText = combinePageGroupText(pageGroups[0])
    return generateSummary(fullText, detailLevel)
  }

  // Generate summary for each page group with page range header
  const summariesWithHeaders: string[] = []

  for (let i = 0; i < pageGroups.length; i++) {
    const group = pageGroups[i]
    const pageNumbers = group.map(p => p.pageNumber)
    const firstPage = pageNumbers[0]
    const lastPage = pageNumbers[pageNumbers.length - 1]
    const pageRange = firstPage === lastPage ? `Pagina ${firstPage}` : `Pagine ${firstPage}-${lastPage}`

    console.log(`Summarizing group ${i + 1}/${pageGroups.length} (${pageRange})`)

    if (onProgress) {
      onProgress(i + 1, pageGroups.length)
    }

    const groupText = combinePageGroupText(group)
    const partialSummary = await generateSummary(groupText, detailLevel)

    // Add page range header to the summary
    summariesWithHeaders.push(`## 📄 ${pageRange}\n\n${partialSummary}`)
  }

  // Return all summaries concatenated with clear separators (NO combining)
  return summariesWithHeaders.join('\n\n---\n\n')
}

/**
 * Prompt for generating ONLY multiple choice questions (call 1 of 2)
 */
function getMultipleChoicePrompt(summaryContent: string): string {
  return `Sei un assistente specializzato nel creare quiz di verifica dell'apprendimento.
Genera esattamente 7 domande a SCELTA MULTIPLA basate ESCLUSIVAMENTE sul testo fornito.

REGOLE:
- Genera SOLO domande a scelta multipla (multiple_choice), NESSUN vero/falso
- Ogni domanda deve avere esattamente 4 opzioni
- Le domande devono essere nella stessa lingua del testo
- Le domande devono coprire i concetti principali del materiale
- Le opzioni errate devono essere plausibili ma chiaramente sbagliate
- Ogni domanda deve avere una spiegazione chiara della risposta corretta
- Basa le domande ESCLUSIVAMENTE sul testo fornito, non su conoscenze esterne

Rispondi SOLO con un array JSON valido, senza testo aggiuntivo.
Formato:
[
  {
    "question": "testo della domanda?",
    "type": "multiple_choice",
    "options": ["opzione A", "opzione B", "opzione C", "opzione D"],
    "correctAnswer": "opzione corretta esatta",
    "explanation": "spiegazione"
  }
]

Il campo correctAnswer DEVE corrispondere esattamente a una delle opzioni.

TESTO:
---
${summaryContent}
---

Genera 7 domande a scelta multipla. Rispondi SOLO con l'array JSON.`
}

/**
 * Prompt for generating ONLY true/false statements (call 2 of 2)
 * Receives the already-generated MC questions to avoid repetition.
 */
function getTrueFalsePrompt(summaryContent: string, existingQuestions: string[]): string {
  const questionsContext = existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')

  return `Sei un assistente specializzato nel creare quiz di verifica dell'apprendimento.
Genera esattamente 3 domande VERO/FALSO basate ESCLUSIVAMENTE sul testo fornito.

REGOLE FONDAMENTALI:
- Genera SOLO domande vero/falso, NESSUNA scelta multipla
- Ogni "domanda" DEVE essere un'AFFERMAZIONE DICHIARATIVA (frase con il punto finale), MAI una domanda con il punto interrogativo
- L'utente deve poter rispondere semplicemente "Vero" o "Falso"
- Basa le affermazioni ESCLUSIVAMENTE sul testo fornito, non su conoscenze esterne
- Le affermazioni devono essere nella stessa lingua del testo

ESEMPI CORRETTI:
- "La fotosintesi avviene nei cloroplasti." (affermazione - si risponde Vero o Falso)
- "Il DNA è composto da quattro basi azotate." (affermazione - si risponde Vero o Falso)
- "Roma fu fondata nel 753 a.C." (affermazione - si risponde Vero o Falso)

ESEMPI SBAGLIATI (NON FARE MAI COSI'):
- "Dove avviene la fotosintesi?" (questa è una DOMANDA, non usare MAI questo formato)
- "Quante basi azotate ha il DNA?" (questa è una DOMANDA)
- "Il DNA è composto da quante basi?" (questa è una DOMANDA)

Le seguenti domande sono GIA' STATE FATTE nel quiz. NON ripetere gli stessi argomenti:
${questionsContext}

Rispondi SOLO con un array JSON valido, senza testo aggiuntivo.
Formato:
[
  {
    "question": "Affermazione dichiarativa con il punto.",
    "type": "true_false",
    "correctAnswer": "Vero",
    "explanation": "spiegazione del perché è vera o falsa"
  }
]

IMPORTANTE: "correctAnswer" deve essere esattamente "Vero" o "Falso". NON includere "options".

TESTO:
---
${summaryContent}
---

Genera 3 affermazioni vero/falso. Rispondi SOLO con l'array JSON.`
}

/**
 * Parses the quiz response from the AI model.
 * Handles various edge cases like markdown code blocks and extra text.
 */
function parseQuizResponse(response: string): QuizQuestion[] {
  // Remove markdown code blocks if present
  let cleanedResponse = response.trim()

  // Remove ```json and ``` wrappers
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.slice(7)
  } else if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.slice(3)
  }

  if (cleanedResponse.endsWith('```')) {
    cleanedResponse = cleanedResponse.slice(0, -3)
  }

  cleanedResponse = cleanedResponse.trim()

  // Find the JSON array in the response (in case there's extra text)
  const arrayStart = cleanedResponse.indexOf('[')
  const arrayEnd = cleanedResponse.lastIndexOf(']')

  if (arrayStart === -1 || arrayEnd === -1) {
    throw new OpenRouterError(
      'La risposta non contiene un array JSON valido',
      'INVALID_JSON_FORMAT'
    )
  }

  const jsonString = cleanedResponse.slice(arrayStart, arrayEnd + 1)

  try {
    const questions = JSON.parse(jsonString)

    if (!Array.isArray(questions)) {
      throw new Error('Response is not an array')
    }

    // Validate and normalize each question
    return questions.map((q, index): QuizQuestion => {
      if (!q.question || typeof q.question !== 'string') {
        throw new Error(`Question ${index + 1} is missing the 'question' field`)
      }

      if (!q.type || (q.type !== 'multiple_choice' && q.type !== 'true_false')) {
        throw new Error(`Question ${index + 1} has invalid type: ${q.type}`)
      }

      if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
        throw new Error(`Question ${index + 1} is missing the 'correctAnswer' field`)
      }

      if (!q.explanation || typeof q.explanation !== 'string') {
        throw new Error(`Question ${index + 1} is missing the 'explanation' field`)
      }

      if (q.type === 'multiple_choice') {
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Question ${index + 1} (multiple_choice) must have exactly 4 options`)
        }

        // Verify correctAnswer is in options
        if (!q.options.includes(q.correctAnswer)) {
          // Try to find a close match (case insensitive)
          const matchingOption = q.options.find(
            (opt: string) => opt.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
          )
          if (matchingOption) {
            q.correctAnswer = matchingOption
          } else {
            console.warn(`Question ${index + 1}: correctAnswer "${q.correctAnswer}" not found in options`)
          }
        }

        return {
          question: q.question,
          type: 'multiple_choice',
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }
      } else {
        // true_false
        // Normalize the answer to "Vero" or "Falso"
        const normalizedAnswer = q.correctAnswer.toLowerCase().trim()
        let correctAnswer: string

        if (normalizedAnswer === 'vero' || normalizedAnswer === 'true' || normalizedAnswer === 'v') {
          correctAnswer = 'Vero'
        } else if (normalizedAnswer === 'falso' || normalizedAnswer === 'false' || normalizedAnswer === 'f') {
          correctAnswer = 'Falso'
        } else {
          correctAnswer = q.correctAnswer // Keep original if not recognized
        }

        return {
          question: q.question,
          type: 'true_false',
          correctAnswer,
          explanation: q.explanation
        }
      }
    })
  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw error
    }
    throw new OpenRouterError(
      `Errore nel parsing del quiz: ${error instanceof Error ? error.message : String(error)}`,
      'JSON_PARSE_ERROR'
    )
  }
}

/**
 * Helper: call OpenRouter with retry and key rotation for quiz generation.
 * Returns the raw response string.
 */
async function callOpenRouterForQuiz(prompt: string): Promise<string> {
  const messages = [{ role: 'user', content: prompt }]

  let lastError: Error | null = null
  const triedKeyIds = new Set<string>()

  for (let keyAttempt = 0; keyAttempt < MAX_KEYS_TO_TRY; keyAttempt++) {
    const keyData = await getActiveKeyWithId()

    if (!keyData) {
      throw new OpenRouterError(
        'Nessuna API key disponibile. Contatta l\'amministratore.',
        'NO_API_KEY'
      )
    }

    if (triedKeyIds.has(keyData.id)) continue
    triedKeyIds.add(keyData.id)

    for (let retry = 0; retry < RETRIES_PER_KEY; retry++) {
      try {
        const response = await callOpenRouter(keyData.key, messages)
        await markKeySuccess(keyData.id)
        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (retry < RETRIES_PER_KEY - 1) {
          await delay(RETRY_DELAY_MS)
          continue
        }

        await markKeyFailed(keyData.id, true)
        break
      }
    }
  }

  throw lastError || new OpenRouterError('Impossibile completare la richiesta')
}

/**
 * Generates a quiz based on the summary content.
 * Uses TWO separate AI calls:
 *   1. Generate 7 multiple choice questions
 *   2. Generate 3 true/false statements (knowing which MC questions were already asked)
 * This ensures true/false questions are proper statements, not questions.
 *
 * @param summaryContent - The summary content to base the quiz on
 * @returns Array of quiz questions
 * @throws OpenRouterError if API calls fail or response parsing fails
 */
export async function generateQuiz(summaryContent: string): Promise<QuizQuestion[]> {
  // Step 1: Generate 7 multiple choice questions
  console.log('[Quiz] Step 1: Generating 7 multiple choice questions...')
  const mcPrompt = getMultipleChoicePrompt(summaryContent)

  let mcQuestions: QuizQuestion[] = []
  for (let attempt = 0; attempt < RETRIES_PER_KEY; attempt++) {
    try {
      const mcResponse = await callOpenRouterForQuiz(mcPrompt)
      mcQuestions = parseQuizResponse(mcResponse)
      console.log(`[Quiz] Got ${mcQuestions.length} multiple choice questions`)
      break
    } catch (error) {
      if (error instanceof OpenRouterError && error.code === 'JSON_PARSE_ERROR' && attempt < RETRIES_PER_KEY - 1) {
        console.log('[Quiz] MC parse error, retrying...')
        await delay(RETRY_DELAY_MS)
        continue
      }
      throw error
    }
  }

  // Step 2: Generate 3 true/false statements (with MC questions as context)
  const existingQuestionTexts = mcQuestions.map(q => q.question)
  console.log('[Quiz] Step 2: Generating 3 true/false statements...')
  const tfPrompt = getTrueFalsePrompt(summaryContent, existingQuestionTexts)

  let tfQuestions: QuizQuestion[] = []
  for (let attempt = 0; attempt < RETRIES_PER_KEY; attempt++) {
    try {
      const tfResponse = await callOpenRouterForQuiz(tfPrompt)
      tfQuestions = parseQuizResponse(tfResponse)
      console.log(`[Quiz] Got ${tfQuestions.length} true/false statements`)
      break
    } catch (error) {
      if (error instanceof OpenRouterError && error.code === 'JSON_PARSE_ERROR' && attempt < RETRIES_PER_KEY - 1) {
        console.log('[Quiz] T/F parse error, retrying...')
        await delay(RETRY_DELAY_MS)
        continue
      }
      throw error
    }
  }

  // Combine: MC first, then T/F
  return [...mcQuestions, ...tfQuestions]
}
