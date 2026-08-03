import { useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { DeckCard } from '@/components/DeckCard';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDeckStore } from '@/store/deckStore';
import type { DeckCategory } from '@/db/schema';

const CATEGORY_LABELS: Record<DeckCategory, string> = {
  hiragana: 'Kana',
  katakana: 'Kana',
  kanji: 'Kanji',
  vocab: 'Vocabulary',
};

export default function DeckListScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { decks, deckStats, refreshDecks, refreshStats } = useDeckStore();

  useEffect(() => {
    (async () => {
      await refreshDecks(db);
      await refreshStats(db);
    })();
  }, [db, refreshDecks, refreshStats]);

  const decksWithStats = decks.map((d) => deckStats[d.id]).filter(Boolean);

  const grouped: Record<string, typeof decksWithStats> = {};
  for (const deck of decksWithStats) {
    const label = CATEGORY_LABELS[deck.category];
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(deck);
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.three }]}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Decks</ThemedText>

        {Object.entries(grouped).map(([label, decks]) => (
          <View key={label} style={styles.group}>
            <ThemedText type="subtitle" style={styles.groupTitle}>{label}</ThemedText>
            <View style={styles.deckList}>
              {decks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  group: {
    gap: Spacing.two,
    width: '100%',
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  deckList: {
    gap: Spacing.two,
    width: '100%',
  },
});
