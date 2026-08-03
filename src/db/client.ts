import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Card,
  CardWithReviewState,
  Deck,
  DeckWithStats,
  ReviewState,
  SessionLog,
} from './schema';
import { todayISO } from '@/utils/date';

export async function getAllDecks(db: SQLiteDatabase): Promise<Deck[]> {
  const rows = await db.getAllAsync<
    Deck & { cardCount: number }
  >(`SELECT d.*, (SELECT COUNT(*) FROM cards WHERE deckId = d.id) as cardCount FROM decks d ORDER BY d.category, d.level`);
  return rows;
}

export async function getDeckById(db: SQLiteDatabase, deckId: string): Promise<Deck | null> {
  const row = await db.getFirstAsync<
    Deck & { cardCount: number }
  >(`SELECT d.*, (SELECT COUNT(*) FROM cards WHERE deckId = d.id) as cardCount FROM decks d WHERE d.id = ?`, deckId);
  return row ?? null;
}

export async function getDeckStats(db: SQLiteDatabase, deckId: string): Promise<DeckWithStats | null> {
  const deck = await getDeckById(db, deckId);
  if (!deck) return null;

  const today = todayISO();

  const dueResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM review_states rs JOIN cards c ON rs.cardId = c.id WHERE c.deckId = ? AND rs.nextReviewDate <= ?`,
    deckId, today
  );
  const dueCount = dueResult?.count ?? 0;

  const newResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM cards c WHERE c.deckId = ? AND c.id NOT IN (SELECT cardId FROM review_states)`,
    deckId
  );
  const newCount = newResult?.count ?? 0;

  const masteryResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM review_states rs JOIN cards c ON rs.cardId = c.id WHERE c.deckId = ? AND rs.interval > 21`,
    deckId
  );
  const masteryCount = masteryResult?.count ?? 0;

  const totalReviewsResult = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(totalReviews), 0) as total FROM review_states rs JOIN cards c ON rs.cardId = c.id WHERE c.deckId = ?`,
    deckId
  );
  const totalReviews = totalReviewsResult?.total ?? 0;

  const masteryPercent = deck.cardCount > 0 ? Math.round((masteryCount / deck.cardCount) * 100) : 0;

  return { ...deck, dueCount, newCount, masteryPercent, totalReviews };
}

export async function getDueCards(
  db: SQLiteDatabase,
  deckId: string,
  limit: number = 50
): Promise<CardWithReviewState[]> {
  const today = todayISO();
  const rows = await db.getAllAsync<Card & ReviewState>(
    `SELECT c.*, rs.id as rsId, rs.easinessFactor, rs.interval, rs.repetitions, rs.nextReviewDate, rs.lastReviewDate, rs.totalReviews, rs.correctReviews
     FROM cards c
     JOIN review_states rs ON rs.cardId = c.id
     WHERE c.deckId = ? AND rs.nextReviewDate <= ?
     ORDER BY rs.nextReviewDate ASC
     LIMIT ?`,
    deckId, today, limit
  );
  return rows.map((row) => {
    const { rsId, ...cardFields } = row as any;
    return {
      ...cardFields,
      reviewState: {
        id: rsId,
        cardId: cardFields.id,
        easinessFactor: row.easinessFactor,
        interval: row.interval,
        repetitions: row.repetitions,
        nextReviewDate: row.nextReviewDate,
        lastReviewDate: row.lastReviewDate,
        totalReviews: row.totalReviews,
        correctReviews: row.correctReviews,
      },
    } as CardWithReviewState;
  });
}

export async function getNewCards(
  db: SQLiteDatabase,
  deckId: string,
  limit: number = 20
): Promise<CardWithReviewState[]> {
  const rows = await db.getAllAsync<Card>(
    `SELECT c.* FROM cards c
     WHERE c.deckId = ? AND c.id NOT IN (SELECT cardId FROM review_states)
     ORDER BY c.id ASC
     LIMIT ?`,
    deckId, limit
  );
  return rows.map((card) => ({ ...card, reviewState: null }));
}

export async function getAllDueCardsCount(db: SQLiteDatabase): Promise<number> {
  const today = todayISO();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM review_states WHERE nextReviewDate <= ?`,
    today
  );
  return result?.count ?? 0;
}

export async function getAllNewCardsCount(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM cards WHERE id NOT IN (SELECT cardId FROM review_states)`
  );
  return result?.count ?? 0;
}

