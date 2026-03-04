"use client";

import { useState } from "react";
import { useFlashcardStore } from "@/store/useFlashcardStore";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [showConfirm, setShowConfirm] = useState(false);
  const setFlashcards = useFlashcardStore((s) => s.setFlashcards);
  const setStudyMode = useFlashcardStore((s) => s.setStudyMode);
  const setCategoryFilter = useFlashcardStore((s) => s.setCategoryFilter);
  const setStatusFilter = useFlashcardStore((s) => s.setStatusFilter);
  const setDifficultyFilter = useFlashcardStore((s) => s.setDifficultyFilter);
  const setSelectedFiles = useFlashcardStore((s) => s.setSelectedFiles);
  const setError = useFlashcardStore((s) => s.setError);

  const handleReset = () => {
    localStorage.removeItem("flashcards");
    localStorage.removeItem("cardZoom");
    setFlashcards([]);
    setStudyMode(false);
    setCategoryFilter(null);
    setStatusFilter(null);
    setDifficultyFilter(null);
    setSelectedFiles([]);
    setError(null);
    setShowConfirm(false);
  };

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          {/* Stacked cards icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-600 dark:text-blue-400"
          >
            <rect x="2" y="4" width="16" height="14" rx="2" />
            <rect x="6" y="2" width="16" height="14" rx="2" />
            <line x1="10" y1="8" x2="18" y2="8" />
            <line x1="10" y1="12" x2="16" y2="12" />
          </svg>
          <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            AI Flashcard Gen
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {/* Reset button */}
          <div className="relative">
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Reset app"
              title="Start fresh"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 1 9 9" />
                <polyline points="1 7 3 12 8 10" />
              </svg>
            </button>
            {showConfirm && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
                  Delete all cards and start fresh?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
