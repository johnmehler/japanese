import { todayISO } from '$lib/utils/date';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import type {
    Card,
    CardWithReviewState,
    Deck,
    DeckWithStats,
    ReviewState,
    SeedDeck,
    SessionLog,
} from './schema';

let db: Database | null = null;
let SQL: SqlJsStatic | null = null;

const DB_NAME = 'nihongo-db';
const STORE_NAME = 'sqlite';
const IDB_NAME = 'nihongo-srs';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  const idb = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(DB_NAME);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  const idb = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, DB_NAME);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (db) {
      await saveToIndexedDB(db.export());
    }
  }, 500);
}

async function migrateDb(database: Database): Promise<void> {
  database.run(`
    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'none'
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      deckId TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      reading TEXT,
      example TEXT,
      exampleReading TEXT,
      exampleMeaning TEXT,
      FOREIGN KEY (deckId) REFERENCES decks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS review_states (
      id TEXT PRIMARY KEY NOT NULL,
      cardId TEXT NOT NULL UNIQUE,
      easinessFactor REAL NOT NULL DEFAULT 2.5,
      interval INTEGER NOT NULL DEFAULT 0,
      repetitions INTEGER NOT NULL DEFAULT 0,
      nextReviewDate TEXT NOT NULL,
      lastReviewDate TEXT,
      totalReviews INTEGER NOT NULL DEFAULT 0,
      correctReviews INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (cardId) REFERENCES cards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_logs (
      id TEXT PRIMARY KEY NOT NULL,
      deckId TEXT NOT NULL,
      date TEXT NOT NULL,
      cardsReviewed INTEGER NOT NULL DEFAULT 0,
      correctCount INTEGER NOT NULL DEFAULT 0,
      durationSec INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (deckId) REFERENCES decks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_cards_deckId ON cards(deckId);
    CREATE INDEX IF NOT EXISTS idx_review_states_cardId ON review_states(cardId);
    CREATE INDEX IF NOT EXISTS idx_review_states_nextReviewDate ON review_states(nextReviewDate);
    CREATE INDEX IF NOT EXISTS idx_session_logs_deckId ON session_logs(deckId);
    CREATE INDEX IF NOT EXISTS idx_session_logs_date ON session_logs(date);
  `);
}

async function seedDbIfNeeded(database: Database, seeds: SeedDeck[]): Promise<void> {
  for (const deck of seeds) {
    const result = database.exec(`SELECT id FROM decks WHERE id = '${deck.id}'`);
    if (result.length > 0) continue;

    database.run(
      'INSERT INTO decks (id, name, description, category, level) VALUES (?, ?, ?, ?, ?)',
      [deck.id, deck.name, deck.description, deck.category, deck.level]
    );

    for (const card of deck.cards) {
      const cardId = `${deck.id}-${card.front}`;
      database.run(
        'INSERT INTO cards (id, deckId, front, back, reading, example, exampleReading, exampleMeaning) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [cardId, deck.id, card.front, card.back, card.reading ?? null, card.example ?? null, card.exampleReading ?? null, card.exampleMeaning ?? null]
      );
    }
  }
}

