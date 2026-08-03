import { Platform } from 'react-native';

import { Fonts } from '@/constants/theme';

export const Typography = {
  japanese: {
    fontSize: 72,
    fontWeight: '400' as const,
    fontFamily: Platform.select({
      ios: 'Hiragino Sans',
      android: 'Noto Sans JP',
      default: 'normal',
    }),
  },
  japaneseLarge: {
    fontSize: 96,
    fontWeight: '400' as const,
    fontFamily: Platform.select({
      ios: 'Hiragino Sans',
      android: 'Noto Sans JP',
      default: 'normal',
    }),
  },
  japaneseMedium: {
    fontSize: 48,
    fontWeight: '400' as const,
    fontFamily: Platform.select({
      ios: 'Hiragino Sans',
      android: 'Noto Sans JP',
      default: 'normal',
    }),
  },
  reading: {
    fontSize: 20,
    fontWeight: '400' as const,
    fontFamily: Platform.select({
      ios: 'Hiragino Sans',
      android: 'Noto Sans JP',
      default: 'normal',
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
} as const;
