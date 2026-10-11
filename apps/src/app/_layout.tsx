import '@/style/global.css';

import { NAV_THEME } from '@/lib/theme';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colorScheme, useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Platform, useColorScheme as useSystemColorScheme } from 'react-native';

export default function RootLayout() {
  const { colorScheme: scheme = 'light' } = useColorScheme();
  const systemScheme = useSystemColorScheme();

  // On native NativeWind follows the OS on its own. On web, class-based dark mode
  // only toggles `.dark` on <html> when told to, so mirror the OS preference.
  useEffect(() => {
    if (Platform.OS === 'web') colorScheme.set(systemScheme === 'dark' ? 'dark' : 'light');
  }, [systemScheme]);

  return (
    <ThemeProvider value={NAV_THEME[scheme]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
      <PortalHost />
    </ThemeProvider>
  );
}
