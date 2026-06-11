import { Capacitor } from '@capacitor/core';
import { db, auth, logTelemetryEvent } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy, doc, setDoc, updateDoc } from 'firebase/firestore';
import { getReverseMetadata } from './locationService';
import { fetchNearbyPoliceMappls } from './MapplsService';
import { KavachSafe } from './KavachNative';
import { DeviceIntegrityService } from './deviceIntegrityService';
import { OfflineQueueService } from './OfflineQueueService';
import { cryptoService } from './cryptoService';
import { GeoPoint } from '../types';

let lastTriggerTime = 0;
const TRIGGER_THROTTLE = 5000; // 🛡️ 5s Tactical Gate to prevent double-logs
const activeBlasts = new Set<string>(); // 🛰️ ATOMIC DEDUPLICATION GATE

export const executeEmergencyBlast = async (user: any, userPos: GeoPoint, data?: any) => {
  const victimId = auth.currentUser?.uid || user?.uid || user?.id || localStorage.getItem('kavach_user_uid');
  if (!victimId) return [];

  const now = Date.now();
  
  // 1. GLOBAL THROTTLE
  if (now - lastTriggerTime < 2000) {
    console.warn("⚠️ KAVACH: Global Redundant Mission Blast Blocked.");
    return [];
  }

  // 2. PER-USER ATOMIC LOCK (Prevents milliseconds race conditions)
  if (activeBlasts.has(victimId)) {
    console.warn(`⚠️ KAVACH: Mission Blast for ${victimId} already in progress. Blocking duplicate.`);
    return [];
  }

  activeBlasts.add(victimId);
  lastTriggerTime = now;

  console.log("🚀 KAVACH: Parallel Tactical Dispatch Engaged for:", victimId);
  
  // Tactical Parallelization Engine
  const tacticalMission = async () => {
    const hooks = [
      // 1. Digital Flare (Cloud Anchor with Deduplication)
      (async () => {
        const finalUser = user || auth.currentUser;
        if (!finalUser || data?.skipCloud) return null;
        
        try {
          const alertsRef = collection(db, 'alerts');
          // 🛡️ SIMPLIFIED DEDUPLICATION QUERY (No index required)
          const q = query(
            alertsRef, 
            where('victimUid', '==', victimId),
            where('status', 'in', ['active', 'responding', 'rescued_pending_victim_clearance'])
          );
          
          const existingSnap = await getDocs(q);
          const existingAlert = existingSnap.docs[0];
          
          const meta = await getReverseMetadata(userPos.lat, userPos.lng);
          const battery = (window as any).kavachBatteryLevel || 0;
          
          // PHASE 8: Device Trust Validation
          const trustReport = await DeviceIntegrityService.calculateTrustScore();
          
          // PHASE 9: Hash Chain Digital Signature Validation
          const payloadString = `${victimId}:${userPos.lat}:${userPos.lng}:${Date.now()}`;
          const digitalSignature = await cryptoService.signPayload(payloadString);
          
          const alertData: any = {
            victimUid: victimId,
            victimName: finalUser.displayName || finalUser.name || 'Kavach Citizen',
            victimPhone: finalUser.phoneNumber || finalUser.phone || localStorage.getItem('kavach_user_phone') || 'UNREGISTERED',
            victimAadhaar: finalUser.aadhar || finalUser.aadhaar || finalUser.victimAadhaar || localStorage.getItem('kavach_user_aadhar') || 'NOT_VERIFIED',
            victimEmail: finalUser.email || 'N/A',
            status: 'active',
            timestamp: serverTimestamp(),
            lastUpdateAt: serverTimestamp(),
            location: { 
              latitude: userPos.lat, 
              longitude: userPos.lng,
              routingLat: data?.routingLat || userPos.lat,
              routingLng: data?.routingLng || userPos.lng,
              address: meta.address,
              city: meta.city,
              pincode: meta.pincode
            },
            telemetry: {
              battery: battery,
              signal: 'HIGH',
              trustScore: trustReport.score,
              trustFlags: trustReport.flags,
              isEmulator: trustReport.isEmulator
            },
            state: meta.state || 'National',
            country: "India",
            type: data?.type || 'SOS_TRIGGER',
            verification_lock: true, 
            dispatch_status: 'ACTIVE_UPLINK',
            handshakeCode: data?.handshakeCode || Math.floor(1000 + Math.random() * 9000).toString(),
            mapplsId: data?.mapplsId || null,
            digitalSignature: digitalSignature,
            guardianContacts: (() => {
              try {
                const gStr = localStorage.getItem('kavach_guardian_cache');
                return gStr ? JSON.parse(gStr) : [];
              } catch (e) { return []; }
            })(),
            ...data?.rideContext
          };

          // 🚗 TRANSIT SYNC: If mission is transit-bound, force journey status
          if (data?.rideContext?.isTransitSOS) {
            try {
              const { updateDoc, doc } = await import('firebase/firestore');
              await updateDoc(doc(db, 'journeys', victimId), {
                status: 'emergency',
                alertId: data.alertId,
                lastUpdated: serverTimestamp()
              });
              console.log("🛑 GRID: Journey Status Escalated to EMERGENCY");
            } catch (e) {
              console.error("❌ KAVACH: Journey Escalation Failed:", e);
            }
          }

          if (existingAlert) {
             console.log(`🛰️ KAVACH: Existing Mission Found [${existingAlert.id}]. Merging Telemetry.`);
             await setDoc(doc(db, 'alerts', existingAlert.id), alertData, { merge: true });
             return { id: existingAlert.id };
          }

          if (data?.alertId) {
            await setDoc(doc(db, 'alerts', data.alertId), alertData, { merge: true });
            logTelemetryEvent('sos_trigger_success_firestore', { method: data?.type });
            return { id: data.alertId };
          }

          const newDoc = await addDoc(collection(db, 'alerts'), alertData);
          logTelemetryEvent('sos_trigger_success_firestore', { method: data?.type });
          return newDoc;
        } catch (error: any) {
          console.error("❌ KAVACH: Alert Dispatch Error (Network/Auth):", error);
          
          // 📦 If offline, queue it!
          if (error?.message?.includes("offline") || error?.code === 'unavailable' || !navigator.onLine) {
            console.warn("⚠️ NETWORK DROPPED: Queuing dispatch payload...");
            logTelemetryEvent('sos_failure_offline_fallback', { method: data?.type, reason: error.message });
            await OfflineQueueService.enqueueSOS(userPos, data);
            return null; // Acknowledge it failed but was queued
          }

          // Fallback to basic creation if query fails but we are online
          return addDoc(collection(db, 'alerts'), {
            victimUid: victimId,
            status: 'active',
            timestamp: serverTimestamp()
          });
        } finally {
           // Release the lock after 10 seconds to allow new missions if needed
           setTimeout(() => activeBlasts.delete(victimId), 10000);
        }
      })(),

      // 2. Physical Signals (Local Tunnel)
      (async () => {
        let guardiansStr = localStorage.getItem('kavach_guardian_cache');
        let guardians = guardiansStr ? JSON.parse(guardiansStr) : [];

        // 🛡️ TACTICAL FALLBACK: If cache is empty, query the master ledger (Firestore)
        if (guardians.length === 0 && victimId) {
          try {
            const gCol = collection(db, 'users', victimId, 'guardians');
            const gSnap = await getDocs(gCol);
            guardians = gSnap.docs.map(d => d.data());
            // Update cache for next time
            if (guardians.length > 0) {
              localStorage.setItem('kavach_guardian_cache', JSON.stringify(guardians));
            }
          } catch (e) {
            console.error("❌ KAVACH: Guardian Ledger Access Failed:", e);
          }
        }

        const phones = guardians.map((g: any) => g.phone).filter(Boolean);
        const alertLink = `https://gen-lang-client-0115433512.web.app/track/${victimId}`;
        
        // 🗺️ Grab fast local metadata for Nearest Police Station
        const meta = await getReverseMetadata(userPos.lat, userPos.lng);
        
        // 🛰️ TACTICAL POI QUERY: Fetch ACTUAL nearest verified Police Station
        let nearestPS = `${meta.suburb || meta.city || 'Nearest'} Police Station`;
        let psMapsLink = '';
        
        try {
          const stations = await fetchNearbyPoliceMappls(userPos.lat, userPos.lng);
          if (stations && stations.length > 0) {
            nearestPS = stations[0].name;
            // Direct pin coordinate link for extreme precision
            psMapsLink = `https://maps.google.com/?q=${stations[0].lat},${stations[0].lng}`;
          } else {
            const searchCity = meta.city ? ` ${meta.city}` : '';
            psMapsLink = `https://maps.google.com/?q=${encodeURIComponent(nearestPS + searchCity)}`;
          }
        } catch (e) {
          const searchCity = meta.city ? ` ${meta.city}` : '';
          psMapsLink = `https://maps.google.com/?q=${encodeURIComponent(nearestPS + searchCity)}`;
        }

        const message = `🚨 SOS! ${user?.displayName?.split(' ')[0] || 'User'} is in danger!
📍 Loc: https://maps.google.com/?q=${userPos.lat},${userPos.lng}
🚔 Near Police Station: ${nearestPS}
🔗 Nav: ${psMapsLink}
🔴 Track: ${alertLink}
PIN: ${data?.handshakeCode || 'N/A'}`;

        console.log(`🛡️ KAVACH DISPATCH: Guardian discovery complete. Found ${phones.length} active nodes.`);

        if (phones.length > 0) {
          await KavachSafe.broadcastEmergencySMS({ numbers: phones, message: message });
        } else {
          console.warn("⚠️ KAVACH: No guardians found to notify via SMS.");
        }

        // 📞 AUTO-CALL INITIATION (First Guardian)
        // 🛡️ TACTICAL OVERRIDE: If triggered via Power Button, Native OS is dialing 112. 
        // We MUST NOT interrupt the police call by trying to dial the guardian simultaneously.
        if (data?.source === 'power') {
          console.warn("⚠️ KAVACH: Power Button trigger detected. Skipping auto-call to Guardian to protect Native 112 call.");
        } else {
          const primaryGuardian = guardians.find((g: any) => g.phone);
          if (primaryGuardian) {
            await KavachSafe.initiateEmergencyCall({ number: primaryGuardian.phone });
          } else {
            console.warn("⚠️ KAVACH: No primary guardian found for auto-call.");
          }
        }

        return true;
      })(),

      // 3. Hardware Haptics
      (async () => {
        if (Capacitor.isNativePlatform() && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 500]);
        }
      })()
    ];

    const results = await Promise.allSettled(hooks);
    console.log("✅ KAVACH: All Mission Nodes Synchronized.");
    return results;
  };

  return tacticalMission();
};

