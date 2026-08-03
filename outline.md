# Nihongo — Spaced Repetition Japanese Learning App

## Overview

A mobile-first spaced repetition (SRS) app for learning Japanese writing systems (hiragana, katakana, kanji) and JLPT N5/N4 vocabulary. Built with Expo (React Native) for cross-platform iOS/Android support.

---

## Tech Stack

- **Framework:** Expo SDK 52+ (React Native)
- **Language:** TypeScript
- **Styling:** Tailwind CSS via NativeWind
- **Navigation:** Expo Router (file-based)
- **State Management:** Zustand
- **Persistence:** SQLite (expo-sqlite) for local storage, no backend required
- **SRS Algorithm:** SM-2 (SuperMemo 2)
- **UI Components:** Custom components + Lucide icons (react-native-vector-icons)
- **Fonts:** Japanese-capable font (e.g., Noto Sans JP)

---

## SRS Algorithm (SM-2)

Each card has:
- `easinessFactor` (EF) — starts at 2.5, minimum 1.3
- `interval` — days until next review (starts at 0)
- `repetitions` — consecutive correct streak (starts at 0)
- `nextReviewDate` — scheduled review date

### Quality Grades (user response per card)

| Grade | Meaning        | Description                        |
|-------|----------------|------------------------------------|
| 0     | Again          | Complete blackout                  |
| 1     | Hard           | Correct but serious difficulty     |
| 2     | Hard           | Correct but with effort            |
| 3     | Good           | Correct with some hesitation       |
| 4     | Easy           | Perfect, instant recall            |
| 5     | Perfect        | Perfect, trivially easy            |

### Algorithm Logic

```
if quality < 3:
    repetitions = 0
    interval = 1
else:
    repetitions += 1
    if repetitions == 1: interval = 1
    elif repetitions == 2: interval = 6
    else: interval = round(interval * EF)

EF = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
EF = max(1.3, EF)

nextReviewDate = today + interval days
```

---

## Data Model

### Deck

| Field       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| id          | string | UUID                                 |
| name        | string | e.g., "Hiragana", "JLPT N5 Vocab"   |
| description | string | Optional deck description            |
| category    | enum   | `hiragana` \| `katakana` \| `kanji` \| `vocab` |
| level       | enum   | `n5` \| `n4` \| `none`               |
| cardCount   | number | Derived count                        |

### Card

| Field           | Type    | Description                              |
|-----------------|---------|------------------------------------------|
| id              | string  | UUID                                     |
| deckId          | string  | FK → Deck                                |
| front           | string  | Prompt (e.g., kana, kanji, or English)   |
| back            | string  | Answer (e.g., romaji, reading, or Japanese) |
| reading         | string  | Optional furigana/reading                |
| example         | string  | Optional example sentence                |
| exampleReading  | string  | Optional reading of example              |
| exampleMeaning  | string  | Optional English translation of example  |

### ReviewState (per card)

| Field             | Type     | Description                        |
|-------------------|----------|------------------------------------|
| id                | string   | UUID                               |
| cardId            | string   | FK → Card                          |
| easinessFactor    | number   | SM-2 EF (default 2.5)              |
| interval          | number   | Days until next review             |
| repetitions       | number   | Consecutive correct count          |
| nextReviewDate    | ISO date | Scheduled review date              |
| lastReviewDate    | ISO date | Last reviewed date                 |
| totalReviews      | number   | Lifetime review count              |
| correctReviews    | number   | Lifetime correct count             |

### SessionLog

| Field        | Type   | Description                        |
|--------------|--------|------------------------------------|
| id           | string | UUID                               |
| deckId       | string | FK → Deck                          |
| date         | ISO    | Session start time                 |
| cardsReviewed| number | Cards in session                   |
| correctCount | number | Quality >= 3 count                 |
| durationSec  | number | Session duration                   |

---

## App Screens (Expo Router)

```
app/
├── _layout.tsx              # Root layout, font loading, theme provider
├── index.tsx                # Home / dashboard
├── deck/
│   ├── index.tsx            # Deck list (all decks)
│   ├── [deckId].tsx         # Deck detail (stats, start review button)
│   └── review/[deckId].tsx  # Review session (card flip + grade buttons)
├── stats/
│   └── index.tsx            # Statistics & charts
└── settings/
    └── index.tsx            # Preferences (theme, daily goal, etc.)
```

### Screen Descriptions

1. **Home/Dashboard** — Today's review count across all decks, quick-start button, streak counter, daily progress bar
2. **Deck List** — Grid of decks grouped by category (kana, kanji, vocab), each showing due card count
3. **Deck Detail** — Deck stats (mastery %, cards due, new cards remaining), start review button, card browser
4. **Review Session** — Card front → tap to reveal back → grade buttons (Again / Hard / Good / Easy), progress indicator, session summary on completion
5. **Stats** — Review heatmap (calendar), accuracy over time, per-deck breakdown, streak info
6. **Settings** — Theme toggle, daily new card limit, review order preference, reset progress, export/import data

