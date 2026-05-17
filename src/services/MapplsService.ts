import axios from 'axios';

// 🛰️ MAPMYINDIA (MAPPLS) TACTICAL SERVICE
// Direct Static Key implementation to avoid OAuth Client ID/Secret complexities.

const REST_KEY = import.meta.env.VITE_MAPMYINDIA_REST_KEY || "wyzopujjvzdbyogtdyzhbguilecucgwgfpmg";

export const fetchNearbyPoliceMappls = async (lat: number, lng: number) => {
  if (!REST_KEY) {
    console.error("Mappls Static Key is missing!");
    return [];
  }

  try {
    // 🛰️ Use server proxy to bypass CORS and inject the Static Key securely
    const url = `/mappls-search/places/nearby/json?keywords=POLICE&refLocation=${lat},${lng}&radius=10000&limit=10`;
    
    const response = await axios.get(url);

    if (response.data.suggestedLocations) {
      const uniqueStations: any[] = [];
      const seenAddresses = new Set<string>();
      let lastDistance = -1000;

      // Deduplicate results (Mappls often returns multiple POIs for the same compound)
      response.data.suggestedLocations.forEach((loc: any) => {
        const addressKey = loc.placeAddress ? loc.placeAddress.toLowerCase().trim() : "";
        const d = loc.distance || 0;

        // Skip if same address OR if distance is almost identical (< 50m difference)
        if ((addressKey && seenAddresses.has(addressKey)) || Math.abs(d - lastDistance) < 50) {
          return;
        }

        if (addressKey) seenAddresses.add(addressKey);
        lastDistance = d;
        uniqueStations.push(loc);
      });

      return uniqueStations.map((loc: any) => ({
        id: loc.eLoc,
        name: loc.placeName,
        address: loc.placeAddress,
        dist: loc.distance ? `${(loc.distance / 1000).toFixed(1)}km` : "Nearby",
        distVal: loc.distance || 0,
        lat: loc.latitude,
        lng: loc.longitude,
        phone: loc.mobile || "112"
      }));
    }
    return [];
  } catch (error) {
    console.error("Mappls Nearby Search Failed:", error);
    return [];
  }
};

export const fetchNearbyHospitalsMappls = async (lat: number, lng: number) => {
  if (!REST_KEY) return [];

  try {
    const url = `/mappls-search/places/nearby/json?keywords=HOSPITAL&refLocation=${lat},${lng}&radius=10000&limit=5`;
    const response = await axios.get(url);

    if (response.data.suggestedLocations) {
      const uniqueHospitals: any[] = [];
      const seenAddresses = new Set<string>();
      let lastDistance = -1000;

      response.data.suggestedLocations.forEach((loc: any) => {
        const addressKey = loc.placeAddress ? loc.placeAddress.toLowerCase().trim() : "";
        const d = loc.distance || 0;
        if ((addressKey && seenAddresses.has(addressKey)) || Math.abs(d - lastDistance) < 50) return;
        if (addressKey) seenAddresses.add(addressKey);
        lastDistance = d;
        uniqueHospitals.push(loc);
      });

      return uniqueHospitals.map((loc: any) => ({
        id: loc.eLoc,
        name: loc.placeName,
        address: loc.placeAddress,
        dist: loc.distance ? `${(loc.distance / 1000).toFixed(1)}km` : "Nearby",
        distVal: loc.distance || 0,
        lat: loc.latitude,
        lng: loc.longitude,
        phone: loc.mobile || "108"
      }));
    }
    return [];
  } catch (error) {
    console.error("Mappls Hospital Search Failed:", error);
    return [];
  }
};
