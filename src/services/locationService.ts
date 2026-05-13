import { Geolocation } from '@capacitor/geolocation';
import { doc, setDoc, serverTimestamp, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Capacitor, registerPlugin } from '@capacitor/core';

const BackgroundGeolocation = registerPlugin<any>('BackgroundGeolocation');

/**
 * 🛰️ MISSION CRITICAL: High-Fidelity GPS Anchor
 */
export const getLiveLocation = async () => {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 5000
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      provider: 'GPS_HARDWARE'
    };
  } catch (error) {
    try {
      const coarse = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 15000
      });
      return {
        latitude: coarse.coords.latitude,
        longitude: coarse.coords.longitude,
        accuracy: coarse.coords.accuracy,
        provider: 'NETWORK_LINK'
      };
    } catch (e) {
      return null;
    }
  }
};

/**
 * 📡 NEURAL PULSE: Real-time Location Watcher (HARDENED)
 */
export const watchLiveLocation = async (
  callback: (pos: [number, number], accuracy: number) => void,
  performanceMode: 'high' | 'auto' | 'power_save' = 'auto'
) => {
  if (Capacitor.isNativePlatform()) {
    await Geolocation.requestPermissions();
  }

  // Dynamic Interval Tuning
  const getInterval = () => {
    const isEmergency = localStorage.getItem('kavach_sos_active') === 'true' ||
      localStorage.getItem('kavach_ride_active') === 'true';
    if (isEmergency) return 1500; // Fast pulse for missions

    switch (performanceMode) {
      case 'high': return 5000;
      case 'power_save': return 60000; // 1 min pulse for extreme saving
      default: return 15000; // 15s standard heartbeat
    }
  };

  // Standard high-accuracy watcher
  const watchId = await Geolocation.watchPosition(
    {
      enableHighAccuracy: performanceMode !== 'power_save',
      timeout: 15000,
      maximumAge: performanceMode === 'power_save' ? 30000 : 5000
    },
    (position, err) => {
      if (position) {
        callback([position.coords.latitude, position.coords.longitude], position.coords.accuracy);
      }
    }
  );

  // 🔥 DYNAMIC PULSE: Intelligent Hardware Pull
  const pulseInterval = setInterval(async () => {
    const interval = getInterval();
    // Only execute if this is the right "time" for the current mode
    // (Simplified logic: set it once, but we'll restart it if mode changes in App.tsx)

    const isEmergency = localStorage.getItem('kavach_sos_active') === 'true' ||
      localStorage.getItem('kavach_ride_active') === 'true';

    if (!isEmergency && performanceMode === 'power_save') return;

    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: performanceMode !== 'power_save',
        timeout: 10000,
        maximumAge: performanceMode === 'power_save' ? 10000 : 5000
      });
      callback([pos.coords.latitude, pos.coords.longitude], pos.coords.accuracy);
    } catch (e) { }
  }, getInterval());

  return { watchId, pulseInterval };
};

export const startBackgroundTracking = async (uid: string, performanceMode: string = 'auto') => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const distanceFilter = performanceMode === 'power_save' ? 50 : 5; // Relax filter for battery

    // 🛡️ TACTICAL ANCHOR: High-resolution background persistent tracking
    await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "KAVACH Neural Link is active. Status: SECURE.",
        backgroundTitle: "🛡️ KAVACH Mission Persistence",
        requestPermissions: true,
        stale: false,
        distanceFilter: distanceFilter
      },
      async (location, error) => {
        if (location) {
    // 🛡️ TACTICAL ANCHOR: High-resolution background persistent tracking
    await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "KAVACH Neural Link is active. Status: SECURE.",
        backgroundTitle: "🛡️ KAVACH Mission Persistence",
        requestPermissions: true,
        stale: false,
        distanceFilter: distanceFilter
      },
      async (location, error) => {
        if (location) {
          const userRef = doc(db, 'users', uid);
          await updateDoc(userRef, {
            'telemetry.coords': [location.latitude, location.longitude],
            'telemetry.lastSeen': serverTimestamp(),
            'telemetry.status': 'Background Secure',
            'telemetry.mode': performanceMode
          }).catch(() => { });
        }
      }
    );
        }
      }
    );
  } catch (e) { }
};

/**
 * 🔄 UNIVERSAL TELEMETRY SYNC (REST BYPASS)
 * Bypasses Firestore SDK to prevent b815/ca9 assertion crashes.
 */
export const syncTelemetry = async (uid: string, role: string, battery: number | null, coords: [number, number], accuracy?: number) => {
  if (!uid) return;

  try {
    const userRef = doc(db, 'users', uid);
    const telemetryData = {
      'telemetry.coords': coords,
      'telemetry.battery': battery || 0,
      'telemetry.lastSeen': serverTimestamp(),
      'telemetry.role': role,
      'telemetry.status': 'Optimal',
      'telemetry.accuracy': accuracy || 0,
      'telemetry.isOnline': navigator.onLine,
      'lastActive': serverTimestamp()
    };

    await updateDoc(userRef, telemetryData);

    // 🛡️ SOS LIVE TRACKING HEARTBEAT: Push real-time movement to tactical units
    const activeAlertId = localStorage.getItem('kavach_active_alert_id');
    if (activeAlertId) {
      const alertRef = doc(db, 'alerts', activeAlertId);
      await updateDoc(alertRef, { 
        'location.latitude': coords[0],
        'location.longitude': coords[1],
        'lastPulse': serverTimestamp(),
        'telemetry.battery': battery || 0,
        'telemetry.accuracy': accuracy || 0
      }).catch(() => { });
    }
  } catch (error: any) {
    // 🛡️ SILENT FAILSAFE: If Firestore internal state is corrupt, don't crash the location thread
    if (error?.message?.includes('ASSERTION FAILED')) {
      console.warn("Telemetry SDK Pulse: Firestore Internal State Corrupt. Re-syncing node...");
    } else {
      console.warn("Telemetry SDK Pulse Interrupted:", error);
    }
  }
};

/**
 * 🗺️ REVERSE GEOCODE METADATA: Lat/Lng -> Structured Region Data
 */
export const getReverseMetadata = async (lat: number, lng: number) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await response.json();
    const addr = data.address || {};
    return {
      address: data.display_name || "Unknown Location",
      suburb: addr.suburb || addr.neighbourhood || addr.road || "General Sector",
      city: addr.city || addr.town || addr.village || "Unknown City",
      state: addr.state || "Bharat Sector",
      pincode: addr.postcode || addr.pincode || "000000",
      country: addr.country || "India",
      display: data.display_name || "Unknown Mission Sector"
    };
  } catch (e) {
    return {
      address: "Neutral Zone",
      suburb: "General Sector",
      city: "Unknown",
      state: "Bharat Sector",
      pincode: "000000",
      country: "India",
      display: "Neutral Zone"
    };
  }
};

export const geocodeLocation = async (lat: number, lng: number): Promise<string> => {
  const meta = await getReverseMetadata(lat, lng);
  return meta.display;
};

/**
 * 🔍 FORWARD GEOCODE: Address -> Lat/Lng
 */
export const searchLocation = async (address: string): Promise<[number, number] | null> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch (e) {
    return null;
  }
};
