import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Deck, DeckWithStats } from '@/db/schema';
import {
  getAllDecks,
  getDeckStats,
  getAllDueCardsCount,
  getAllNewCardsCount,
} from '@/db/client';

interface DeckState {
  decks: Deck[];
  deckStats: Record<string, DeckWithStats>;
  totalDue: number;
  totalNew: number;
  loading: boolean;
  refreshDecks: (db: SQLiteDatabase) => Promise<void>;
  refreshStats: (db: SQLiteDatabase) => Promise<void>;
  getDeck: (deckId: string) => Deck | undefined;
}

export const useDeckStore = create<DeckState>((set, get) => ({
  decks: [],
  deckStats: {},
  totalDue: 0,
  totalNew: 0,
  loading: false,
  refreshDecks: async (db) => {
    const decks = await getAllDecks(db);
    set({ decks });
  },
  refreshStats: async (db) => {
    const { decks } = get();
    const deckStats: Record<string, DeckWithStats> = {};
    for (const deck of decks) {
      const stats = await getDeckStats(db, deck.id);
      if (stats) deckStats[deck.id] = stats;
    }
    const totalDue = await getAllDueCardsCount(db);
    const totalNew = await getAllNewCardsCount(db);
    set({ deckStats, totalDue, totalNew });
  },
  getDeck: (deckId) => get().decks.find((d) => d.id === deckId),
}));
