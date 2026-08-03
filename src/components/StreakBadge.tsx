import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const theme = useTheme();

  return (
    <ThemedView
      type="card"
      style={[styles.container, { borderColor: theme.cardBorder }]}>
      <View style={[styles.iconContainer, { backgroundColor: streak > 0 ? theme.warningLight : theme.surfaceVariant }]}>
        <ThemedText style={[styles.icon, { color: streak > 0 ? theme.warning : theme.textSecondary }]}>
          🔥
        </ThemedText>
      </View>
      <View style={styles.info}>
        <ThemedText style={styles.streakValue}>
          {streak} {streak === 1 ? 'day' : 'days'}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.streakLabel}>
          Current streak
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
