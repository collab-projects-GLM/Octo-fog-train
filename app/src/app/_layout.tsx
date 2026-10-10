import "../global.css";

import { Stack } from "expo-router";

import Providers from "@/components/utility/Providers";
import SplashController from "@/components/utility/SplashController";
import { useAuth } from "@/feature/auth/AuthProvider";

export default function RootLayout() {
  return (
    <Providers>
      <SplashController />
      <RootNavigator />
    </Providers>
  );
}

/**
 * Both groups are always declared; `guard` decides which is reachable. When the
 * session changes, the router moves to the first reachable screen by itself, so
 * no screen has to navigate after signing in or out.
 */
function RootNavigator() {
  const { status } = useAuth();
  const isSignedIn = status === "authenticated";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
