import { describe, expect, it } from "vitest";
import { degToRad, toLngLat } from "@/lib/geo";

describe("toLngLat", () => {
  it("puts longitude first, the order Mapbox uses", () => {
    expect(toLngLat({ latitude: 27.67, longitude: 85.43 })).toEqual([85.43, 27.67]);
  });
});

describe("degToRad", () => {
  it("converts the common angles", () => {
    expect(degToRad(0)).toBe(0);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 12);
    expect(degToRad(180)).toBeCloseTo(Math.PI, 12);
    expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2, 12);
  });
});
