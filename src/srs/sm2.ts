export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2State {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  totalReviews: number;
  correctReviews: number;
}

export function createInitialState(): SM2State {
  return {
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
    lastReviewDate: null,
    totalReviews: 0,
    correctReviews: 0,
  };
}

export function sm2(state: SM2State, quality: Quality): SM2State {
  const { easinessFactor: prevEF, interval: prevInterval, repetitions: prevReps } = state;

  let easinessFactor = prevEF;
  let interval: number;
  let repetitions: number;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions = prevReps + 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * easinessFactor);
    }
  }

  easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easinessFactor = Math.max(1.3, easinessFactor);

  const today = new Date();
  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + interval);
  const nextReviewDate = nextDate.toISOString().split('T')[0];

  return {
    easinessFactor,
    interval,
    repetitions,
    nextReviewDate,
    lastReviewDate: today.toISOString().split('T')[0],
    totalReviews: state.totalReviews + 1,
    correctReviews: state.correctReviews + (quality >= 3 ? 1 : 0),
  };
}

export const GRADE_LABELS: { grade: Quality; label: string; description: string }[] = [
  { grade: 0, label: 'Again', description: 'Complete blackout' },
  { grade: 1, label: 'Hard', description: 'Correct but serious difficulty' },
  { grade: 2, label: 'Hard', description: 'Correct but with effort' },
  { grade: 3, label: 'Good', description: 'Correct with some hesitation' },
  { grade: 4, label: 'Easy', description: 'Perfect, instant recall' },
  { grade: 5, label: 'Perfect', description: 'Perfect, trivially easy' },
];

export const PRIMARY_GRADES: { grade: Quality; label: string; color: string }[] = [
  { grade: 0, label: 'Again', color: '#E53935' },
  { grade: 2, label: 'Hard', color: '#FB8C00' },
  { grade: 3, label: 'Good', color: '#43A047' },
  { grade: 4, label: 'Easy', color: '#1E88E5' },
];
