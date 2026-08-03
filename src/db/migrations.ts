import type { SQLiteDatabase } from 'expo-sqlite';

import { SeedDeck } from './schema';

const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

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
    currentDbVersion = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export async function seedDbIfNeeded(db: SQLiteDatabase, seeds: SeedDeck[]): Promise<void> {
  for (const deck of seeds) {
    const existing = await db.getFirstAsync('SELECT id FROM decks WHERE id = ?', deck.id);
    if (existing) continue;

    await db.runAsync(
      'INSERT INTO decks (id, name, description, category, level) VALUES (?, ?, ?, ?, ?)',
      deck.id,
      deck.name,
      deck.description,
      deck.category,
      deck.level
    );

    for (const card of deck.cards) {
      const cardId = `${deck.id}-${card.front}`;
      await db.runAsync(
        'INSERT INTO cards (id, deckId, front, back, reading, example, exampleReading, exampleMeaning) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        cardId,
        deck.id,
        card.front,
        card.back,
        card.reading ?? null,
        card.example ?? null,
        card.exampleReading ?? null,
        card.exampleMeaning ?? null
      );
    }
  }
}
