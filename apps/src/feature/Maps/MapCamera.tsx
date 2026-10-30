import { Camera, UserTrackingMode } from "@rnmapbox/maps";
import type { Ref } from "react";
import { useStartCenter } from "@/hooks/use-start-center";
import { GAME_VIEW } from "./map-config";

type MapCameraProps = {
  ref?: Ref<Camera>;
  /** Location permission is granted: start at the last known fix and allow following. */
  hasLocation: boolean;
  /** Lock the camera on the user. */
  following: boolean;
  /** Zoom and pitch to follow with. */
  zoom: number;
  pitch: number;
};

/**
 * @abstract The map's camera: starts on the user's last known position and follows them with
 * their course. Render it inside a MapView.
 * @returns JSX
 */
export default function MapCamera({
  ref,
  hasLocation,
  following,
  zoom,
  pitch,
}: MapCameraProps) {
  const startCenter = useStartCenter(hasLocation);

  return (
    <Camera
      ref={ref}
      // `defaultSettings` only apply on mount, so remount once the first fix is known. The
      // camera then starts on the user, tilted, instead of flying in from 0°N 0°E.
      key={startCenter ? "located" : "default"}
      defaultSettings={{
        centerCoordinate: startCenter ?? undefined,
        zoomLevel: GAME_VIEW.zoom,
        pitch: GAME_VIEW.pitch,
      }}
      followUserLocation={hasLocation && following}
      followUserMode={UserTrackingMode.FollowWithCourse}
      followZoomLevel={zoom}
      followPitch={pitch}
    />
  );
}
