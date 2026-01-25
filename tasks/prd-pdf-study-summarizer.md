# PRD: Riassu.mi - PDF Study Summarizer

## Introduction

Riassu.mi è un'applicazione web che permette agli studenti di caricare PDF dei capitoli da studiare, specificare eventuali pagine da saltare, e ottenere riassunti generati da AI con quiz di verifica finale. Il sistema supporta multiple API key di OpenRouter per garantire affidabilità, utilizzando esclusivamente modelli AI gratuiti.

## Goals

- Permettere upload di PDF con selezione pagine da escludere
- Generare riassunti con livello di dettaglio configurabile (breve/medio/dettagliato)
- Creare quiz misti (domande multiple choice + vero/falso) basati sul contenuto
- Supportare multiple API key OpenRouter per failover automatico
- Offrire sia modalità guest (scarica risultati) che account utente (storico salvato)
- Utilizzare solo modelli AI gratuiti di OpenRouter

## User Stories

### US-001: Setup progetto e struttura base

**Description:** Come sviluppatore, ho bisogno della struttura base del progetto per iniziare lo sviluppo.

**Acceptance Criteria:**

- [ ] Inizializzare progetto Next.js 14+ con App Router
- [ ] Configurare TypeScript
- [ ] Configurare Tailwind CSS per lo styling
- [ ] Struttura cartelle: app/, components/, lib/, types/
- [ ] Typecheck e lint passano

---

### US-002: Configurazione database e schema

**Description:** Come sviluppatore, ho bisogno di un database per salvare utenti, riassunti e quiz.

**Acceptance Criteria:**

- [ ] Setup SQLite con Prisma ORM (semplice, no setup esterno)
- [ ] Schema: User (id, email, password_hash, created_at)
- [ ] Schema: Summary (id, user_id nullable, title, content, detail_level, created_at)
- [ ] Schema: Quiz (id, summary_id, questions JSON, created_at)
- [ ] Schema: ApiKey (id, key_encrypted, provider, is_active, last_used, fail_count)
- [ ] Migration eseguita con successo
- [ ] Typecheck passa

---

### US-003: Gestione multiple API key OpenRouter

**Description:** Come utente, voglio che il sistema usi automaticamente un'altra API key se una fallisce, così non perdo il lavoro.

**Acceptance Criteria:**

- [ ] Pagina admin per aggiungere/rimuovere API key OpenRouter
- [ ] API key salvate criptate nel database
- [ ] Logica di failover: se una key fallisce, prova la successiva
- [ ] Tracciamento fail_count per ogni key
- [ ] Key con troppi fallimenti viene disattivata temporaneamente (1 ora)
- [ ] Typecheck passa

---

### US-004: Upload PDF e parsing

**Description:** Come studente, voglio caricare un PDF del mio libro/appunti per farlo riassumere.

**Acceptance Criteria:**

- [ ] Componente upload con drag & drop
- [ ] Validazione: solo PDF, max 20MB
- [ ] Estrazione testo dal PDF (libreria pdf-parse o simile)
- [ ] Preview del numero di pagine estratte
- [ ] Messaggio errore chiaro se PDF non leggibile/scansionato
- [ ] Typecheck passa
- [ ] Verify in browser using dev-browser skill

---

### US-005: Selezione pagine da escludere

**Description:** Come studente, voglio poter escludere certe pagine (es. indice, bibliografia) dal riassunto.

**Acceptance Criteria:**

- [ ] Input per specificare pagine da saltare (es. "1-3, 15, 20-25")
- [ ] Validazione formato input
- [ ] Preview pagine che verranno processate vs escluse
- [ ] Default: nessuna pagina esclusa
- [ ] Typecheck passa
- [ ] Verify in browser using dev-browser skill

---

### US-006: Selezione livello dettaglio riassunto

**Description:** Come studente, voglio scegliere quanto deve essere dettagliato il riassunto in base al mio tempo disponibile.

**Acceptance Criteria:**

- [ ] Selector con 3 opzioni: Breve / Medio / Dettagliato
- [ ] Breve: bullet points dei concetti chiave
- [ ] Medio: 1-2 paragrafi per sezione principale
- [ ] Dettagliato: spiegazioni complete con esempi
- [ ] Tooltip che spiega ogni livello
- [ ] Typecheck passa
- [ ] Verify in browser using dev-browser skill

