import { toLngLat, type LngLat } from "./geo";

/** One GPS fix, normalised from expo-location's coordinates. */
export type LiveFix = {
  coordinate: LngLat;
  /** Direction of travel in degrees clockwise from north; null while it is unknown. */
  course: number | null;
  /** Metres per second; null while it is unknown. */
  speed: number | null;
};

type RawCoords = {
  longitude: number;
  latitude: number;
  heading: number | null;
  speed: number | null;
};

/** expo-location reports -1 for "unknown" on Android; treat it as null. */
function knownOrNull(value: number | null): number | null {
  return value != null && value >= 0 ? value : null;
}

export function toLiveFix(coords: RawCoords): LiveFix {
  return {
    coordinate: toLngLat(coords),
    course: knownOrNull(coords.heading),
    speed: knownOrNull(coords.speed),
  };
}
