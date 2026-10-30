import { describe, expect, it } from "vitest";
import {
  avatarVisibility,
  avatarScreenHeight,
  AVATAR_HEIGHT_M,
} from "@/feature/Maps/avatar-scale";
import {
  cameraTarget,
  GAME_VIEW,
  MAP_VIEW,
} from "@/feature/Maps/map-config";

describe("cameraTarget", () => {
  it("uses the close-up view and its tilt by default", () => {
    expect(cameraTarget({ tilted: true, normalMap: false })).toEqual(GAME_VIEW);
  });

  it("uses the zoomed-out view and its tilt for the normal map", () => {
    expect(cameraTarget({ tilted: true, normalMap: true })).toEqual(MAP_VIEW);
  });

  it("keeps each view's zoom but looks straight down when not tilted", () => {
    expect(cameraTarget({ tilted: false, normalMap: false })).toEqual({
      zoom: GAME_VIEW.zoom,
      pitch: 0,
    });
    expect(cameraTarget({ tilted: false, normalMap: true })).toEqual({
      zoom: MAP_VIEW.zoom,
      pitch: 0,
    });
  });
});

describe("view presets and the avatar", () => {
  const sizeAt = (view: { zoom: number; pitch: number }, latitude: number) =>
    avatarScreenHeight({
      heightM: AVATAR_HEIGHT_M,
      zoom: view.zoom,
      pitch: view.pitch,
      latitude,
      y: 400,
      viewHeight: 800,
    });

  it("makes the avatar fully visible in the close-up view", () => {
    expect(avatarVisibility(sizeAt(GAME_VIEW, 27.67))).toBe(1);
  });

  it("makes the avatar a hidden speck in the normal map, wherever people live", () => {
    // The normal map relies on this: the marker takes over from the avatar there.
    for (const latitude of [0, 27.67, 51.5, 60]) {
      expect(avatarVisibility(sizeAt(MAP_VIEW, latitude))).toBe(0);
    }
  });
});