---

### US-007: Generazione riassunto con AI

**Description:** Come studente, voglio ricevere un riassunto del mio PDF generato dall'AI.

**Acceptance Criteria:**

- [ ] Chiamata a OpenRouter con modello gratuito (es. meta-llama/llama-3.2-3b-instruct:free)
- [ ] Prompt ottimizzato per riassunti di studio
- [ ] Gestione testi lunghi: chunking se supera context window
- [ ] Progress indicator durante generazione
- [ ] Risultato formattato in Markdown
- [ ] Failover automatico ad altra API key se errore
- [ ] Typecheck passa
- [ ] Verify in browser using dev-browser skill

---

### US-008: Generazione quiz di verifica

**Description:** Come studente, voglio un quiz per verificare se ho capito il contenuto riassunto.

**Acceptance Criteria:**

- [ ] Generazione 10 domande basate sul riassunto
- [ ] Mix: ~70% multiple choice (4 opzioni), ~30% vero/falso
- [ ] Domande in italiano se contenuto italiano, altrimenti lingua del testo
- [ ] Struttura JSON: { question, type, options?, correctAnswer, explanation }
- [ ] Failover automatico ad altra API key se errore
- [ ] Typecheck passa

---

### US-009: Interfaccia quiz interattivo

**Description:** Come studente, voglio completare il quiz in modo interattivo e vedere il mio punteggio.

**Acceptance Criteria:**

- [ ] Una domanda alla volta con navigazione avanti/indietro
- [ ] Selezione risposta con feedback visivo
- [ ] Pulsante "Verifica" al termine
- [ ] Schermata risultati: punteggio X/10, risposte corrette/sbagliate
- [ ] Per ogni errore: mostra risposta corretta + spiegazione
- [ ] Possibilità di ripetere il quiz
- [ ] Typecheck passa
- [ ] Verify in browser using dev-browser skill

---

### US-010: Download risultati (modalità guest)

**Description:** Come studente senza account, voglio scaricare riassunto e quiz per conservarli.

**Acceptance Criteria:**

- [ ] Pulsante "Scarica Riassunto" genera PDF formattato
- [ ] Pulsante "Scarica Quiz" genera PDF con domande (e risposte a fine documento)
- [ ] Pulsante "Scarica Tutto" genera PDF unico con riassunto + quiz
- [ ] Funziona senza login
- [ ] Typecheck passa
- [ ] Verify in browser using dev-browser skill

---

### US-011: Registrazione e login utente

**Description:** Come studente, voglio creare un account per salvare i miei riassunti e quiz.

**Acceptance Criteria:**

- [ ] Form registrazione: email + password
- [ ] Validazione email formato corretto
- [ ] Password minimo 8 caratteri
- [ ] Hash password con bcrypt
- [ ] Form login con email + password
- [ ] Sessione gestita con cookie HTTP-only
- [ ] Messaggio errore per credenziali errate
- [ ] Typecheck passa
- [ ] Verify in browser using dev-browser skill

---

### US-012: Dashboard utente con storico

**Description:** Come studente con account, voglio vedere tutti i miei riassunti e quiz passati.

**Acceptance Criteria:**

- [ ] Lista riassunti salvati con: titolo, data, livello dettaglio
- [ ] Click su riassunto apre dettaglio con contenuto completo
- [ ] Accesso al quiz associato da ogni riassunto
- [ ] Possibilità di eliminare riassunti
- [ ] Ordinamento per data (più recenti prima)
- [ ] Typecheck passa
- [ ] Verify in browser using dev-browser skill

---

### US-013: Homepage e landing page

**Description:** Come visitatore, voglio capire cosa fa l'app e iniziare subito a usarla.

**Acceptance Criteria:**

- [ ] Hero section con titolo, descrizione breve, CTA "Carica PDF"
- [ ] Sezione "Come funziona" in 3 step illustrati
- [ ] Opzione "Prova senza account" vs "Accedi per salvare"
- [ ] Design pulito e mobile-responsive
- [ ] Typecheck passa
- [ ] Verify in browser using dev-browser skill

---

