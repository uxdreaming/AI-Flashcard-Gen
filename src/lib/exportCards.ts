import type { Flashcard } from "@/types/flashcard";

function escapeCSV(str: string): string {
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV(flashcards: Flashcard[]): string {
  const header = "Question,Answer,Category,Difficulty,Status";
  const rows = flashcards.map(
    (f) =>
      `${escapeCSV(f.question)},${escapeCSV(f.answer)},${escapeCSV(f.category)},${f.difficulty},${f.status}`
  );
  return [header, ...rows].join("\n");
}

export function exportToAnki(flashcards: Flashcard[]): string {
  return flashcards
    .map((f) => `${f.question}\t${f.answer}\t${f.category}`)
    .join("\n");
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
