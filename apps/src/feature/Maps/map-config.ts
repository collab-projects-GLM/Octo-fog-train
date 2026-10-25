/**
 * Camera presets and map constants. Pure data, so it can be read (and tested) without the map.
 */

type ViewTarget = { zoom: number; pitch: number };

/**
 * The close-up "game" view: the avatar keeps its real proportions to the map, so it only reads
 * as a person when the map is close in, like a third-person camera (about 63 dp tall at zoom
 * 21.5 and 60° at 27°N). Mapbox settles a little under the requested follow zoom.
 */
export const GAME_VIEW: ViewTarget = { zoom: 21.5, pitch: 60 };

/**
 * The normal map: a street-level overview like any maps app. The avatar is a speck here (about
 * 2 dp), below her fade threshold, so she fades out and the live marker takes over. Keep it
 * that way when changing this: tests/map-config.test.ts checks it.
 */
export const MAP_VIEW: ViewTarget = { zoom: 16.5, pitch: 50 };

type ViewState = {
  /** Tilted 3D, or top-down. */
  tilted: boolean;
  /** The zoomed-out normal map, or the close-up avatar view. */
  normalMap: boolean;
};

/** The zoom and pitch the camera should have for the current view state. */
export function cameraTarget({ tilted, normalMap }: ViewState): ViewTarget {
  const view = normalMap ? MAP_VIEW : GAME_VIEW;
  return { zoom: view.zoom, pitch: tilted ? view.pitch : 0 };
}

export const MAP_STYLE_URL = "mapbox://styles/mapbox/standard";

/** Terrain source for the exaggeration switch (Standard's own DEM isn't reachable from JS). */
export const TERRAIN_SOURCE_ID = "terrain-dem";
export const TERRAIN_SOURCE_URL = "mapbox://mapbox.mapbox-terrain-dem-v1";

/**
 * While the avatar is visible the marker's pulse stays this tight (pixels). Sized to the GPS
 * accuracy it would be tens of metres, which at close zoom covers the whole screen.
 */
export const CLOSE_PULSE_RADIUS = 24;
