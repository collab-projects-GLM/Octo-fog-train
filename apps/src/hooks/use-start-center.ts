import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { toLngLat, type LngLat } from "@/lib/geo";

/**
 * Reads the last known GPS fix once `enabled` (location permission granted) and returns it as
 * [lng, lat]. Starting the camera there avoids a flight from 0°N 0°E to the user. Stays `null`
 * when there is no fix to use.
 */
export function useStartCenter(enabled: boolean): LngLat | null {
  const [center, setCenter] = useState<LngLat | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    void (async () => {
      try {
        const position =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));
        if (!cancelled) setCenter(toLngLat(position.coords));
      } catch {
        // Location services off or no fix: the camera keeps its default start.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return center;
}
