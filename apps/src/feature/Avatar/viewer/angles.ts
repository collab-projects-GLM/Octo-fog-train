/**
 * Turn `current` toward `target` the short way round, covering `rate * delta` of the remaining
 * angle (an exponential ease), all in radians. `rate` is per second and `delta` is in seconds,
 * so a long frame turns further than a short one but never overshoots.
 */
export function approachAngle(
  current: number,
  target: number,
  rate: number,
  delta: number,
): number {
  const full = Math.PI * 2;
  const diff =
    ((((target - current + Math.PI) % full) + full) % full) - Math.PI;
  return current + diff * Math.min(1, rate * delta);
}
