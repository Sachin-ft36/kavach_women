import { getOfficialPolicePhone } from '../../utils/policePhoneUtils';

export const safeParsePayload = (response: any): any => {
  if (!response) return null;
  const targetData = response.data;
  if (typeof targetData === 'string') {
    try {
      return JSON.parse(targetData);
    } catch {
      return null;
    }
  }
  return targetData;
};

export const processMapplsLocations = (locations: any[], fallbackPhone: string) => {
  const sorted = [...locations].sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
  const uniqueStations: any[] = [];
  const seenNames = new Set<string>();

  sorted.forEach((loc: any) => {
    const nameKey = (loc.placeName || '').toLowerCase().trim();
    if (!nameKey || seenNames.has(nameKey)) return;
    seenNames.add(nameKey);
    uniqueStations.push(loc);
  });

  return uniqueStations.map((loc: any) => {
    const pLat = loc.latitude || loc.lat || loc.y || undefined;
    const pLng = loc.longitude || loc.lng || loc.lon || loc.x || undefined;
    
    return {
      id: loc.eLoc || Math.random().toString(),
      name: loc.placeName || "Local Station",
      address: loc.placeAddress || "",
      dist: loc.distance ? `${(loc.distance / 1000).toFixed(2)}km` : "Nearby",
      distVal: loc.distance ? (loc.distance / 1000) : 0,
      lat: pLat,
      lng: pLng,
      phone: getOfficialPolicePhone(loc.placeName || "", loc.mobile || fallbackPhone)
    };
  }).filter((loc: any) => loc.lat !== undefined && loc.lng !== undefined);
};
