import type { Camera } from "@rnmapbox/maps";
import { useCallback, useEffect, useState, type RefObject } from "react";
import { useToggle } from "@/hooks/use-toggle";
import { cameraTarget } from "./map-config";

/**
 * The map's camera mode: whether it follows the user, tilted or top-down, and the close-up
 * avatar view or the zoomed-out normal map. Gives the zoom and pitch to follow with and the
 * handlers for the controls. The caller owns the `camera` ref (it goes on the map's Camera).
 */
export function useViewMode(camera: RefObject<Camera | null>) {
  const [following, setFollowing] = useState(true);
  const [tilted, toggleTilt] = useToggle(true);
  const [normalMap, toggleNormalMapFlag] = useToggle(false);
  const { zoom, pitch } = cameraTarget({ tilted, normalMap });

  // A tilt change while following is applied through the Camera's `followPitch`; otherwise move
  // the camera.
  useEffect(() => {
    if (following) return;
    camera.current?.setCamera({
      pitch,
      animationDuration: 400,
      animationMode: "easeTo",
    });
  }, [camera, pitch, following]);

  const recenter = useCallback(() => setFollowing(true), []);

  // Touching the map ends follow mode. Setting the prop to false (rather than relying on the
  // native tracking-mode event, which never reaches JS here) lets the recenter button switch it
  // back on. React ignores the repeat while a gesture is active.
  const stopFollowing = useCallback(() => setFollowing(false), []);

  // Switching view recenters on the user: follow mode zooms and tilts correctly over terrain,
  // while moving a free camera to a new zoom there collapses the pitch (60° to about 18°).
  const toggleNormalMap = useCallback(() => {
    toggleNormalMapFlag();
    setFollowing(true);
  }, [toggleNormalMapFlag]);

  return {
    following,
    tilted,
    normalMap,
    zoom,
    pitch,
    recenter,
    stopFollowing,
    toggleTilt,
    toggleNormalMap,
  };
}
