import { useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import type { CardWithReviewState } from '@/db/schema';
import { getDueCards, getNewCards } from '@/db/client';
import { useSettingsStore } from '@/store/settingsStore';
import { shuffle } from '@/utils/shuffle';

export function useDueCards(deckId: string) {
  const db = useSQLiteContext();
  const { dailyNewCardLimit, reviewOrder } = useSettingsStore();

  const fetchCards = useCallback(async (): Promise<CardWithReviewState[]> => {
    const dueCards = await getDueCards(db, deckId, 100);
    const newCards = await getNewCards(db, deckId, dailyNewCardLimit);

    if (reviewOrder === 'dueFirst') {
      return [...dueCards, ...newCards];
    } else if (reviewOrder === 'newFirst') {
      return [...newCards, ...dueCards];
    } else {
      return shuffle([...dueCards, ...newCards]);
    }
  }, [db, deckId, dailyNewCardLimit, reviewOrder]);

  return { fetchCards };
}
