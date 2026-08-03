import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DeckWithStats } from '@/db/schema';

interface DeckCardProps {
  deck: DeckWithStats;
}

const CATEGORY_ICONS: Record<string, string> = {
  hiragana: 'あ',
  katakana: 'ア',
  kanji: '漢',
  vocab: '語',
};

export function DeckCard({ deck }: DeckCardProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/deck/${deck.id}`)}>
      {({ pressed }) => (
        <ThemedView
          type="card"
          style={[
            styles.container,
            { borderColor: theme.cardBorder },
            pressed && styles.pressed,
          ]}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
              <ThemedText style={styles.icon}>
                {CATEGORY_ICONS[deck.category]}
              </ThemedText>
            </View>
            <View style={styles.info}>
              <ThemedText type="smallBold" style={styles.name}>{deck.name}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.description}>
                {deck.cardCount} cards
              </ThemedText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: theme.danger }]}>
                {deck.dueCount}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.statLabel}>Due</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: theme.warning }]}>
                {deck.newCount}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.statLabel}>New</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: theme.success }]}>
                {deck.masteryPercent}%
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.statLabel}>Mastery</ThemedText>
            </View>
          </View>
        </ThemedView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    fontWeight: '500',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
