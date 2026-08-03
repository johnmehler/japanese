export type DeckCategory = 'hiragana' | 'katakana' | 'kanji' | 'vocab';
export type DeckLevel = 'n5' | 'n4' | 'none';

export interface Deck {
  id: string;
  name: string;
  description: string;
  category: DeckCategory;
  level: DeckLevel;
  cardCount: number;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  reading: string | null;
  example: string | null;
  exampleReading: string | null;
  exampleMeaning: string | null;
}

export interface ReviewState {
  id: string;
  cardId: string;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  totalReviews: number;
  correctReviews: number;
}

export interface SessionLog {
  id: string;
  deckId: string;
  date: string;
  cardsReviewed: number;
  correctCount: number;
  durationSec: number;
}

export interface DeckWithStats extends Deck {
  dueCount: number;
  newCount: number;
  masteryPercent: number;
  totalReviews: number;
}

export interface CardWithReviewState extends Card {
  reviewState: ReviewState | null;
}

export interface SeedDeck {
  id: string;
  name: string;
  description: string;
  category: DeckCategory;
  level: DeckLevel;
  cards: SeedCard[];
}

export interface SeedCard {
  front: string;
  back: string;
  reading?: string;
  example?: string;
  exampleReading?: string;
  exampleMeaning?: string;
}
