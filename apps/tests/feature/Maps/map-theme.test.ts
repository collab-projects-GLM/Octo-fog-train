import { describe, expect, it } from "vitest";
import { MAP_COLORS, MAP_THEMES, mapTheme } from "@/feature/Maps/map-theme";
import { PALETTE } from "@/style/palette.generated";

describe("mapTheme", () => {
  it("gives every map color the NativeWind color it is mapped to", () => {
    for (const scheme of ["light", "dark"] as const) {
      const theme = mapTheme(scheme);
      for (const [slot, token] of Object.entries(MAP_COLORS)) {
        expect(theme[slot as keyof typeof MAP_COLORS]).toBe(PALETTE[scheme][token]);
      }
    }
  });

  it("uses daylight in both schemes, so the dark palette isn't darkened twice", () => {
    expect(mapTheme("light").lightPreset).toBe("day");
    expect(mapTheme("dark").lightPreset).toBe("day");
  });

  it("colors points of interest from the palette, not per category", () => {
    expect(mapTheme("light").colorModePointOfInterestLabels).toBe("single");
  });

  it("follows the palette, so changing a token changes the map", () => {
    // water is a light blue by day and a dark one at night
    expect(MAP_THEMES.light.colorWater).toBe(PALETTE.light.water);
    expect(MAP_THEMES.dark.colorWater).toBe(PALETTE.dark.water);
    expect(MAP_THEMES.light.colorWater).not.toBe(MAP_THEMES.dark.colorWater);
  });

  it("builds each theme once", () => {
    expect(MAP_THEMES.light).toBe(MAP_THEMES.light);
    expect(MAP_THEMES.light).toEqual(mapTheme("light"));
  });

  it("only produces colors Mapbox can parse", () => {
    for (const theme of Object.values(MAP_THEMES)) {
      for (const [slot, value] of Object.entries(theme)) {
        if (!slot.startsWith("color") || slot.startsWith("colorMode")) continue;
        expect(value, slot).toMatch(/^hsl\(\d+(\.\d+)?, \d+(\.\d+)?%, \d+(\.\d+)?%\)$/);
      }
    }
  });
});
