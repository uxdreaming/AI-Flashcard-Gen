export type MasteryStatus = "new" | "learning" | "mastered";
export type Difficulty = "easy" | "medium" | "hard";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: Difficulty;
  status: MasteryStatus;
  createdAt: number;
  // Spaced repetition fields
  nextReview?: number;
  interval?: number;
  easeFactor?: number;
  reviewCount?: number;
}

export interface FlashcardCollection {
  flashcards: Flashcard[];
  sourceFileName?: string;
  updatedAt: number;
}

export type GenerationStep =
  | "idle"
  | "uploading"
  | "extracting"
  | "generating"
  | "done";
