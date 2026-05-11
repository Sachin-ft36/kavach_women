import { Capacitor } from '@capacitor/core';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy, doc, setDoc } from 'firebase/firestore';
import { getReverseMetadata } from './locationService';
import { KavachSafe } from '../App';

let lastTriggerTime = 0;
const TRIGGER_THROTTLE = 5000; // 🛡️ 5s Tactical Gate to prevent double-logs
const activeBlasts = new Set<string>(); // 🛰️ ATOMIC DEDUPLICATION GATE

export const executeEmergencyBlast = async (user: any, userPos: [number, number], data?: any) => {
  const victimId = user?.uid || user?.id || localStorage.getItem('kavach_user_uid');
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
        if (!user || data?.skipCloud) return null;
        
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
          
          const meta = await getReverseMetadata(userPos[0], userPos[1]);
          const battery = (window as any).kavachBatteryLevel || 0;
          
          const alertData: any = {
            victimUid: victimId,
            victimName: user.displayName || user.name || 'Kavach Citizen',
            victimPhone: user.phoneNumber || user.phone || localStorage.getItem('kavach_user_phone') || 'UNREGISTERED',
            victimAadhaar: user.aadhar || user.aadhaar || user.victimAadhaar || localStorage.getItem('kavach_user_aadhar') || 'NOT_VERIFIED',
            victimEmail: user.email || 'N/A',
            status: 'active',
            timestamp: serverTimestamp(),
            lastUpdateAt: serverTimestamp(),
            location: { 
              latitude: userPos[0], 
              longitude: userPos[1],
              address: meta.address,
              city: meta.city,
              pincode: meta.pincode || meta.postcode
            },
            telemetry: {
              battery: battery,
              signal: 'HIGH'
            },
            state: meta.state || 'National',
            country: "India",
            type: data?.type || 'SOS_TRIGGER',
            verification_lock: true, 
            dispatch_status: 'ACTIVE_UPLINK',
            handshakeCode: data?.handshakeCode || '0000',
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
            return { id: data.alertId };
          }

          const newDoc = await addDoc(collection(db, 'alerts'), alertData);
          return newDoc;
        } catch (error) {
          console.error("❌ KAVACH: Alert Deduplication Error:", error);
          // Fallback to basic creation if query fails
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
        const guardiansStr = localStorage.getItem('kavach_guardian_cache');
        const guardians = guardiansStr ? JSON.parse(guardiansStr) : [];
        const mapLink = `https://www.google.com/maps?q=${userPos[0]},${userPos[1]}`;
        const message = `🚨 CRITICAL EMERGENCY SOS 🚨\nAlert! Help needed!\n📍 ${mapLink}\n🛡️ KAVACH Grid`;

        const smsPromises = guardians.map((g: any) => 
          g.phone ? KavachSafe.sendSilentSMS({ number: g.phone, message: message }) : null
        );

        // 📞 AUTO-CALL INITIATION (First Guardian)
        const primaryGuardian = guardians.find((g: any) => g.phone);
        if (primaryGuardian) {
          KavachSafe.directCall({ number: primaryGuardian.phone });
        }

        return Promise.all(smsPromises);
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
