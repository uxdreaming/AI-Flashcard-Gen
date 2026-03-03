"use client";

import type { Flashcard } from "@/types/flashcard";

interface StudyStatsProps {
  flashcards: Flashcard[];
}

export default function StudyStats({ flashcards }: StudyStatsProps) {
  const total = flashcards.length;
  if (total === 0) return null;

  const mastered = flashcards.filter((f) => f.status === "mastered").length;
  const learning = flashcards.filter((f) => f.status === "learning").length;
  const newCount = flashcards.filter((f) => f.status === "new").length;

  const pctMastered = Math.round((mastered / total) * 100);
  const pctLearning = Math.round((learning / total) * 100);
  const pctNew = 100 - pctMastered - pctLearning;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {pctMastered > 0 && (
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${pctMastered}%` }}
          />
        )}
        {pctLearning > 0 && (
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${pctLearning}%` }}
          />
        )}
        {pctNew > 0 && (
          <div
            className="bg-zinc-300 transition-all dark:bg-zinc-600"
            style={{ width: `${pctNew}%` }}
          />
        )}
      </div>

      {/* Counters */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          <span className="text-zinc-500 dark:text-zinc-400">
            {mastered} mastered
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-zinc-500 dark:text-zinc-400">
            {learning} learning
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <span className="text-zinc-500 dark:text-zinc-400">
            {newCount} new
          </span>
        </div>
      </div>
    </div>
  );
}
