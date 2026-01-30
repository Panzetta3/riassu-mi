"use client";

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui";

export type FileType = "pdf" | "image";

interface FileUploadProps {
  onFileSelect: (file: File, type: FileType) => void;
  selectedFile: File | null;
  fileType: FileType | null;
  error: string | null;
  onClearFile: () => void;
  isProcessingImage?: boolean;
  ocrProgress?: number;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB for images

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function FileUpload({
  onFileSelect,
  selectedFile,
  fileType,
  error,
  onClearFile,
  isProcessingImage = false,
  ocrProgress = 0,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFile = useCallback((file: File) => {
    if (isPdfFile(file)) {
      onFileSelect(file, "pdf");
    } else if (isImageFile(file)) {
      onFileSelect(file, "image");
    }
  }, [onFileSelect]);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [processFile]
  );

  const handleCameraCapture = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0], "image");
      }
      // Reset input
      e.target.value = "";
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCameraClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    cameraInputRef.current?.click();
  }, []);

  return (
    <div className="w-full">
      {/* Hidden file input for PDF/images */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Hidden camera input for mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-gray-700"
          }
          ${error ? "border-red-400 dark:border-red-500" : ""}
          ${isProcessingImage ? "pointer-events-none opacity-75" : ""}
        `}
      >
        {isProcessingImage ? (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-5xl animate-pulse">
              <span role="img" aria-label="Processing">
                🔍
              </span>
            </div>
            <p className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-200">
              Estrazione testo in corso...
            </p>
            <div className="w-full max-w-xs">
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {ocrProgress}%
              </p>
            </div>
          </div>
        ) : !selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-5xl">
              <span role="img" aria-label="Upload">
                📤
              </span>
            </div>
            <p className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-200">
              Trascina qui il tuo file
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              oppure clicca per selezionare
            </p>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              PDF o immagini (JPG, PNG)
            </p>

            {/* Camera button - visible on mobile */}
            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                onClick={handleCameraClick}
                className="flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scatta foto
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-5xl">
              <span role="img" aria-label={fileType === "pdf" ? "PDF" : "Image"}>
                {fileType === "pdf" ? "📄" : "🖼️"}
              </span>
            </div>
            <p className="mb-1 text-lg font-medium text-gray-700 dark:text-gray-200">
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(selectedFile.size)}
            </p>
            {fileType === "image" && (
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                ✓ Testo estratto dall&apos;immagine
              </p>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Clear file button */}
      {selectedFile && !error && !isProcessingImage && (
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" onClick={onClearFile}>
            Rimuovi file
          </Button>
        </div>
      )}
    </div>
  );
}

export { MAX_FILE_SIZE, MAX_IMAGE_SIZE, formatFileSize, isImageFile, isPdfFile };
