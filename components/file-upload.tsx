"use client";

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  error: string | null;
  onClearFile: () => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  onFileSelect,
  selectedFile,
  error,
  onClearFile,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInputChange}
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
        `}
      >
        {!selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-5xl">
              <span role="img" aria-label="Upload">
                📤
              </span>
            </div>
            <p className="mb-2 text-lg font-medium text-gray-700 dark:text-gray-200">
              Trascina qui il tuo PDF
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              oppure clicca per selezionare un file
            </p>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              Solo file .pdf, massimo 20MB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-5xl">
              <span role="img" aria-label="PDF">
                📄
              </span>
            </div>
            <p className="mb-1 text-lg font-medium text-gray-700 dark:text-gray-200">
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Clear file button */}
      {selectedFile && !error && (
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" onClick={onClearFile}>
            Rimuovi file
          </Button>
        </div>
      )}
    </div>
  );
}

export { MAX_FILE_SIZE, formatFileSize };
