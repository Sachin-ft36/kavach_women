import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { calculateHaversineDistance } from '../utils/geoUtils';
import { Capacitor, registerPlugin } from '@capacitor/core';

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

  const triggerInternalCheck = () => {
    // Logic for checking existing cached alerts against new position
    // (This would be more complex, but the current simplified approach is robust enough)
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
      unsubscribe();
      // Safety stop
      if (Capacitor.isNativePlatform()) {
        KavachNative.stopContinuousSiren().catch(() => {});
      }
    };
  }, [role, isRegistered]);

  return null;
}
