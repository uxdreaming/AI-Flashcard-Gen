import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/extractText";
import { generateFlashcardsWithAI } from "@/lib/gemini";
import { parseFlashcards } from "@/lib/parseFlashcards";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB per file
const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md"];
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
];

// Rate limiting: in-memory map of IP -> timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  rateLimitMap.set(ip, recent);

  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

function deduplicateCards(
  cards: { question: string; answer: string; category: string; difficulty: string }[]
) {
  const seen = new Map<string, string>();
  const result: typeof cards = [];

  for (const card of cards) {
    const normalized = card.question.toLowerCase().trim();
    // Skip exact duplicates
    if (seen.has(normalized)) continue;

    // Skip if this question is a substring of an existing longer question
    let isSubstring = false;
    for (const existing of seen.keys()) {
      if (existing.includes(normalized) || normalized.includes(existing)) {
        // Keep the longer one
        if (normalized.length <= existing.length) {
          isSubstring = true;
          break;
        } else {
          // Remove the shorter existing one, keep this longer one
          const shortIdx = result.findIndex(
            (r) => r.question.toLowerCase().trim() === existing
          );
          if (shortIdx !== -1) {
            result.splice(shortIdx, 1);
            seen.delete(existing);
          }
        }
      }
    }

    if (!isSubstring) {
      seen.set(normalized, card.question);
      result.push(card);
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const count = Math.min(30, Math.max(5, parseInt(formData.get("count") as string) || 15));
    const difficulty = (formData.get("difficulty") as string) || "medium";

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const textParts: string[] = [];
    const extractionErrors: string[] = [];

    for (const file of files) {
      const ext = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

      if (
        !ALLOWED_EXTENSIONS.includes(ext) &&
        !ALLOWED_MIME_TYPES.includes(file.type)
      ) {
        return NextResponse.json(
          {
            error: `Invalid file type for "${file.name}". Allowed: .pdf, .txt, .md`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `"${file.name}" is too large. Maximum size is 10MB.` },
          { status: 400 }
        );
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const text = await extractText(buffer, file.name, file.type);
        if (text.trim()) {
          textParts.push(text);
        }
      } catch (err) {
        console.warn(`Failed to extract text from "${file.name}":`, err);
        extractionErrors.push(file.name);
      }
    }

    const combinedText = textParts.join("\n\n---\n\n");

    if (!combinedText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from any of the files." },
        { status: 422 }
      );
    }

    let flashcards;
    let warning: string | undefined;
    let usedFallback = false;

    try {
      const result = await generateFlashcardsWithAI(combinedText, count, difficulty);
      flashcards = result.flashcards;
      if (result.truncated) {
        warning = "Your content was truncated due to length. Some information may not be covered in the flashcards.";
      }
    } catch (aiError) {
      console.warn("Gemini failed, falling back to heuristic parser:", aiError);
      usedFallback = true;
      flashcards = parseFlashcards(combinedText).map((c) => ({
        ...c,
        difficulty: difficulty as "easy" | "medium" | "hard",
      }));
    }

    // Post-generation validation
    flashcards = flashcards.filter(
      (c) => c.question.trim().length >= 5 && c.answer.trim().length > 0
    );

    // Trim fields
    flashcards = flashcards.map((c) => ({
      question: c.question.trim(),
      answer: c.answer.trim(),
      category: c.category.trim() || "Concepts",
      difficulty: c.difficulty,
    }));

    // Deduplicate
    flashcards = deduplicateCards(flashcards);

    // If Gemini produced 0 valid cards, try heuristic as second chance
    if (flashcards.length === 0 && !usedFallback) {
      console.warn("Gemini returned 0 valid cards, trying heuristic fallback");
      usedFallback = true;
      const heuristicCards = parseFlashcards(combinedText).map((c) => ({
        ...c,
        difficulty: difficulty as "easy" | "medium" | "hard",
      }));
      flashcards = deduplicateCards(
        heuristicCards.filter(
          (c) => c.question.trim().length >= 5 && c.answer.trim().length > 0
        ).map((c) => ({
          question: c.question.trim(),
          answer: c.answer.trim(),
          category: c.category.trim() || "Concepts",
          difficulty: c.difficulty,
        }))
      );
    }

    if (flashcards.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not generate flashcards. The file may be image-based, encrypted, or contain very little readable text. Try a different PDF or a text file.",
        },
        { status: 422 }
      );
    }


    // Add extraction warnings
    if (extractionErrors.length > 0) {
      const filesWarning = `Failed to read: ${extractionErrors.join(", ")}.`;
      warning = warning ? `${warning} ${filesWarning}` : filesWarning;
    }

    return NextResponse.json({ flashcards, ...(warning && { warning }) });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}
