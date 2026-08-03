import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Flashcard } from '@/components/Flashcard';
import { GradeButtons } from '@/components/GradeButtons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useReviewSession } from '@/hooks/useReviewSession';
import { useDeckStore } from '@/store/deckStore';
import { formatDuration } from '@/utils/date';

export default function ReviewScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { getDeck } = useDeckStore();
  const {
    cards,
    currentIndex,
    revealed,
    reviewedCount,
    correctCount,
    startTime,
    isComplete,
    currentCard,
    loadSession,
    gradeCard,
    reveal,
    reset,
  } = useReviewSession(deckId);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const deck = getDeck(deckId);

  if (cards.length === 0 && !isComplete) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  if (isComplete) {
    const durationSec = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    const accuracy = reviewedCount > 0 ? Math.round((correctCount / reviewedCount) * 100) : 0;

    return (
      <View style={[styles.completeContainer, { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ThemedText type="title" style={styles.completeTitle}>Session Complete!</ThemedText>

        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <ThemedText style={[styles.summaryValue, { color: theme.primary }]}>{reviewedCount}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.summaryLabel}>Cards Reviewed</ThemedText>
          </View>
          <View style={styles.summaryStat}>
            <ThemedText style={[styles.summaryValue, { color: theme.success }]}>{accuracy}%</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.summaryLabel}>Accuracy</ThemedText>
          </View>
          <View style={styles.summaryStat}>
            <ThemedText style={[styles.summaryValue, { color: theme.text }]}>{formatDuration(durationSec)}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.summaryLabel}>Time</ThemedText>
          </View>
        </View>

        <View style={styles.completeButtons}>
          <Pressable onPress={() => { reset(); router.push('/deck') }} style={styles.completeButton}>
            {({ pressed }) => (
              <ThemedView type="backgroundElement" style={[styles.buttonInner, pressed && styles.pressed]}>
                <ThemedText style={styles.buttonText}>Back to Decks</ThemedText>
              </ThemedView>
            )}
          </Pressable>
          <Pressable onPress={() => { reset(); router.push('/') }} style={styles.completeButton}>
            {({ pressed }) => (
              <ThemedView style={[styles.buttonInner, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
                <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>Home</ThemedText>
              </ThemedView>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  const progress = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => { reset(); router.back() }}>
          <ThemedText themeColor="textSecondary" style={styles.exitText}>Exit</ThemedText>
        </Pressable>
        <ThemedText style={styles.deckName}>{deck?.name ?? 'Review'}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.counter}>
          {currentIndex + 1}/{cards.length}
        </ThemedText>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
      </View>

      <View style={styles.cardArea}>
        {currentCard && (
          <Flashcard card={currentCard} revealed={revealed} onReveal={reveal} />
        )}
      </View>

      {revealed ? (
        <GradeButtons onGrade={(quality) => gradeCard(currentCard?.id ?? '', quality)} />
      ) : (
        <Pressable onPress={reveal} style={styles.tapToReveal}>
          {({ pressed }) => (
            <ThemedView style={[styles.revealButton, { backgroundColor: theme.surfaceVariant }, pressed && styles.pressed]}>
              <ThemedText style={styles.revealText}>Tap to reveal answer</ThemedText>
            </ThemedView>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  exitText: {
    fontSize: 16,
  },
  deckName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  counter: {
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: Spacing.four,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  tapToReveal: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  revealButton: {
    paddingVertical: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  revealText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  pressed: {
    opacity: 0.7,
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.five,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: Spacing.three,
  },
  summaryStat: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  summaryLabel: {
    fontSize: 12,
  },
  completeButtons: {
    flexDirection: 'row',
    gap: Spacing.three,
    width: '100%',
  },
  completeButton: {
    flex: 1,
  },
  buttonInner: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
