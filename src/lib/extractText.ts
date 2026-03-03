import { PDFParse } from "pdf-parse";

export async function extractText(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();

  if (ext === ".pdf" || mimeType === "application/pdf") {
    try {
      const pdf = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await pdf.getText();
      const text = result.text || "";
      if (text.trim().length > 20) return text;
    } catch (err) {
      console.warn("PDFParse primary method failed:", err);
    }

    // Fallback: try treating the buffer directly
    try {
      const rawText = buffer.toString("utf-8");
      // Extract readable text fragments from raw PDF bytes
      const fragments: string[] = [];
      const matches = rawText.matchAll(/\(([^)]{2,})\)/g);
      for (const m of matches) {
        const frag = m[1].trim();
        // Filter out PDF operators and binary data
        if (frag.length > 2 && /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(frag) && !/^[A-Z]{1,2}$/.test(frag)) {
          fragments.push(frag);
        }
      }
      if (fragments.length > 5) {
        return fragments.join(" ");
      }
    } catch {
      // ignore fallback failure
    }

    throw new Error(`Could not extract text from "${fileName}". The PDF may be image-based or encrypted.`);
  }

  return buffer.toString("utf-8");
}
