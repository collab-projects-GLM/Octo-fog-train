import { useEffect, useState } from "react";
import * as Location from "expo-location";

export type LiveLocation = {
  /** [lng, lat] */
  coordinate: [number, number];
  /** Direction of travel in degrees clockwise from north; null while it is unknown. */
  course: number | null;
  /** Metres per second; null while it is unknown. */
  speed: number | null;
  /** Horizontal accuracy in metres. */
  accuracy: number | null;
};

/**
 * Streams GPS fixes (about 1 Hz while moving) once `enabled` (location permission granted).
 * Returns null until the first fix.
 */
export function useLiveLocation(enabled: boolean): LiveLocation | null {
  const [live, setLive] = useState<LiveLocation | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;

    void Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      ({ coords }) => {
        setLive({
          coordinate: [coords.longitude, coords.latitude],
          // -1 means "unknown" on Android.
          course: coords.heading != null && coords.heading >= 0 ? coords.heading : null,
          speed: coords.speed != null && coords.speed >= 0 ? coords.speed : null,
          accuracy: coords.accuracy,
        });
      },
    ).then((created) => {
      if (cancelled) created.remove();
      else subscription = created;
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  return live;
}
