import axios from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

// Ensure strict key fallback structures to protect security perimeters
const MAPPLS_KEY = import.meta.env.VITE_MAPMYINDIA_REST_KEY;
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;

/**
 * Helper to normalize cross-platform data payloads.
 * Forcefully converts raw background text strings into structured Javascript objects.
 */
const safeParsePayload = (response: any): any => {
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

export const isOfficialPoliceStation = (name: string): boolean => {
  if (!name) return false;
  const lower = name.toLowerCase();

  if (lower.includes('police')) return true;

  const officialTerms = [
    'station', 'chowki', 'chouki', 'chowky', 'chouky', 'thana', 'outpost',
    'point', 'hq', 'headquarter', 'control', 'post', 'line', 'traffic',
    'office', 'cell', 'force', 'camp', 'chowk', 'division', 'commissioner',
    'headquarters', 'auxiliary', 'auxilliary', 'support', 'mahila', 'unit',
    'superintendent', 'inspector', 'general', 'crpf', 'bsf', 'cisf', 'itbp', 'rpf', 'sp', 'dsp', 'collector'
  ];

  const personalTerms = ['house', 'home', 'residence', 'nivas', 'niwas', 'bungalow', 'flat'];
  const hasPersonalTerm = personalTerms.some(term => lower.includes(term));
  const hasOfficialTerm = officialTerms.some(term => lower.includes(term));

  if (hasPersonalTerm && !hasOfficialTerm) return false;
  return hasOfficialTerm;
};

export const getOfficialPolicePhone = (name: string, fallback: string = "112"): string => {
  const clean = name.toLowerCase().trim();
  if (fallback && fallback !== "112" && fallback !== "100") {
    return fallback;
  }

  const NATIONAL_DIRECTORY: Record<string, string> = {
    'rewa antrela': '07661-235960', 'rewa baikunthpur': '07662-277228',
    'rewa chakghat': '07661-283230', 'rewa chorhata': '07662-220577',
    'rewa civil lines': '07662-254434', 'rewa dabhora': '07661-282950',
    'rewa garh': '07660-284545', 'rewa govindgarh': '07662-261530',
    'rewa hanumana': '07664-288530', 'rewa java': '07661-282230',
    'rewa kotwali': '07662-258557', 'rewa laur': '07663-286231',
    'rewa mangwan': '07660-281218', 'rewa mauganj': '07663-270341',
    'rewa naigarhi': '07663-285119', 'rewa panwar': '07661-235950',
    'rewa raipur': '07662-265204', 'rewa sagra': '07662-263244',
    'rewa semariya': '07660-266549', 'rewa shahpur': '07663-237692',
    'rewa sirmour': '07660-260633', 'rewa sohagi': '07661-282230',
    'rewa university': '07662-240817', 'rewa teonthar': '07662-240817',
    'rewa traffic': '07662-223171', 'rewa mahila': '07661-255700',
    'rewa saman': '07662-258557', 'rewa samaan': '07662-258557',
    'indore palasia': '0731-2522108', 'indore vijay nagar': '0731-2522105',
    'indore bhanwarkuan': '0731-2522110', 'bhopal mp nagar': '0755-2443491',
    'bhopal t t nagar': '0755-2443493', 'patna boring road': '0612-2213344',
    'patna gardanibagh': '0612-2213345', 'jodhpur sardarpura': '0291-2650711'
  };

  for (const [key, phone] of Object.entries(NATIONAL_DIRECTORY)) {
    const parts = key.split(' ');
    if (parts.every(part => clean.includes(part))) {
      return phone;
    }
  }
  return fallback || "112";
};

/**
 * 🛰️ MAPMYINDIA NEARBY POLICE SYSTEM
 */
export const fetchNearbyPoliceMappls = async (lat: number, lng: number) => {
  if (!MAPPLS_KEY) {
    console.error("Mappls Key missing. Routing directly to backup provider.");
    return await executeMapboxPoliceBackup(lat, lng);
  }

  try {
    const isNative = Capacitor.isNativePlatform();
    let rawResult: any;

    if (isNative) {
      const url = `https://search.mappls.com/search/places/nearby/json?keywords=POLICE&refLocation=${lat},${lng}&radius=10000&limit=20&sortBy=dist&access_token=${MAPPLS_KEY}`;
      const response = await CapacitorHttp.get({ url, headers: { 'Accept': 'application/json' } });
      rawResult = safeParsePayload(response);

      if (!rawResult?.suggestedLocations?.length) {
        const url2 = `https://search.mappls.com/search/places/nearby/json?keywords=police+station&refLocation=${lat},${lng}&radius=10000&limit=20&sortBy=dist&access_token=${MAPPLS_KEY}`;
        const response2 = await CapacitorHttp.get({ url: url2, headers: { 'Accept': 'application/json' } });
        rawResult = safeParsePayload(response2);
      }
    } else {
      const url = `/mappls-search/places/nearby/json?keywords=POLICE&refLocation=${lat},${lng}&radius=10000&limit=20&sortBy=dist`;
      const response = await axios.get(url);
      rawResult = response.data;

      if (!rawResult?.suggestedLocations?.length) {
        const response2 = await axios.get(`/mappls-search/places/nearby/json?keywords=police+station&refLocation=${lat},${lng}&radius=10000&limit=20&sortBy=dist`);
        rawResult = response2.data;
      }
    }

    if (rawResult?.suggestedLocations?.length > 0) {
      return processMapplsLocations(rawResult.suggestedLocations, "112");
    }

    return await executeMapboxPoliceBackup(lat, lng);
  } catch (error) {
    console.warn("Primary Mappls tracking engine failed. Calling Mapbox POI array:", error);
    return await executeMapboxPoliceBackup(lat, lng);
  }
};

/**
 * 🛰️ MAPMYINDIA NEARBY HOSPITALS SYSTEM
 */
export const fetchNearbyHospitalsMappls = async (lat: number, lng: number) => {
  if (!MAPPLS_KEY) return await executeMapboxHospitalBackup(lat, lng);

  try {
    const isNative = Capacitor.isNativePlatform();
    let rawResult: any;

    if (isNative) {
      const url = `https://search.mappls.com/search/places/nearby/json?keywords=HOSPITAL&refLocation=${lat},${lng}&radius=10000&limit=20&access_token=${MAPPLS_KEY}`;
      const response = await CapacitorHttp.get({ url, headers: { 'Accept': 'application/json' } });
      rawResult = safeParsePayload(response);
    } else {
      const url = `/mappls-search/places/nearby/json?keywords=HOSPITAL&refLocation=${lat},${lng}&radius=10000&limit=20`;
      const response = await axios.get(url);
      rawResult = response.data;
    }

    if (rawResult?.suggestedLocations?.length > 0) {
      const uniqueHospitals: any[] = [];
      const seenAddresses = new Set<string>();

      rawResult.suggestedLocations.forEach((loc: any) => {
        const nameLower = (loc.placeName || "").toLowerCase();
        const isRehab = nameLower.includes("rehab") || nameLower.includes("punarvas") || 
                        nameLower.includes("nashamukti") || nameLower.includes("de-addiction");
        if (isRehab) return;

        const addressKey = loc.placeAddress ? loc.placeAddress.toLowerCase().trim() : "";
        if (addressKey && seenAddresses.has(addressKey)) return;
        if (addressKey) seenAddresses.add(addressKey);
        uniqueHospitals.push(loc);
      });

      return uniqueHospitals.map((loc: any) => ({
        id: loc.eLoc,
        name: loc.placeName,
        address: loc.placeAddress,
        dist: loc.distance ? `${(loc.distance / 1000).toFixed(1)}km` : "Nearby",
        distVal: loc.distance ? (loc.distance / 1000) : 0,
        lat: loc.latitude,
        lng: loc.longitude,
        phone: loc.mobile || "108"
      }));
    }

    return await executeMapboxHospitalBackup(lat, lng);
  } catch (error) {
    console.warn("Primary Mappls Hospital engine dropped. Switching to Mapbox backup:", error);
    return await executeMapboxHospitalBackup(lat, lng);
  }
};

/**
 * 🛰️ MAPMYINDIA ADVANCED ROUTING
 * Fixed parameter layout schema ordering to: latitude,longitude.
 */
export const fetchRouteMappls = async (startLng: number, startLat: number, endLng: number, endLat: number) => {
  if (!MAPPLS_KEY) return null;
  try {
    const isNative = Capacitor.isNativePlatform();
    // FIXED: Formatted parameter array elements using the correct `lat,lng;lat,lng` coordinate order
    const url = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/route_adv/driving/${startLat},${startLng};${endLat},${endLng}?steps=true&geometries=geojson`;

    let parsedData: any;
    if (isNative) {
      const response = await CapacitorHttp.get({ url, headers: { 'Accept': 'application/json' } });
      parsedData = safeParsePayload(response);
    } else {
      const proxyUrl = `/mappls-route/${startLng},${startLat}/${endLng},${endLat}?steps=true&geometries=geojson`;
      const response = await axios.get(proxyUrl);
      parsedData = response.data;
    }

    if (parsedData?.routes?.length > 0) {
      return parsedData.routes[0].geometry.coordinates;
    }
    return null;
  } catch (error) {
    console.error("Mappls Advanced Routing Engine Failure Exception:", error);
    return null;
  }
};

// Internal utilities to group Mappls parameters safely
const processMapplsLocations = (locations: any[], fallbackPhone: string) => {
  const sorted = [...locations].sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
  const uniqueStations: any[] = [];
  const seenNames = new Set<string>();

  sorted.forEach((loc: any) => {
    const nameKey = (loc.placeName || '').toLowerCase().trim();
    if (!nameKey || seenNames.has(nameKey)) return;
    seenNames.add(nameKey);
    uniqueStations.push(loc);
  });

  return uniqueStations.map((loc: any) => ({
    id: loc.eLoc,
    name: loc.placeName,
    address: loc.placeAddress,
    dist: loc.distance ? `${(loc.distance / 1000).toFixed(2)}km` : "Nearby",
    distVal: loc.distance ? (loc.distance / 1000) : 0,
    lat: loc.latitude,
    lng: loc.longitude,
    phone: getOfficialPolicePhone(loc.placeName, loc.mobile || fallbackPhone)
  }));
};

// Encapsulated secure fallback workers to process backup tracking metrics smoothly
const executeMapboxPoliceBackup = async (lat: number, lng: number) => {
  if (!MAPBOX_TOKEN) return [];
  try {
    const url = `https://api.mapbox.com/search/searchbox/v1/category/police?proximity=${lng},${lat}&limit=15&access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(url);
    const resData = await response.json();

    if (!resData?.features) return [];

    return resData.features
      .map((f: any) => {
        const fLat = f.geometry?.coordinates?.[1] || lat;
        const fLng = f.geometry?.coordinates?.[0] || lng;
        const distMeters = f.properties?.distance || 0;

        return {
          id: f.properties?.mapbox_id || f.id || Math.random().toString(),
          name: f.properties?.name || "Local Police Station",
          address: f.properties?.full_address || "Nearby Area",
          dist: distMeters ? `${(distMeters / 1000).toFixed(2)}km` : "Nearby",
          distVal: distMeters / 1000 || 0,
          lat: fLat,
          lng: fLng,
          phone: getOfficialPolicePhone(f.properties?.name || "", "112")
        };
      })
      .sort((a: any, b: any) => a.distVal - b.distVal);
  } catch {
    return [];
  }
};

const executeMapboxHospitalBackup = async (lat: number, lng: number) => {
  if (!MAPBOX_TOKEN) return [];
  try {
    const url = `https://api.mapbox.com/search/searchbox/v1/category/hospital?proximity=${lng},${lat}&limit=20&access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(url);
    const resData = await response.json();

    if (!resData?.features) return [];

    return resData.features.map((f: any) => {
      const fLat = f.geometry?.coordinates?.[1] || lat;
      const fLng = f.geometry?.coordinates?.[0] || lng;
      const distMeters = f.properties?.distance || 0;

      return {
        id: f.properties?.mapbox_id || f.id || Math.random().toString(),
        name: f.properties?.name || "Local Hospital",
        address: f.properties?.full_address || "Nearby Area",
        dist: distMeters ? `${(distMeters / 1000).toFixed(1)}km` : "Nearby",
        distVal: distMeters / 1000 || 0,
        lat: fLat,
        lng: fLng,
        phone: "108"
      };
    });
  } catch {
    return [];
  }
};
