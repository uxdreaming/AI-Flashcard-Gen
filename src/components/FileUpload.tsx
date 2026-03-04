"use client";

import { useRef, useState, useCallback } from "react";

interface FileUploadProps {
  onFilesAdded: (files: File[]) => void;
  onGenerate: () => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  onClearFiles: () => void;
  loading: boolean;
  compact?: boolean;
  difficulty: string;
  onDifficultyChange: (d: string) => void;
  count: number;
  onCountChange: (c: number) => void;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB per file
const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".md"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Basic" },
  { value: "medium", label: "Intermediate" },
  { value: "hard", label: "Advanced" },
];

const COUNT_OPTIONS = [5, 10, 15, 20, 30];

function getFileIcon(fileName: string) {
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  if (ext === ".pdf")
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    );
  if (ext === ".md")
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    );
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
  onFilesAdded,
  onGenerate,
  selectedFiles,
  onRemoveFile,
  onClearFiles,
  loading,
  compact = false,
  difficulty,
  onDifficultyChange,
  count,
  onCountChange,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndAdd = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const valid: File[] = [];
      const errors: string[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name
          .substring(file.name.lastIndexOf("."))
          .toLowerCase();
        const hasValidExt = ACCEPTED_EXTENSIONS.includes(ext);
        const hasValidMime = ACCEPTED_MIME_TYPES.includes(file.type);
        if (!hasValidExt && !hasValidMime) {
          errors.push(`${file.name} (invalid type)`);
          continue;
        }
        if (file.size > MAX_SIZE) {
          errors.push(`${file.name} (exceeds 10MB)`);
          continue;
        }
        valid.push(file);
      }

      if (errors.length > 0) {
        setError(
          `${errors.length} file${errors.length > 1 ? "s" : ""} skipped: ${errors.join(", ")}`
        );
      }

      if (valid.length > 0) onFilesAdded(valid);
    },
    [onFilesAdded]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) validateAndAdd(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) validateAndAdd(files);
  };

  const settingsBar = (
    <div className="flex flex-col gap-3">
      {/* Difficulty selector */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Difficulty
        </label>
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onDifficultyChange(opt.value)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                difficulty === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count selector */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Number of cards
        </label>
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => onCountChange(n)}
              className={`flex-1 px-2 py-2 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                count === n
                  ? "bg-blue-600 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (compact && selectedFiles.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        {selectedFiles.map((file, i) => (
          <div key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
            {getFileIcon(file.name)}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {file.name}
              </p>
              <p className="text-xs text-zinc-400">
                {formatSize(file.size)}
              </p>
            </div>
            <button
              onClick={() => onRemoveFile(i)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
        {settingsBar}
        <button
          onClick={onGenerate}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          Generate
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {selectedFiles.length > 0 ? (
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="flex max-h-52 flex-col gap-3 overflow-y-auto">
            {selectedFiles.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center gap-4">
                {getFileIcon(file.name)}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                    {file.name}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {formatSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveFile(i)}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  aria-label="Remove file"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3">
            {settingsBar}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              + Add more
            </button>
            <button
              onClick={onGenerate}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : `Generate (${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""})`}
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
            dragOver
              ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40"
              : "border-zinc-300 hover:border-blue-400 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:border-blue-500 dark:hover:bg-zinc-800/50"
          }`}
        >
          <div className="mb-3 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 dark:text-zinc-500">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="font-medium text-zinc-700 dark:text-zinc-300">
            Drop your files here or click to browse
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            You can select multiple files
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
              PDF
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              TXT
            </span>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              MD
            </span>
            <span className="ml-1 text-xs text-zinc-400">up to 10MB each</span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