export const archiveIncident = async (incidentId: string) => {
  try {
    const { doc, getDoc, setDoc, deleteDoc } = await import('firebase/firestore');
    
    // 1. Fetch Hot Data
    const alertRef = doc(db, 'alerts', incidentId);
    const alertSnap = await getDoc(alertRef);
    
    if (!alertSnap.exists()) {
      console.warn(`[ARCHIVE] Incident ${incidentId} not found in Hot Data.`);
      return false;
    }
    
    const incidentData = alertSnap.data();
    
    // 2. Only archive if closed or resolved
    if (incidentData.status !== 'resolved' && incidentData.status !== 'closed' && incidentData.status !== 'aborted') {
      console.warn(`[ARCHIVE] Cannot archive active incident ${incidentId}. Current status: ${incidentData.status}`);
      return false;
    }
    
    // 3. Move to Cold Archive Collection
    const archiveRef = doc(db, 'incident_archive', incidentId);
    await setDoc(archiveRef, {
      ...incidentData,
      archivedAt: serverTimestamp()
    });
    
    // 4. Delete from Hot Data
    await deleteDoc(alertRef);
    console.log(`🗄️ [ARCHIVE] Successfully moved incident ${incidentId} to Cold Archive.`);
    return true;
  } catch (error) {
    console.error(`❌ [ARCHIVE] Failed to archive incident ${incidentId}:`, error);
    return false;
  }
};
