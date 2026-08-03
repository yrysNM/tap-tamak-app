/** Mean Earth radius in kilometers. */
export const EARTH_RADIUS_KM = 6371;

/** Default delivery radius in kilometers. */
export const DEFAULT_DELIVERY_RADIUS_KM = 2;

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Convert degrees to radians before using trigonometric functions. */
export function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Haversine distance between two geographic points in kilometers.
 * Uses Earth radius = 6371 km.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Returns true when the distance between two points is less than or equal to the radius.
 * Delivery is allowed only inside this radius (default: 2 km).
 *
 * @example
 * // Within 2 km (Almaty center vs nearby point)
 * isWithinDeliveryRadius(43.238949, 76.889709, 43.245, 76.895); // true
 *
 * @example
 * // Outside 2 km
 * isWithinDeliveryRadius(43.238949, 76.889709, 43.270, 76.950); // false
 */
export function isWithinDeliveryRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusKm: number = DEFAULT_DELIVERY_RADIUS_KM,
): boolean {
  const distanceKm = haversineDistanceKm(lat1, lng1, lat2, lng2);
  return distanceKm <= radiusKm;
}
