import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StreakBadge } from '@/components/StreakBadge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import {
    getAccuracyByDay,
    getOverallStats,
    getReviewActivityByDay,
    getSessionLogs,
} from '@/db/client';
import { useTheme } from '@/hooks/use-theme';
import { useStreak } from '@/hooks/useStreak';

export default function StatsScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { getStreak } = useStreak();
  const [streak, setStreak] = useState(0);
  const [activity, setActivity] = useState<{ date: string; count: number }[]>([]);
  const [accuracy, setAccuracy] = useState<{ date: string; accuracy: number }[]>([]);
  const [overall, setOverall] = useState({ totalReviews: 0, totalCorrect: 0, totalCards: 0, masteredCards: 0 });
  const [recentSessions, setRecentSessions] = useState<{ id: string; deckId: string; date: string; cardsReviewed: number; correctCount: number; durationSec: number }[]>([]);

  useEffect(() => {
    (async () => {
      setStreak(await getStreak());
      setActivity(await getReviewActivityByDay(db, 90));
      setAccuracy(await getAccuracyByDay(db, 30));
      setOverall(await getOverallStats(db));
      setRecentSessions((await getSessionLogs(db)).slice(0, 10));
    })();
  }, [db, getStreak]);

  const retentionRate = overall.totalReviews > 0
    ? Math.round((overall.totalCorrect / overall.totalReviews) * 100)
    : 0;
  const masteryPercent = overall.totalCards > 0
    ? Math.round((overall.masteredCards / overall.totalCards) * 100)
    : 0;

  const maxActivity = Math.max(...activity.map((a) => a.count), 1);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.three }]}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Statistics</ThemedText>

        <StreakBadge streak={streak} />

        <View style={styles.statsGrid}>
          <ThemedView type="card" style={[styles.statBox, { borderColor: theme.cardBorder }]}>
            <ThemedText style={[styles.statNumber, { color: theme.primary }]}>{overall.totalReviews}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.statName}>Total Reviews</ThemedText>
          </ThemedView>
          <ThemedView type="card" style={[styles.statBox, { borderColor: theme.cardBorder }]}>
            <ThemedText style={[styles.statNumber, { color: theme.success }]}>{retentionRate}%</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.statName}>Retention</ThemedText>
          </ThemedView>
          <ThemedView type="card" style={[styles.statBox, { borderColor: theme.cardBorder }]}>
            <ThemedText style={[styles.statNumber, { color: theme.accent }]}>{overall.totalCards}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.statName}>Cards Learned</ThemedText>
          </ThemedView>
          <ThemedView type="card" style={[styles.statBox, { borderColor: theme.cardBorder }]}>
            <ThemedText style={[styles.statNumber, { color: theme.warning }]}>{masteryPercent}%</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.statName}>Mastery</ThemedText>
          </ThemedView>
        </View>

        <ThemedText type="subtitle" style={styles.sectionTitle}>Review Activity (90 days)</ThemedText>
        <ThemedView type="card" style={[styles.heatmapContainer, { borderColor: theme.cardBorder }]}>
          <View style={styles.heatmap}>
            {activity.map((day) => {
              const intensity = day.count / maxActivity;
              const bgColor = intensity === 0
                ? theme.surfaceVariant
                : intensity < 0.25
                ? theme.primaryLight
                : intensity < 0.5
                ? theme.primary + '80'
                : intensity < 0.75
                ? theme.primary + 'CC'
                : theme.primary;
              return (
                <View
                  key={day.date}
                  style={[styles.heatmapCell, { backgroundColor: bgColor }]}
                />
              );
            })}
            {activity.length === 0 && (
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                No activity yet. Start reviewing!
              </ThemedText>
            )}
          </View>
        </ThemedView>

        <ThemedText type="subtitle" style={styles.sectionTitle}>Accuracy (30 days)</ThemedText>
        <ThemedView type="card" style={[styles.chartContainer, { borderColor: theme.cardBorder }]}>
          {accuracy.length === 0 ? (
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              No data yet.
            </ThemedText>
          ) : (
            <View style={styles.chartBars}>
              {accuracy.map((day) => (
                <View key={day.date} style={styles.chartBarWrapper}>
                  <View style={[styles.chartBar, { height: Math.round(day.accuracy * 100), backgroundColor: theme.success }]} />
                </View>
              ))}
            </View>
          )}
        </ThemedView>

        <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Sessions</ThemedText>
        {recentSessions.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.emptyText}>No sessions yet.</ThemedText>
        ) : (
          <View style={styles.sessionList}>
            {recentSessions.map((session) => {
              const acc = session.cardsReviewed > 0
                ? Math.round((session.correctCount / session.cardsReviewed) * 100)
                : 0;
              return (
                <ThemedView key={session.id} type="card" style={[styles.sessionRow, { borderColor: theme.cardBorder }]}>
                  <View style={styles.sessionInfo}>
                    <ThemedText style={styles.sessionDeck}>{session.deckId}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.sessionDate}>
                      {new Date(session.date).toLocaleDateString()}
                    </ThemedText>
                  </View>
                  <View style={styles.sessionStats}>
                    <ThemedText style={styles.sessionStat}>{session.cardsReviewed} cards</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.sessionStat}>{acc}%</ThemedText>
                  </View>
                </ThemedView>
              );
            })}
          </View>
        )}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    width: '100%',
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  statName: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  heatmapContainer: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    width: '100%',
  },
  heatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  heatmapCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  chartContainer: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    width: '100%',
    minHeight: 120,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 2,
  },
  chartBarWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
  sessionList: {
    gap: Spacing.two,
    width: '100%',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  sessionInfo: {
    gap: 2,
  },
  sessionDeck: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  sessionDate: {
    fontSize: 12,
  },
  sessionStats: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  sessionStat: {
    fontSize: 13,
  },
});
