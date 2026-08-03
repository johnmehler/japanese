import { create } from 'zustand';

export type ReviewOrder = 'dueFirst' | 'newFirst' | 'mixed';
export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsState {
  dailyNewCardLimit: number;
  reviewOrder: ReviewOrder;
  themeMode: ThemeMode;
  hapticFeedback: boolean;
  dailyGoal: number;
  setDailyNewCardLimit: (limit: number) => void;
  setReviewOrder: (order: ReviewOrder) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setDailyGoal: (goal: number) => void;
}

const STORAGE_KEY = 'nihongo-settings';

function loadSettings() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveSettings(state: Partial<SettingsState>) {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const existing = raw ? JSON.parse(raw) : {};
    const merged = { ...existing, ...state };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
  } catch {}
}

const saved = loadSettings();

export const useSettingsStore = create<SettingsState>((set) => ({
  dailyNewCardLimit: saved?.dailyNewCardLimit ?? 20,
  reviewOrder: saved?.reviewOrder ?? 'dueFirst',
  themeMode: saved?.themeMode ?? 'system',
  hapticFeedback: saved?.hapticFeedback ?? true,
  dailyGoal: saved?.dailyGoal ?? 50,
  setDailyNewCardLimit: (limit) => {
    saveSettings({ dailyNewCardLimit: limit });
    set({ dailyNewCardLimit: limit });
  },
  setReviewOrder: (order) => {
    saveSettings({ reviewOrder: order });
    set({ reviewOrder: order });
  },
  setThemeMode: (mode) => {
    saveSettings({ themeMode: mode });
    set({ themeMode: mode });
  },
  setHapticFeedback: (enabled) => {
    saveSettings({ hapticFeedback: enabled });
    set({ hapticFeedback: enabled });
  },
  setDailyGoal: (goal) => {
    saveSettings({ dailyGoal: goal });
    set({ dailyGoal: goal });
  },
}));
