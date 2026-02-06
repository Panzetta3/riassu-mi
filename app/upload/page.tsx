"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUpload, MAX_FILE_SIZE, MAX_IMAGE_SIZE, isImageFile, isPdfFile, isWordFile, isTextFile, FileType } from "@/components/file-upload";
import { Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import { DetailLevelSelector, DetailLevel } from "@/components/detail-level-selector";
import { ProgressIndicator, ProgressStage } from "@/components/progress-indicator";
import { parsePageRanges } from "@/lib/utils";
import { useToast } from "@/components/toast";

const MAX_TEXT_FILE_SIZE = 10 * 1024 * 1024; // 10MB for text/word files

function validateFile(file: File, type: FileType): string | null {
  if (type === "pdf") {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return "Il file deve essere in formato PDF";
    }
    if (file.type !== "application/pdf") {
      return "Il file deve essere un PDF valido";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Il file supera il limite di 2GB";
    }
  } else if (type === "image") {
    if (!isImageFile(file)) {
      return "Il file deve essere un'immagine valida (JPG, PNG)";
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return "L'immagine supera il limite di 20MB";
    }
  } else if (type === "word") {
    if (!isWordFile(file)) {
      return "Il file deve essere un documento Word valido (.docx)";
    }
    if (file.size > MAX_TEXT_FILE_SIZE) {
      return "Il file Word supera il limite di 10MB";
    }
  } else if (type === "text") {
    if (!isTextFile(file)) {
      return "Il file deve essere un file di testo valido (.txt)";
    }
    if (file.size > MAX_TEXT_FILE_SIZE) {
      return "Il file di testo supera il limite di 10MB";
    }
  }
  return null;
}

// Get page count from PDF using pdf-lib (client-side compatible)
async function getPdfPageCount(file: File): Promise<number> {
  const { PDFDocument } = await import("pdf-lib");
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}

