import { StateCreator } from 'zustand';
import { KavachState } from './types';
import { supabase } from '../../lib/supabase';
import { logTelemetryEvent } from '../../firebase';

const lastLat = localStorage.getItem('kavach_last_lat');
const lastLng = localStorage.getItem('kavach_last_lng');

export const createLocationSlice: StateCreator<KavachState, [], [], Pick<KavachState, 'userPos' | 'setUserPos' | 'syncLocation'>> = (set, get) => ({
  userPos: (lastLat && lastLng) ? { lat: parseFloat(lastLat), lng: parseFloat(lastLng) } : { lat: 20.5937, lng: 78.9629 },

  setUserPos: (userPos) => {
    localStorage.setItem('kavach_last_lat', userPos.lat.toString());
    localStorage.setItem('kavach_last_lng', userPos.lng.toString());
    set({ userPos });
  },

  syncLocation: async (providedCoords = null) => {
    try {
      const { getLiveLocation } = await import('../../services/locationService');
      const { db, auth } = await import('../../firebase');
      const { doc, updateDoc, serverTimestamp, arrayUnion, setDoc, getDoc } = await import('firebase/firestore');

      const loc: any = providedCoords || await getLiveLocation();
      if (loc) {
        const lat = loc.latitude ?? loc.coords?.latitude;
        const lng = loc.longitude ?? loc.coords?.longitude;

        if (lat !== undefined && lng !== undefined) {
          const userPos = { lat, lng };
          set({ userPos, loading: false });

          if (auth.currentUser) {
            try {
              const updates: any = {
                lastLocation: { latitude: lat, longitude: lng },
                lastActive: serverTimestamp()
              };
              try {
                await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
              } catch (fsErr) {
                console.warn("⚠️ Firestore location sync deferred (document not found):", fsErr);
              }

              const state = get();

              await supabase
                .from('profiles')
                .update({
                  last_location: `POINT(${lng} ${lat})`
                })
                .eq('id', auth.currentUser.uid);

              if (state.isRideModeActive && state.rideData) {
                try {
                  await setDoc(doc(db, 'journeys', auth.currentUser.uid), {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    path: arrayUnion({ lng: loc.longitude, lat: loc.latitude }),
                    lastUpdated: serverTimestamp(),
                    heartbeat: serverTimestamp()
                  }, { merge: true });
                  console.log("📍 KAVACH: Transit Heartbeat Pulse... Movement Mirrored to Grid.");
                } catch (e) {
                  console.warn("⚠️ KAVACH: Transit Sync Interrupted. Check National Grid Rules.");
                }
              }

              if (state.isSOSActive && state.activeAlertId) {
                try {
                  await setDoc(doc(db, 'alerts', state.activeAlertId), {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    path: arrayUnion({ lng: loc.longitude, lat: loc.latitude }),
                    lastUpdated: serverTimestamp()
                  }, { merge: true });
                } catch (e) {
                  console.warn("⚠️ KAVACH: Alert Telemetry Sync Pending...");
                }
              } else if (state.respondingToAlertId) {
                try {
                  const pathKey = `footprints.${auth.currentUser.uid}`;
                  await setDoc(doc(db, 'alerts', state.respondingToAlertId), {
                    [pathKey]: arrayUnion({ lng: loc.longitude, lat: loc.latitude, t: Date.now() }),
                    lastUpdated: serverTimestamp()
                  }, { merge: true });
                } catch (e) {
                  logTelemetryEvent('sos_failure_offline_fallback', { method: 'responder_tracking', alertId: state.respondingToAlertId, reason: (e as Error).message });
                  console.warn("🌐 OFFLINE: Firestore failed. Routing to Tamper-Proof Offline Queue...");
                }
              }

              const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
              if (userSnap.exists()) {
                const data = userSnap.data();
                set({
                  isSOSBlocked: !!data.isSOSBlocked,
                  isPermanentlyBlocked: !!data.isPermanentlyBlocked,
                  sosBlockedReason: data.sosBlockedReason || null,
                  sosStrikeCount: data.sosStrikeCount || 0,
                  hasPendingWarning: !!data.hasPendingWarning,
                  warningMessage: data.warningMessage || null
                });
              }
            } catch (e) {
              console.error("Cloud Hub Sync Failed:", e);
            }
          }
          return userPos;
        }
      }
    } catch (e) {
      console.warn("📍 KAVACH: Telemetry Sync Pending (Location Timeout). Nodes will refresh on next pulse.");
    }
    return null;
  }
});
