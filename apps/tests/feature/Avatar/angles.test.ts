import { describe, expect, it } from "vitest";
import { approachAngle } from "@/feature/Avatar/viewer/angles";

describe("approachAngle", () => {
  it("covers rate * delta of the remaining angle", () => {
    // 8 per second over 0.05 s is 40% of the way.
    expect(approachAngle(0, 1, 8, 0.05)).toBeCloseTo(0.4, 12);
  });

  it("never overshoots on a long frame", () => {
    expect(approachAngle(0, 1, 8, 1)).toBe(1);
    expect(approachAngle(0, -1, 8, 5)).toBe(-1);
  });

  it("stays put when already at the target", () => {
    expect(approachAngle(1.2, 1.2, 8, 0.016)).toBeCloseTo(1.2, 12);
  });

  it("takes the short way round the wrap at ±π", () => {
    // From 3.0 to -3.0 rad the short way is forward through π (about 0.28 rad), not back
    // through 0 (6 rad).
    const next = approachAngle(3, -3, 1, 1);
    expect(next).toBeCloseTo(-3 + Math.PI * 2, 9);
    expect(approachAngle(-3, 3, 1, 1)).toBeCloseTo(3 - Math.PI * 2, 9);
  });

  it("turns toward a target more than a full turn away without spinning", () => {
    const next = approachAngle(0, Math.PI * 2 + 0.5, 8, 0.05);
    expect(next).toBeCloseTo(0.2, 9);
  });
});
