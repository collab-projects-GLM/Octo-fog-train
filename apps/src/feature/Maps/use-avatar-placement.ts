import type { MapState, MapView } from "@rnmapbox/maps";
import { useRef, type RefObject } from "react";
import type { LayoutChangeEvent } from "react-native";
import { useAvatarStore } from "@/context/stores/avatar-store";
import { createCoalescer } from "@/lib/coalesce";
import type { LiveFix } from "@/lib/location";
import { facingYaw, isWalking } from "./avatar-pose";
import {
  AVATAR_HEIGHT_M,
  avatarScreenHeight,
  avatarVisibility,
} from "./avatar-scale";
import type { AvatarPuckHandle } from "./AvatarPuck";
import { GAME_VIEW } from "./map-config";

/**
 * Keeps the avatar standing on the user's GPS point as the camera moves, sized in proportion to
 * the map there, facing the way they travel and walking when they do.
 *
 * Everything here runs per camera frame or per GPS fix, so it holds no React state: it mirrors
 * what it needs in refs, projects with `getPointInView` and pushes the result into the avatar
 * puck through its handle. (The one exception is the avatar-visible flag, which goes to a store
 * that only the live marker reads.)
 *
 * The caller owns the two refs (so they can go on the MapView and the AvatarPuck) and passes
 * them in. Wire up the returned handlers: `onLayout` on the map's container, `onCameraChanged` /
 * `onMapIdle` on the MapView, `onFix` to `useLiveLocation`.
 */
export function useAvatarPlacement(
  map: RefObject<MapView | null>,
  avatar: RefObject<AvatarPuckHandle | null>,
) {
  const fix = useRef<LiveFix | null>(null);
  /** The camera as last reported, plus the map view's height; all the projection needs. */
  const camera = useRef({
    heading: 0,
    zoom: GAME_VIEW.zoom,
    pitch: GAME_VIEW.pitch,
    height: 0,
  });
  /** The last known direction of travel; kept while standing still. */
  const course = useRef<number | null>(null);

  /**
   * Stand the avatar on the user's GPS point, wherever the camera currently shows it, and size
   * it in proportion to the map there (zoom, tilt, and how far from the camera that spot is).
   */
  const project = async () => {
    const current = fix.current;
    if (!current || !map.current) return;
    const [x, y] = await map.current.getPointInView(current.coordinate);
    const height = avatarScreenHeight({
      heightM: AVATAR_HEIGHT_M,
      zoom: camera.current.zoom,
      pitch: camera.current.pitch,
      latitude: current.coordinate[1],
      y,
      viewHeight: camera.current.height,
    });
    avatar.current?.place(x, y, height);
    useAvatarStore.getState().setShown(avatarVisibility(height) > 0);
  };

  // Coalesced: calls during a projection collapse into one more run that sees the latest state.
  // Created on first use, not during render. `project` reads only refs, so the closure from the
  // first call is as good as any later one.
  const coalescer = useRef<(() => Promise<void>) | null>(null);
  const place = () => {
    coalescer.current ??= createCoalescer(project);
    return coalescer.current();
  };

  /** Face the way the user travels, relative to how the map is turned, and walk when they move. */
  const pose = () => {
    avatar.current?.setPose(
      facingYaw(course.current, camera.current.heading),
      isWalking(fix.current?.speed ?? null),
    );
  };

  const onFix = (next: LiveFix) => {
    fix.current = next;
    if (next.course != null && isWalking(next.speed)) course.current = next.course;
    void place();
    pose();
  };

  const onCameraChanged = (state: MapState) => {
    camera.current.heading = state.properties.heading;
    camera.current.zoom = state.properties.zoom;
    camera.current.pitch = state.properties.pitch;
    void place();
    pose();
  };

  const onLayout = (event: LayoutChangeEvent) => {
    camera.current.height = event.nativeEvent.layout.height;
  };

  return { onFix, onCameraChanged, onMapIdle: place, onLayout };
}
