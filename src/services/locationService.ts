import { Geolocation } from '@capacitor/geolocation';
import { doc, setDoc, serverTimestamp, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Capacitor, registerPlugin } from '@capacitor/core';

const BackgroundGeolocation = registerPlugin<any>('BackgroundGeolocation');

export const getLiveLocation = async () => {
  try {
    // PRIMARY: High-Precision GPS Anchor
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
    console.warn("KAVACH: GPS Lock Delayed, switching to Network Tunnel.");
    // BACKUP: Network Tower/WiFi Fallback
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

export const startBackgroundTracking = async (uid: string) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 🛡️ PERSISTENT MISSION: This task runs even if the app UI is killed
    await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "KAVACH is securing your location in the background.",
        backgroundTitle: "🛡️ KAVACH Mission Active",
        requestPermissions: true,
        stale: false,
        distanceFilter: 10 // Trigger every 10 meters moved
      },
      async (location, error) => {
        if (error) {
          if (error.code === "NOT_AUTHORIZED") {
             console.error("Background Location: Permission Denied.");
          }
          return;
        }

        if (location) {
          console.log("📍 KAVACH Background Sync: ", location.latitude, location.longitude);
          // Directly update the neural link from background process
          await updateDoc(doc(db, 'users', uid), {
            'telemetry.coords': [location.latitude, location.longitude],
            'telemetry.lastSeen': serverTimestamp(),
            'telemetry.status': 'Background Secure'
          });
        }
      }
    );
    console.log("KAVACH: Background Sentinel Engaged.");
  } catch (e) {
    console.error("Background sentinel failure:", e);
  }
};

export const syncTelemetry = async (user: any, role: string, batteryLevel: number | null) => {
  if (!user) return null;

  try {
    const loc = await getLiveLocation();
    
    const telemetryData = {
      coords: [loc.latitude, loc.longitude],
      battery: batteryLevel,
      lastSeen: serverTimestamp(),
      role,
      status: 'Optimal',
      accuracy: loc.accuracy,
      isOnline: navigator.onLine
    };

    await setDoc(doc(db, 'users', user.uid), {
      telemetry: telemetryData,
      lastActive: serverTimestamp()
    }, { merge: true });

    // CRITICAL: Battery Dead Mission Pulse (Police/Super Cell Hook)
    if (batteryLevel !== null && batteryLevel < 15 && batteryLevel > 0) {
      const lastBatterySignal = localStorage.getItem('kavach_last_battery_alert');
      const now = Date.now();
      
      // Only fire once per 30 mins to avoid spam, unless SOS is active
      if (!lastBatterySignal || now - parseInt(lastBatterySignal) > 1800000) {
        console.warn("KAVACH: Critical Battery Telemetry. Dispatching Final Anchor.");
        
        await addDoc(collection(db, 'alerts'), {
          victimUid: user.uid,
          victimName: user.displayName || 'Verified Citizen',
          type: 'BATTERY_CRITICAL_ANCHOR',
          location: 'Phone Imminent Shutdown - GPS Anchor Fixed',
          coords: [loc.latitude, loc.longitude],
          status: 'active',
          severity: 'URGENT',
          timestamp: serverTimestamp(),
          metadata: {
            battery: batteryLevel,
            shutdown_risk: true,
            police_dispatchRequired: true
          }
        });
        
        localStorage.setItem('kavach_last_battery_alert', now.toString());
      }
    }

    console.log('KAVACH Neural Link: Telemetry synced.');
    return [loc.latitude, loc.longitude] as [number, number];
  } catch (error) {
    console.warn('KAVACH Telemetry Interrupted:', error);
    return null;
  }
};

export const geocodeLocation = async (address: string) => {
  const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaHlxcmcwMHRpMnNxdnQ4YThsYmE2In0.C1n-oZWeUvxlOkXbNeFUTA";
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return [lat, lng] as [number, number];
    }
    return null;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
};

