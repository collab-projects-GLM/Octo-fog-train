import { SplashScreen } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/feature/auth/AuthProvider";

SplashScreen.preventAutoHideAsync();

/** Keeps the splash screen up until the stored session has been checked. */
export default function SplashController() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "loading") SplashScreen.hide();
  }, [status]);

  return null;
}
