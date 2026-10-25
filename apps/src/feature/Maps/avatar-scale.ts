import { degToRad } from "@/lib/geo";

/**
 * How tall the avatar stands in the world, in metres. This is the one place to change it: later
 * it can come from the user's own height setting instead of a constant.
 */
export const AVATAR_HEIGHT_M = 1.7;

/**
 * Metres under one dp at zoom 0 on the equator: the Mapbox world is 512 dp wide there, and the
 * equator is 40,075,016.686 m round.
 */
const METERS_PER_DP_AT_ZOOM_0 = 78271.517;

/** At or below this on-screen height (dp) the avatar is hidden: a speck, the marker says it all. */
const FADE_START_DP = 8;
/** At this on-screen height (dp) and above the avatar is fully visible. */
const FADE_END_DP = 14;

/**
 * How visible the avatar should be at an on-screen height: 0 (hidden, so the viewer can stop
 * drawing) up to 1, ramping linearly between the two thresholds. The one definition of
 * "visible": opacity, pausing the viewer and the marker's pulse all read it.
 */
export function avatarVisibility(heightDp: number): number {
  const ramp = (heightDp - FADE_START_DP) / (FADE_END_DP - FADE_START_DP);
  return Math.min(1, Math.max(0, ramp));
}

/** Mapbox looks through a 36.87° vertical field of view, so tan(fov / 2) is 1/3. */
const HALF_FOV_TAN = 1 / 3;

type AvatarScaleInput = {
  /** How tall the avatar is, in metres. */
  heightM: number;
  /** Map camera zoom and pitch (degrees, 0 = straight down). */
  zoom: number;
  pitch: number;
  /** Latitude the avatar stands at; metres per dp shrink toward the poles. */
  latitude: number;
  /** Where its feet are on screen: dp from the top of the map view. */
  y: number;
  /** Height of the map view in dp. The camera's scale is quoted at its vertical centre. */
  viewHeight: number;
};

/**
 * On-screen height in dp of a standing figure, in proportion to the map around it.
 *
 * Two things set that proportion. The map's zoom gives the scale at the centre of the view
 * (metres per dp). Then, because the camera looks down at `pitch`, the figure is foreshortened by
 * sin(pitch), and it is bigger or smaller than at the centre depending on how far its feet are
 * from the camera: higher on a tilted screen means farther away and smaller. The perspective
 * factor is the standard pinhole result for a ground plane tilted by `pitch`:
 * 1 - (offset above centre / focal length) * tan(pitch).
 */
export function avatarScreenHeight({
  heightM,
  zoom,
  pitch,
  latitude,
  y,
  viewHeight,
}: AvatarScaleInput): number {
  const pitchRad = degToRad(pitch);
  const metersPerDp =
    (METERS_PER_DP_AT_ZOOM_0 * Math.cos(degToRad(latitude))) / 2 ** zoom;

  let perspective = 1;
  if (viewHeight > 0) {
    const focal = viewHeight / 2 / HALF_FOV_TAN;
    const aboveCentre = viewHeight / 2 - y;
    // Floor it so a point near the horizon can't flip the sign.
    perspective = Math.max(0.05, 1 - (aboveCentre / focal) * Math.tan(pitchRad));
  }

  return ((heightM * Math.sin(pitchRad)) / metersPerDp) * perspective;
}
