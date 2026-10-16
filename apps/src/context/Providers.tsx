import { queryClient } from "@/clients/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { ThemeProvider } from "expo-router";
import { NAV_THEME } from "@/lib/theme";
import { useColorScheme } from "nativewind";

export default function Providers({ children }: PropsWithChildren) {
  const { colorScheme: scheme = "light" } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[scheme]}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