---

## Project Structure

```
nihongo/
├── app/                        # Expo Router screens
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── Card.tsx            # Flashcard flip component
│   │   ├── GradeButtons.tsx    # SRS quality grade buttons
│   │   ├── DeckCard.tsx        # Deck list item
│   │   ├── ProgressRing.tsx    # Circular progress indicator
│   │   └── StreakBadge.tsx     # Streak display
│   ├── db/
│   │   ├── schema.ts           # SQLite table definitions
│   │   ├── migrations.ts       # Schema versioning
│   │   └── client.ts           # SQLite connection wrapper
│   ├── srs/
│   │   └── sm2.ts              # SM-2 algorithm implementation
│   ├── store/
│   │   ├── deckStore.ts        # Zustand store for decks
│   │   ├── reviewStore.ts      # Zustand store for review sessions
│   │   └── settingsStore.ts    # Zustand store for app settings
│   ├── data/
│   │   ├── hiragana.ts         # Hiragana deck seed data
│   │   ├── katakana.ts         # Katakana deck seed data
│   │   ├── kanjiN5.ts          # N5 kanji seed data
│   │   ├── kanjiN4.ts          # N4 kanji seed data
│   │   ├── vocabN5.ts          # N5 vocabulary seed data
│   │   └── vocabN4.ts          # N4 vocabulary seed data
│   ├── hooks/
│   │   ├── useReviewSession.ts # Manages a review session lifecycle
│   │   ├── useDueCards.ts      # Fetches cards due for review
│   │   └── useStreak.ts        # Tracks daily streak
│   ├── utils/
│   │   ├── date.ts             # Date helpers
│   │   └── shuffle.ts          # Array shuffle utility
│   └── theme/
│       ├── colors.ts           # Color palette
│       └── typography.ts       # Font sizes & styles
├── assets/                     # Images, fonts
├── app.json                    # Expo config
├── package.json
└── tsconfig.json
```

---

## Seed Data Scope

### Hiragana (46 cards)
- All 46 basic hiragana (あ → ん)
- Front: hiragana character → Back: romaji

### Katakana (46 cards)
- All 46 basic katakana (ア → ン)
- Front: katakana character → Back: romaji

### Kanji N5 (~100 cards)
- JLPT N5 kanji set
- Front: kanji → Back: meaning(s) + on'yomi/kun'yomi readings

### Kanji N4 (~180 cards)
- JLPT N4 kanji set
- Front: kanji → Back: meaning(s) + on'yomi/kun'yomi readings

### Vocabulary N5 (~800 cards)
- JLPT N5 vocabulary
- Front: Japanese word (kanji + furigana) → Back: English meaning + reading

### Vocabulary N4 (~1,500 cards)
- JLPT N4 vocabulary
- Front: Japanese word (kanji + furigana) → Back: English meaning + reading

---

## Key Features

### Core
- **Spaced repetition review** with SM-2 algorithm
- **Card flip animation** — tap to reveal answer
- **Due card scheduling** — only shows cards due for review today
- **New card introduction** — configurable daily limit for new cards
- **Streak tracking** — consecutive days with at least one review
- **Offline-first** — all data stored locally in SQLite

### UX
- **Dark/light theme** toggle
- **Haptic feedback** on card flip and grade selection
- **Swipe gestures** — swipe left = Again, swipe right = Easy (optional)
- **Progress indicators** — session progress bar, daily goal ring
- **Session summary** — accuracy, time spent, cards reviewed

### Statistics
- **Review heatmap** — GitHub-style calendar of review activity
- **Accuracy trend** — line chart of accuracy over time
- **Per-deck mastery** — percentage of cards with interval > 21 days
- **Retention rate** — overall correct rate

---

## Implementation Phases

### Phase 1 — Foundation
- Expo project setup, TypeScript, NativeWind, fonts
- SQLite schema + migrations
- SM-2 algorithm implementation
- Seed data for hiragana + katakana

### Phase 2 — Core Review Loop
- Home/dashboard screen
- Deck list screen
- Deck detail screen
- Review session screen (card flip + grade buttons)
- Session summary

### Phase 3 — Full Content
- Seed data for N5/N4 kanji
- Seed data for N5/N4 vocabulary
- New card introduction logic + daily limits

### Phase 4 — Stats & Polish
- Statistics screen (heatmap, charts)
- Streak tracking
- Settings screen
- Dark/light theme
- Haptic feedback
- Session animations & transitions

### Phase 5 — Enhancements
- Import/export progress backup
- Custom deck creation
- Audio pronunciation (expo-av)
- Furigana rendering support
- Widget/notifications for daily reminders
