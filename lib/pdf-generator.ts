import { jsPDF } from "jspdf";

interface SummaryPdfData {
  title: string;
  pdfName: string;
  detailLevel: string;
  createdAt: Date;
  content: string;
}

// Map detail level to Italian labels
const detailLevelLabels: Record<string, string> = {
  brief: "Breve",
  medium: "Medio",
  detailed: "Dettagliato",
};

/**
 * Converts Markdown text to plain text with basic formatting preserved
 */
function markdownToPlainText(markdown: string): string {
  let text = markdown;

  // Remove bold markers but keep text
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");

  // Remove italic markers but keep text
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  // Convert headers to uppercase with newlines
  text = text.replace(/^### (.+)$/gm, "\n$1\n");
  text = text.replace(/^## (.+)$/gm, "\n$1\n");
  text = text.replace(/^# (.+)$/gm, "\n$1\n");

  // Convert list items
  text = text.replace(/^[-*] (.+)$/gm, "  • $1");
  text = text.replace(/^\d+\. (.+)$/gm, "  • $1");

  // Remove code blocks but keep content
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```\w*\n?/g, "").replace(/```/g, "");
  });

  // Remove inline code markers
  text = text.replace(/`([^`]+)`/g, "$1");

  // Remove blockquote markers
  text = text.replace(/^> (.+)$/gm, "  $1");

  // Remove horizontal rules
  text = text.replace(/^---+$/gm, "");
  text = text.replace(/^\*\*\*+$/gm, "");

  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/**
 * Generates a PDF from summary data
 */
export function generateSummaryPdf(data: SummaryPdfData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Helper function to add a new page if needed
  const checkNewPage = (requiredSpace: number): void => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(data.title, contentWidth);
  checkNewPage(titleLines.length * 8);
  doc.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 8 + 5;

  // Metadata section
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);

  const detailLabel = detailLevelLabels[data.detailLevel] || data.detailLevel;
  const dateStr = data.createdAt.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const metadata = [
    `File: ${data.pdfName}`,
    `Livello: ${detailLabel}`,
    `Data: ${dateStr}`,
  ];

  metadata.forEach((line) => {
    checkNewPage(5);
    doc.text(line, margin, yPosition);
    yPosition += 5;
  });

  // Separator line
  yPosition += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Reset text color for content
  doc.setTextColor(0, 0, 0);

  // Convert markdown to plain text
  const plainContent = markdownToPlainText(data.content);
  const lines = plainContent.split("\n");

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  for (const line of lines) {
    if (line.trim() === "") {
      yPosition += 3;
      continue;
    }

    // Check if it looks like a header (all caps or ends with colon and is short)
    const isHeader = line.length < 60 && !line.startsWith("  •");

    if (isHeader && line.trim().length > 0 && !line.startsWith("  ")) {
      // Header styling
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      checkNewPage(8);
      const headerLines = doc.splitTextToSize(line, contentWidth);
      doc.text(headerLines, margin, yPosition);
      yPosition += headerLines.length * 6 + 3;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    } else {
      // Regular text
      const textLines = doc.splitTextToSize(line, contentWidth);
      checkNewPage(textLines.length * 5);
      doc.text(textLines, margin, yPosition);
      yPosition += textLines.length * 5 + 2;
    }
  }

  // Footer with generation notice
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generato con Riassu.mi - Pagina ${i} di ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // Generate filename
  const sanitizedTitle = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
  const dateForFile = data.createdAt.toISOString().split("T")[0];
  const filename = `riassunto-${sanitizedTitle}-${dateForFile}.pdf`;

  // Download the PDF
  doc.save(filename);
}
