"use client";

import { useState, useMemo } from "react";
import type { Flashcard, MasteryStatus } from "@/types/flashcard";
import { getCategoryColor } from "@/lib/categoryColors";

interface FlashcardItemProps {
  flashcard: Flashcard;
  index: number;
  total: number;
  categories: string[];
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Pick<Flashcard, "question" | "answer" | "category">>) => void;
  onMastery: (id: string, status: MasteryStatus, quality?: number) => void;
  onPrev: () => void;
  onNext: () => void;
  zoom: number;
  speaking?: boolean;
  onSpeak?: (text: string) => void;
  onStopSpeak?: () => void;
}

function getAdaptiveFontClass(text: string, isQuestion: boolean): string {
  const len = text.length;
  if (isQuestion) {
    if (len < 60) return "text-xl";
    if (len < 150) return "text-lg";
    return "text-base";
  }
  if (len < 80) return "text-lg";
  if (len < 200) return "text-base";
  return "text-sm";
}

function formatContent(text: string) {
  const numberedInline = text.match(/\d+\.\s+.+?,\s*\d+\./);
  if (numberedInline) {
    const items = text.split(/,\s*(?=\d+\.)/).map((s) => s.trim());
    return (
      <ol className="space-y-1.5 text-left">
        {items.map((item, i) => {
          const cleaned = item.replace(/^\d+\.\s*/, "").replace(/\.$/, "");
          return (
            <li key={i} className="flex gap-2">
              <span className="flex-shrink-0 font-mono opacity-30">{i + 1}.</span>
              <span>{cleaned}</span>
            </li>
          );
        })}
      </ol>
    );
  }

  const lines = text.split(/\n/).filter((l) => l.trim());
  const allNumbered = lines.length > 1 && lines.every((l) => /^\d+[.)]\s/.test(l.trim()));
  const allBulleted = lines.length > 1 && lines.every((l) => /^[-*]\s/.test(l.trim()));

  if (allNumbered) {
    return (
      <ol className="space-y-1.5 text-left">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span className="flex-shrink-0 font-mono opacity-30">{i + 1}.</span>
            <span>{line.replace(/^\d+[.)]\s*/, "")}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (allBulleted) {
    return (
      <ul className="space-y-1.5 text-left">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span className="flex-shrink-0 opacity-30">&#8226;</span>
            <span>{line.replace(/^[-*]\s*/, "")}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (lines.length > 1) {
    return (
      <div className="space-y-2 text-left">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  }

  return <p>{text}</p>;
}

export default function FlashcardItem({
  flashcard,
  index,
  total,
  categories,
  onDelete,
  onEdit,
  onMastery,
  onPrev,
  onNext,
  zoom,
  speaking,
  onSpeak,
  onStopSpeak,
}: FlashcardItemProps) {
  const [flipped, setFlipped] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const c = getCategoryColor(flashcard.category, categories);

  const questionFontClass = useMemo(() => getAdaptiveFontClass(flashcard.question, true), [flashcard.question]);
  const answerFontClass = useMemo(() => getAdaptiveFontClass(flashcard.answer, false), [flashcard.answer]);

  const handleFlip = () => {
    if (!editing) setFlipped(!flipped);
  };

  const handleNav = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    setFlipped(false);
    setEditing(false);
    action();
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditQuestion(flashcard.question);
    setEditAnswer(flashcard.answer);
    setEditCategory(flashcard.category);
    setEditing(true);
    setFlipped(false);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(flashcard.id, {
      question: editQuestion.trim(),
      answer: editAnswer.trim(),
      category: editCategory.trim() || flashcard.category,
    });
    setEditing(false);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(false);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (speaking && onStopSpeak) {
      onStopSpeak();
    } else if (onSpeak) {
      onSpeak(flipped ? flashcard.answer : flashcard.question);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Card container */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div
          className="card-flip-container w-full"
          style={{
            maxWidth: "640px",
            aspectRatio: "3 / 2",
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            transition: "transform 0.2s ease",
          }}
        >
          <div className={`card-flip-inner ${flipped && !editing ? "flipped" : ""}`}>
            {/* Front — Question / Edit mode */}
            <div
              className="card-flip-face flex flex-col overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-700"
              style={{ borderLeft: `3px solid ${c.accent}` }}
            >
              <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-zinc-800">
                {/* Header */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-2 dark:border-zinc-700/50">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: c.accent }}
                    />
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {flashcard.category}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {flashcard.difficulty || "medium"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-zinc-400">
                      {index + 1}/{total}
                    </span>
                    {onSpeak && (
                      <button
                        onClick={handleSpeak}
                        className={`rounded p-1 transition-colors ${speaking ? "text-blue-500 dark:text-blue-400" : "text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"}`}
                        aria-label={speaking ? "Stop" : "Read aloud"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {speaking ? (
                            <>
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                            </>
                          ) : (
                            <>
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </>
                          )}
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={startEdit}
                      className="rounded p-1 text-zinc-300 transition-colors hover:text-blue-500 dark:text-zinc-600 dark:hover:text-blue-400"
                      aria-label="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(flashcard.id); }}
                      className="rounded p-1 text-zinc-300 transition-colors hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400"
                      aria-label="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Body */}
                {editing ? (
                  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-500">Question</label>
                      <textarea
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                        rows={3}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-500">Answer</label>
                      <textarea
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                        rows={4}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-500">Category</label>
                      <input
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-lg border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-8 py-6"
                      onClick={handleFlip}
                    >
                      <p className={`text-center font-semibold leading-snug text-zinc-800 dark:text-zinc-100 ${questionFontClass}`}>
                        {flashcard.question}
                      </p>
                    </div>

                    <div className="flex-shrink-0 border-t border-zinc-100 px-5 py-1.5 text-center dark:border-zinc-700/50">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        Click to reveal answer
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Back — Answer */}
            <div
              className="card-flip-face card-flip-back flex flex-col overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-700"
              style={{ borderLeft: `3px solid ${c.accent}` }}
            >
              <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-zinc-800">
                {/* Header */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-2 dark:border-zinc-700/50">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Answer
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-zinc-400">
                      {index + 1}/{total}
                    </span>
                    {onSpeak && (
                      <button
                        onClick={handleSpeak}
                        className={`rounded p-1 transition-colors ${speaking ? "text-blue-500 dark:text-blue-400" : "text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"}`}
                        aria-label={speaking ? "Stop" : "Read aloud"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Answer body */}
                <div
                  className="min-h-0 flex-1 overflow-y-auto px-8 py-6"
                  onClick={handleFlip}
                >
                  <div className={`leading-relaxed text-zinc-700 dark:text-zinc-300 ${answerFontClass}`}>
                    {formatContent(flashcard.answer)}
                  </div>
                </div>

                {/* Mastery buttons — plain text style */}
                <div className="flex-shrink-0 border-t border-zinc-100 px-5 py-2 dark:border-zinc-700/50">
                  <div className="flex items-center justify-center gap-4">
                    <span className="mr-1 text-[10px] text-zinc-400">How well did you know this?</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMastery(flashcard.id, "learning", 1);
                        setFlipped(false);
                        onNext();
                      }}
                      className="text-xs text-zinc-500 transition-colors hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                    >
                      Again
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMastery(flashcard.id, "learning", 3);
                        setFlipped(false);
                        onNext();
                      }}
                      className="text-xs text-zinc-500 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
                    >
                      Good
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMastery(flashcard.id, "mastered", 5);
                        setFlipped(false);
                        onNext();
                      }}
                      className="text-xs text-zinc-500 transition-colors hover:text-green-600 dark:text-zinc-400 dark:hover:text-green-400"
                    >
                      Easy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-shrink-0 items-center justify-center gap-3">
        <button
          onClick={(e) => handleNav(e, onPrev)}
          disabled={index === 0}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 disabled:opacity-30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          {total <= 20 ? (
            Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all ${i !== index ? "bg-zinc-300 dark:bg-zinc-600" : ""}`}
                style={{
                  height: "8px",
                  width: i === index ? "20px" : "8px",
                  ...(i === index ? { backgroundColor: c.accent } : {}),
                }}
              />
            ))
          ) : (
            <span className="px-2 font-mono text-sm text-zinc-500 dark:text-zinc-400">
              {index + 1} / {total}
            </span>
          )}
        </div>

        <button
          onClick={(e) => handleNav(e, onNext)}
          disabled={index === total - 1}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 disabled:opacity-30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
