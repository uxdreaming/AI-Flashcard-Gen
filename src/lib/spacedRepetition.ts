/**
 * Simplified SM-2 spaced repetition algorithm.
 * quality: 0-5 scale (0-2 = fail/reset, 3-5 = pass/increase interval)
 */

export interface SM2Result {
  nextReview: number;
  interval: number;
  easeFactor: number;
  reviewCount: number;
}

export function calculateNextReview(
  quality: 0 | 1 | 2 | 3 | 4 | 5,
  currentInterval: number,
  currentEaseFactor: number,
  currentReviewCount: number
): SM2Result {
  let interval = currentInterval;
  let easeFactor = currentEaseFactor;
  let reviewCount = currentReviewCount;

  if (quality < 3) {
    // Failed — reset interval
    interval = 1;
    reviewCount = 0;
  } else {
    // Passed — increase interval
    reviewCount += 1;
    if (reviewCount === 1) {
      interval = 1;
    } else if (reviewCount === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Update ease factor (minimum 1.3)
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const now = Date.now();
  const nextReview = now + interval * 24 * 60 * 60 * 1000; // interval in days

  return { nextReview, interval, easeFactor, reviewCount };
}

export function getCardsForReview(cards: { nextReview?: number }[]): number[] {
  const now = Date.now();
  const indices: number[] = [];
  cards.forEach((card, i) => {
    if (!card.nextReview || card.nextReview <= now) {
      indices.push(i);
    }
  });
  // Sort by most overdue first
  indices.sort((a, b) => {
    const aReview = cards[a].nextReview || 0;
    const bReview = cards[b].nextReview || 0;
    return aReview - bReview;
  });
  return indices;
}

export function getNextReviewText(nextReview: number): string {
  const now = Date.now();
  const diff = nextReview - now;
  if (diff <= 0) return "Due now";
  const hours = Math.ceil(diff / (1000 * 60 * 60));
  if (hours < 24) return `in ${hours}h`;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `in ${days}d`;
}
