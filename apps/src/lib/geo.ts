/** [longitude, latitude], the order Mapbox uses. */
export type LngLat = [number, number];

export function toLngLat({
  longitude,
  latitude,
}: {
  longitude: number;
  latitude: number;
}): LngLat {
  return [longitude, latitude];
}

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
