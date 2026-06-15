import { Geolocation } from '@capacitor/geolocation';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { GeoPoint } from '../types';


const BackgroundGeolocation = registerPlugin<any>('BackgroundGeolocation');

export interface PrecisionLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  provider: 'GPS_HARDWARE' | 'NETWORK_LINK';
}

/**
 * 🛰️ HIGH-FIDELITY GPS ANCHOR
 * Performs an isolated hardware poll to fetch precise spatial coordinates.
 */
export const getLiveLocation = async (): Promise<PrecisionLocation | null> => {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000, // Reduced from 30s to prevent long thread locks
      maximumAge: 3000
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      provider: 'GPS_HARDWARE'
    };
  } catch (error) {
    try {
      const coarsePosition = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 10000
      });
      return {
        latitude: coarsePosition.coords.latitude,
        longitude: coarsePosition.coords.longitude,
        accuracy: coarsePosition.coords.accuracy,
        provider: 'NETWORK_LINK'
      };
    } catch {
      return null;
    }
  }
};

/**
 * 📡 NEURAL PULSE: Real-time Location Watcher
 * Manages clean single-stream tracking hooks without running concurrent loop engines.
 */
export const watchLiveLocation = async (
  callback: (pos: GeoPoint, accuracy: number) => void,
  performanceMode: 'high' | 'auto' | 'power_save' | 'ultra_power_save' = 'auto'
): Promise<string> => {
  if (Capacitor.isNativePlatform()) {
    await Geolocation.requestPermissions();
  }

  const isEmergencyMode = localStorage.getItem('kavach_sos_active') === 'true' ||
                          localStorage.getItem('kavach_ride_active') === 'true';

  const isUltraSave = performanceMode === 'ultra_power_save';

  // Leverage the native stream architecture instead of stacking intervals over watches
  const watchId = await Geolocation.watchPosition(
    {
      enableHighAccuracy: isEmergencyMode || performanceMode === 'high',
      timeout: isEmergencyMode ? 5000 : (isUltraSave ? 60000 : 20000),
      maximumAge: isEmergencyMode ? 0 : (isUltraSave ? 300000 : (performanceMode === 'power_save' ? 45000 : 10000)) // 5 mins cache in ultra save
    },
    (position) => {
      if (position?.coords) {
        callback({ lat: position.coords.latitude, lng: position.coords.longitude }, position.coords.accuracy);
      }
    }
  );

  return watchId; // Simply clear via Geolocation.clearWatch({ id: watchId })
};

/**
 * 🛡️ PERSISTENT BACKGROUND TRACKING ENGINE — Supabase Primary
 * Registers a single, flat native process watcher for closed-state tracking.
 */
export const startBackgroundTracking = async (uid: string, performanceMode: string = 'auto') => {
  if (!Capacitor.isNativePlatform() || !uid) return;

  try {
    const definedDistanceFilter = performanceMode === 'power_save' ? 50 : 8;

    await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "KAVACH Tracker is active. Location monitoring SECURE.",
        backgroundTitle: "🛡️ KAVACH Mission Persistence",
        requestPermissions: true,
        stale: false,
        distanceFilter: definedDistanceFilter
      },
      async (location: any) => {
        if (!location || !location.latitude || !location.longitude) return;

        // ✅ Write PostGIS geography point via RPC
        try {
          const { supabase } = await import('../lib/supabase');
          const { error: rpcError } = await supabase.rpc('update_protector_coords', {
            p_id: uid,
            p_lat: location.latitude,
            p_lng: location.longitude,
            p_battery: 100,
            p_accuracy: Math.round(location.accuracy ?? 0),
            p_online: true,
          });
          // Fallback to plain update if RPC not deployed yet
          if (rpcError) {
            await supabase.from('profiles').update({
              last_seen: new Date().toISOString(),
              is_online: true,
            }).eq('id', uid);
          }
        } catch {
          // Silent fail in background
        }
      }
    );
  } catch (error) {
    console.error("Background location tracking failed to initialize:", error);
  }
};


/**
 * 🔄 UNIVERSAL TELEMETRY SYNC — Supabase + PostGIS Primary
 * Uses update_protector_coords RPC to write a proper GEOGRAPHY point
 * so find_nearest_protectors() geospatial queries work correctly.
 */
