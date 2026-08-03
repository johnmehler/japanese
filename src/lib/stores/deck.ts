import { writable } from 'svelte';
import type { DeckWithStats } from '$lib/db/schema';
import {
  getAllDecks,
  getDeckStats,
  getAllDueCardsCount,
  getAllNewCardsCount,
  getTodayReviewCount,
} from '$lib/db/client';

export const decks = writable<DeckWithStats[]>([]);
export const totalDue = writable(0);
export const totalNew = writable(0);
export const todayReviewed = writable(0);
export const dbReady = writable(false);

export async function refreshDecks() {
  const allDecks = getAllDecks();
  const decksWithStats = allDecks.map((d) => getDeckStats(d.id)).filter(Boolean) as DeckWithStats[];
  decks.set(decksWithStats);
}

export async function refreshGlobalStats() {
  totalDue.set(getAllDueCardsCount());
  totalNew.set(getAllNewCardsCount());
  todayReviewed.set(getTodayReviewCount());
}

export async function refreshAll() {
  await refreshDecks();
  await refreshGlobalStats();
  dbReady.set(true);
}
