import Mapbox, {
  Camera,
  LocationPuck,
  MapView,
  RasterDemSource,
  StyleImport,
  Terrain,
  UserTrackingMode,
  type MapState,
} from "@rnmapbox/maps";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// The player's avatar; swap for another `.vrm` whenever.
import avatarModel from "../../../assets/models/sfw.vrm";
import AvatarPuck, { type AvatarPuckHandle } from "./AvatarPuck";
import { AVATAR_FADE_START_DP, AVATAR_HEIGHT_M, avatarScreenHeight } from "./avatar-scale";
import MapControls from "./MapControls";
import { useLiveLocation } from "./use-live-location";
import { useLocationPermission } from "./use-location-permission";
import { useStartCenter } from "./use-start-center";

// Inlined at build time, so it must be read with this exact static expression.
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

if (MAPBOX_TOKEN) {
  void Mapbox.setAccessToken(MAPBOX_TOKEN);
}

// The avatar keeps its real proportions to the map (AVATAR_HEIGHT_M), so it only reads as a
// person when the map is close in, like a third-person game camera: about 50 dp tall at zoom 21
// at 27°N, 3 dp at zoom 17. Mapbox settles a little under the requested follow zoom.
const GAME_ZOOM = 21.5;
const GAME_PITCH = 60;
// The normal map: a street-level overview like any maps app. The avatar is a speck here, so it
// fades out and the live marker takes over.
const MAP_ZOOM = 16.5;
const MAP_PITCH = 50;
/** Terrain source for the exaggeration switch below (Standard's own DEM isn't reachable). */
const TERRAIN_SOURCE = "terrain-dem";
/**
 * While the avatar is visible the marker's pulse stays this tight (pixels). Sized to the GPS
 * accuracy it would be tens of metres, which at close zoom covers the whole screen.
 */
const CLOSE_PULSE_RADIUS = 24;
/** Metres per second above which the avatar walks instead of standing. */
const WALK_SPEED = 0.7;

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});

/**
 * @abstract Tilted 3D map (Mapbox Standard style, extruded buildings) that follows the user,
 * with a live location marker and the player's VRM avatar standing on it. Includes the camera
 * controls (recenter, 2D/3D).
 * @returns JSX
 */