export const syncTelemetry = async (
  uid: string,
  role: string,
  battery: number | null,
  coords: GeoPoint,
  accuracy?: number
): Promise<void> => {
  if (!uid || !coords || coords.lat === 0) return;

  try {
    const { supabase } = await import('../lib/supabase');

    // ✅ PRIMARY: Call RPC to write PostGIS geography point + telemetry fields
    const { error: rpcError } = await supabase.rpc('update_protector_coords', {
      p_id: uid,
      p_lat: coords.lat,
      p_lng: coords.lng,
      p_battery: Math.round(battery ?? 100),
      p_accuracy: Math.round(accuracy ?? 0),
      p_online: navigator.onLine,
    });

    // 🔄 FALLBACK: If RPC not yet deployed, update columns directly
    if (rpcError) {
      await supabase
        .from('profiles')
        .update({
          last_seen: new Date().toISOString(),
          battery_level: Math.round(battery ?? 100),
          is_online: navigator.onLine,
          gps_accuracy: Math.round(accuracy ?? 0),
        })
        .eq('id', uid);
    }

    // Update active alert responder location (non-blocking)
    const activeAlertId = localStorage.getItem('kavach_active_alert_id');
    if (activeAlertId) {
      (async () => {
        try {
          await supabase.from('alerts').update({
            responder_lat: coords.lat,
            responder_lng: coords.lng,
            last_pulse: new Date().toISOString(),
          }).eq('id', activeAlertId);
        } catch { /* non-critical */ }
      })();
    }
  } catch (error: any) {
    // Silent fail — telemetry is non-critical, never crash the app
    console.warn('Telemetry sync deferred:', error?.message?.slice(0, 80));
  }
};


// Simple in-memory cache to handle immediate reverse geocoding lookups
const reverseGeocodeThrottleCache = new Map<string, { data: any; expiry: number }>();

/**
 * 🗺️ REVERSE GEOCODE METADATA
 * Resolves spatial vectors to readable location names. Includes a strict local caching rule.
 */
export const getReverseMetadata = async (lat: number, lng: number) => {
  // Quantize coordinates to 4 decimal places (~11-meter bounding box precision) to maximize cache hits
  const quantizedCacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const currentTime = Date.now();
  const cachedHit = reverseGeocodeThrottleCache.get(quantizedCacheKey);

  if (cachedHit && currentTime < cachedHit.expiry) {
    return cachedHit.data;
  }

  try {
    const targetUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    
    // Inject custom compliance headers to meet OSM Nominatim usage requirements
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'KavachEmergencySafetyCore/2.0 (contact: tech@kavach.security MobileApp)',
        'Accept-Language': 'en'
      }
    });

    if (response.status === 429) {
      throw new Error("Nominatim rate limiting exception");
    }

    const data = await response.json();
    const addressDetails = data.address || {};
    
    const resolvedPayload = {
      address: data.display_name || "Unknown Location",
      suburb: addressDetails.suburb || addressDetails.neighbourhood || addressDetails.road || "General Sector",
      city: addressDetails.city || addressDetails.town || addressDetails.village || "Unknown City",
      state: addressDetails.state || "Active Sector",
      pincode: addressDetails.postcode || "000000",
      country: addressDetails.country || "India",
      display: data.display_name || "Unknown Mission Sector"
    };

    // Keep geocoded records cached for 5 minutes to prevent duplicate API requests
    reverseGeocodeThrottleCache.set(quantizedCacheKey, {
      data: resolvedPayload,
      expiry: currentTime + 300000
    });

    return resolvedPayload;
  } catch (error) {
    console.warn("Geocoding service unavailable, pulling default safe fallback values:", error);
    return {
      address: "Neutral Zone Location",
      suburb: "General Sector",
      city: "Unknown",
      state: "Active Sector",
      pincode: "000000",
      country: "India",
      display: "Position Resolved (Awaiting Network Synchronization)"
    };
  }
};

export const geocodeLocation = async (lat: number, lng: number): Promise<string> => {
  const meta = await getReverseMetadata(lat, lng);
  return meta.display;
};

/**
 * 🔍 FORWARD GEOCODE TOOL
 */
export const searchLocation = async (address: string): Promise<[number, number] | null> => {
  if (!address) return null;
  try {
    const targetUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'KavachEmergencySafetyCore/2.0 (contact: tech@kavach.security MobileApp)'
      }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch {
    return null;
  }
};
