import axios from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { executeMapboxPoliceBackup, executeMapboxHospitalBackup } from './mappls/MapboxFallback';
import { safeParsePayload, processMapplsLocations } from './mappls/mapplsUtils';

// Ensure strict key fallback structures to protect security perimeters
const MAPPLS_KEY = import.meta.env.VITE_MAPMYINDIA_REST_KEY || "wyzopujjvzdbyogtdyzhbguilecucgwgfpmg";

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
      const processed = processMapplsLocations(rawResult.suggestedLocations, "112");
      if (processed.length > 0) return processed;
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
  if (!startLng || !startLat || !endLng || !endLat || isNaN(startLng) || isNaN(startLat) || isNaN(endLng) || isNaN(endLat)) {
    console.warn("🛰️ fetchRouteMappls: Invalid coordinates passed:", { startLng, startLat, endLng, endLat });
    return null;
  }
  if (!MAPPLS_KEY) return null;
  try {
    const isNative = Capacitor.isNativePlatform();
    // NEW MAPPLS ENDPOINT FORMAT (lng,lat order)
    const routePath = `${startLng},${startLat};${endLng},${endLat}`;
    let parsedData: any;
    if (isNative) {
      const url = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/route_adv/driving/${routePath}?steps=true&geometries=geojson`;
      const response = await CapacitorHttp.get({ url, headers: { 'Accept': 'application/json' } });
      parsedData = safeParsePayload(response);
    } else {
      const url = `/mappls-adv-route/${MAPPLS_KEY}/route_adv/driving/${routePath}?steps=true&geometries=geojson`;
      const response = await axios.get(url);
      parsedData = response.data;
    }

    if (parsedData?.routes?.length > 0) {
      return parsedData.routes[0].geometry.coordinates;
    }
  } catch (error) {
    console.warn("🛰️ PROXY: Mappls routing key expired/invalid. Deploying Mapbox Tactical Fallback Engine for Geometry...");
  }
  
  // Mapbox Fallback for Geometry
  try {
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data?.routes?.length > 0) {
      return data.routes[0].geometry.coordinates;
    }
    return null;
  } catch (fallbackError) {
    console.error("fetchRouteMappls Fallback error:", fallbackError);
    return null;
  }
};

export const fetchRouteDetails = async (startLng: number, startLat: number, endLng: number, endLat: number) => {
  if (!startLng || !startLat || !endLng || !endLat || isNaN(startLng) || isNaN(startLat) || isNaN(endLng) || isNaN(endLat)) {
    console.warn("🛰️ fetchRouteDetails: Invalid coordinates passed:", { startLng, startLat, endLng, endLat });
    return null;
  }
  try {
    if (MAPPLS_KEY) {
      const isNative = Capacitor.isNativePlatform();
      const routePath = `${startLng},${startLat};${endLng},${endLat}`;
      let parsedData: any;
      if (isNative) {
        const url = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/route_adv/driving/${routePath}?steps=false&overview=false`;
        const response = await CapacitorHttp.get({ url, headers: { 'Accept': 'application/json' } });
        parsedData = safeParsePayload(response);
      } else {
        const url = `/mappls-adv-route/${MAPPLS_KEY}/route_adv/driving/${routePath}?steps=false&overview=false`;
        const response = await axios.get(url);
        parsedData = response.data;
      }

      if (parsedData?.routes?.length > 0) {
        const r = parsedData.routes[0];
        return { distance: r.distance, duration: r.duration };
      }
    }
  } catch (error) {
    console.warn("🛰️ PROXY: Mappls routing key expired/invalid. Deploying Mapbox Tactical Fallback Engine for ETA...");
  }
  
  // Mapbox Fallback
  try {
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data?.routes?.length > 0) {
      const r = data.routes[0];
      return { distance: r.distance, duration: r.duration };
    }
  } catch (fallbackError) {
    console.error("fetchRouteDetails Fallback error:", fallbackError);
  }
  return null;
};


