"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useFlashcardStore } from "@/store/useFlashcardStore";
import type { Difficulty } from "@/types/flashcard";
import FileUpload from "@/components/FileUpload";
import FlashcardList from "@/components/FlashcardList";
import LoadingIndicator from "@/components/LoadingIndicator";
import { getCardsForReview } from "@/lib/spacedRepetition";

export default function Home() {
  const {
    flashcards,
    loading,
    error,
    selectedFiles,
    generationStep,
    categoryFilter,
    statusFilter,
    difficultyFilter,
    setFlashcards,
    deleteFlashcard,
    updateFlashcard,
    setMastery,
    saveToStorage,
    loadFromStorage,
    setLoading,
    setError,
    addFiles,
    removeFile,
    setSelectedFiles,
    setGenerationStep,
    setCategoryFilter,
    setStatusFilter,
    setDifficultyFilter,
  } = useFlashcardStore();

  const [saved, setSaved] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(15);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (flashcards.length > 0 && !loading) {
      setStudyMode(true);
    }
  }, [flashcards.length, loading]);

  const dueCount = useMemo(() => {
    return getCardsForReview(flashcards).length;
  }, [flashcards]);

  const masteredCount = useMemo(() => {
    return flashcards.filter((f) => f.status === "mastered").length;
  }, [flashcards]);

  const handleGenerate = async () => {
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setError(null);
    setWarning(null);
    setSaved(false);
    setGenerationStep("uploading");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setGenerationStep("extracting");

      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append("files", file);
      }
      formData.append("count", String(count));
      formData.append("difficulty", difficulty);

      setGenerationStep("generating");

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 504
            ? "The request timed out. Try with fewer or smaller files."
            : `Server error (${res.status}). Please try again.`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate flashcards");
      }

      if (data.warning) {
        setWarning(data.warning);
      }

      const flashcardsWithIds = data.flashcards.map(
        (f: { question: string; answer: string; category: string; difficulty?: string }) => ({
          ...f,
          id: uuidv4(),
          difficulty: (f.difficulty || "medium") as Difficulty,
          status: "new" as const,
          createdAt: Date.now(),
        })
      );

      setGenerationStep("done");
      setFlashcards(flashcardsWithIds);
      setSelectedFiles([]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User cancelled
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
      setGenerationStep("idle");
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const handleSave = () => {
    saveToStorage();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBack = () => {
    setStudyMode(false);
  };

  // Study mode
  if (studyMode && flashcards.length > 0) {
    return (
      <div className="study-mode h-screen">
        <FlashcardList
          flashcards={flashcards}
          onDelete={deleteFlashcard}
          onEdit={updateFlashcard}
          onMastery={setMastery}
          onSave={handleSave}
          saved={saved}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          difficultyFilter={difficultyFilter}
          onDifficultyChange={setDifficultyFilter}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Landing page
  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        {error && (
          <div className="mt-3 flex-shrink-0 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        {warning && !loading && (
          <div className="mt-3 flex-shrink-0 rounded-xl bg-amber-50 p-3 text-center text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            {warning}
          </div>
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingIndicator
              step={generationStep}
              count={count}
              onCancel={handleCancel}
            />
          </div>
        ) : (
            <div className="grid flex-1 grid-cols-1 content-center gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-[11px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  Powered by Gemini AI
                </span>
                <h2 className="text-3xl font-bold leading-tight tracking-tight text-zinc-800 dark:text-zinc-100 lg:text-4xl">
                  Turn your notes into
                  <br />
                  <span className="text-blue-600 dark:text-blue-400">smart flashcards</span>
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Upload PDFs, text or markdown. AI extracts key concepts and creates study-ready flashcards with spaced repetition.
                </p>

                {/* Feature list */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-900/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400"><span className="font-medium text-zinc-700 dark:text-zinc-300">AI extraction</span> — auto-detect concepts from documents</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-green-50 dark:bg-green-900/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400"><span className="font-medium text-zinc-700 dark:text-zinc-300">Spaced repetition</span> — SM-2 optimal review intervals</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-purple-50 dark:bg-purple-900/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400">
                        <circle cx="5" cy="6" r="3" /><circle cx="19" cy="6" r="3" /><circle cx="12" cy="18" r="3" />
                        <line x1="7.5" y1="7.5" x2="10.5" y2="16.5" /><line x1="16.5" y1="7.5" x2="13.5" y2="16.5" />
                      </svg>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400"><span className="font-medium text-zinc-700 dark:text-zinc-300">Multiple views</span> — cards, gallery, concept map & audio</span>
                  </div>
                </div>

                {/* Try Demo button */}
                <button
                  onClick={() => {
                    const demoCards = [
                      { question: "What is User Experience (UX) Design?", answer: "UX Design is the process of creating products that provide meaningful and relevant experiences to users, involving branding, design, usability, and function.", category: "UX Fundamentals", difficulty: "easy" as Difficulty },
                      { question: "What are Jakob Nielsen's 5 quality components of usability?", answer: "Learnability, efficiency, memorability, errors, and satisfaction.", category: "Usability", difficulty: "medium" as Difficulty },
                      { question: "What are the three WCAG 2.1 conformance levels?", answer: "Level A (minimum), Level AA (mid-range, most common target), and Level AAA (highest).", category: "Accessibility", difficulty: "medium" as Difficulty },
                      { question: "What is Information Architecture (IA)?", answer: "IA is the structural design of shared information environments. It involves organizing, structuring, and labeling content effectively using methods like card sorting, tree testing, and sitemap creation.", category: "UX Fundamentals", difficulty: "easy" as Difficulty },
                      { question: "What is the difference between qualitative and quantitative UX research?", answer: "Qualitative methods (interviews, usability testing) explore the 'why' behind behavior with small samples. Quantitative methods (surveys, analytics, A/B testing) measure the 'what' with large samples for statistical significance.", category: "UX Research", difficulty: "medium" as Difficulty },
                      { question: "Explain Fitts's Law and its implication for UI design.", answer: "Fitts's Law states that the time to reach a target depends on its size and distance from the cursor. In UI design, this means important actions should be large and close to the user's current focus.", category: "Interaction Design", difficulty: "hard" as Difficulty },
                      { question: "What are the 5 phases of Design Thinking?", answer: "1. Empathize (research users), 2. Define (synthesize into a problem statement), 3. Ideate (brainstorm solutions), 4. Prototype (build low-fidelity representations), 5. Test (gather feedback with real users).", category: "Design Thinking", difficulty: "easy" as Difficulty },
                      { question: "What is a design token and what types exist?", answer: "Design tokens are the smallest units of a design system that store visual attributes as named values. Types include color, spacing, typography, shadow, and border radius tokens.", category: "Design Systems", difficulty: "medium" as Difficulty },
                      { question: "What is Atomic Design and what are its five levels?", answer: "Atomic Design breaks components into: Atoms (buttons, inputs), Molecules (search bar = input + button), Organisms (navigation header), Templates (page layouts), and Pages (templates with real content).", category: "Design Systems", difficulty: "hard" as Difficulty },
                      { question: "What is Hicks's Law?", answer: "Hicks's Law states that decision time increases logarithmically with the number of choices. In UI design, this means reducing options and using progressive disclosure to simplify decisions.", category: "Interaction Design", difficulty: "medium" as Difficulty },
                    ];
                    setFlashcards(demoCards.map(c => ({
                      ...c,
                      id: uuidv4(),
                      status: "new" as const,
                      createdAt: Date.now(),
                    })));
                  }}
                  className="mt-1 flex w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Try demo
                </button>

              </div>

              <div className="flex flex-col gap-3">
                <FileUpload
                  onFilesAdded={addFiles}
                  onGenerate={handleGenerate}
                  selectedFiles={selectedFiles}
                  onRemoveFile={removeFile}
                  onClearFiles={() => setSelectedFiles([])}
                  loading={loading}
                  difficulty={difficulty}
                  onDifficultyChange={setDifficulty}
                  count={count}
                  onCountChange={setCount}
                />

                {/* Resume studying card */}
                {flashcards.length > 0 && (
                  <div className="flex flex-col gap-2.5 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        Your deck
                      </span>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                        <span>{flashcards.length} cards</span>
                        <span>{masteredCount} mastered</span>
                        {dueCount > 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            {dueCount} due
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${flashcards.length > 0 ? (masteredCount / flashcards.length) * 100 : 0}%` }}
                      />
                      <div
                        className="bg-amber-500 transition-all"
                        style={{ width: `${flashcards.length > 0 ? (flashcards.filter(f => f.status === "learning").length / flashcards.length) * 100 : 0}%` }}
                      />
                    </div>
                    <button
                      onClick={() => setStudyMode(true)}
                      className="w-full rounded-lg bg-zinc-800 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                      {dueCount > 0 ? `Study now (${dueCount} due)` : "Continue studying"}
                    </button>
                  </div>
                )}
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
