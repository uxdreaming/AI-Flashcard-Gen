import { create } from "zustand";
import type {
  Flashcard,
  FlashcardCollection,
  GenerationStep,
  MasteryStatus,
} from "@/types/flashcard";
import { calculateNextReview } from "@/lib/spacedRepetition";

const STORAGE_KEY = "flashcards";

interface FlashcardState {
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;
  selectedFiles: File[];
  generationStep: GenerationStep;
  categoryFilter: string | null;
  statusFilter: MasteryStatus | null;
  difficultyFilter: string | null;
  studyMode: boolean;
  setFlashcards: (flashcards: Flashcard[]) => void;
  addFlashcards: (flashcards: Flashcard[]) => void;
  deleteFlashcard: (id: string) => void;
  updateFlashcard: (id: string, updates: Partial<Pick<Flashcard, "question" | "answer" | "category">>) => void;
  setMastery: (id: string, status: MasteryStatus, quality?: number) => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedFiles: (files: File[]) => void;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  setGenerationStep: (step: GenerationStep) => void;
  setCategoryFilter: (category: string | null) => void;
  setStatusFilter: (status: MasteryStatus | null) => void;
  setDifficultyFilter: (difficulty: string | null) => void;
  setStudyMode: (mode: boolean) => void;
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  flashcards: [],
  loading: false,
  error: null,
  selectedFiles: [],
  generationStep: "idle",
  categoryFilter: null,
  statusFilter: null,
  difficultyFilter: null,
  studyMode: false,

  setFlashcards: (flashcards) => set({ flashcards }),

  addFlashcards: (newFlashcards) =>
    set((state) => ({
      flashcards: [...state.flashcards, ...newFlashcards],
    })),

  deleteFlashcard: (id) =>
    set((state) => ({
      flashcards: state.flashcards.filter((f) => f.id !== id),
    })),

  updateFlashcard: (id, updates) =>
    set((state) => ({
      flashcards: state.flashcards.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),

  setMastery: (id, status, quality) =>
    set((state) => ({
      flashcards: state.flashcards.map((f) => {
        if (f.id !== id) return f;
        const updated: Flashcard = { ...f, status };
        // Apply SM-2 if quality is provided
        if (quality !== undefined) {
          const q = quality as 0 | 1 | 2 | 3 | 4 | 5;
          const result = calculateNextReview(
            q,
            f.interval || 0,
            f.easeFactor || 2.5,
            f.reviewCount || 0
          );
          updated.nextReview = result.nextReview;
          updated.interval = result.interval;
          updated.easeFactor = result.easeFactor;
          updated.reviewCount = result.reviewCount;
        }
        return updated;
      }),
    })),

  saveToStorage: () => {
    const { flashcards } = get();
    const collection: FlashcardCollection = {
      flashcards,
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    } catch (err) {
      if (err instanceof DOMException && err.name === "QuotaExceededError") {
        set({
          error:
            "Storage is full. Try deleting some flashcards or clearing browser data.",
        });
      } else {
        console.error("Failed to save flashcards:", err);
      }
    }
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const collection: FlashcardCollection = JSON.parse(raw);
      if (collection.flashcards && Array.isArray(collection.flashcards)) {
        // Migrate old cards missing fields
        const migrated = collection.flashcards.map((f) => ({
          ...f,
          difficulty: f.difficulty || "medium",
          status: f.status || "new",
          // SM-2 defaults for existing cards
          nextReview: f.nextReview || 0,
          interval: f.interval || 0,
          easeFactor: f.easeFactor || 2.5,
          reviewCount: f.reviewCount || 0,
        })) as Flashcard[];
        set({ flashcards: migrated });
      }
    } catch {
      console.error("Failed to load flashcards from storage");
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedFiles: (files) => set({ selectedFiles: files }),
  addFiles: (files) =>
    set((state) => ({
      selectedFiles: [...state.selectedFiles, ...files],
    })),
  removeFile: (index) =>
    set((state) => ({
      selectedFiles: state.selectedFiles.filter((_, i) => i !== index),
    })),
  setGenerationStep: (step) => set({ generationStep: step }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setDifficultyFilter: (difficulty) => set({ difficultyFilter: difficulty }),
  setStudyMode: (mode) => set({ studyMode: mode }),
}));
