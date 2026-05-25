import { Geolocation } from '@capacitor/geolocation';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Capacitor, registerPlugin } from '@capacitor/core';

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
  callback: (pos: [number, number], accuracy: number) => void,
  performanceMode: 'high' | 'auto' | 'power_save' = 'auto'
): Promise<string> => {
  if (Capacitor.isNativePlatform()) {
    await Geolocation.requestPermissions();
  }

  const isEmergencyMode = localStorage.getItem('kavach_sos_active') === 'true' ||
                          localStorage.getItem('kavach_ride_active') === 'true';

  // Leverage the native stream architecture instead of stacking intervals over watches
  const watchId = await Geolocation.watchPosition(
    {
      enableHighAccuracy: isEmergencyMode || performanceMode === 'high',
      timeout: isEmergencyMode ? 5000 : 20000,
      maximumAge: isEmergencyMode ? 0 : (performanceMode === 'power_save' ? 45000 : 10000)
    },
    (position) => {
      if (position?.coords) {
        callback([position.coords.latitude, position.coords.longitude], position.coords.accuracy);
      }
    }
  );

  return watchId; // Simply clear via Geolocation.clearWatch({ id: watchId })
};

/**
 * 🛡️ PERSISTENT BACKGROUND TRACKING ENGINE
 * Registers a single, flat native process watcher for closed-state tracking.
 */
export const startBackgroundTracking = async (uid: string, performanceMode: string = 'auto') => {
  if (!Capacitor.isNativePlatform() || !uid) return;

  try {
    const definedDistanceFilter = performanceMode === 'power_save' ? 50 : 8;

    // FIXED: Removed structural nesting loop. Allocating a single, flat native watcher handle.
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

        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          'telemetry.coords': [location.latitude, location.longitude],
          'telemetry.lastSeen': serverTimestamp(),
          'telemetry.status': 'Background Secure',
          'telemetry.mode': performanceMode
        }).catch(() => {});
      }
    );
  } catch (error) {
    console.error("Background location tracking failed to initialize:", error);
  }
};

/**
 * 🔄 UNIVERSAL TELEMETRY SYNC
 * Safely updates remote indices while managing database write targets.
 */
export const syncTelemetry = async (
  uid: string, 
  role: string, 
  battery: number | null, 
  coords: [number, number], 
  accuracy?: number
): Promise<void> => {
  if (!uid || !coords || coords[0] === 0) return;

  try {
    const userRef = doc(db, 'users', uid);
    const primaryPayload = {
      'telemetry.coords': coords,
      'telemetry.battery': battery ?? 100,
      'telemetry.lastSeen': serverTimestamp(),
      'telemetry.role': role,
      'telemetry.status': 'Optimal',
      'telemetry.accuracy': accuracy ?? 0,
      'telemetry.isOnline': navigator.onLine,
      'lastActive': serverTimestamp()
    };

    await updateDoc(userRef, primaryPayload);

    const activeAlertId = localStorage.getItem('kavach_active_alert_id');
    if (activeAlertId) {
      const alertRef = doc(db, 'alerts', activeAlertId);
      await updateDoc(alertRef, { 
        'location.latitude': coords[0],
        'location.longitude': coords[1],
        'lastPulse': serverTimestamp(),
        'telemetry.battery': battery ?? 100,
        'telemetry.accuracy': accuracy ?? 0
      }).catch(() => {});
    }
  } catch (error: any) {
    console.error("Telemetry write tracking exception intercepted safely:", error.message);
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
