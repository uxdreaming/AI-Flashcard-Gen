"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type { Flashcard, MasteryStatus } from "@/types/flashcard";
import FlashcardItem from "./FlashcardItem";
import GalleryView from "./GalleryView";
import ConceptMap from "./ConceptMap";
import StudyStats from "./StudyStats";
import { getCategoryColor } from "@/lib/categoryColors";
import { exportToCSV, exportToAnki, downloadFile } from "@/lib/exportCards";
import { getCardsForReview, getNextReviewText } from "@/lib/spacedRepetition";
import { useAudio } from "@/hooks/useAudio";

type ViewMode = "single" | "gallery" | "map";

interface FlashcardListProps {
  flashcards: Flashcard[];
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Pick<Flashcard, "question" | "answer" | "category">>) => void;
  onMastery: (id: string, status: MasteryStatus, quality?: number) => void;
  onSave: () => void;
  saved: boolean;
  categoryFilter: string | null;
  onCategoryChange: (category: string | null) => void;
  statusFilter: MasteryStatus | null;
  onStatusChange: (status: MasteryStatus | null) => void;
  difficultyFilter: string | null;
  onDifficultyChange: (difficulty: string | null) => void;
  onBack: () => void;
}

const masteryColors: Record<MasteryStatus, string> = {
  new: "bg-zinc-300 dark:bg-zinc-600",
  learning: "bg-amber-500",
  mastered: "bg-green-500",
};

