<p align="center">
  <img src="docs/cover.png" alt="AI Flashcard Gen" width="100%" />
</p>

<h1 align="center">AI Flashcard Gen</h1>

<p align="center">
  <strong>Turn any document into smart flashcards with AI-powered extraction and spaced repetition.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## About

AI Flashcard Gen is a study tool that extracts key concepts from your documents and generates ready-to-study flashcards. Upload PDFs, text or markdown files — the AI handles the rest.

Built for students, professionals and anyone who learns. Drop your material, get flashcards, study with spaced repetition.

<p align="center">
  <img src="docs/Flashcards.png" alt="Flashcards Preview" width="100%" />
</p>

---

## Features

| | Feature | Description |
|---|---|---|
| :brain: | **AI Extraction** | Gemini 2.0 Flash analyzes your documents and generates question/answer pairs automatically |
| :repeat: | **Spaced Repetition** | SM-2 algorithm schedules optimal review intervals — study what you need, when you need it |
| :card_index: | **Single Card View** | Navigate flashcards one at a time with flip animations, mastery tracking and keyboard shortcuts |
| :framed_picture: | **Gallery View** | Grid layout to browse all cards at a glance, with inline flip and sorting by category, difficulty or status |
| :globe_with_meridians: | **Concept Map** | Interactive force-directed graph showing relationships between concepts and categories |
| :speaker: | **Text-to-Speech** | Listen to questions and answers with auto language detection (English/Spanish) |
| :file_folder: | **Multi-file Upload** | Drag & drop multiple files at once — PDF, TXT and Markdown supported |
| :bar_chart: | **Study Stats** | Track your progress with mastery counts, due cards and review streaks |
| :first_quarter_moon: | **Dark Mode** | Full light/dark theme support |
| :floppy_disk: | **Local Storage** | Your flashcards persist in the browser — no account needed |
| :shield: | **Smart Fallback** | If AI generation fails, a heuristic parser extracts cards from text structure |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 with Turbopack |
| Frontend | React 19, Tailwind CSS 4 |
| State | Zustand 5 |
| AI | Google Gemini 2.0 Flash (`@google/genai`) |
| PDF | pdf-parse with raw bytes fallback |
| Audio | Web Speech API (native, zero dependencies) |
| Language | TypeScript 5 |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ installed ([download](https://nodejs.org/))
- **Google Gemini API key** — free at [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/uxdreaming/AI-Flashcard-Gen.git
cd AI-Flashcard-Gen
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

### 4. Run the development server

```bash
npm run dev
```

### 5. Open in browser

Navigate to **[http://localhost:3000](http://localhost:3000)** and start uploading your study material.

---

## Supported Formats

| Format | Extension | Details |
|---|---|---|
| :page_facing_up: PDF | `.pdf` | Text extraction with raw bytes fallback for complex files |
| :memo: Plain text | `.txt` | Direct text processing |
| :bookmark_tabs: Markdown | `.md` | Supports headers, lists, tables and structured content |

**Max file size:** 10 MB per file. Multiple files can be uploaded at once.

---

## How It Works

```
Document Upload  →  Text Extraction  →  AI Analysis  →  Flashcard Generation
     .pdf              pdf-parse           Gemini 2.0        Q&A pairs with
     .txt              raw fallback        Flash              categories &
     .md                                                      difficulty
```

1. **Upload** — Drag & drop or browse for files (PDF, TXT, MD)
2. **Configure** — Choose difficulty level (Basic / Intermediate / Advanced) and card count (5-30)
3. **Generate** — AI extracts key concepts and creates flashcards
4. **Study** — Review cards in single view, gallery or concept map with spaced repetition
5. **Listen** — Use text-to-speech to hear questions and answers
6. **Track** — Monitor mastery progress with "Study Now" for due reviews

---

## Project Structure

```
AI-Flashcard-Gen/
├── src/
│   ├── app/
│   │   ├── api/generate/     # API route for flashcard generation
│   │   ├── layout.tsx        # Root layout with Geist fonts
│   │   ├── page.tsx          # Landing page & study mode entry
│   │   └── globals.css       # Global styles & animations
│   ├── components/
│   │   ├── FlashcardItem.tsx  # Single card with flip animation
│   │   ├── FlashcardList.tsx  # Main study interface & sidebar
│   │   ├── GalleryView.tsx    # Grid view with mini-cards
│   │   ├── ConceptMap.tsx     # Force-directed concept graph
│   │   ├── FileUpload.tsx     # Drag & drop upload zone
│   │   ├── LoadingIndicator.tsx
│   │   ├── StudyStats.tsx     # Progress statistics
│   │   └── ThemeToggle.tsx    # Dark/light mode switch
│   ├── hooks/
│   │   └── useAudio.ts       # Text-to-speech hook
│   ├── lib/
│   │   ├── gemini.ts          # Gemini AI integration
│   │   ├── extractText.ts     # PDF & text extraction
│   │   ├── parseFlashcards.ts # Heuristic fallback parser
│   │   ├── spacedRepetition.ts # SM-2 algorithm
│   │   ├── categoryColors.ts  # Muted color palette
│   │   └── exportCards.ts     # CSV/JSON export
│   ├── store/
│   │   └── useFlashcardStore.ts # Zustand state management
│   └── types/
│       └── flashcard.ts       # TypeScript interfaces
├── docs/                      # Screenshots & assets
├── .env.example               # Environment template
└── package.json
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Completed Features

| | Feature |
|---|---|
| :white_check_mark: | Text extraction from PDF with raw bytes fallback |
| :white_check_mark: | AI flashcard generation with Gemini 2.0 Flash |
| :white_check_mark: | Support for PDF, TXT and Markdown files |
| :white_check_mark: | Drag & drop multi-file upload with validation |
| :white_check_mark: | Difficulty selector (Basic / Intermediate / Advanced) |
| :white_check_mark: | Flashcard count selector (5, 10, 15, 20, 30) |
| :white_check_mark: | Single card view with 3D flip animation |
| :white_check_mark: | Gallery view with mini-card grid and inline flip |
| :white_check_mark: | Interactive concept map with force-directed graph |
| :white_check_mark: | Text-to-speech with auto language detection |
| :white_check_mark: | SM-2 spaced repetition algorithm |
| :white_check_mark: | "Study Now" mode filtering due cards |
| :white_check_mark: | Mastery tracking (Again / Good / Easy) |
| :white_check_mark: | Category, status and difficulty filters |
| :white_check_mark: | CSV and JSON export |
| :white_check_mark: | Dark mode with system detection |
| :white_check_mark: | Local storage persistence |
| :white_check_mark: | Heuristic fallback parser when AI is unavailable |
| :white_check_mark: | Rate limiting on API endpoint |
| :white_check_mark: | Keyboard navigation between cards |
| :white_check_mark: | Responsive design (mobile + desktop) |
| :white_check_mark: | Clean visual design with muted color palette |

---

## License

MIT

---

<p align="center">
  <sub>Built with :blue_heart: by <a href="https://github.com/uxdreaming">uxdreaming</a></sub>
</p>
