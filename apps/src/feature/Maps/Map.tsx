import Mapbox, { MapView, type Camera, type MapState } from "@rnmapbox/maps";
import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLiveLocation } from "@/hooks/use-live-location";
import { useToggle } from "@/hooks/use-toggle";
import { useLocationPermission } from "@/permissions/use-location-permission";
import { AVATAR_MODEL } from "@/feature/Avatar/avatar-model";
import AvatarPuck, { type AvatarPuckHandle } from "./AvatarPuck";
import MapCamera from "./MapCamera";
import MapControls from "./MapControls";
import MapLayers from "./MapLayers";
import { MAP_STYLE_URL } from "./map-config";
import UserMarker from "./UserMarker";
import { useAvatarPlacement } from "./use-avatar-placement";
import { useMapTheme } from "./use-map-theme";
import { useViewMode } from "./use-view-mode";

// Inlined at build time, so it must be read with this exact static expression.
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

if (MAPBOX_TOKEN) {
  void Mapbox.setAccessToken(MAPBOX_TOKEN);
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});

/**
 * @abstract Tilted 3D map (Mapbox Standard style, extruded buildings) that follows the user,
 * with a live location marker and the player's VRM avatar standing on it, and the controls for
 * the camera and layers. This is only the composition: the camera mode lives in `useViewMode`,
 * the avatar tracking in `useAvatarPlacement`, and each piece of the map in its own component,
 * so nothing here changes at GPS or camera-frame rate.
 * @returns JSX
 */
export default function Maps() {
  const insets = useSafeAreaInsets();
  const hasLocation = useLocationPermission();
  const map = useRef<MapView>(null);
  const camera = useRef<Camera>(null);
  const avatar = useRef<AvatarPuckHandle>(null);
  const theme = useMapTheme();
  const view = useViewMode(camera);
  const placement = useAvatarPlacement(map, avatar);
  useLiveLocation(hasLocation, placement.onFix);
  const [terrain, toggleTerrain] = useToggle(true);
  const [buildings, toggleBuildings] = useToggle(true);

  const onCameraChanged = (state: MapState) => {
    if (state.gestures.isGestureActive) view.stopFollowing();
    placement.onCameraChanged(state);
  };

  if (!MAPBOX_TOKEN) {
    return (
      <View className="w-full flex-1 items-center justify-center">
        <Text>EXPO_PUBLIC_MAPBOX_TOKEN is not set.</Text>
      </View>
    );
  }

  return (
    // React Native has no `dvh`, and NativeWind drops it. The app draws edge to edge, so the
    // map region is the window minus the bottom inset (the system navigation buttons).
    <View className="w-full flex-1" style={{ paddingBottom: insets.bottom }}>
      <View className="w-full flex-1" onLayout={placement.onLayout}>
        <MapView
          ref={map}
          style={styles.map}
          styleURL={MAP_STYLE_URL}
          scaleBarEnabled={false}
          onCameraChanged={onCameraChanged}
          onMapIdle={placement.onMapIdle}
        >
          <MapLayers theme={theme} buildings={buildings} terrain={terrain} />
          <MapCamera
            ref={camera}
            hasLocation={hasLocation}
            following={view.following}
            zoom={view.zoom}
            pitch={view.pitch}
          />
          {hasLocation && <UserMarker />}
        </MapView>

        {hasLocation && <AvatarPuck ref={avatar} model={AVATAR_MODEL} />}

        <MapControls
          following={view.following}
          tilted={view.tilted}
          terrain={terrain}
          buildings={buildings}
          normalMap={view.normalMap}
          onRecenter={view.recenter}
          onToggleTilt={view.toggleTilt}
          onToggleTerrain={toggleTerrain}
          onToggleBuildings={toggleBuildings}
          onToggleNormalMap={view.toggleNormalMap}
        />
      </View>
    </View>
  );
}
