import { useEffect, useRef } from "react";
import * as Location from "expo-location";

/**
 * Asks for foreground location once, on mount.
 * Returns true once the permission is granted.
 */
export function useLocationPermission(): boolean {
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current || !permission) return;
    if (!permission.granted && permission.canAskAgain) {
      asked.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission]);

  return permission?.granted ?? false;
}
