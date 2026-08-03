import { create } from 'zustand';
import type { CardWithReviewState } from '@/db/schema';
import type { Quality } from '@/srs/sm2';

interface ReviewSessionState {
  cards: CardWithReviewState[];
  currentIndex: number;
  revealed: boolean;
  reviewedCount: number;
  correctCount: number;
  startTime: number | null;
  deckId: string | null;
  sessionResults: { cardId: string; quality: Quality }[];
  setCards: (cards: CardWithReviewState[], deckId: string) => void;
  reveal: () => void;
  hide: () => void;
  nextCard: () => void;
  recordGrade: (cardId: string, quality: Quality) => void;
  reset: () => void;
  isComplete: () => boolean;
}

export const useReviewStore = create<ReviewSessionState>((set, get) => ({
  cards: [],
  currentIndex: 0,
  revealed: false,
  reviewedCount: 0,
  correctCount: 0,
  startTime: null,
  deckId: null,
  sessionResults: [],
  setCards: (cards, deckId) =>
    set({
      cards,
      deckId,
      currentIndex: 0,
      revealed: false,
      reviewedCount: 0,
      correctCount: 0,
      startTime: Date.now(),
      sessionResults: [],
    }),
  reveal: () => set({ revealed: true }),
  hide: () => set({ revealed: false }),
  nextCard: () =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      revealed: false,
    })),
  recordGrade: (cardId, quality) =>
    set((state) => ({
      reviewedCount: state.reviewedCount + 1,
      correctCount: state.correctCount + (quality >= 3 ? 1 : 0),
      sessionResults: [...state.sessionResults, { cardId, quality }],
    })),
  reset: () =>
    set({
      cards: [],
      currentIndex: 0,
      revealed: false,
      reviewedCount: 0,
      correctCount: 0,
      startTime: null,
      deckId: null,
      sessionResults: [],
    }),
  isComplete: () => get().currentIndex >= get().cards.length,
}));
