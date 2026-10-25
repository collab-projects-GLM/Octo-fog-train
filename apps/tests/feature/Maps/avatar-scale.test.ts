import { describe, expect, it } from "vitest";
import {
  AVATAR_HEIGHT_M,
  avatarScreenHeight,
  avatarVisibility,
} from "@/feature/Maps/avatar-scale";

/** Bhaktapur, where the avatar was verified on a device. */
const LATITUDE = 27.67;
const VIEW_HEIGHT = 800;
const CENTRE_Y = VIEW_HEIGHT / 2;

const heightAt = (
  overrides: Partial<Parameters<typeof avatarScreenHeight>[0]> = {},
) =>
  avatarScreenHeight({
    heightM: AVATAR_HEIGHT_M,
    zoom: 21.5,
    pitch: 60,
    latitude: LATITUDE,
    y: CENTRE_Y,
    viewHeight: VIEW_HEIGHT,
    ...overrides,
  });

describe("avatarScreenHeight", () => {
  it("is about 63 dp for a 1.7 m avatar at zoom 21.5 and pitch 60 (measured on device)", () => {
    // Measured: computed 62.8 dp, seen ~64.8 dp on screen.
    expect(heightAt()).toBeGreaterThan(62);
    expect(heightAt()).toBeLessThan(64);
  });

  it("matches the metres-per-dp maths looking straight along the ground", () => {
    // Pitch 90 on the equator: no foreshortening, no perspective offset.
    const metersPerDp = 78271.517 / 2 ** 21.5;
    expect(
      heightAt({ pitch: 90, latitude: 0, viewHeight: 0 }),
    ).toBeCloseTo(AVATAR_HEIGHT_M / metersPerDp, 6);
  });

  it("doubles with every zoom level", () => {
    expect(heightAt({ zoom: 20.5 }) * 2).toBeCloseTo(heightAt({ zoom: 21.5 }), 9);
  });

  it("is zero looking straight down: a standing figure has no height from above", () => {
    expect(heightAt({ pitch: 0 })).toBe(0);
  });

  it("grows toward the poles, where a dp covers fewer metres", () => {
    expect(heightAt({ latitude: 60, viewHeight: 0 })).toBeCloseTo(
      heightAt({ latitude: 0, viewHeight: 0 }) * 2,
      6,
    );
  });

  it("scales with the avatar's real height", () => {
    expect(heightAt({ heightM: 3.4 })).toBeCloseTo(heightAt({ heightM: 1.7 }) * 2, 9);
  });

  it("is smaller higher up the screen and larger lower down (perspective)", () => {
    const far = heightAt({ y: 100 });
    const centre = heightAt({ y: CENTRE_Y });
    const near = heightAt({ y: 700 });
    expect(far).toBeLessThan(centre);
    expect(centre).toBeLessThan(near);
  });

  it("ignores perspective when the view height is not known yet", () => {
    expect(heightAt({ viewHeight: 0, y: 5 })).toBe(heightAt({ viewHeight: 0, y: 700 }));
  });

  it("never goes to zero or negative near the horizon", () => {
    expect(heightAt({ pitch: 80, y: -5000 })).toBeGreaterThan(0);
  });
});

describe("avatarVisibility", () => {
  it("is hidden at and below 8 dp, a speck", () => {
    expect(avatarVisibility(0)).toBe(0);
    expect(avatarVisibility(8)).toBe(0);
  });

  it("is fully visible at and above 14 dp", () => {
    expect(avatarVisibility(14)).toBe(1);
    expect(avatarVisibility(63)).toBe(1);
  });

  it("ramps linearly in between", () => {
    expect(avatarVisibility(11)).toBeCloseTo(0.5, 12);
    expect(avatarVisibility(9)).toBeLessThan(avatarVisibility(12));
  });
});
