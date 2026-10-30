import { PALETTE, type ColorToken } from "@/style/palette.generated";

export type MapScheme = keyof typeof PALETTE;

/**
 * Which NativeWind color each of the Standard basemap's color settings takes. This is the one
 * place that decides how the app's palette (src/style/brand.css) shows up on the map: change a
 * color there and the map follows, in light and dark; to restyle a part of the map, point its
 * setting at another token here. A setting left out keeps Mapbox's own color.
 *
 * The roles follow how the UI uses them: `muted` is the quiet surface things sit on, `card` a
 * raised one, `border` / `ring` the strokes, `muted-foreground` secondary text.
 */
export const MAP_COLORS = {
  // The ground.
  colorLand: "muted",
  colorWater: "water",
  colorGreenspace: "greenspace",
  // Zoned land is left to read as plain ground, without Mapbox's pastel tints.
  colorCommercial: "secondary",
  colorEducation: "secondary",
  colorMedical: "secondary",
  colorIndustrial: "secondary",
  // What stands on it.
  colorBuildings: "card",
  // Roads, from the smallest up.
  colorRoads: "background",
  colorTrunks: "ring",
  colorMotorways: "muted-foreground",
  // Text and lines on top.
  colorPlaceLabels: "foreground",
  colorRoadLabels: "muted-foreground",
  colorPointOfInterestLabels: "muted-foreground",
  colorAdminBoundaries: "muted-foreground",
} as const satisfies Record<string, ColorToken>;

/**
 * Settings that make the palette the whole look. Daylight in both schemes: the other presets
 * darken the map on top of the dark palette, which leaves it near black. Points of interest take
 * one color instead of Mapbox's per-category ones.
 */
const FIXED = {
  lightPreset: "day",
  colorModePointOfInterestLabels: "single",
} as const;

/** Config for the Standard basemap import: `FIXED` and every color in `MAP_COLORS`. */
export type MapTheme = typeof FIXED & Record<keyof typeof MAP_COLORS, string>;

/** The map's colors for a color scheme, taken from the NativeWind palette. */
export function mapTheme(scheme: MapScheme): MapTheme {
  const palette = PALETTE[scheme];
  const colors = {} as Record<keyof typeof MAP_COLORS, string>;
  for (const slot of Object.keys(MAP_COLORS) as (keyof typeof MAP_COLORS)[]) {
    colors[slot] = palette[MAP_COLORS[slot]];
  }
  return { ...FIXED, ...colors };
}

/** Built once, so the map components get the same object every render and skip the work. */
export const MAP_THEMES: Record<MapScheme, MapTheme> = {
  light: mapTheme("light"),
  dark: mapTheme("dark"),
};
