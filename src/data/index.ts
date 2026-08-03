import type { SeedDeck } from '@/db/schema';
import { hiraganaDeck } from './hiragana';
import { katakanaDeck } from './katakana';
import { kanjiN5Deck } from './kanjiN5';
import { kanjiN4Deck } from './kanjiN4';
import { vocabN5Deck } from './vocabN5';
import { vocabN4Deck } from './vocabN4';

export const allSeeds: SeedDeck[] = [
  hiraganaDeck,
  katakanaDeck,
  kanjiN5Deck,
  kanjiN4Deck,
  vocabN5Deck,
  vocabN4Deck,
];
