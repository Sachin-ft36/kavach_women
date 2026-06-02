/**
 * Geographic Utility Module for KAVACH Tactical Engine
 */

/**
 * Calculates the great-circle distance between two points on the Earth surface using the Haversine formula.
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadian = (angle: number) => (Math.PI / 180) * angle;

  const R = 6371; // Earth radius in kilometers
  const dLat = toRadian(lat2 - lat1);
  const dLon = toRadian(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadian(lat1)) * Math.cos(toRadian(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * OpenStreetMap Nominatim Geocoding
 * Converts a text location into lat/lng coordinates (Offline/Free alternative to Google Maps)
 */
export async function geocodeLocation(address: string): Promise<[number, number] | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    // Note: Nominatim requires a user-agent, browsers handle it for fetch but good practice to know.
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch (error) {
    console.error("KAVACH Geocoder failure:", error);
    return null; // Geocoding failed, target coords will not be tracked (fallback to displacement only)
  }
}

/**
 * OpenStreetMap Nominatim Reverse Geocoding
 * Converts lat/lng into a readable City/State object for Jurisdiction routing
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; state: string } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`);
    const data = await res.json();
    if (data && data.address) {
      const city = data.address.city || data.address.town || data.address.county || data.address.state_district || "Unknown Region";
      const state = data.address.state || "Unknown State";
      return { city, state };
    }
    return { city: "Unknown Routing Area", state: "Unknown Jurisdiction" };
  } catch (error) {
    console.error("KAVACH Reverse Geocoder error:", error);
    return null;
  }
}

/**
 * Calculates the shortest distance in meters from a point (user GPS) to a line segment (poly-line segment).
 * Approximation using flat Earth projection (highly accurate for small distances like 500m).
 */
export function pointToLineSegmentDistanceMeters(
  px: number, py: number, // point lng, lat
  x1: number, y1: number, // segment start lng, lat
  x2: number, y2: number  // segment end lng, lat
): number {
  // We approximate 1 deg lat = 111320 meters, 1 deg lng = 111320 * cos(lat) meters
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos(py * Math.PI / 180);

  // Convert degrees to pseudo-meters relative to point 1
  const dx = (x2 - x1) * mPerDegLng;
  const dy = (y2 - y1) * mPerDegLat;
  const p_dx = (px - x1) * mPerDegLng;
  const p_dy = (py - y1) * mPerDegLat;

  const segmentLengthSquared = dx * dx + dy * dy;
  let t = 0;
  if (segmentLengthSquared > 0) {
    t = (p_dx * dx + p_dy * dy) / segmentLengthSquared;
    t = Math.max(0, Math.min(1, t)); // clamp to [0, 1]
  }

  // Projection point on the segment
  const proj_x = x1 * mPerDegLng + t * dx;
  const proj_y = y1 * mPerDegLat + t * dy;
  const p_x_meters = px * mPerDegLng;
  const p_y_meters = py * mPerDegLat;

  const dist = Math.sqrt(Math.pow(p_x_meters - proj_x, 2) + Math.pow(p_y_meters - proj_y, 2));
  return dist;
}

/**
 * Calculates shortest distance from point to entire polyline (array of [lng, lat])
 */
export function distanceToPolylineMeters(px: number, py: number, polyline: [number, number][]): number {
  if (!polyline || polyline.length < 2) return 0;
  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = polyline[i];
    const p2 = polyline[i + 1];
    const dist = pointToLineSegmentDistanceMeters(px, py, p1[0], p1[1], p2[0], p2[1]);
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance;
}

/**
 * Fetches the optimal route polyline from Mapbox Directions API for Geofencing
 */
export async function fetchMapboxRoute(startLng: number, startLat: number, endLng: number, endLat: number): Promise<[number, number][] | null> {
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
  if (!MAPBOX_TOKEN) return null;
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates; // array of [lng, lat]
    }
    return null;
  } catch (error) {
    console.error("Mapbox Routing Engine failed:", error);
    return null;
  }
}
