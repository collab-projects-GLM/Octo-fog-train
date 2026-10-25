import { degToRad } from "@/lib/geo";

/** Metres per second above which the avatar walks instead of standing. */
export const WALK_SPEED = 0.7;

/** Whether a fix's speed (null while unknown) is fast enough to walk. */
export function isWalking(speed: number | null): boolean {
  return (speed ?? 0) > WALK_SPEED;
}

/**
 * The avatar's yaw (radians, in the viewer's convention: 0 faces the camera, π shows the back)
 * so she faces the way the user travels, relative to how the map is turned. With no known
 * course she faces the way the map points. 0° relative is "up the map", which is her back
 * toward the camera.
 */
export function facingYaw(
  courseDeg: number | null,
  mapHeadingDeg: number,
): number {
  const travel = courseDeg ?? mapHeadingDeg;
  return Math.PI - degToRad(travel - mapHeadingDeg);
}
