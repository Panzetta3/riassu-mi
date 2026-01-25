/**
 * Parses a page range string into an array of page numbers.
 * Supports formats like: "1-3, 5, 10-15" which becomes [1, 2, 3, 5, 10, 11, 12, 13, 14, 15]
 *
 * @param input - The page range string (e.g., "1-3, 5, 10-15")
 * @param maxPage - Optional maximum page number for validation
 * @returns Object with parsed pages array and any validation errors
 */
export function parsePageRanges(
  input: string,
  maxPage?: number
): { pages: number[]; error: string | null } {
  const trimmed = input.trim();

  // Empty input is valid - no pages to exclude
  if (!trimmed) {
    return { pages: [], error: null };
  }

  const pages = new Set<number>();
  const parts = trimmed.split(",");

  for (const part of parts) {
    const trimmedPart = part.trim();

    if (!trimmedPart) continue;

    // Check if it's a range (contains hyphen)
    if (trimmedPart.includes("-")) {
      const rangeParts = trimmedPart.split("-");

      // Should have exactly 2 parts for a valid range
      if (rangeParts.length !== 2) {
        return {
          pages: [],
          error: `Formato non valido: "${trimmedPart}". Usa il formato "inizio-fine" (es. "1-5")`,
        };
      }

      const start = parseInt(rangeParts[0].trim(), 10);
      const end = parseInt(rangeParts[1].trim(), 10);

      if (isNaN(start) || isNaN(end)) {
        return {
          pages: [],
          error: `Formato non valido: "${trimmedPart}". I numeri di pagina devono essere validi`,
        };
      }

      if (start < 1 || end < 1) {
        return {
          pages: [],
          error: `I numeri di pagina devono essere maggiori di 0`,
        };
      }

      if (start > end) {
        return {
          pages: [],
          error: `Intervallo non valido: "${trimmedPart}". Il numero iniziale deve essere minore o uguale al finale`,
        };
      }

      if (maxPage !== undefined && (start > maxPage || end > maxPage)) {
        return {
          pages: [],
          error: `Numero di pagina fuori intervallo. Il PDF ha solo ${maxPage} pagine`,
        };
      }

      // Add all pages in the range
      for (let i = start; i <= end; i++) {
        pages.add(i);
      }
    } else {
      // Single page number
      const pageNum = parseInt(trimmedPart, 10);

      if (isNaN(pageNum)) {
        return {
          pages: [],
          error: `Formato non valido: "${trimmedPart}". Deve essere un numero`,
        };
      }

      if (pageNum < 1) {
        return {
          pages: [],
          error: `I numeri di pagina devono essere maggiori di 0`,
        };
      }

      if (maxPage !== undefined && pageNum > maxPage) {
        return {
          pages: [],
          error: `Numero di pagina fuori intervallo. Il PDF ha solo ${maxPage} pagine`,
        };
      }

      pages.add(pageNum);
    }
  }

  return { pages: Array.from(pages).sort((a, b) => a - b), error: null };
}

/**
 * Validates a page range string format without parsing all pages.
 * Useful for real-time validation in form inputs.
 *
 * @param input - The page range string to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePageRangeFormat(input: string): string | null {
  const { error } = parsePageRanges(input);
  return error;
}
