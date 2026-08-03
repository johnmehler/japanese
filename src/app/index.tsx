import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeckCard } from '@/components/DeckCard';
import { ProgressRing } from '@/components/ProgressRing';
import { StreakBadge } from '@/components/StreakBadge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getSessionLogs } from '@/db/client';
import { useTheme } from '@/hooks/use-theme';
import { useStreak } from '@/hooks/useStreak';
import { useDeckStore } from '@/store/deckStore';
import { useSettingsStore } from '@/store/settingsStore';
import { todayISO } from '@/utils/date';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { getStreak } = useStreak();
  const { decks, deckStats, totalDue, totalNew, refreshDecks, refreshStats } = useDeckStore();
  const { dailyGoal } = useSettingsStore();
  const [streak, setStreak] = useState(0);
  const [todayReviewed, setTodayReviewed] = useState(0);

  useEffect(() => {
    (async () => {
      await refreshDecks(db);
      await refreshStats(db);
      setStreak(await getStreak());
      const logs = await getSessionLogs(db);
      const today = todayISO();
      const todayLogs = logs.filter((l) => l.date.split('T')[0] === today);
      setTodayReviewed(todayLogs.reduce((sum, l) => sum + l.cardsReviewed, 0));
    })();
  }, [db, refreshDecks, refreshStats, getStreak]);

  const totalCards = totalDue + totalNew;
  const dailyProgress = dailyGoal > 0 ? Math.min(todayReviewed / dailyGoal, 1) : 0;
  const decksWithStats = decks.map((d) => deckStats[d.id]).filter(Boolean);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.three }]}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Nihongo</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>Spaced repetition for Japanese</ThemedText>

        <View style={styles.row}>
          <StreakBadge streak={streak} />
          <View style={styles.progressContainer}>
            <ProgressRing progress={dailyProgress} size={64} label={`${todayReviewed}`} />
            <ThemedText themeColor="textSecondary" style={styles.progressLabel}>/ {dailyGoal} today</ThemedText>
          </View>
        </View>

        {totalCards > 0 && (
          <Pressable onPress={() => router.push('/deck')}>
            {({ pressed }) => (
              <ThemedView style={[styles.quickStart, { backgroundColor: theme.primary, borderColor: theme.primary }, pressed && styles.pressed]}>
                <ThemedText style={styles.quickStartText}>Start Review</ThemedText>
                <ThemedText style={styles.quickStartSubtext}>{totalDue} due · {totalNew} new</ThemedText>
              </ThemedView>
            )}
          </Pressable>
        )}

        <ThemedText type="subtitle" style={styles.sectionTitle}>Your Decks</ThemedText>
        <View style={styles.deckList}>
          {decksWithStats.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </View>
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
    fontSize: 36,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  progressLabel: {
    fontSize: 12,
  },
  quickStart: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    gap: Spacing.one,
    width: '100%',
  },
  quickStartText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  quickStartSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    marginTop: Spacing.two,
  },
  deckList: {
    gap: Spacing.two,
    width: '100%',
  },
});