export async function getCardsForDeck(db: SQLiteDatabase, deckId: string): Promise<CardWithReviewState[]> {
  const rows = await db.getAllAsync<Card & ReviewState>(
    `SELECT c.*, rs.id as rsId, rs.easinessFactor, rs.interval, rs.repetitions, rs.nextReviewDate, rs.lastReviewDate, rs.totalReviews, rs.correctReviews
     FROM cards c
     LEFT JOIN review_states rs ON rs.cardId = c.id
     WHERE c.deckId = ?
     ORDER BY c.id ASC`,
    deckId
  );
  return rows.map((row) => {
    const { rsId, ...cardFields } = row as any;
    return {
      ...cardFields,
      reviewState: rsId
        ? {
            id: rsId,
            cardId: cardFields.id,
            easinessFactor: row.easinessFactor,
            interval: row.interval,
            repetitions: row.repetitions,
            nextReviewDate: row.nextReviewDate,
            lastReviewDate: row.lastReviewDate,
            totalReviews: row.totalReviews,
            correctReviews: row.correctReviews,
          }
        : null,
    } as CardWithReviewState;
  });
}

export async function upsertReviewState(db: SQLiteDatabase, state: ReviewState): Promise<void> {
  await db.runAsync(
    `INSERT INTO review_states (id, cardId, easinessFactor, interval, repetitions, nextReviewDate, lastReviewDate, totalReviews, correctReviews)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(cardId) DO UPDATE SET
       easinessFactor = excluded.easinessFactor,
       interval = excluded.interval,
       repetitions = excluded.repetitions,
       nextReviewDate = excluded.nextReviewDate,
       lastReviewDate = excluded.lastReviewDate,
       totalReviews = excluded.totalReviews,
       correctReviews = excluded.correctReviews`,
    state.id,
    state.cardId,
    state.easinessFactor,
    state.interval,
    state.repetitions,
    state.nextReviewDate,
    state.lastReviewDate,
    state.totalReviews,
    state.correctReviews
  );
}

export async function insertSessionLog(db: SQLiteDatabase, log: SessionLog): Promise<void> {
  await db.runAsync(
    `INSERT INTO session_logs (id, deckId, date, cardsReviewed, correctCount, durationSec) VALUES (?, ?, ?, ?, ?, ?)`,
    log.id, log.deckId, log.date, log.cardsReviewed, log.correctCount, log.durationSec
  );
}

export async function getSessionLogs(db: SQLiteDatabase, deckId?: string): Promise<SessionLog[]> {
  if (deckId) {
    return db.getAllAsync<SessionLog>(
      `SELECT * FROM session_logs WHERE deckId = ? ORDER BY date DESC`,
      deckId
    );
  }
  return db.getAllAsync<SessionLog>(`SELECT * FROM session_logs ORDER BY date DESC`);
}

export async function getReviewActivityByDay(db: SQLiteDatabase, days: number = 365): Promise<{ date: string; count: number }[]> {
  return db.getAllAsync<{ date: string; count: number }>(
    `SELECT DATE(date) as date, SUM(cardsReviewed) as count FROM session_logs WHERE date >= DATE('now', ?) GROUP BY DATE(date) ORDER BY date ASC`,
    `-${days} days`
  );
}

export async function getAccuracyByDay(db: SQLiteDatabase, days: number = 30): Promise<{ date: string; accuracy: number }[]> {
  return db.getAllAsync<{ date: string; accuracy: number }>(
    `SELECT DATE(date) as date, CASE WHEN SUM(cardsReviewed) > 0 THEN CAST(SUM(correctCount) AS REAL) / SUM(cardsReviewed) ELSE 0 END as accuracy FROM session_logs WHERE date >= DATE('now', ?) GROUP BY DATE(date) ORDER BY date ASC`,
    `-${days} days`
  );
}

export async function getOverallStats(db: SQLiteDatabase): Promise<{
  totalReviews: number;
  totalCorrect: number;
  totalCards: number;
  masteredCards: number;
}> {
  const reviewStats = await db.getFirstAsync<{ total: number; correct: number }>(
    `SELECT COALESCE(SUM(totalReviews), 0) as total, COALESCE(SUM(correctReviews), 0) as correct FROM review_states`
  );
  const cardStats = await db.getFirstAsync<{ total: number; mastered: number }>(
    `SELECT COUNT(*) as total, SUM(CASE WHEN interval > 21 THEN 1 ELSE 0 END) as mastered FROM review_states`
  );
  return {
    totalReviews: reviewStats?.total ?? 0,
    totalCorrect: reviewStats?.correct ?? 0,
    totalCards: cardStats?.total ?? 0,
    masteredCards: cardStats?.mastered ?? 0,
  };
}

export async function resetAllProgress(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`DELETE FROM review_states; DELETE FROM session_logs;`);
}

export async function resetDeckProgress(db: SQLiteDatabase, deckId: string): Promise<void> {
  await db.runAsync(
    `DELETE FROM review_states WHERE cardId IN (SELECT id FROM cards WHERE deckId = ?)`,
    deckId
  );
  await db.runAsync(`DELETE FROM session_logs WHERE deckId = ?`, deckId);
}
