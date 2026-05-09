import { useEffect, useRef, useState } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { calculateHaversineDistance } from '../utils/geoUtils';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { toast } from 'sonner';

const KavachNative = registerPlugin<any>('KavachPlugin');

/**
 * 🛡️ PROTECTOR SENTINEL (Hardened)
 * Monitors nearby SOS signals and triggers hardware alarms on protector devices.
 * Optimized for battery and real-time response.
 */
export function useProtectorSentinel() {
  const { role, userPos, isRegistered } = useKavachStore();
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
    if (!userPosRef.current || role !== 'protector') return;
    
    cachedAlerts.forEach((alert) => {
      const distance = calculateHaversineDistance(
        userPosRef.current[0], userPosRef.current[1],
        alert.coords[0], alert.coords[1]
      );

      if (distance <= 1.5 && !activeAlertsRef.current.has(alert.id)) {
        handleRadiusBreach(alert.id, distance);
      }
    });
  };

  useEffect(() => {
    // Only Protectors listen for nearby distress signals
    if (!isRegistered || role !== 'protector') return;

    console.log("🛡️ PROTECTOR SENTINEL: National Security Watch Engaged.");

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
          const victimCoords = alertData.coords;
          if (!victimCoords) return;

          const distance = calculateHaversineDistance(
            userPosRef.current[0], userPosRef.current[1],
            victimCoords[0], victimCoords[1]
          );

          // 🚨 RADIUS BREACH: Victim within 1.5km (Increased for safety margin)
          if (distance <= 1.5 && !activeAlertsRef.current.has(alertId)) {
            activeAlertsRef.current.add(alertId);
            
            console.warn(`🚨 KAVACH: DISTRESS DETECTED! DISTANCE: ${Math.round(distance * 1000)}m`);
            
            if (Capacitor.isNativePlatform()) {
              // 1. Force hardware siren on
              KavachNative.startContinuousSiren().catch(() => {});
              
              // 2. Dispatch High-Priority System Notification
              KavachNative.showUrgentNotification({
                title: "🚨 URGENT: NEARBY EMERGENCY",
                body: `A victim needs help ${Math.round(distance * 1000)}m away from your location. Intercept immediately!`,
                id: alertId,
                sound: 'siren'
              }).catch(() => {});
              
              // 3. Trigger Hardware Haptic Pulse
              if (useKavachStore.getState().isHubReady) {
                KavachNative.triggerHapticPulse().catch(() => {});
              }
            }
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
  }, [role, isRegistered]);

  return null;
}
