import Mapbox, {
  Camera,
  LocationPuck,
  MapView,
  StyleImport,
  UserTrackingMode,
} from "@rnmapbox/maps";
import { StyleSheet, Text, View } from "react-native";
// Placeholder character; swap for the real avatar `.glb` later.
import avatarModel from "../../../assets/models/CesiumMan.glb";
import { useLocationPermission } from "./use-location-permission";

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
 * @abstract Tilted 3D map (Mapbox Standard style, extruded buildings) that
 * follows the user, with a 3D character standing on their GPS position.
 * @returns JSX
 */
export default function MapViewComponent() {
  const hasLocation = useLocationPermission();

  if (!MAPBOX_TOKEN) {
    return (
      <View className="w-full flex-1 items-center justify-center">
        <Text>EXPO_PUBLIC_MAPBOX_TOKEN is not set.</Text>
      </View>
    );
  }

  return (
    <View className="w-full flex-1">
      <MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/standard"
        scaleBarEnabled={false}
      >
        <StyleImport
          id="basemap"
          existing
          config={{ show3dBuildings: true, lightPreset: "day" }}
        />
        <Camera
          followUserLocation={hasLocation}
          followUserMode={UserTrackingMode.FollowWithCourse}
          followZoomLevel={17}
          followPitch={60}
        />
        {hasLocation && (
          <LocationPuck
            puckBearingEnabled
            puckBearing="course"
            model={{
              uri: avatarModel,
              // Real size is ~1.7 m, which is a few pixels at street zoom.
              scale: [15, 15, 15],
              rotation: [0, 0, 0],
            }}
          />
        )}
      </MapView>
    </View>
  );
}
