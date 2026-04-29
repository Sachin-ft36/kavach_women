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
      timeout: 10000,
      maximumAge: 0 
    });
    
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      provider: 'GPS_HARDWARE'
    };
  } catch (error) {
    const coarse = await Geolocation.getCurrentPosition({ 
      enableHighAccuracy: false,
      timeout: 5000 
    });
    return {
      latitude: coarse.coords.latitude,
      longitude: coarse.coords.longitude,
      accuracy: coarse.coords.accuracy,
      provider: 'NETWORK_LINK'
    };
  }
};

/**
 * 📡 NEURAL PULSE: Real-time Location Watcher (HARDENED)
 */
export const watchLiveLocation = async (callback: (pos: [number, number], accuracy: number) => void) => {
    if (Capacitor.isNativePlatform()) {
      await Geolocation.requestPermissions();
    }

    // Standard high-accuracy watcher
    const watchId = await Geolocation.watchPosition(
        {
            enableHighAccuracy: true,
            timeout: 5000, 
            maximumAge: 0
        },
        (position, err) => {
            if (position) {
                callback([position.coords.latitude, position.coords.longitude], position.coords.accuracy);
            }
        }
    );

    // 🔥 DYNAMIC PULSE: Intelligent Hardware Pull
    const pulseInterval = setInterval(async () => {
       const isEmergency = localStorage.getItem('kavach_sos_active') === 'true' || 
                           localStorage.getItem('kavach_ride_active') === 'true';
       
       if (!isEmergency) return; // Save battery if no mission active

       try {
         const pos = await Geolocation.getCurrentPosition({
           enableHighAccuracy: true,
           timeout: 2000,
           maximumAge: 0
         });
         callback([pos.coords.latitude, pos.coords.longitude], pos.coords.accuracy);
       } catch (e) {}
    }, 1000); // 1s ULTRA-PULSE: Critical for high-speed tracking and vehicle interception

    return { watchId, pulseInterval };
};

export const startBackgroundTracking = async (uid: string) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 🛡️ TACTICAL ANCHOR: High-resolution background persistent tracking
    await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "KAVACH Neural Link is active. Status: SECURE.",
        backgroundTitle: "🛡️ KAVACH Mission Persistence",
        requestPermissions: true,
        stale: false,
        distanceFilter: 1 // Ultra-High Resolution: 1 meter displacement trigger
      },
      async (location, error) => {
        if (location) {
          await updateDoc(doc(db, 'users', uid), {
            'telemetry.coords': [location.latitude, location.longitude],
            'telemetry.lastSeen': serverTimestamp(),
            'telemetry.status': 'Background Secure'
          });
        }
      }
    );
  } catch (e) {}
};

/**
 * 🔄 UNIVERSAL TELEMETRY SYNC
 * Updates Firestore with fresh hardware data.
 */
export const syncTelemetry = async (uid: string, role: string, battery: number | null, coords: [number, number], accuracy?: number) => {
  if (!uid) return;
  try {
    const telemetryData = {
      coords: coords,
      battery: battery,
      lastSeen: serverTimestamp(),
      role,
      status: 'Optimal',
      accuracy: accuracy || 0,
      isOnline: navigator.onLine
    };

    await setDoc(doc(db, 'users', uid), {
      telemetry: telemetryData,
      lastActive: serverTimestamp()
    }, { merge: true });

    // 🛡️ ALERT HEARTBEAT: Sync pulse to active mission document for SuperCell oversight
    const activeAlertId = localStorage.getItem('kavach_active_alert_id');
    if (activeAlertId) {
      await updateDoc(doc(db, 'alerts', activeAlertId), {
        lastPulse: serverTimestamp()
      }).catch(() => {});
    }

    // Battery Critical Dispatch
    if (battery !== null && battery < 10 && battery > 0) {
       // Logic for final location anchor...
    }
  } catch (error) {}
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
      city: addr.city || addr.town || addr.village || "Unknown City",
      state: addr.state || "Bharat Sector",
      country: addr.country || "India",
      display: data.display_name || "Unknown Mission Sector"
    };
  } catch (e) {
    return {
      city: "Unknown",
      state: "Bharat Sector",
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
