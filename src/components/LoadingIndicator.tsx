"use client";

import type { GenerationStep } from "@/types/flashcard";

interface LoadingIndicatorProps {
  step: GenerationStep;
  count?: number;
  onCancel?: () => void;
}

const steps: { key: GenerationStep; label: string }[] = [
  { key: "uploading", label: "Reading file..." },
  { key: "extracting", label: "Extracting text..." },
  { key: "generating", label: "Generating flashcards with AI..." },
];

export default function LoadingIndicator({
  step,
  count,
  onCancel,
}: LoadingIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="py-16">
      {/* Steps */}
      <div className="mx-auto mb-10 max-w-sm">
        {steps.map((s, i) => {
          const isActive = s.key === step;
          const isDone = i < currentIndex;
          let label = s.label;
          if (s.key === "generating" && isActive && count) {
            label = `Generating ~${count} flashcards...`;
          }

          return (
            <div key={s.key} className="flex items-center gap-3 py-2">
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  isDone
                    ? "bg-green-100 text-green-600 dark:bg-green-900/60 dark:text-green-400"
                    : isActive
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                }`}
              >
                {isDone ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-sm ${
                  isActive
                    ? "font-medium text-zinc-800 dark:text-zinc-200"
                    : isDone
                      ? "text-zinc-400 line-through dark:text-zinc-500"
                      : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {label}
              </span>
              {isActive && (
                <div className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-blue-600" />
              )}
            </div>
          );
        })}

        {/* Estimate + Cancel */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            This usually takes 5-15 seconds
          </p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Skeleton cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="mb-4 h-5 w-20 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-700" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-700" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
