import { Capacitor } from '@capacitor/core';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { registerPlugin } from '@capacitor/core';
import { getReverseMetadata } from './locationService';

const KavachNative = registerPlugin<any>('KavachPlugin');

export const executeEmergencyBlast = async (user: any, userPos: [number, number], data?: any) => {
  console.log("🚀 KAVACH: Parallel Tactical Dispatch Engaged.");
  
  // Tactical Parallelization Engine
  const tacticalMission = async () => {
    const hooks = [
      // 1. Digital Flare (Cloud Anchor)
      (async () => {
        if (!user) return null;
        const meta = await getReverseMetadata(userPos[0], userPos[1]);
        
        return addDoc(collection(db, 'alerts'), {
          victimUid: user.uid,
          victimName: user.displayName || 'Kavach Citizen',
          victimPhone: user.phoneNumber || localStorage.getItem('kavach_user_phone') || 'UNREGISTERED',
          victimAadhar: user.aadhar || localStorage.getItem('kavach_user_aadhar') || 'NOT_VERIFIED',
          status: 'active',
          timestamp: serverTimestamp(),
          location: { latitude: userPos[0], longitude: userPos[1] },
          state: meta.state,
          country: "India",
          type: data?.type || 'SOS_TRIGGER',
          hash: 'PENDING_SHA256_ANCHOR',
          verification_lock: true, 
          dispatch_status: 'QUEUED'
        });
      })(),

      // 2. Physical Signals (Local Tunnel)
      (async () => {
        const guardiansStr = localStorage.getItem('kavach_guardian_cache');
        const guardians = guardiansStr ? JSON.parse(guardiansStr) : [];
        const mapLink = `https://www.google.com/maps?q=${userPos[0]},${userPos[1]}`;
        const message = `🚨 CRITICAL EMERGENCY SOS 🚨\nAlert! Help needed!\n📍 ${mapLink}\n🛡️ KAVACH Grid`;

        const smsPromises = guardians.map((g: any) => 
          g.phone ? KavachNative.sendSilentSMS({ number: g.phone, message: message }) : null
        );

        // 📞 AUTO-CALL INITIATION (First Guardian) - Calling Native method 'directCall'
        const primaryGuardian = guardians.find((g: any) => g.phone);
        if (primaryGuardian) {
          KavachNative.directCall({ number: primaryGuardian.phone });
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
