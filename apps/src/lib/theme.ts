import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { PALETTE } from '@/style/palette.generated';

type Scheme = keyof typeof PALETTE;

// React Navigation can't read CSS variables, so it takes the palette generated from
// src/style/brand.css instead.
function navTheme(scheme: Scheme, base: Theme): Theme {
  const color = PALETTE[scheme];
  return {
    ...base,
    colors: {
      background: color.background,
      border: color.border,
      card: color.card,
      notification: color.destructive,
      primary: color.primary,
      text: color.foreground,
    },
  };
}

export const NAV_THEME: Record<Scheme, Theme> = {
  light: navTheme('light', DefaultTheme),
  dark: navTheme('dark', DarkTheme),
};
