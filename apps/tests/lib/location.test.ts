import { describe, expect, it } from "vitest";
import { toLiveFix } from "@/lib/location";

const base = { longitude: 85.43, latitude: 27.67, heading: 90, speed: 1.4 };

describe("toLiveFix", () => {
  it("converts coordinates to [lng, lat] and keeps known course and speed", () => {
    expect(toLiveFix(base)).toEqual({
      coordinate: [85.43, 27.67],
      course: 90,
      speed: 1.4,
    });
  });

  it("treats -1 as unknown, which is how Android reports it", () => {
    const fix = toLiveFix({ ...base, heading: -1, speed: -1 });
    expect(fix.course).toBeNull();
    expect(fix.speed).toBeNull();
  });

  it("treats null as unknown", () => {
    const fix = toLiveFix({ ...base, heading: null, speed: null });
    expect(fix.course).toBeNull();
    expect(fix.speed).toBeNull();
  });

  it("keeps zero: standing still and facing north are real values", () => {
    const fix = toLiveFix({ ...base, heading: 0, speed: 0 });
    expect(fix.course).toBe(0);
    expect(fix.speed).toBe(0);
  });
});
