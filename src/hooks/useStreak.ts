import { useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { getSessionLogs } from '@/db/client';
import { isSameDay, nowISO, todayISO } from '@/utils/date';

export function useStreak() {
  const db = useSQLiteContext();

  const getStreak = useCallback(async (): Promise<number> => {
    const logs = await getSessionLogs(db);
    if (logs.length === 0) return 0;

    const reviewDays = new Set(
      logs.map((log) => log.date.split('T')[0])
    );

    let streak = 0;
    const today = todayISO();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (reviewDays.has(today)) {
      streak = 1;
      let date = new Date();
      while (true) {
        date.setDate(date.getDate() - 1);
        const dateStr = date.toISOString().split('T')[0];
        if (reviewDays.has(dateStr)) {
          streak++;
        } else {
          break;
        }
      }
    } else if (reviewDays.has(yesterdayStr)) {
      let date = new Date();
      date.setDate(date.getDate() - 1);
      while (true) {
        const dateStr = date.toISOString().split('T')[0];
        if (reviewDays.has(dateStr)) {
          streak++;
        } else {
          break;
        }
        date.setDate(date.getDate() - 1);
      }
    }

    return streak;
  }, [db]);

  return { getStreak };
}
