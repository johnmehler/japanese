import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import type { CardWithReviewState } from '@/db/schema';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/store/settingsStore';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface FlashcardProps {
  card: CardWithReviewState;
  revealed: boolean;
  onReveal: () => void;
}

export function Flashcard({ card, revealed, onReveal }: FlashcardProps) {
  const theme = useTheme();
  const { hapticFeedback } = useSettingsStore();
  const rotate = useSharedValue(0);

  const flip = useCallback(() => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    rotate.value = withTiming(180, { duration: 400, easing: Easing.out(Easing.ease) });
    onReveal();
  }, [hapticFeedback, onReveal, rotate]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotate.value}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotate.value + 180}deg` }],
    backfaceVisibility: 'hidden',
  }));

  return (
    <View style={styles.container}>
      <Pressable onPress={flip} style={styles.pressable} disabled={revealed}>
        <Animated.View style={[styles.cardFace, frontStyle, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <ThemedView style={styles.cardContent} type="card">
            <ThemedText style={styles.cardFront}>{card.front}</ThemedText>
            {card.reading && !revealed && (
              <ThemedText themeColor="textSecondary" style={styles.hintText}>
                Tap to reveal
              </ThemedText>
            )}
          </ThemedView>
        </Animated.View>

        <Animated.View
          style={[styles.cardFace, styles.cardBackView, backStyle, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <ThemedView style={styles.cardContent} type="card">
            <ThemedText style={styles.cardFront}>{card.front}</ThemedText>
            {card.reading && (
              <ThemedText themeColor="textSecondary" style={styles.reading}>
                {card.reading}
              </ThemedText>
            )}
            <View style={styles.divider} />
            <ThemedText style={styles.cardBackText}>{card.back}</ThemedText>
            {card.example && (
              <View style={styles.exampleContainer}>
                <ThemedText style={styles.exampleText}>{card.example}</ThemedText>
                {card.exampleReading && (
                  <ThemedText themeColor="textSecondary" style={styles.exampleReading}>
                    {card.exampleReading}
                  </ThemedText>
                )}
                {card.exampleMeaning && (
                  <ThemedText themeColor="textSecondary" style={styles.exampleMeaning}>
                    {card.exampleMeaning}
                  </ThemedText>
                )}
              </View>
            )}
          </ThemedView>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    width: '100%',
    flex: 1,
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: Spacing.four,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackView: {
    position: 'absolute',
  },
  cardContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
    borderRadius: Spacing.four,
    backgroundColor: 'transparent',
  },
  cardFront: {
    fontSize: 80,
    fontWeight: '400' as const,
    textAlign: 'center',
  },
  cardBackText: {
    fontSize: 36,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  reading: {
    fontSize: 20,
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: Spacing.three,
  },
  hintText: {
    fontSize: 14,
    marginTop: Spacing.four,
  },
  exampleContainer: {
    marginTop: Spacing.five,
    alignItems: 'center',
    gap: Spacing.one,
  },
  exampleText: {
    fontSize: 18,
    textAlign: 'center',
  },
  exampleReading: {
    fontSize: 14,
    textAlign: 'center',
  },
  exampleMeaning: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
