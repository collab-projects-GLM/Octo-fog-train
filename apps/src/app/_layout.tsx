import "@/style/global.css";

import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import Providers from "@/context/Providers";

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }} />
      <PortalHost />
    </Providers>
  );
}
