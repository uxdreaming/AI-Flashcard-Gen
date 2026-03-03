interface RawFlashcard {
  question: string;
  answer: string;
  category: string;
}

/**
 * Extracts flashcards from text using heuristics.
 * Handles: definitions, bullet lists, numbered lists, headers as categories,
 * key takeaways, markdown tables, and plain paragraph text as last resort.
 */
export function parseFlashcards(text: string): RawFlashcard[] {
  const flashcards: RawFlashcard[] = [];
  const rawLines = text.split("\n");

  let currentCategory = "Concepts";
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i].trim();

    if (!line || line === "```" || line === "---" || line === "|||" || line.match(/^\|[-\s|]+\|$/)) {
      i++;
      continue;
    }

    // Detect category from headers
    const mdHeader = line.match(/^#{1,3}\s+(.+)/);
    if (mdHeader) {
      const h = mdHeader[1].trim();
      if (h.length > 2 && h.length < 60) currentCategory = h;
      i++;
      continue;
    }

    const titleLine = line.match(/^([A-Z][^:]{3,50})(?:\s*[-–—]\s*.+)?$/);
    if (titleLine && !line.includes(":")) {
      currentCategory = titleLine[1].trim();
      i++;
      continue;
    }

    const sectionHeader = line.match(/^([A-Za-z][^:]{3,50}):\s*$/);
    if (sectionHeader) {
      currentCategory = sectionHeader[1].trim();
      i++;
      continue;
    }

    // Pattern: "Key takeaway:" callouts
    const takeawayMatch = line.match(/^[-*]?\s*(?:key\s+)?takeaway:\s*(.+)/i);
    if (takeawayMatch) {
      let answer = takeawayMatch[1].trim();
      if (i + 1 < rawLines.length && rawLines[i + 1].trim().startsWith("(")) {
        answer += " — " + rawLines[i + 1].trim().replace(/[()]/g, "").trim();
        i++;
      }
      flashcards.push({
        question: "What is the key takeaway?",
        answer,
        category: currentCategory,
      });
      i++;
      continue;
    }

    // Pattern: "- Term: definition"
    const bulletDef = line.match(/^[-*]\s+(.+?):\s+(.{10,})$/);
    if (bulletDef) {
      const term = bulletDef[1].trim();
      let answer = bulletDef[2].trim();

      const subItems: string[] = [];
      let j = i + 1;
      while (j < rawLines.length) {
        const nextRaw = rawLines[j];
        if (!nextRaw.trim()) break;
        if (!nextRaw.match(/^\s{2,}[*+-]\s+/)) break;
        subItems.push(nextRaw.trim().replace(/^[*+-]\s+/, "").trim());
        j++;
      }

      if (subItems.length > 0) {
        answer = answer + ". " + subItems.join(". ");
      }

      if (term.length >= 3 && term.length <= 80) {
        flashcards.push({
          question: `What is "${term}"?`,
          answer,
          category: currentCategory,
        });
      }

      i = j;
      continue;
    }

    // Pattern: numbered lists (3+ consecutive items)
    const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    if (numberedMatch) {
      const numberedItems: string[] = [];
      let j = i;
      while (j < rawLines.length && rawLines[j].trim().match(/^\d+[.)]\s+/)) {
        const m = rawLines[j].trim().match(/^\d+[.)]\s+(.+)/);
        if (m) numberedItems.push(m[1].trim());
        j++;
      }

      if (numberedItems.length >= 3) {
        flashcards.push({
          question: `List the ${numberedItems.length} items under "${currentCategory}"`,
          answer: numberedItems.map((item, idx) => `${idx + 1}. ${item}`).join(", "),
          category: currentCategory,
        });
      }

      i = j;
      continue;
    }

    // Pattern: markdown table rows
    const tableMatch = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (tableMatch) {
      const col1 = tableMatch[1].trim();
      const col2 = tableMatch[2].trim();
      if (col1.toLowerCase() !== "front" && col1.toLowerCase() !== "back" &&
          !col1.match(/^[-\s]+$/) && col2.length > 3) {
        flashcards.push({
          question: col1,
          answer: col2,
          category: currentCategory,
        });
      }
      i++;
      continue;
    }

    i++;
  }

  // FALLBACK: if structured parsing found very few cards, extract from paragraphs
  if (flashcards.length < 3) {
    const paragraphCards = extractFromParagraphs(text);
    flashcards.push(...paragraphCards);
  }

  return flashcards;
}

/**
 * Last-resort extraction: splits text into meaningful paragraphs
 * and generates Q&A from sentences.
 */
function extractFromParagraphs(text: string): RawFlashcard[] {
  const cards: RawFlashcard[] = [];

  // Clean up the text
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Split into paragraphs (2+ newlines or significant breaks)
  const paragraphs = cleaned
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 40 && /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(p));

  // Try to detect a category from the first few lines
  let category = "Concepts";
  const firstLines = cleaned.split("\n").slice(0, 5);
  for (const line of firstLines) {
    const trimmed = line.trim();
    if (trimmed.length > 3 && trimmed.length < 60 && !trimmed.includes(".")) {
      category = trimmed;
      break;
    }
  }

  // Generate cards from paragraphs
  for (const para of paragraphs.slice(0, 20)) {
    // Split paragraph into sentences
    const sentences = para
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.length > 15);

    if (sentences.length === 0) continue;

    // Strategy 1: first sentence as question context, rest as answer
    if (sentences.length >= 2) {
      const firstSentence = sentences[0].replace(/[.!?]$/, "");
      const restSentences = sentences.slice(1).join(" ");

      // Try to form a "What" question from the first sentence
      let question: string;
      if (firstSentence.length < 100) {
        question = `What can you tell about: ${firstSentence}?`;
      } else {
        // Use first meaningful phrase
        const shortPhrase = firstSentence.slice(0, 60).replace(/\s\S*$/, "");
        question = `Explain: ${shortPhrase}...`;
      }

      if (restSentences.length > 10) {
        cards.push({
          question,
          answer: restSentences.slice(0, 300),
          category,
        });
      }
    }

    // Strategy 2: if paragraph is a single long sentence, make it an "explain" card
    if (sentences.length === 1 && sentences[0].length > 50) {
      const sentence = sentences[0];
      // Find key terms (capitalized words that aren't sentence starters)
      const keyTerms = sentence.match(/(?<=\s)[A-Z][a-z]{3,}/g);
      if (keyTerms && keyTerms.length > 0) {
        cards.push({
          question: `What is ${keyTerms[0]}?`,
          answer: sentence.slice(0, 300),
          category,
        });
      }
    }

    if (cards.length >= 15) break;
  }

  return cards;
}
