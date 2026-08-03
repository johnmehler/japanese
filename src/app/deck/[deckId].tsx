import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProgressRing } from '@/components/ProgressRing';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getDeckStats, getCardsForDeck, resetDeckProgress } from '@/db/client';
import type { DeckWithStats, CardWithReviewState } from '@/db/schema';

export default function DeckDetailScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [deck, setDeck] = useState<DeckWithStats | null>(null);
  const [cards, setCards] = useState<CardWithReviewState[]>([]);

  useEffect(() => {
    (async () => {
      const stats = await getDeckStats(db, deckId);
      setDeck(stats);
      const allCards = await getCardsForDeck(db, deckId);
      setCards(allCards);
    })();
  }, [db, deckId]);

  if (!deck) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  const totalDue = deck.dueCount + deck.newCount;

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.three }]}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>{deck.name}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.description}>{deck.description}</ThemedText>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ProgressRing progress={deck.masteryPercent / 100} size={72} />
            <ThemedText themeColor="textSecondary" style={styles.statLabel}>Mastery</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: theme.danger }]}>{deck.dueCount}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.statLabel}>Due</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: theme.warning }]}>{deck.newCount}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.statLabel}>New</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: theme.text }]}>{deck.cardCount}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.statLabel}>Total</ThemedText>
          </View>
        </View>

        {totalDue > 0 && (
          <Pressable onPress={() => router.push(`/deck/review/${deckId}`)}>
            {({ pressed }) => (
              <ThemedView style={[styles.startButton, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
                <ThemedText style={styles.startButtonText}>Start Review</ThemedText>
                <ThemedText style={styles.startButtonSubtext}>{totalDue} cards ready</ThemedText>
              </ThemedView>
            )}
          </Pressable>
        )}

        {totalDue === 0 && (
          <ThemedView type="backgroundElement" style={styles.allDone}>
            <ThemedText style={styles.allDoneText}>All caught up! Come back later.</ThemedText>
          </ThemedView>
        )}

        <View style={styles.cardBrowser}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Cards ({cards.length})</ThemedText>
          {cards.slice(0, 50).map((card) => (
            <ThemedView key={card.id} type="card" style={[styles.cardRow, { borderColor: theme.cardBorder }]}>
              <ThemedText style={styles.cardFront}>{card.front}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.cardBack}>{card.back}</ThemedText>
              {card.reviewState && (
                <View style={styles.cardStatus}>
                  <ThemedText themeColor="textSecondary" style={styles.cardStatusText}>
                    {card.reviewState.interval}d · EF {card.reviewState.easinessFactor.toFixed(1)}
                  </ThemedText>
                </View>
              )}
            </ThemedView>
          ))}
          {cards.length > 50 && (
            <ThemedText themeColor="textSecondary" style={styles.moreCards}>
              +{cards.length - 50} more cards...
            </ThemedText>
          )}
        </View>

        <Pressable onPress={async () => {
          await resetDeckProgress(db, deckId);
          const stats = await getDeckStats(db, deckId);
          setDeck(stats);
          const allCards = await getCardsForDeck(db, deckId);
          setCards(allCards);
        }}>
          {({ pressed }) => (
            <ThemedView type="backgroundElement" style={[styles.resetButton, pressed && styles.pressed]}>
              <ThemedText themeColor="textSecondary" style={styles.resetText}>Reset deck progress</ThemedText>
            </ThemedView>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  description: {
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: Spacing.two,
  },
  statCard: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
  },
  startButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    gap: Spacing.one,
    width: '100%',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  startButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  allDone: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    width: '100%',
  },
  allDoneText: {
    fontSize: 16,
  },
  cardBrowser: {
    gap: Spacing.two,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.three,
  },
  cardFront: {
    fontSize: 20,
    fontWeight: '500' as const,
    minWidth: 60,
  },
  cardBack: {
    fontSize: 14,
    flex: 1,
  },
  cardStatus: {
    alignItems: 'flex-end',
  },
  cardStatusText: {
    fontSize: 11,
  },
  moreCards: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  resetButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    width: '100%',
  },
  resetText: {
    fontSize: 14,
  },
});