export default function FlashcardList({
  flashcards,
  onDelete,
  onEdit,
  onMastery,
  onSave,
  saved,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  difficultyFilter,
  onDifficultyChange,
  onBack,
}: FlashcardListProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [studyNow, setStudyNow] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("flashcard-viewMode") as ViewMode) || "single";
    }
    return "single";
  });
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("flashcard-zoom");
      return stored ? parseFloat(stored) : 1;
    }
    return 1;
  });

  const { speak, stop, speaking, autoRead, toggleAutoRead } = useAudio();

  const categories = useMemo(() => {
    const cats = new Set(flashcards.map((f) => f.category));
    return Array.from(cats).sort();
  }, [flashcards]);

  const filtered = useMemo(() => {
    let result = flashcards;
    if (categoryFilter) result = result.filter((f) => f.category === categoryFilter);
    if (statusFilter) result = result.filter((f) => f.status === statusFilter);
    if (difficultyFilter) result = result.filter((f) => f.difficulty === difficultyFilter);
    return result;
  }, [flashcards, categoryFilter, statusFilter, difficultyFilter]);

  // Study Now: cards due for review
  const dueForReview = useMemo(() => {
    const indices = getCardsForReview(flashcards);
    return indices;
  }, [flashcards]);

  const studyCards = useMemo(() => {
    if (!studyNow) return filtered;
    return dueForReview
      .map((i) => flashcards[i])
      .filter((c) => {
        if (categoryFilter && c.category !== categoryFilter) return false;
        if (statusFilter && c.status !== statusFilter) return false;
        if (difficultyFilter && c.difficulty !== difficultyFilter) return false;
        return true;
      });
  }, [studyNow, filtered, dueForReview, flashcards, categoryFilter, statusFilter, difficultyFilter]);

  const activeCards = studyNow ? studyCards : filtered;

  useEffect(() => {
    setCurrentIndex(0);
  }, [categoryFilter, statusFilter, difficultyFilter, studyNow]);

  useEffect(() => {
    if (currentIndex >= activeCards.length && activeCards.length > 0) {
      setCurrentIndex(activeCards.length - 1);
    }
  }, [activeCards.length, currentIndex]);

  // Auto-read on card change
  useEffect(() => {
    if (autoRead && activeCards[currentIndex] && viewMode === "single") {
      speak(activeCards[currentIndex].question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, autoRead, viewMode]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(activeCards.length - 1, i + 1));
  }, [activeCards.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (viewMode !== "single") return;
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handlePrev, handleNext, viewMode]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("flashcard-viewMode", mode);
    stop();
  };

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.min(1.5, Math.max(0.6, newZoom));
    setZoom(clamped);
    localStorage.setItem("flashcard-zoom", String(clamped));
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(flashcards);
    downloadFile(csv, "flashcards.csv", "text/csv");
    setShowExportMenu(false);
  };

  const handleExportAnki = () => {
    const anki = exportToAnki(flashcards);
    downloadFile(anki, "flashcards-anki.txt", "text/plain");
    setShowExportMenu(false);
  };

  const handleGoToCard = (index: number) => {
    setCurrentIndex(index);
    handleViewModeChange("single");
  };

  // Next review text for "all caught up"
  const nextReviewText = useMemo(() => {
    if (dueForReview.length > 0) return null;
    const futureReviews = flashcards
      .filter((f) => f.nextReview && f.nextReview > Date.now())
      .sort((a, b) => (a.nextReview || 0) - (b.nextReview || 0));
    if (futureReviews.length === 0) return null;
    return getNextReviewText(futureReviews[0].nextReview!);
  }, [flashcards, dueForReview]);

  const emptyState = activeCards.length === 0 ? (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        {studyNow ? (
          <>
            <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300">All caught up!</p>
            {nextReviewText && (
              <p className="mt-1 text-sm text-zinc-400">Next review {nextReviewText}</p>
            )}
            <button
              onClick={() => setStudyNow(false)}
              className="mt-3 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Back to all cards
            </button>
          </>
        ) : (
          <>
            <p className="text-zinc-500 dark:text-zinc-400">No cards match the current filters.</p>
            <button
              onClick={() => {
                onCategoryChange(null);
                onStatusChange(null);
                onDifficultyChange(null);
              }}
              className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Clear all filters
            </button>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="hidden w-72 flex-shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:flex">
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                saved
                  ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {saved ? "Saved" : "Save"}
            </button>
            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="Export"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                  <button
                    onClick={handleExportCSV}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={handleExportAnki}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Export for Anki
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View mode toggle + Study Now */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
          <div className="flex items-center gap-1">
            {/* Single view */}
            <button
              onClick={() => handleViewModeChange("single")}
              className={`rounded p-1.5 transition-colors ${viewMode === "single" ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"}`}
              aria-label="Single card view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </button>
            {/* Gallery view */}
            <button
              onClick={() => handleViewModeChange("gallery")}
              className={`rounded p-1.5 transition-colors ${viewMode === "gallery" ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"}`}
              aria-label="Gallery view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            {/* Concept map */}
            <button
              onClick={() => handleViewModeChange("map")}
              className={`rounded p-1.5 transition-colors ${viewMode === "map" ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"}`}
              aria-label="Concept map"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5" cy="6" r="3" /><circle cx="19" cy="6" r="3" />
                <circle cx="12" cy="18" r="3" />
                <line x1="7.5" y1="7.5" x2="10.5" y2="16.5" />
                <line x1="16.5" y1="7.5" x2="13.5" y2="16.5" />
              </svg>
            </button>
          </div>

          {/* Study Now button */}
          <button
            onClick={() => setStudyNow(!studyNow)}
            className={`relative rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
              studyNow
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            Study Now
            {dueForReview.length > 0 && !studyNow && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {dueForReview.length > 99 ? "99+" : dueForReview.length}
              </span>
            )}
          </button>
        </div>

        {/* Audio controls */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-1.5 dark:border-zinc-800">
          <button
            onClick={toggleAutoRead}
            className={`flex items-center gap-1.5 rounded px-2 py-1 text-[10px] transition-colors ${
              autoRead
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            Auto-read {autoRead ? "on" : "off"}
          </button>
        </div>

        {/* Category filters */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <button
              onClick={() => onCategoryChange(null)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                !categoryFilter
                  ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              All
            </button>
            {categories.map((cat) => {
              const cc = getCategoryColor(cat, categories);
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(categoryFilter === cat ? null : cat)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    categoryFilter === cat
                      ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: cc.accent }}
                  />
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Status & Difficulty filters */}
        <div className="flex flex-wrap gap-1.5 border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
          {(["new", "learning", "mastered"] as MasteryStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(statusFilter === s ? null : s)}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                statusFilter === s
                  ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${masteryColors[s]}`} />
              {s}
            </button>
          ))}
          <span className="mx-0.5" />
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => onDifficultyChange(difficultyFilter === d ? null : d)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                difficultyFilter === d
                  ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Card list */}
        <div className="flex-1 overflow-y-auto">
          {activeCards.map((card, i) => {
            const cc = getCategoryColor(card.category, categories);
            const isActive = i === currentIndex;
            return (
              <button
                key={card.id}
                onClick={() => {
                  setCurrentIndex(i);
                  if (viewMode !== "single") handleViewModeChange("single");
                }}
                className={`flex w-full items-start gap-3 border-b border-zinc-50 px-4 py-3 text-left transition-all dark:border-zinc-800/50 ${
                  isActive && viewMode === "single"
                    ? "border-l-2 bg-zinc-50 dark:bg-zinc-800/50"
                    : "border-l-2 border-l-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
                style={isActive && viewMode === "single" ? { borderLeftColor: cc.accent } : undefined}
              >
                <div className="mt-1 flex flex-shrink-0 flex-col items-center gap-1.5">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: cc.accent }}
                  />
                  <span className={`h-1.5 w-1.5 rounded-full ${masteryColors[card.status || "new"]}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${isActive && viewMode === "single" ? "font-semibold text-zinc-800 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}`}>
                    {card.question}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-500">
                    {card.category}
                  </p>
                </div>
                <span className="mt-0.5 flex-shrink-0 font-mono text-[10px] text-zinc-300 dark:text-zinc-600">
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sidebar footer */}
        <div className="border-t border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
          {/* Review badge */}
          {dueForReview.length > 0 && (
            <div className="mb-2 text-[11px] text-amber-600 dark:text-amber-400">
              {dueForReview.length} card{dueForReview.length !== 1 ? "s" : ""} due for review
            </div>
          )}
          <div className="mb-2">
            <StudyStats flashcards={flashcards} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              {activeCards.length} card{activeCards.length !== 1 ? "s" : ""}
              {categoryFilter ? ` in ${categoryFilter}` : ""}
              {studyNow ? " (study mode)" : ""}
            </p>
            {viewMode === "single" && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleZoomChange(zoom - 0.1)}
                  disabled={zoom <= 0.6}
                  className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30 dark:text-zinc-500 dark:hover:text-zinc-300"
                  aria-label="Zoom out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
                <span className="font-mono text-[10px] text-zinc-400">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => handleZoomChange(zoom + 0.1)}
                  disabled={zoom >= 1.5}
                  className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30 dark:text-zinc-500 dark:hover:text-zinc-300"
                  aria-label="Zoom in"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex min-h-0 flex-1 flex-col bg-zinc-50 px-6 py-4 dark:bg-zinc-900">
        {/* Mobile top bar */}
        <div className="flex flex-shrink-0 items-center justify-between pb-3 md:hidden">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-zinc-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            {/* Mobile view toggle */}
            <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
              <button
                onClick={() => handleViewModeChange("single")}
                className={`rounded p-1 ${viewMode === "single" ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
              </button>
              <button
                onClick={() => handleViewModeChange("gallery")}
                className={`rounded p-1 ${viewMode === "gallery" ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              </button>
              <button
                onClick={() => handleViewModeChange("map")}
                className={`rounded p-1 ${viewMode === "map" ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="6" r="3" /><circle cx="19" cy="6" r="3" /><circle cx="12" cy="18" r="3" /></svg>
              </button>
            </div>
            <button
              onClick={onSave}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                saved ? "bg-green-100 text-green-700" : "bg-blue-600 text-white"
              }`}
            >
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* Render based on view mode */}
        {emptyState || (
          <>
            {viewMode === "single" && activeCards[currentIndex] && (
              <div className="mx-auto w-full max-w-3xl min-h-0 flex-1">
                <FlashcardItem
                  flashcard={activeCards[currentIndex]}
                  index={currentIndex}
                  total={activeCards.length}
                  categories={categories}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onMastery={onMastery}
                  onPrev={handlePrev}
                  onNext={handleNext}
                  zoom={zoom}
                  speaking={speaking}
                  onSpeak={speak}
                  onStopSpeak={stop}
                />
              </div>
            )}

            {viewMode === "gallery" && (
              <GalleryView
                flashcards={activeCards}
                categories={categories}
                onGoToCard={handleGoToCard}
              />
            )}

            {viewMode === "map" && (
              <ConceptMap
                flashcards={activeCards}
                categories={categories}
                onSelectCard={handleGoToCard}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
