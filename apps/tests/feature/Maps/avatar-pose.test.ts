import { describe, expect, it } from "vitest";
import { facingYaw, isWalking, WALK_SPEED } from "@/feature/Maps/avatar-pose";

describe("isWalking", () => {
  it("is false while the speed is unknown", () => {
    expect(isWalking(null)).toBe(false);
  });

  it("is false at or below the walking threshold, which filters GPS jitter", () => {
    expect(isWalking(0)).toBe(false);
    expect(isWalking(WALK_SPEED)).toBe(false);
  });

  it("is true above the threshold", () => {
    expect(isWalking(WALK_SPEED + 0.01)).toBe(true);
    expect(isWalking(1.4)).toBe(true);
  });
});

describe("facingYaw", () => {
  // Viewer convention: 0 faces the camera, π shows the back.
  it("shows her back, walking up the map, with no known course", () => {
    expect(facingYaw(null, 0)).toBeCloseTo(Math.PI, 12);
    expect(facingYaw(null, 137)).toBeCloseTo(Math.PI, 12);
  });

  it("shows her back when travelling the way the map points", () => {
    expect(facingYaw(90, 90)).toBeCloseTo(Math.PI, 12);
  });

  it("turns with the direction of travel relative to the map", () => {
    // Travelling 90° clockwise of the map's heading is to the right on screen.
    expect(facingYaw(180, 90)).toBeCloseTo(Math.PI / 2, 12);
    expect(facingYaw(0, 90)).toBeCloseTo((3 * Math.PI) / 2, 12);
  });

  it("faces the camera when travelling back toward it", () => {
    expect(facingYaw(270, 90)).toBeCloseTo(0, 12);
  });
});
