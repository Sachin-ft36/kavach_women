import axios from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

// 🛰️ MAPMYINDIA (MAPPLS) TACTICAL SERVICE
// Direct Static Key implementation to avoid OAuth Client ID/Secret complexities.

const REST_KEY = import.meta.env.VITE_MAPMYINDIA_REST_KEY || "wyzopujjvzdbyogtdyzhbguilecucgwgfpmg";

export const isOfficialPoliceStation = (name: string): boolean => {
  const lower = name.toLowerCase();
  
  // Whitelist of official terms
  const officialTerms = [
    'station', 'chowki', 'chouki', 'chowky', 'chouky', 'thana', 'outpost', 
    'point', 'hq', 'headquarter', 'control', 'post', 'line', 'traffic', 
    'office', 'cell', 'force', 'camp', 'chowk', 'division', 'commissioner',
    'headquarters', 'police'
  ];
  
  // Blacklist of personal/individual terms in India (to filter out private houses/officers' residences)
  const personalTerms = [
    'patel', 'prajapati', 'singh', 'kumar', 'sharma', 'verma', 'yadav', 
    'tiwari', 'mishra', 'gupta', 'choudhary', 'devi', 'lal', 'ram', 'rajesh', 
    'kuldeep', 'amit', 'deepak', 'sanjay', 'sunil', 'vijay', 'anil', 'rahul',
    'house', 'home', 'residence', 'nivas', 'niwas'
  ];

  // If name contains both a personal term and NO strict official keyword like 'station', 'chowki', 'thana', filter it out!
  const hasPersonalTerm = personalTerms.some(term => lower.includes(term));
  const hasStrictOfficialTerm = ['station', 'chowki', 'chouki', 'thana', 'outpost', 'hq', 'headquarters'].some(term => lower.includes(term));
  
  if (hasPersonalTerm && !hasStrictOfficialTerm) {
    return false;
  }

  // Check if it has any official terms
  return officialTerms.some(term => lower.includes(term));
};

