import { useSQLiteContext } from 'expo-sqlite';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore, type ReviewOrder, type ThemeMode } from '@/store/settingsStore';
import { resetAllProgress } from '@/db/client';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    dailyNewCardLimit,
    reviewOrder,
    themeMode,
    hapticFeedback,
    dailyGoal,
    setDailyNewCardLimit,
    setReviewOrder,
    setThemeMode,
    setHapticFeedback,
    setDailyGoal,
  } = useSettingsStore();

  const reviewOrders: { value: ReviewOrder; label: string }[] = [
    { value: 'dueFirst', label: 'Due cards first' },
    { value: 'newFirst', label: 'New cards first' },
    { value: 'mixed', label: 'Mixed' },
  ];

  const themeModes: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.three }]}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Settings</ThemedText>

        <ThemedText type="subtitle" style={styles.sectionTitle}>Review</ThemedText>

        <ThemedView type="card" style={[styles.settingRow, { borderColor: theme.cardBorder }]}>
          <View style={styles.settingInfo}>
            <ThemedText style={styles.settingLabel}>Daily New Card Limit</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.settingDesc}>
              Max new cards introduced per day
            </ThemedText>
          </View>
          <View style={styles.stepper}>
            <Pressable onPress={() => setDailyNewCardLimit(Math.max(0, dailyNewCardLimit - 5))}>
              {({ pressed }) => (
                <ThemedView type="backgroundElement" style={[styles.stepperBtn, pressed && styles.pressed]}>
                  <ThemedText style={styles.stepperText}>-</ThemedText>
                </ThemedView>
              )}
            </Pressable>
            <ThemedText style={styles.stepperValue}>{dailyNewCardLimit}</ThemedText>
            <Pressable onPress={() => setDailyNewCardLimit(Math.min(100, dailyNewCardLimit + 5))}>
              {({ pressed }) => (
                <ThemedView type="backgroundElement" style={[styles.stepperBtn, pressed && styles.pressed]}>
                  <ThemedText style={styles.stepperText}>+</ThemedText>
                </ThemedView>
              )}
            </Pressable>
          </View>
        </ThemedView>

        <ThemedView type="card" style={[styles.settingRow, { borderColor: theme.cardBorder }]}>
          <View style={styles.settingInfo}>
            <ThemedText style={styles.settingLabel}>Daily Goal</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.settingDesc}>
              Target reviews per day
            </ThemedText>
          </View>
          <View style={styles.stepper}>
            <Pressable onPress={() => setDailyGoal(Math.max(10, dailyGoal - 10))}>
              {({ pressed }) => (
                <ThemedView type="backgroundElement" style={[styles.stepperBtn, pressed && styles.pressed]}>
                  <ThemedText style={styles.stepperText}>-</ThemedText>
                </ThemedView>
              )}
            </Pressable>
            <ThemedText style={styles.stepperValue}>{dailyGoal}</ThemedText>
            <Pressable onPress={() => setDailyGoal(Math.min(200, dailyGoal + 10))}>
              {({ pressed }) => (
                <ThemedView type="backgroundElement" style={[styles.stepperBtn, pressed && styles.pressed]}>
                  <ThemedText style={styles.stepperText}>+</ThemedText>
                </ThemedView>
              )}
            </Pressable>
          </View>
        </ThemedView>

        <ThemedView type="card" style={[styles.settingColumn, { borderColor: theme.cardBorder }]}>
          <ThemedText style={styles.settingLabel}>Review Order</ThemedText>
          {reviewOrders.map((order) => (
            <Pressable key={order.value} onPress={() => setReviewOrder(order.value)}>
              {({ pressed }) => (
                <View style={[styles.radioRow, pressed && styles.pressed]}>
                  <View style={[styles.radio, { borderColor: theme.primary }, reviewOrder === order.value && { backgroundColor: theme.primary }]} />
                  <ThemedText style={styles.radioLabel}>{order.label}</ThemedText>
                </View>
              )}
            </Pressable>
          ))}
        </ThemedView>

        <ThemedText type="subtitle" style={styles.sectionTitle}>Appearance</ThemedText>

        <ThemedView type="card" style={[styles.settingColumn, { borderColor: theme.cardBorder }]}>
          <ThemedText style={styles.settingLabel}>Theme</ThemedText>
          {themeModes.map((mode) => (
            <Pressable key={mode.value} onPress={() => setThemeMode(mode.value)}>
              {({ pressed }) => (
                <View style={[styles.radioRow, pressed && styles.pressed]}>
                  <View style={[styles.radio, { borderColor: theme.primary }, themeMode === mode.value && { backgroundColor: theme.primary }]} />
                  <ThemedText style={styles.radioLabel}>{mode.label}</ThemedText>
                </View>
              )}
            </Pressable>
          ))}
        </ThemedView>

        <ThemedView type="card" style={[styles.settingRow, { borderColor: theme.cardBorder }]}>
          <View style={styles.settingInfo}>
            <ThemedText style={styles.settingLabel}>Haptic Feedback</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.settingDesc}>
              Vibration on card flip and grading
            </ThemedText>
          </View>
          <Switch
            value={hapticFeedback}
            onValueChange={setHapticFeedback}
            trackColor={{ false: theme.surfaceVariant, true: theme.primary }}
          />
        </ThemedView>

        <ThemedText type="subtitle" style={styles.sectionTitle}>Data</ThemedText>

        <Pressable onPress={async () => { await resetAllProgress(db); }}>
          {({ pressed }) => (
            <ThemedView type="card" style={[styles.dangerButton, { borderColor: theme.danger }, pressed && styles.pressed]}>
              <ThemedText style={[styles.dangerText, { color: theme.danger }]}>Reset All Progress</ThemedText>
            </ThemedView>
          )}
        </Pressable>

        <ThemedText themeColor="textSecondary" style={styles.version}>Nihongo SRS v1.0.0</ThemedText>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    marginTop: Spacing.two,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    width: '100%',
  },
  settingColumn: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
    width: '100%',
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  settingDesc: {
    fontSize: 13,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    minWidth: 30,
    textAlign: 'center',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  radioLabel: {
    fontSize: 15,
  },
  pressed: {
    opacity: 0.7,
  },
  dangerButton: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    width: '100%',
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  version: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.three,
  },
});
