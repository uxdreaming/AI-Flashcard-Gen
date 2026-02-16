# AI Flashcard Generator

Smart flashcard generator optimized for spaced repetition from PDF/text documents. Built for anyone who studies — whether you're a student, a professional learning new skills, or a curious mind exploring new topics. Drop your material, get study-ready flashcards.

## Idea

Upload a PDF (notes, papers, documentation) and the system will:
1. Extract key concepts from the document
2. Generate question/answer pairs as flashcards
3. Optimize flashcards for retention using spaced repetition principles
4. Export in formats compatible with Anki and other apps

## Use cases

| Scenario | Input | Output |
|----------|-------|--------|
| Preparing a biology exam | 40-page chapter PDF | 50 flashcards with concepts, definitions and relationships |
| Learning English vocabulary | Article from The Guardian | Cards with words in context, meaning and usage examples |
| Studying for AWS certification | Official documentation PDF | Flashcards per service with exam-style questions |
| Reviewing a research paper | Paper from arxiv | Cards with hypothesis, methodology, key findings and limitations |

## Roadmap

### Phase 1 - MVP
- [ ] Text extraction from PDF
- [ ] Prompt engineering to generate flashcards from text
- [ ] Basic JSON/CSV output
- [ ] End-to-end working script

### Phase 2 - UI & Improvements
- [ ] Interface for file uploads
- [ ] Difficulty and flashcard count selector
- [ ] Flashcard preview before export
- [ ] Anki export format (.apkg)

### Phase 3 - Intelligence
- [ ] Automatic topic and subtopic detection
- [ ] Flashcard generation with visual context (diagrams, tables)
- [ ] Quiz mode with multiple choice questions
- [ ] Difficulty analysis per concept

## Structure

```
AI-Flashcard-Generator/
├── src/           # Source code
├── data/          # Test PDFs and generated outputs
├── docs/          # Project documentation
└── README.md
```