export default function MapViewComponent() {
  const insets = useSafeAreaInsets();
  const hasLocation = useLocationPermission();
  const live = useLiveLocation(hasLocation);
  const startCenter = useStartCenter(hasLocation);

  const [following, setFollowing] = useState(true);
  const [tilted, setTilted] = useState(true);
  const [terrain, setTerrain] = useState(true);
  const [buildings, setBuildings] = useState(true);
  const [normalMap, setNormalMap] = useState(false);
  // True while the avatar is big enough to see; set from `place` as the camera moves.
  const [avatarShown, setAvatarShown] = useState(true);
  const zoom = normalMap ? MAP_ZOOM : GAME_ZOOM;
  const pitch = tilted ? (normalMap ? MAP_PITCH : GAME_PITCH) : 0;

  const map = useRef<MapView>(null);
  const camera = useRef<Camera>(null);
  const avatar = useRef<AvatarPuckHandle>(null);

  // Read by the map callbacks below, which must not re-create on every GPS fix.
  const liveRef = useRef(live);
  const mapHeading = useRef(0);
  const mapView = useRef({ zoom: GAME_ZOOM, pitch: GAME_PITCH });
  const mapHeight = useRef(0);
  const course = useRef<number | null>(null);
  const projecting = useRef(false);
  const projectAgain = useRef(false);

  /**
   * Stand the avatar on the user's GPS point, wherever the camera currently shows it, and size
   * it in proportion to the map there (zoom, tilt, and how far from the camera that spot is).
   */
  const place = useCallback(async () => {
    if (projecting.current) {
      projectAgain.current = true;
      return;
    }
    projecting.current = true;
    try {
      do {
        projectAgain.current = false;
        const coordinate = liveRef.current?.coordinate;
        if (!coordinate || !map.current) break;
        const [x, y] = await map.current.getPointInView(coordinate);
        avatar.current?.moveTo(x, y);
        const height = avatarScreenHeight({
          heightM: AVATAR_HEIGHT_M,
          zoom: mapView.current.zoom,
          pitch: mapView.current.pitch,
          latitude: coordinate[1],
          y,
          viewHeight: mapHeight.current,
        });
        avatar.current?.setHeight(height);
        // Only re-renders when it flips, not on every camera frame.
        setAvatarShown(height >= AVATAR_FADE_START_DP);
      } while (projectAgain.current);
    } catch {
      // The map isn't ready yet; the next camera change retries.
    } finally {
      projecting.current = false;
    }
  }, []);

  /** Face the way the user travels, relative to how the map is turned, and walk when they move. */
  const pose = useCallback(() => {
    const travel = course.current ?? mapHeading.current;
    const relative = ((travel - mapHeading.current) * Math.PI) / 180;
    // 0 on screen is "up the map", which is the avatar's back toward the camera (yaw π).
    const yaw = Math.round((Math.PI - relative) * 100) / 100;
    avatar.current?.setPose(yaw, (liveRef.current?.speed ?? 0) > WALK_SPEED);
  }, []);

  useEffect(() => {
    liveRef.current = live;
    if (live?.course != null && (live.speed ?? 0) > WALK_SPEED)
      course.current = live.course;
    void place();
    pose();
  }, [live, place, pose]);

  const onCameraChanged = useCallback(
    (state: MapState) => {
      mapHeading.current = state.properties.heading;
      mapView.current = { zoom: state.properties.zoom, pitch: state.properties.pitch };
      // Touching the map ends follow mode. Setting the prop to false (rather than relying on
      // the native tracking-mode event, which never reaches JS here) lets the recenter button
      // switch it back on. React ignores the repeat while a gesture is active.
      if (state.gestures.isGestureActive) setFollowing(false);
      void place();
      pose();
    },
    [place, pose],
  );

  // A tilt change while following is applied through `followPitch`; otherwise move the camera.
  useEffect(() => {
    if (following) return;
    camera.current?.setCamera({
      pitch,
      animationDuration: 400,
      animationMode: "easeTo",
    });
  }, [pitch, following]);

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
      <View
        className="w-full flex-1"
        onLayout={(event) => {
          mapHeight.current = event.nativeEvent.layout.height;
        }}
      >
        <MapView
          ref={map}
          style={styles.map}
          styleURL="mapbox://styles/mapbox/standard"
          scaleBarEnabled={false}
          onCameraChanged={onCameraChanged}
          onMapIdle={place}
        >
          <StyleImport
            id="basemap"
            existing
            config={{
              show3dObjects: buildings,
              show3dBuildings: buildings,
              show3dFacades: buildings,
              show3dLandmarks: buildings,
              show3dTrees: buildings,
              lightPreset: "day",
            }}
          />
          {/* Terrain on/off is the exaggeration: 1 is the real relief, 0 is flat ground. */}
          <RasterDemSource
            id={TERRAIN_SOURCE}
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={514}
            maxZoomLevel={14}
          />
          <Terrain
            sourceID={TERRAIN_SOURCE}
            style={{ exaggeration: terrain ? 1 : 0 }}
          />
          <Camera
            ref={camera}
            // `defaultSettings` only apply on mount, so remount once the first fix is known. The
            // camera then starts on the user, tilted, instead of flying in from 0°N 0°E.
            key={startCenter ? "located" : "default"}
            defaultSettings={{
              centerCoordinate: startCenter ?? undefined,
              zoomLevel: GAME_ZOOM,
              pitch: GAME_PITCH,
            }}
            followUserLocation={hasLocation && following}
            followUserMode={UserTrackingMode.FollowWithCourse}
            followZoomLevel={zoom}
            followPitch={pitch}
          />
          {/* The live marker: a pulsing dot with the accuracy ring, under the avatar's feet. */}
          {hasLocation && (
            <LocationPuck
              puckBearingEnabled
              puckBearing="course"
              pulsing={{
                isEnabled: true,
                radius: avatarShown ? CLOSE_PULSE_RADIUS : "accuracy",
              }}
            />
          )}
        </MapView>

        {hasLocation && <AvatarPuck ref={avatar} model={avatarModel} />}

        <MapControls
          following={following}
          tilted={tilted}
          terrain={terrain}
          buildings={buildings}
          normalMap={normalMap}
          onRecenter={() => setFollowing(true)}
          onToggleTilt={() => setTilted((current) => !current)}
          onToggleTerrain={() => setTerrain((current) => !current)}
          onToggleBuildings={() => setBuildings((current) => !current)}
          // Switching view recenters on the user: follow mode zooms and tilts correctly over
          // terrain, while moving a free camera to a new zoom there collapses the pitch.
          onToggleNormalMap={() => {
            setNormalMap((current) => !current);
            setFollowing(true);
          }}
        />
      </View>
    </View>
  );
}
