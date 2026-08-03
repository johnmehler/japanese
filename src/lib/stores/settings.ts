import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ReviewOrder = 'dueFirst' | 'newFirst' | 'mixed';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface Settings {
  dailyNewCardLimit: number;
  reviewOrder: ReviewOrder;
  themeMode: ThemeMode;
  hapticFeedback: boolean;
  dailyGoal: number;
}

const DEFAULT_SETTINGS: Settings = {
  dailyNewCardLimit: 20,
  reviewOrder: 'dueFirst',
  themeMode: 'system',
  hapticFeedback: true,
  dailyGoal: 50,
};

function loadSettings(): Settings {
  if (!browser) return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem('nihongo-settings');
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function createSettingsStore() {
  const { subscribe, set, update } = writable<Settings>(loadSettings());

  return {
    subscribe,
    set: (settings: Settings) => {
      if (browser) localStorage.setItem('nihongo-settings', JSON.stringify(settings));
      set(settings);
    },
    update: (fn: (s: Settings) => Settings) => {
      update((s) => {
        const next = fn(s);
        if (browser) localStorage.setItem('nihongo-settings', JSON.stringify(next));
        return next;
      });
    },
    setDailyNewCardLimit: (v: number) => {
      update((s) => ({ ...s, dailyNewCardLimit: v }));
    },
    setReviewOrder: (v: ReviewOrder) => {
      update((s) => ({ ...s, reviewOrder: v }));
    },
    setThemeMode: (v: ThemeMode) => {
      update((s) => ({ ...s, themeMode: v }));
    },
    setHapticFeedback: (v: boolean) => {
      update((s) => ({ ...s, hapticFeedback: v }));
    },
    setDailyGoal: (v: number) => {
      update((s) => ({ ...s, dailyGoal: v }));
    },
  };
}

export const settings = createSettingsStore();