// Run OCR on image using tesseract.js
async function extractTextFromImage(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  const Tesseract = await import("tesseract.js");

  const result = await Tesseract.recognize(file, "ita+eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  return result.data.text;
}

// Extract text from Word file using mammoth
async function extractTextFromWord(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// Extract text from TXT file
async function extractTextFromTxt(file: File): Promise<string> {
  return await file.text();
}

export default function UploadPage() {
  const router = useRouter();
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoadingPageCount, setIsLoadingPageCount] = useState(false);
  const [excludePagesInput, setExcludePagesInput] = useState("");
  const [excludePagesError, setExcludePagesError] = useState<string | null>(null);
  const [excludedPages, setExcludedPages] = useState<number[]>([]);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("medium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState<ProgressStage>("analyzing");
  const [apiError, setApiError] = useState<string | null>(null);
  const [chunkProgress, setChunkProgress] = useState<{current: number, total: number} | undefined>();

  // Image OCR state
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string | null>(null);

  // Load page count when PDF is selected
  useEffect(() => {
    if (!selectedFile || fileType !== "pdf") {
      setPageCount(null);
      setExcludePagesInput("");
      setExcludePagesError(null);
      setExcludedPages([]);
      return;
    }

    setIsLoadingPageCount(true);
    getPdfPageCount(selectedFile)
      .then((count) => {
        setPageCount(count);
      })
      .catch(() => {
        setPageCount(null);
      })
      .finally(() => {
        setIsLoadingPageCount(false);
      });
  }, [selectedFile, fileType]);

  // Validate exclude pages input when it changes or page count changes
  useEffect(() => {
    if (!excludePagesInput.trim()) {
      setExcludePagesError(null);
      setExcludedPages([]);
      return;
    }

    const result = parsePageRanges(excludePagesInput, pageCount ?? undefined);
    if (result.error) {
      setExcludePagesError(result.error);
      setExcludedPages([]);
    } else {
      setExcludePagesError(null);
      setExcludedPages(result.pages);
    }
  }, [excludePagesInput, pageCount]);

  const handleFileSelect = useCallback(async (file: File, type: FileType) => {
    const validationError = validateFile(file, type);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      setFileType(null);
      setExtractedText(null);
      return;
    }

    setError(null);
    setApiError(null);

    if (type === "image") {
      // Process image with OCR
      setIsProcessingImage(true);
      setOcrProgress(0);
      setSelectedFile(file);
      setFileType(type);

      try {
        const text = await extractTextFromImage(file, setOcrProgress);

        if (!text.trim()) {
          setError("Nessun testo rilevato nell'immagine. Riprova con un'immagine piÃ¹ chiara.");
          setSelectedFile(null);
          setFileType(null);
          setExtractedText(null);
        } else {
          setExtractedText(text);
        }
      } catch (err) {
        console.error("OCR error:", err);
        setError("Errore durante l'estrazione del testo dall'immagine");
        setSelectedFile(null);
        setFileType(null);
        setExtractedText(null);
      } finally {
        setIsProcessingImage(false);
      }
    } else if (type === "word") {
      // Process Word file
      setIsProcessingImage(true);
      setOcrProgress(50);
      setSelectedFile(file);
      setFileType(type);

      try {
        const text = await extractTextFromWord(file);

        if (!text.trim()) {
          setError("Nessun testo trovato nel documento Word.");
          setSelectedFile(null);
          setFileType(null);
          setExtractedText(null);
        } else {
          setExtractedText(text);
        }
      } catch (err) {
        console.error("Word extraction error:", err);
        setError("Errore durante l'estrazione del testo dal documento Word");
        setSelectedFile(null);
        setFileType(null);
        setExtractedText(null);
      } finally {
        setIsProcessingImage(false);
      }
    } else if (type === "text") {
      // Process TXT file
      setSelectedFile(file);
      setFileType(type);

      try {
        const text = await extractTextFromTxt(file);

        if (!text.trim()) {
          setError("Il file di testo Ã¨ vuoto.");
          setSelectedFile(null);
          setFileType(null);
          setExtractedText(null);
        } else {
          setExtractedText(text);
        }
      } catch (err) {
        console.error("TXT extraction error:", err);
        setError("Errore durante la lettura del file di testo");
        setSelectedFile(null);
        setFileType(null);
        setExtractedText(null);
      }
    } else {
      // PDF file
      setSelectedFile(file);
      setFileType(type);
      setExtractedText(null);
    }
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setFileType(null);
    setError(null);
    setPageCount(null);
    setExcludePagesInput("");
    setExcludePagesError(null);
    setExcludedPages([]);
    setApiError(null);
    setExtractedText(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setApiError(null);
    setProgressStage("analyzing");

    try {
      let response: Response;

      if ((fileType === "image" || fileType === "word" || fileType === "text") && extractedText) {
        // For images, Word, and TXT files, send the extracted text
        const stageTimer = setTimeout(() => {
          setProgressStage("generating");
        }, 500);

        response = await fetch("/api/summarize-text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: extractedText,
            detailLevel,
            title: selectedFile.name.replace(/\.[^.]+$/, ""),
          }),
        });

        clearTimeout(stageTimer);
      } else {
        // PDF: multi-step flow to avoid serverless timeout
        const FILE_SIZE_LIMIT = 4.5 * 1024 * 1024; // 4.5MB (Vercel limit)
        const formData = new FormData();

        if (selectedFile.size > FILE_SIZE_LIMIT) {
          setProgressStage("uploading");
          try {
            const { upload } = await import("@vercel/blob/client");
            const uniqueName = `${Date.now()}-${selectedFile.name}`;
            const blob = await upload(uniqueName, selectedFile, {
              access: "public",
              handleUploadUrl: "/api/upload-blob",
            });
            formData.append("blobUrl", blob.url);
            formData.append("fileName", selectedFile.name);
          } catch (uploadError) {
            throw new Error(`Errore durante l'upload del file: ${uploadError instanceof Error ? uploadError.message : "Errore sconosciuto"}`);
          }
        } else {
          formData.append("file", selectedFile);
        }

        if (excludePagesInput.trim()) {
          formData.append("excludePages", excludePagesInput);
        }

        // Step 1: Parse PDF to get page groups
        setProgressStage("analyzing");
        const parseRes = await fetch("/api/parse-pdf", { method: "POST", body: formData });
        const parseData = await parseRes.json();
        if (!parseRes.ok) throw new Error(parseData?.error || "Errore durante l'analisi del PDF");

        const { groups, totalGroups, pdfName } = parseData;

        // Step 2: Summarize each chunk
        setProgressStage("chunking");
        const summaries: string[] = [];

        for (let i = 0; i < groups.length; i++) {
          setChunkProgress({ current: i + 1, total: totalGroups });

          const chunkRes = await fetch("/api/summarize-chunk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: groups[i].text, detailLevel }),
          });
          const chunkData = await chunkRes.json();
          if (!chunkRes.ok) throw new Error(chunkData?.error || `Errore generazione riassunto (parte ${i + 1})`);

          summaries.push(`## \u{1F4C4} ${groups[i].pageRange}\n\n${chunkData.summary}`);
        }

        // Step 3: Save combined summary
        setProgressStage("saving");
        const content = summaries.length === 1 ? summaries[0] : summaries.join('\n\n---\n\n');

        const saveRes = await fetch("/api/save-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, detailLevel, pdfName }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveData?.error || "Errore nel salvataggio");

        toast.success("Riassunto generato con successo!");
        setTimeout(() => { router.push(`/summary/${saveData.summaryId}`); }, 500);
        return; // PDF flow complete, skip shared text response handling below
      }

      // Shared response handling (text/image/word path only)
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error("Risposta del server non valida");
          }
        } else {
          throw new Error("Risposta vuota dal server");
        }
      } else {
        throw new Error("Risposta del server non valida");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Errore durante la generazione del riassunto");
      }

      setProgressStage("saving");
      toast.success("Riassunto generato con successo!");

      setTimeout(() => {
        router.push(`/summary/${data.summaryId}`);
      }, 500);

    } catch (err) {
      setIsProcessing(false);
      const errorMsg = err instanceof Error ? err.message : "Errore sconosciuto";
      setApiError(errorMsg);
      toast.error(errorMsg);
    }
  }, [selectedFile, fileType, extractedText, detailLevel, excludePagesInput, router, toast]);

  const canSubmit = selectedFile && !error && !excludePagesError &&
    (fileType === "pdf" || ((fileType === "image" || fileType === "word" || fileType === "text") && extractedText));

  return (
    <div className="min-h-screen page-shell px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Torna alla home
        </Link>

        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Carica il tuo documento
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Seleziona un PDF, Word, TXT o scatta una foto per generare un riassunto
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Show Progress Indicator when processing */}
            {isProcessing ? (
              <ProgressIndicator stage={progressStage} pageCount={pageCount ?? undefined} chunkProgress={chunkProgress} />
            ) : (
              <>
                {/* File Upload Component */}
                <FileUpload
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  fileType={fileType}
                  error={error}
                  onClearFile={handleClearFile}
                  isProcessingImage={isProcessingImage}
                  ocrProgress={ocrProgress}
                />

                {/* Extracted text preview for images, Word, and TXT files */}
                {(fileType === "image" || fileType === "word" || fileType === "text") && extractedText && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {fileType === "image" ? "Testo rilevato:" : "Anteprima testo:"}
                    </p>
                    <p className="max-h-32 overflow-y-auto text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {extractedText.slice(0, 500)}
                      {extractedText.length > 500 && "..."}
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      {extractedText.length} caratteri
                    </p>
                  </div>
                )}

                {/* API Error Message */}
                {apiError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <div className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">
                          Errore
                        </p>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                          {apiError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF-specific options */}
                {fileType === "pdf" && selectedFile && !error && (
                  <div className="space-y-4">
                    {/* Page count info */}
                    {isLoadingPageCount ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Analizzando il PDF...
                      </p>
                    ) : pageCount !== null ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Il PDF contiene <span className="font-semibold">{pageCount}</span> {pageCount === 1 ? "pagina" : "pagine"}
                      </p>
                    ) : null}

                    {/* Page exclusion input */}
                    <div>
                      <Input
                        label="Pagine da escludere (opzionale)"
                        placeholder="es. 1-3, 5, 10-15"
                        value={excludePagesInput}
                        onChange={(e) => setExcludePagesInput(e.target.value)}
                        error={excludePagesError ?? undefined}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Inserisci i numeri di pagina o gli intervalli da saltare (es. &quot;1-3, 5, 10-15&quot;)
                      </p>
                    </div>

                    {/* Preview of pages to process */}
                    {pageCount !== null && !excludePagesError && (
                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <div className="flex flex-col gap-2 text-sm sm:flex-row sm:justify-between">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Pagine escluse: </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {excludedPages.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Pagine da processare: </span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {pageCount - excludedPages.length}
                            </span>
                          </div>
                        </div>
                        {excludedPages.length > 0 && excludedPages.length <= 20 && (
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Escluse: {excludedPages.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Detail Level Selector - show for all file types */}
                {selectedFile && !error && (fileType === "pdf" || extractedText) && (
                  <DetailLevelSelector
                    value={detailLevel}
                    onChange={setDetailLevel}
                  />
                )}

                {/* Action Button */}
                {canSubmit && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="primary"
                      className="px-8 py-3 text-lg"
                      onClick={handleSubmit}
                    >
                      Genera Riassunto
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Info section */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            I tuoi file vengono elaborati in modo sicuro e non vengono
            conservati dopo la generazione del riassunto.
          </p>
        </div>
      </div>
    </div>
  );
}