### US-014: Gestione errori e stati di caricamento

**Description:** Come utente, voglio feedback chiaro su cosa sta succedendo e se qualcosa va storto.

**Acceptance Criteria:**

- [ ] Spinner/skeleton durante caricamenti
- [ ] Toast notifications per successo/errore
- [ ] Messaggi errore user-friendly (no stack trace)
- [ ] Retry automatico per errori di rete (max 2 tentativi)
- [ ] Pagina 404 personalizzata
- [ ] Typecheck passa
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

- FR-1: Il sistema deve accettare file PDF fino a 20MB
- FR-2: Il sistema deve estrarre testo da PDF (non supporta PDF scansionati/immagini)
- FR-3: L'utente deve poter specificare pagine da escludere nel formato "1-3, 5, 10-15"
- FR-4: Il sistema deve offrire 3 livelli di dettaglio: breve, medio, dettagliato
- FR-5: Il sistema deve generare riassunti usando solo modelli AI gratuiti di OpenRouter
- FR-6: Il sistema deve supportare multiple API key con failover automatico
- FR-7: Il sistema deve generare quiz con domande multiple choice e vero/falso
- FR-8: L'utente deve poter usare l'app senza registrazione (modalità guest)
- FR-9: L'utente registrato deve poter salvare e rivedere riassunti/quiz passati
- FR-10: Il sistema deve permettere download in formato PDF di riassunti e quiz
- FR-11: Le API key devono essere salvate in modo sicuro (criptate)
- FR-12: Una API key con >5 fallimenti consecutivi viene disattivata per 1 ora

## Non-Goals

- Non supporta PDF scansionati/immagini (richiede OCR)
- Non supporta altri formati (Word, EPUB, etc.) - solo PDF
- Non genera audio/podcast del riassunto
- Non ha funzionalità social (condivisione, gruppi di studio)
- Non supporta upload multipli simultanei
- Non ha app mobile nativa (solo web responsive)
- Non memorizza i PDF originali dopo l'elaborazione
- Non supporta modelli AI a pagamento

## Technical Considerations

### Stack Tecnologico
- **Frontend/Backend:** Next.js 14+ con App Router
- **Database:** SQLite + Prisma ORM (semplice deploy, no servizi esterni)
- **Styling:** Tailwind CSS
- **PDF Parsing:** pdf-parse (Node.js)
- **PDF Generation:** jspdf o react-pdf
- **Auth:** Sessioni custom con cookie HTTP-only + bcrypt
- **AI:** OpenRouter API (modelli gratuiti)

### Modelli AI Gratuiti OpenRouter (da usare)
- `meta-llama/llama-3.2-3b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `google/gemma-2-9b-it:free`
- `qwen/qwen-2-7b-instruct:free`

### Limiti e Considerazioni
- Context window modelli free: ~4-8k tokens → chunking necessario per PDF lunghi
- Rate limiting OpenRouter: gestire con retry + backoff
- PDF text extraction fallisce su PDF scansionati → messaggio errore chiaro
- Criptazione API key: usare crypto di Node.js con chiave da env variable

## Design Considerations

### UI/UX
- Design minimalista, focus sul contenuto
- Colori: tema chiaro con accent color (suggerito: blu/verde)
- Mobile-first responsive design
- Feedback immediato per ogni azione
- Progress bar durante generazione AI (può richiedere 30-60 secondi)

### Componenti Riutilizzabili
- Button (primary, secondary, ghost variants)
- Card (per riassunti, quiz)
- Modal (conferme, errori)
- Input/Select/FileUpload
- Toast notifications
- Loading spinner/skeleton

## Success Metrics

- Upload PDF → riassunto generato in meno di 90 secondi
- Quiz completabile in modalità interattiva senza bug
- Failover API key funziona senza intervento utente
- App usabile su mobile senza problemi di layout
- Download PDF genera file leggibili e ben formattati

## Open Questions

1. Limite numero di riassunti per utente free? (suggerimento: illimitati, è gratis)
2. Aggiungere opzione "lingua output" forzata (IT/EN) o auto-detect?
3. Implementare rate limiting per utenti guest per evitare abusi?
4. Salvare statistiche quiz (% corrette nel tempo) per utenti registrati?
