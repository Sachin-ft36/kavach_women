import { useEffect, useRef, useState } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { calculateHaversineDistance } from '../utils/geoUtils';
import { Capacitor } from '@capacitor/core';
import { KavachNative } from '../services/KavachNative';
import { toast } from 'sonner';

/**
 * 🛡️ PROTECTOR SENTINEL (Hardened)
 * Monitors nearby SOS signals and triggers hardware alarms on protector devices.
 * Optimized for battery and real-time response.
 */
export function useProtectorSentinel() {
  const { role, userPos, isRegistered, profile, isSOSBlocked } = useKavachStore();
  const activeAlertsRef = useRef<Set<string>>(new Set());
  const userPosRef = useRef(userPos);

  // Sync ref with store position for low-dependency checking
  useEffect(() => {
    userPosRef.current = userPos;
    // When protector moves, re-check existing alerts
    triggerInternalCheck();
  }, [userPos]);

  const [cachedAlerts, setCachedAlerts] = useState<any[]>([]);

  const handleRadiusBreach = (alertId: string, distance: number) => {
    activeAlertsRef.current.add(alertId);
    console.warn(`🚨 KAVACH SENTINEL: DISTRESS DETECTED! DISTANCE: ${Math.round(distance * 1000)}m`);
    
    if (Capacitor.isNativePlatform()) {
      KavachNative.startContinuousSiren().catch(() => {});
      KavachNative.showUrgentNotification({
        title: "🚨 URGENT: NEARBY EMERGENCY",
        body: `A victim needs help ${Math.round(distance * 1000)}m away. Intercept now!`,
        id: alertId,
        sound: 'siren'
      }).catch(() => {});
    }
    toast.error("NEARBY SOS DETECTED", { 
      description: `Target located ${Math.round(distance * 1000)}m away. Check Map!`,
      duration: 10000 
    });
  };

  const triggerInternalCheck = () => {
    if (!userPosRef.current || role !== 'protector' || !profile?.isVerified || isSOSBlocked) return;
    
    // 🎖️ PROTECTOR ELITE STATUS
    const occupation = profile?.protectorVetting?.occupation || '';
    const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police'].some(r => 
      occupation.toLowerCase().includes(r.toLowerCase())
    );

    cachedAlerts.forEach((alert) => {
      const distance = calculateHaversineDistance(
        userPosRef.current[0], userPosRef.current[1],
        alert.location?.latitude || alert.coords?.[0], 
        alert.location?.longitude || alert.coords?.[1]
      );

      const activeRadius = alert.dispatchRadius || 1.0;
      const canHelp = isElite ? (distance <= 5.0) : (distance <= activeRadius);

      if (canHelp && !activeAlertsRef.current.has(alert.id)) {
        handleRadiusBreach(alert.id, distance);
      }
    });
  };

  useEffect(() => {
    // Only Protectors listen for nearby distress signals, and ONLY IF VERIFIED
    if (!isRegistered || role !== 'protector' || !profile?.isVerified || isSOSBlocked) return;

    // 🎖️ PROTECTOR ELITE STATUS
    const occupation = profile?.protectorVetting?.occupation || '';
    const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police'].some(r => 
      occupation.toLowerCase().includes(r.toLowerCase())
    );

    console.log(`🛡️ PROTECTOR SENTINEL: ${isElite ? 'ELITE' : 'STANDARD'} Watch Engaged.`);

    const q = query(
      collection(db, 'alerts'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCachedAlerts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      snapshot.docChanges().forEach((change) => {
        const alertData = change.doc.data();
        const alertId = change.doc.id;

        if (change.type === 'added' || change.type === 'modified') {
          const vLat = alertData.location?.latitude || alertData.coords?.[0];
          const vLng = alertData.location?.longitude || alertData.coords?.[1];
          if (!vLat || !vLng) return;

          const distance = calculateHaversineDistance(
            userPosRef.current[0], userPosRef.current[1],
            vLat, vLng
          );

          // 🚨 TIERED RADIUS BREACH: Check against dynamic dispatch radius
          const activeRadius = alertData.dispatchRadius || 1.0;
          const canHelp = isElite ? (distance <= 5.0) : (distance <= activeRadius);

          if (canHelp && !activeAlertsRef.current.has(alertId)) {
            activeAlertsRef.current.add(alertId);
            
            // 🛡️ TACTICAL SYNC: Link to Store
            useKavachStore.getState().setActiveTab('dashboard');
            
            console.warn(`🚨 KAVACH: DISTRESS DETECTED! TIER: ${activeRadius}KM, DISTANCE: ${Math.round(distance * 1000)}m`);
            
            if (Capacitor.isNativePlatform()) {
              KavachNative.startContinuousSiren().catch(() => {});
              KavachNative.showUrgentNotification({
                title: isElite ? "🚨 ELITE ALERT: IMMEDIATE SOS" : "🚨 RAKSHAK ALERT: NEARBY SOS",
                body: `Distress signal ${Math.round(distance * 1000)}m away. Intercept now!`,
                id: alertId,
                sound: 'siren'
              }).catch(() => {});
              KavachNative.triggerHapticPulse().catch(() => {});
            }

            toast.error(isElite ? "ELITE OVERRIDE: SOS DETECTED" : "MISSION CRITICAL: NEARBY SOS", {
              description: `Distress signal detected. Distance: ${Math.round(distance * 1000)}m. Mobilize!`,
              duration: 15000,
              icon: '🚨',
              action: {
                label: 'INTERCEPT',
                onClick: () => {
                  useKavachStore.getState().setActiveTab('dashboard');
                }
              }
            });
          }
        }

        if (change.type === 'removed' || alertData.status === 'resolved' || alertData.status === 'cancelled') {
          if (activeAlertsRef.current.has(alertId)) {
            activeAlertsRef.current.delete(alertId);
            
            // Auto-stop siren ONLY if no other nearby alerts are active
            if (activeAlertsRef.current.size === 0 && Capacitor.isNativePlatform()) {
              KavachNative.stopContinuousSiren().catch(() => {});
            }
          }
        }
      });
    }, (error) => {
      console.error("KAVACH Sentinel Link Interrupted:", error);
    });

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        console.warn("Sentinel Cleanup Interrupted:", e);
      }
      // Safety stop
      if (Capacitor.isNativePlatform()) {
        KavachNative.stopContinuousSiren().catch(() => {});
      }
    };
  }, [role, isRegistered, profile, isSOSBlocked]);

  return null;
}
