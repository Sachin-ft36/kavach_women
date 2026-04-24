import { Capacitor } from '@capacitor/core';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const executeEmergencyBlast = async (user: any, userPos: [number, number], data?: any) => {
  console.log("🚀 KAVACH: Parallel Tactical Dispatch Engaged.");
  
  // Tactical Parallelization Engine
  const tacticalMission = async () => {
    const hooks = [
      // 1. Digital Flare (Cloud Anchor)
      (async () => {
        if (!user) return null;
        return addDoc(collection(db, 'alerts'), {
          victimUid: user.uid,
          victimName: user.displayName || 'Kavach Citizen',
          status: 'active',
          timestamp: serverTimestamp(),
          location: { latitude: userPos[0], longitude: userPos[1] },
          type: data?.type || 'SOS_TRIGGER',
          hash: 'PENDING_SHA256_ANCHOR',
          verification_lock: true, // 🛡️ SIGNAL: Only dispatch to Verified Protectors
          dispatch_status: 'QUEUED'
        });
      })(),

      // 2. Physical Signals (Local Tunnel)
      (async () => {
        const KavachDirect = (window as any).KavachDirect;
        if (!KavachDirect) return;
        
        const guardiansStr = localStorage.getItem('emergency_contacts');
        const guardians = guardiansStr ? JSON.parse(guardiansStr) : [];
        const mapLink = `https://www.google.com/maps?q=${userPos[0]},${userPos[1]}`;
        const message = `🚨 CRITICAL EMERGENCY SOS 🚨\nAlert! Help needed!\n📍 ${mapLink}\n🛡️ KAVACH Grid`;

        return Promise.all(guardians.map((g: any) => 
          g.phone ? KavachDirect.directSmsBypass(g.phone, message) : null
        ));
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
