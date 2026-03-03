"use client";

import { useState, useMemo } from "react";
import type { Flashcard } from "@/types/flashcard";
import { getCategoryColor } from "@/lib/categoryColors";

type SortMode = "all" | "category" | "difficulty" | "status";

interface GalleryViewProps {
  flashcards: Flashcard[];
  categories: string[];
  onGoToCard: (index: number) => void;
}

function MiniCard({
  card,
  categories,
  onClick,
  onDoubleClick,
}: {
  card: Flashcard;
  categories: string[];
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const c = getCategoryColor(card.category, categories);

  const handleClick = () => {
    setFlipped(!flipped);
    onClick();
  };

  return (
    <div
      className="mini-card-flip-container cursor-pointer"
      style={{ height: "160px" }}
      onClick={handleClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      <div className={`mini-card-flip-inner ${flipped ? "flipped" : ""}`}>
        {/* Front */}
        <div
          className="mini-card-flip-face flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
          style={{ borderLeft: `3px solid ${c.accent}` }}
        >
          <div className="flex items-center gap-1.5 border-b border-zinc-100 px-3 py-1.5 dark:border-zinc-700/50">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: c.accent }}
            />
            <span className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
              {card.category}
            </span>
          </div>
          <div className="flex flex-1 items-center px-3 py-2">
            <p className="line-clamp-3 text-sm font-medium leading-snug text-zinc-700 dark:text-zinc-200">
              {card.question}
            </p>
          </div>
          <div className="px-3 pb-1.5">
            <span className="text-[9px] text-zinc-400">{card.difficulty}</span>
          </div>
        </div>

        {/* Back */}
        <div
          className="mini-card-flip-face mini-card-flip-back flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
          style={{ borderLeft: `3px solid ${c.accent}` }}
        >
          <div className="flex items-center gap-1.5 border-b border-zinc-100 px-3 py-1.5 dark:border-zinc-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-[10px] text-zinc-400">Answer</span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <p className="line-clamp-5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
              {card.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GalleryView({
  flashcards,
  categories,
  onGoToCard,
}: GalleryViewProps) {
  const [sortMode, setSortMode] = useState<SortMode>("all");

  const grouped = useMemo(() => {
    if (sortMode === "all") {
      return [{ label: null, cards: flashcards.map((c, i) => ({ card: c, originalIndex: i })) }];
    }

    const groups = new Map<string, { card: Flashcard; originalIndex: number }[]>();
    flashcards.forEach((card, i) => {
      const key =
        sortMode === "category"
          ? card.category
          : sortMode === "difficulty"
          ? card.difficulty
          : card.status;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ card, originalIndex: i });
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, cards]) => ({ label, cards }));
  }, [flashcards, sortMode]);

  const sortModes: { key: SortMode; label: string }[] = [
    { key: "all", label: "All" },
    { key: "category", label: "Category" },
    { key: "difficulty", label: "Difficulty" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Sort controls */}
      <div className="flex flex-shrink-0 items-center gap-1 px-4 pb-3">
        {sortModes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setSortMode(mode.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              sortMode === mode.key
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {grouped.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-6" : ""}>
            {group.label && (
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {group.label}
              </h3>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {group.cards.map(({ card, originalIndex }) => (
                <MiniCard
                  key={card.id}
                  card={card}
                  categories={categories}
                  onClick={() => {}}
                  onDoubleClick={() => onGoToCard(originalIndex)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
