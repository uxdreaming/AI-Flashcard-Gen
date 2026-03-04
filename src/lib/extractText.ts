async function extractPdfText(buffer: Buffer): Promise<string> {
  // Primary: pdfjs-dist (works on Vercel serverless)
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      text += content.items.map((item: any) => item.str || "").join(" ") + "\n";
    }
    if (text.trim().length > 20) return text;
  } catch (err) {
    console.warn("pdfjs-dist extraction failed:", err);
  }

  // Fallback: regex extraction from raw PDF bytes
  const rawText = buffer.toString("utf-8");
  const fragments: string[] = [];
  const matches = rawText.matchAll(/\(([^)]{2,})\)/g);
  for (const m of matches) {
    const frag = m[1].trim();
    if (frag.length > 2 && /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(frag) && !/^[A-Z]{1,2}$/.test(frag)) {
      fragments.push(frag);
    }
  }
  if (fragments.length > 5) {
    return fragments.join(" ");
  }

  throw new Error("Could not extract text from PDF. It may be image-based or encrypted.");
}

export async function extractText(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();

  if (ext === ".pdf" || mimeType === "application/pdf") {
    return extractPdfText(buffer);
  }

  return buffer.toString("utf-8");
}
