import { LocationPuck } from "@rnmapbox/maps";
import { useAvatarStore } from "@/context/stores/avatar-store";
import { CLOSE_PULSE_RADIUS } from "./map-config";

// Module-level so the puck gets the same objects every render and skips the work.
const PULSE_CLOSE = { isEnabled: true, radius: CLOSE_PULSE_RADIUS };
const PULSE_ACCURACY = { isEnabled: true, radius: "accuracy" } as const;

/**
 * @abstract The live location marker: a pulsing dot under the avatar's feet. While the avatar
 * is on screen the pulse stays tight; without her it spreads to the GPS accuracy. It owns the
 * only subscription to the avatar-visible flag, so a flip re-renders just this. Render it
 * inside a MapView, once location permission is granted.
 * @returns JSX
 */
export default function UserMarker() {
  const avatarShown = useAvatarStore((state) => state.shown);

  return (
    <LocationPuck
      puckBearingEnabled
      puckBearing="course"
      pulsing={avatarShown ? PULSE_CLOSE : PULSE_ACCURACY}
    />
  );
}
