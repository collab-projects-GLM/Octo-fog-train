import * as Location from "expo-location";
import { useEffect, useEffectEvent } from "react";
import { toLiveFix, type LiveFix } from "@/lib/location";

/**
 * Streams GPS fixes (about 1 Hz while moving) to `onFix` once `enabled` (location permission
 * granted). The fixes are not kept in React state: nothing on screen renders from them, so a
 * state update per fix would only re-render the whole map for no visible change.
 */
export function useLiveLocation(
  enabled: boolean,
  onFix: (fix: LiveFix) => void,
): void {
  // Always calls the latest `onFix`, without re-subscribing when its identity changes.
  const emit = useEffectEvent(onFix);

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
      ({ coords }) => emit(toLiveFix(coords)),
    ).then((created) => {
      if (cancelled) created.remove();
      else subscription = created;
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);
}
