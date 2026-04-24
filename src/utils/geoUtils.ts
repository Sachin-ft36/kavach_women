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
