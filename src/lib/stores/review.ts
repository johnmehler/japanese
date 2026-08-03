import {
    getDueCards,
    getNewCards,
    insertSessionLog,
    upsertReviewState,
} from '$lib/db/client';
import type { CardWithReviewState } from '$lib/db/schema';
import type { Quality } from '$lib/srs/sm2';
import { createInitialState, sm2 } from '$lib/srs/sm2';
import { nowISO } from '$lib/utils/date';
import { shuffle } from '$lib/utils/shuffle';
import { writable } from 'svelte';
import { get } from 'svelte/store';
import { settings } from './settings';

function uuid(): string {
  return crypto.randomUUID();
}

export const cards = writable<CardWithReviewState[]>([]);
export const currentIndex = writable(0);
export const revealed = writable(false);
export const reviewedCount = writable(0);
export const correctCount = writable(0);
export const startTime = writable<number | null>(null);
export const isComplete = writable(false);

export function getStreak(): number {
  // This will be implemented in the stats hook
  return 0;
}

export async function loadSession(deckId: string) {
  const s = get(settings);
  const dueCards = getDueCards(deckId, 50);
  const newCards = getNewCards(deckId, s.dailyNewCardLimit);

  let sessionCards = [...dueCards, ...newCards];

  if (s.reviewOrder === 'mixed') {
    sessionCards = shuffle(sessionCards);
  } else if (s.reviewOrder === 'newFirst') {
    sessionCards = [...newCards, ...dueCards];
  }

  cards.set(sessionCards);
  currentIndex.set(0);
  revealed.set(false);
  reviewedCount.set(0);
  correctCount.set(0);
  startTime.set(Date.now());
  isComplete.set(false);
}

export function reveal() {
  revealed.set(true);
}

export async function gradeCard(cardId: string, quality: Quality, deckId: string) {
  const currentCards = get(cards);
  const card = currentCards.find((c) => c.id === cardId);
  if (!card) return;

  const prevState = card.reviewState
    ? {
        easinessFactor: card.reviewState.easinessFactor,
        interval: card.reviewState.interval,
        repetitions: card.reviewState.repetitions,
        nextReviewDate: card.reviewState.nextReviewDate,
        lastReviewDate: card.reviewState.lastReviewDate,
        totalReviews: card.reviewState.totalReviews,
        correctReviews: card.reviewState.correctReviews,
      }
    : createInitialState();

  const newState = sm2(prevState, quality);

  upsertReviewState({
    id: card.reviewState?.id ?? uuid(),
    cardId,
    ...newState,
  });

  reviewedCount.update((n) => n + 1);
  if (quality >= 3) correctCount.update((n) => n + 1);

  const idx = get(currentIndex);
  if (idx + 1 >= currentCards.length) {
    const durationSec = startTime() ? Math.round((Date.now() - (startTime() as number)) / 1000) : 0;
    insertSessionLog({
      id: uuid(),
      deckId,
      date: nowISO(),
      cardsReviewed: get(reviewedCount),
      correctCount: get(correctCount),
      durationSec,
    });
    isComplete.set(true);
  } else {
    currentIndex.set(idx + 1);
    revealed.set(false);
  }
}

export function reset() {
  cards.set([]);
  currentIndex.set(0);
  revealed.set(false);
  reviewedCount.set(0);
  correctCount.set(0);
  startTime.set(null);
  isComplete.set(false);
}
