import { GoogleGenAI } from "@google/genai";
import type { Difficulty } from "@/types/flashcard";

interface RawFlashcard {
  question: string;
  answer: string;
  category: string;
  difficulty: Difficulty;
}

export interface GeminiResult {
  flashcards: RawFlashcard[];
  truncated: boolean;
}

const MAX_TEXT_LENGTH = 30_000;
const CHUNK_SIZE = 25_000;
const CHUNK_OVERLAP = 2_000;

function buildPrompt(text: string, count: number, difficulty: string): string {
  return `You are an expert study flashcard generator. Analyze the following text and create exactly ${count} high-quality flashcards.

CONTENT ANALYSIS:
- First, identify the type of content (technical, scientific, historical, literary, mathematical, etc.)
- Adapt your question style to match the subject matter

QUESTION VARIETY (use a mix of these types):
- "What is/are..." (definitions and concepts)
- "Why does/is..." (reasoning and causation)
- "How does/do..." (processes and mechanisms)
- "Compare..." (similarities and differences)
- "Explain..." (deeper understanding)
- "List..." (enumeration of key points)
- "What is the difference between..." (distinctions)

RULES:
- Generate exactly ${count} flashcards
- Difficulty level: ${difficulty} (easy = basic recall, medium = understanding & application, hard = analysis & synthesis)
- Each answer must be self-contained — understandable without seeing the source text
- Answers should be 1-3 sentences, concise but complete
- Categories must be specific topic names from the content (NEVER use "General" or "Other")
- Do NOT include trivial, obvious, or overly broad information
- Each flashcard must include a difficulty field: "easy", "medium", or "hard"
- Vary the difficulty distribution: for "${difficulty}" level, weight toward that level but include some variety

Return ONLY a JSON array with this exact format (no other text):
[
  {
    "question": "What is...?",
    "answer": "It is...",
    "category": "Specific Topic",
    "difficulty": "medium"
  }
]

Text to analyze:
${text}`;
}

function parseJsonResponse(raw: string): RawFlashcard[] {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to extract JSON array with regex
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        throw new Error(
          "Failed to parse Gemini response as JSON. The AI returned malformed data."
        );
      }
    } else {
      throw new Error(
        "No JSON array found in Gemini response. The AI returned unexpected format."
      );
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini response is not an array");
  }

  return parsed.map((item: Record<string, unknown>) => ({
    question: String(item.question || "").trim(),
    answer: String(item.answer || "").trim(),
    category: String(item.category || "Concepts").trim(),
    difficulty: validateDifficulty(item.difficulty),
  }));
}

function validateDifficulty(val: unknown): Difficulty {
  if (val === "easy" || val === "medium" || val === "hard") return val;
  return "medium";
}

function splitIntoChunks(text: string): string[] {
  if (text.length <= MAX_TEXT_LENGTH) return [text];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end));
    start = end - CHUNK_OVERLAP;
    if (start + CHUNK_OVERLAP >= text.length) break;
  }
  return chunks;
}

export async function generateFlashcardsWithAI(
  text: string,
  count: number = 15,
  difficulty: string = "medium"
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "tu_key_aqui") {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  const truncated = text.length > MAX_TEXT_LENGTH;
  const chunks = splitIntoChunks(text);

  if (chunks.length === 1) {
    const truncatedText = text.slice(0, MAX_TEXT_LENGTH);
    const prompt = buildPrompt(truncatedText, count, difficulty);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const raw = response.text ?? "";
    const flashcards = parseJsonResponse(raw);
    return { flashcards, truncated };
  }

  // Multi-chunk: distribute count across chunks
  const perChunk = Math.max(3, Math.ceil(count / chunks.length));
  const allCards: RawFlashcard[] = [];

  for (const chunk of chunks) {
    const prompt = buildPrompt(chunk, perChunk, difficulty);
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const raw = response.text ?? "";
    try {
      const cards = parseJsonResponse(raw);
      allCards.push(...cards);
    } catch {
      // Skip failed chunks, continue with others
      console.warn("Failed to parse chunk response, skipping");
    }
  }

  return { flashcards: allCards, truncated: true };
}
