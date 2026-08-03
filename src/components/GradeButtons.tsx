import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { PRIMARY_GRADES, type Quality } from '@/srs/sm2';
import { ThemedText } from './themed-text';

interface GradeButtonsProps {
  onGrade: (quality: Quality) => void;
}

export function GradeButtons({ onGrade }: GradeButtonsProps) {
  return (
    <View style={styles.container}>
      {PRIMARY_GRADES.map((grade) => (
        <Pressable
          key={grade.grade}
          style={[
            styles.button,
            { backgroundColor: grade.color },
          ]}
          onPress={() => onGrade(grade.grade)}
        >
          <ThemedText style={styles.label}>{grade.label}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
