import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getDueCards, getNewCards, insertSessionLog, upsertReviewState } from '@/db/client';
import type { CardWithReviewState, SessionLog } from '@/db/schema';
import { createInitialState, sm2, type Quality, type SM2State } from '@/srs/sm2';
import { useReviewStore } from '@/store/reviewStore';
import { useSettingsStore } from '@/store/settingsStore';
import { nowISO } from '@/utils/date';
import { shuffle } from '@/utils/shuffle';

export function useReviewSession(deckId: string) {
  const db = useSQLiteContext();
  const { dailyNewCardLimit, reviewOrder, hapticFeedback } = useSettingsStore();
  const reviewStore = useReviewStore();

  const loadSession = useCallback(async () => {
    const dueCards = await getDueCards(db, deckId, 100);
    const newCards = await getNewCards(db, deckId, dailyNewCardLimit);

    let cards: CardWithReviewState[];
    if (reviewOrder === 'dueFirst') {
      cards = [...dueCards, ...newCards];
    } else if (reviewOrder === 'newFirst') {
      cards = [...newCards, ...dueCards];
    } else {
      cards = shuffle([...dueCards, ...newCards]);
    }

    reviewStore.setCards(cards, deckId);
  }, [db, deckId, dailyNewCardLimit, reviewOrder, reviewStore]);

  const gradeCard = useCallback(
    async (cardId: string, quality: Quality) => {
      const card = reviewStore.cards[reviewStore.currentIndex];
      if (!card || card.id !== cardId) return;

      if (hapticFeedback) {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }

      const prevState: SM2State = card.reviewState
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
      const reviewStateRecord = {
        ...newState,
        id: card.reviewState?.id ?? `rs-${cardId}`,
        cardId,
      };

      await upsertReviewState(db, reviewStateRecord);
      reviewStore.recordGrade(cardId, quality);

      if (reviewStore.currentIndex + 1 >= reviewStore.cards.length) {
        const sessionLog: SessionLog = {
          id: `session-${Date.now()}`,
          deckId,
          date: nowISO(),
          cardsReviewed: reviewStore.reviewedCount + 1,
          correctCount: reviewStore.correctCount + (quality >= 3 ? 1 : 0),
          durationSec: Math.round((Date.now() - (reviewStore.startTime ?? Date.now())) / 1000),
        };
        await insertSessionLog(db, sessionLog);
      }

      reviewStore.nextCard();
    },
    [db, deckId, hapticFeedback, reviewStore]
  );

  return {
    cards: reviewStore.cards,
    currentIndex: reviewStore.currentIndex,
    revealed: reviewStore.revealed,
    reviewedCount: reviewStore.reviewedCount,
    correctCount: reviewStore.correctCount,
    startTime: reviewStore.startTime,
    isComplete: reviewStore.currentIndex >= reviewStore.cards.length,
    currentCard: reviewStore.cards[reviewStore.currentIndex],
    loadSession,
    gradeCard,
    reveal: reviewStore.reveal,
    hide: reviewStore.hide,
    reset: reviewStore.reset,
  };
}