export const fetchNearbyPoliceMappls = async (lat: number, lng: number) => {
  if (!REST_KEY) {
    console.error("Mappls Static Key is missing!");
    return [];
  }

  try {
    const isNative = Capacitor.isNativePlatform();
    let data: any;

    if (isNative) {
      console.log("🛰️ MAPPLS NATIVE HTTP TRIGGERED");
      const url = `https://search.mappls.com/search/places/nearby/json?keywords=POLICE&refLocation=${lat},${lng}&radius=10000&limit=10&access_token=${REST_KEY}`;
      const response = await CapacitorHttp.get({
        url,
        headers: { 'Accept': 'application/json' }
      });
      data = response.data;
    } else {
      console.log("🛰️ MAPPLS WEB HTTP PROXY TRIGGERED");
      const url = `/mappls-search/places/nearby/json?keywords=POLICE&refLocation=${lat},${lng}&radius=10000&limit=10`;
      const response = await axios.get(url);
      data = response.data;
    }

    if (data && data.suggestedLocations) {
      const uniqueStations: any[] = [];
      const seenAddresses = new Set<string>();
      let lastDistance = -1000;

      // Deduplicate results (Mappls often returns multiple POIs for the same compound)
      data.suggestedLocations.forEach((loc: any) => {
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

    // 🛰️ ROOT FALLBACK ENGINE: Mapbox Category Search - 100% Reliable POI Engine
    console.log("🛰️ Mappls police search returned 0 nodes. Deploying Mapbox Search Box Category API...");
    try {
      const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
      const url = `https://api.mapbox.com/search/searchbox/v1/category/police?proximity=${lng},${lat}&limit=10&access_token=${MAPBOX_TOKEN}`;
      const response = await fetch(url);
      const resData = await response.json();
      
      if (resData && Array.isArray(resData.features) && resData.features.length > 0) {
        return resData.features.map((f: any) => {
          const fLat = f.geometry?.coordinates?.[1] || f.properties?.coordinates?.latitude || lat;
          const fLng = f.geometry?.coordinates?.[0] || f.properties?.coordinates?.longitude || lng;
          const distMeters = f.properties?.distance || 0;
          
          return {
            id: f.properties?.mapbox_id || f.id || Math.random().toString(),
            name: f.properties?.name || f.properties?.full_address || "Local Police Station",
            address: f.properties?.full_address || "Nearby",
            dist: distMeters ? `${(distMeters / 1000).toFixed(1)}km` : "Nearby",
            distVal: distMeters / 1000 || 0,
            lat: fLat,
            lng: fLng,
            phone: "112"
          };
        }).filter((s: any) => isOfficialPoliceStation(s.name));
      }
    } catch (e) {
      console.warn("Mappls root fallback to Mapbox POI search failed:", e);
    }

    return [];
  } catch (error) {
    console.error("Mappls Nearby Search Failed, attempting Mapbox POI backup...", error);
    try {
      const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
      const url = `https://api.mapbox.com/search/searchbox/v1/category/police?proximity=${lng},${lat}&limit=10&access_token=${MAPBOX_TOKEN}`;
      const response = await fetch(url);
      const resData = await response.json();
      
      if (resData && Array.isArray(resData.features) && resData.features.length > 0) {
        return resData.features.map((f: any) => {
          const fLat = f.geometry?.coordinates?.[1] || f.properties?.coordinates?.latitude || lat;
          const fLng = f.geometry?.coordinates?.[0] || f.properties?.coordinates?.longitude || lng;
          const distMeters = f.properties?.distance || 0;
          
          return {
            id: f.properties?.mapbox_id || f.id || Math.random().toString(),
            name: f.properties?.name || f.properties?.full_address || "Local Police Station",
            address: f.properties?.full_address || "Nearby",
            dist: distMeters ? `${(distMeters / 1000).toFixed(1)}km` : "Nearby",
            distVal: distMeters / 1000 || 0,
            lat: fLat,
            lng: fLng,
            phone: "112"
          };
        }).filter((s: any) => isOfficialPoliceStation(s.name));
      }
    } catch (e) {
      console.warn("Mappls catch fallback to Mapbox POI search failed:", e);
    }
    return [];
  }
};

export const fetchNearbyHospitalsMappls = async (lat: number, lng: number) => {
  if (!REST_KEY) return [];

  try {
    const isNative = Capacitor.isNativePlatform();
    let data: any;

    if (isNative) {
      console.log("🛰️ MAPPLS HOSPITALS NATIVE HTTP TRIGGERED");
      const url = `https://search.mappls.com/search/places/nearby/json?keywords=HOSPITAL&refLocation=${lat},${lng}&radius=10000&limit=5&access_token=${REST_KEY}`;
      const response = await CapacitorHttp.get({
        url,
        headers: { 'Accept': 'application/json' }
      });
      data = response.data;
    } else {
      console.log("🛰️ MAPPLS HOSPITALS WEB HTTP PROXY TRIGGERED");
      const url = `/mappls-search/places/nearby/json?keywords=HOSPITAL&refLocation=${lat},${lng}&radius=10000&limit=5`;
      const response = await axios.get(url);
      data = response.data;
    }

    if (data && data.suggestedLocations) {
      const uniqueHospitals: any[] = [];
      const seenAddresses = new Set<string>();
      let lastDistance = -1000;

      data.suggestedLocations.forEach((loc: any) => {
        const nameLower = (loc.placeName || "").toLowerCase();
        // Skip de-addiction (nashamukti) and rehabilitation centers
        const isRehab = nameLower.includes("rehab") || 
                        nameLower.includes("punarvas") || 
                        nameLower.includes("punarvaas") || 
                        nameLower.includes("nashamukti") || 
                        nameLower.includes("nasha mukti") || 
                        nameLower.includes("de-addiction") || 
                        nameLower.includes("deaddiction") || 
                        nameLower.includes("addiction");
        if (isRehab) return;

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

    // 🛰️ ROOT FALLBACK ENGINE: Mapbox Category Search - Hospitals
    console.log("🛰️ Mappls hospital search returned 0 nodes. Deploying Mapbox Search Box Category API...");
    try {
      const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
      const url = `https://api.mapbox.com/search/searchbox/v1/category/hospital?proximity=${lng},${lat}&limit=5&access_token=${MAPBOX_TOKEN}`;
      const response = await fetch(url);
      const resData = await response.json();
      
      if (resData && Array.isArray(resData.features) && resData.features.length > 0) {
        return resData.features.map((f: any) => {
          const fLat = f.geometry?.coordinates?.[1] || f.properties?.coordinates?.latitude || lat;
          const fLng = f.geometry?.coordinates?.[0] || f.properties?.coordinates?.longitude || lng;
          const distMeters = f.properties?.distance || 0;
          
          return {
            id: f.properties?.mapbox_id || f.id || Math.random().toString(),
            name: f.properties?.name || f.properties?.full_address || "Local Hospital",
            address: f.properties?.full_address || "Nearby",
            dist: distMeters ? `${(distMeters / 1000).toFixed(1)}km` : "Nearby",
            distVal: distMeters / 1000 || 0,
            lat: fLat,
            lng: fLng,
            phone: "108"
          };
        });
      }
    } catch (e) {
      console.warn("Mappls root fallback to Mapbox Hospital search failed:", e);
    }

    return [];
  } catch (error) {
    console.error("Mappls Hospital Search Failed, attempting Mapbox backup...", error);
    try {
      const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";
      const url = `https://api.mapbox.com/search/searchbox/v1/category/hospital?proximity=${lng},${lat}&limit=5&access_token=${MAPBOX_TOKEN}`;
      const response = await fetch(url);
      const resData = await response.json();
      
      if (resData && Array.isArray(resData.features) && resData.features.length > 0) {
        return resData.features.map((f: any) => {
          const fLat = f.geometry?.coordinates?.[1] || f.properties?.coordinates?.latitude || lat;
          const fLng = f.geometry?.coordinates?.[0] || f.properties?.coordinates?.longitude || lng;
          const distMeters = f.properties?.distance || 0;
          
          return {
            id: f.properties?.mapbox_id || f.id || Math.random().toString(),
            name: f.properties?.name || f.properties?.full_address || "Local Hospital",
            address: f.properties?.full_address || "Nearby",
            dist: distMeters ? `${(distMeters / 1000).toFixed(1)}km` : "Nearby",
            distVal: distMeters / 1000 || 0,
            lat: fLat,
            lng: fLng,
            phone: "108"
          };
        });
      }
    } catch (e) {
      console.warn("Mappls catch fallback to Mapbox Hospital search failed:", e);
    }
    return [];
  }
};

export const fetchRouteMappls = async (startLng: number, startLat: number, endLng: number, endLat: number) => {
  if (!REST_KEY) return null;
  try {
    const isNative = Capacitor.isNativePlatform();
    // Use proper MapmyIndia Advanced Routing URL
    const url = `https://apis.mappls.com/advancedmaps/v1/${REST_KEY}/route_adv/driving/${startLng},${startLat};${endLng},${endLat}?steps=true&geometries=geojson`;
    
    let data;
    if (isNative) {
      console.log("🛰️ MAPPLS ROUTING NATIVE HTTP TRIGGERED");
      const response = await CapacitorHttp.get({ url, headers: { 'Accept': 'application/json' } });
      data = response.data;
    } else {
      console.log("🛰️ MAPPLS ROUTING WEB HTTP PROXY TRIGGERED");
      const proxyUrl = `/mappls-route/${startLng},${startLat}/${endLng},${endLat}?steps=true&geometries=geojson`;
      const response = await axios.get(proxyUrl);
      data = response.data;
    }

    if (data && data.routes && data.routes.length > 0) {
      // Returns an array of [lng, lat] coordinates representing the exact road path
      return data.routes[0].geometry.coordinates;
    }
    return null;
  } catch (error) {
    console.error("Mappls Routing API Failed:", error);
    return null;
  }
};