export async function initDb(): Promise<Database> {
  if (db) return db;

  SQL = await initSqlJs({
    locateFile: (file: string) => `/sql-wasm/${file}`,
  });

  const savedData = await loadFromIndexedDB();
  db = savedData ? new SQL.Database(savedData) : new SQL.Database();

  await migrateDb(db);
  await seedDbIfNeeded(db, allSeeds);
  scheduleSave();

  return db;
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

export async function persistDb(): Promise<void> {
  if (db) {
    await saveToIndexedDB(db.export());
  }
}

function rowsToObjects<T>(result: { columns: string[]; values: unknown[][] }[]): T[] {
  if (result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}

function exec<T>(sql: string, params?: (string | number | null)[]): T[] {
  const database = getDb();
  if (params) {
    const stmt = database.prepare(sql);
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  } else {
    const result = database.exec(sql);
    return rowsToObjects<T>(result);
  }
}

function execOne<T>(sql: string, params?: (string | number | null)[]): T | null {
  const results = exec<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

function run(sql: string, params?: (string | number | null)[]): void {
  const database = getDb();
  database.run(sql, params);
  scheduleSave();
}

// CRUD functions

export function getAllDecks(): Deck[] {
  return exec<Deck & { cardCount: number }>(
    `SELECT d.*, (SELECT COUNT(*) FROM cards WHERE deckId = d.id) as cardCount FROM decks d ORDER BY d.category, d.level`
  );
}

export function getDeckById(deckId: string): Deck | null {
  return execOne<Deck & { cardCount: number }>(
    `SELECT d.*, (SELECT COUNT(*) FROM cards WHERE deckId = d.id) as cardCount FROM decks d WHERE d.id = ?`,
    [deckId]
  );
}

export function getDeckStats(deckId: string): DeckWithStats | null {
  const deck = getDeckById(deckId);
  if (!deck) return null;

  const today = todayISO();

  const dueResult = execOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM review_states rs JOIN cards c ON rs.cardId = c.id WHERE c.deckId = ? AND rs.nextReviewDate <= ?`,
    [deckId, today]
  );
  const dueCount = dueResult?.count ?? 0;

  const newResult = execOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM cards c WHERE c.deckId = ? AND c.id NOT IN (SELECT cardId FROM review_states)`,
    [deckId]
  );
  const newCount = newResult?.count ?? 0;

  const masteryResult = execOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM review_states rs JOIN cards c ON rs.cardId = c.id WHERE c.deckId = ? AND rs.interval > 21`,
    [deckId]
  );
  const masteryCount = masteryResult?.count ?? 0;

  const totalReviewsResult = execOne<{ total: number }>(
    `SELECT COALESCE(SUM(totalReviews), 0) as total FROM review_states rs JOIN cards c ON rs.cardId = c.id WHERE c.deckId = ?`,
    [deckId]
  );
  const totalReviews = totalReviewsResult?.total ?? 0;

  const masteryPercent = deck.cardCount > 0 ? Math.round((masteryCount / deck.cardCount) * 100) : 0;

  return { ...deck, dueCount, newCount, masteryPercent, totalReviews };
}

export function getDueCards(deckId: string, limit: number = 50): CardWithReviewState[] {
  const today = todayISO();
  const rows = exec<Card & ReviewState>(
    `SELECT c.*, rs.id as rsId, rs.easinessFactor, rs.interval, rs.repetitions, rs.nextReviewDate, rs.lastReviewDate, rs.totalReviews, rs.correctReviews
     FROM cards c
     JOIN review_states rs ON rs.cardId = c.id
     WHERE c.deckId = ? AND rs.nextReviewDate <= ?
     ORDER BY rs.nextReviewDate ASC
     LIMIT ?`,
    [deckId, today, limit]
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

export function getNewCards(deckId: string, limit: number = 20): CardWithReviewState[] {
  const rows = exec<Card>(
    `SELECT c.* FROM cards c
     WHERE c.deckId = ? AND c.id NOT IN (SELECT cardId FROM review_states)
     ORDER BY c.id ASC
     LIMIT ?`,
    [deckId, limit]
  );
  return rows.map((card) => ({ ...card, reviewState: null }));
}

export function getAllDueCardsCount(): number {
  const today = todayISO();
  const result = execOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM review_states WHERE nextReviewDate <= ?`,
    [today]
  );
  return result?.count ?? 0;
}

export function getAllNewCardsCount(): number {
  const result = execOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM cards WHERE id NOT IN (SELECT cardId FROM review_states)`
  );
  return result?.count ?? 0;
}

export function getCardsForDeck(deckId: string): CardWithReviewState[] {
  const rows = exec<Card & ReviewState>(
    `SELECT c.*, rs.id as rsId, rs.easinessFactor, rs.interval, rs.repetitions, rs.nextReviewDate, rs.lastReviewDate, rs.totalReviews, rs.correctReviews
     FROM cards c
     LEFT JOIN review_states rs ON rs.cardId = c.id
     WHERE c.deckId = ?
     ORDER BY c.id ASC`,
    [deckId]
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

export function getTodayReviewCount(): number {
  const today = todayISO();
  const result = execOne<{ count: number }>(
    `SELECT COALESCE(SUM(cardsReviewed), 0) as count FROM session_logs WHERE date >= ?`,
    [today]
  );
  return result?.count ?? 0;
}

export function upsertReviewState(state: ReviewState): void {
  run(
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
    [state.id, state.cardId, state.easinessFactor, state.interval, state.repetitions, state.nextReviewDate, state.lastReviewDate, state.totalReviews, state.correctReviews]
  );
}

export function insertSessionLog(log: SessionLog): void {
  run(
    `INSERT INTO session_logs (id, deckId, date, cardsReviewed, correctCount, durationSec) VALUES (?, ?, ?, ?, ?, ?)`,
    [log.id, log.deckId, log.date, log.cardsReviewed, log.correctCount, log.durationSec]
  );
}

export function getSessionLogs(deckId?: string): SessionLog[] {
  if (deckId) {
    return exec<SessionLog>(
      `SELECT * FROM session_logs WHERE deckId = ? ORDER BY date DESC`,
      [deckId]
    );
  }
  return exec<SessionLog>(`SELECT * FROM session_logs ORDER BY date DESC`);
}

export function getReviewActivityByDay(days: number = 90): { date: string; count: number }[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString().split('T')[0];
  return exec<{ date: string; count: number }>(
    `SELECT DATE(date) as date, SUM(cardsReviewed) as count FROM session_logs WHERE date >= ? GROUP BY DATE(date) ORDER BY date ASC`,
    [cutoffISO]
  );
}

export function getAccuracyByDay(days: number = 30): { date: string; accuracy: number }[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString().split('T')[0];
  return exec<{ date: string; accuracy: number }>(
    `SELECT DATE(date) as date, CASE WHEN SUM(cardsReviewed) > 0 THEN CAST(SUM(correctCount) AS REAL) / SUM(cardsReviewed) ELSE 0 END as accuracy FROM session_logs WHERE date >= ? GROUP BY DATE(date) ORDER BY date ASC`,
    [cutoffISO]
  );
}

export function getOverallStats(): {
  totalReviews: number;
  totalCorrect: number;
  totalCards: number;
  masteredCards: number;
} {
  const reviewStats = execOne<{ total: number; correct: number }>(
    `SELECT COALESCE(SUM(totalReviews), 0) as total, COALESCE(SUM(correctReviews), 0) as correct FROM review_states`
  );
  const cardStats = execOne<{ total: number; mastered: number }>(
    `SELECT COUNT(*) as total, SUM(CASE WHEN interval > 21 THEN 1 ELSE 0 END) as mastered FROM review_states`
  );
  return {
    totalReviews: reviewStats?.total ?? 0,
    totalCorrect: reviewStats?.correct ?? 0,
    totalCards: cardStats?.total ?? 0,
    masteredCards: cardStats?.mastered ?? 0,
  };
}

export function resetAllProgress(): void {
  run(`DELETE FROM review_states`);
  run(`DELETE FROM session_logs`);
}

export function resetDeckProgress(deckId: string): void {
  run(`DELETE FROM review_states WHERE cardId IN (SELECT id FROM cards WHERE deckId = ?)`, [deckId]);
  run(`DELETE FROM session_logs WHERE deckId = ?`, [deckId]);
}
