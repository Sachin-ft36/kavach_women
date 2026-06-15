import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, DocumentData } from 'firebase/firestore';
import { calculateHaversineDistance } from '../utils/geoUtils';
import { Capacitor } from '@capacitor/core';
import { KavachNative } from '../services/KavachNative';
import { toast } from 'sonner';

/**
 * 🛡️ PROTECTOR SENTINEL (Hardened)
 * Monitors nearby SOS signals and handles critical hardware notifications.
 * Thread-safe location checking with low-impact tracking loops.
 */
export function useProtectorSentinel() {
  const { role, userPos, isRegistered, profile, isSOSBlocked } = useKavachStore();
  
  // High-performance operational state tracking references
  const activeAlertsRef = useRef<Set<string>>(new Set());
  const alertsDatabaseRef = useRef<Map<string, DocumentData>>(new Map());
  const isSirenPlayingRef = useRef<boolean>(false);
  
  const userPosRef = useRef(userPos);
  const profileRef = useRef(profile);

  // Sync profile data change states instantly across active threads
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    userPosRef.current = userPos;
    
    // Evaluate the perimeter map instantly when the responder's coordinates update
    evaluatePerimeterBreaches();
  }, [userPos]);

  // Centralized evaluation engine for multi-stream coordinate updates
  const evaluatePerimeterBreaches = () => {
    const currentPos = userPosRef.current;
    const currentProfile = profileRef.current;

    if (!currentPos || !currentPos[0] || !currentPos[1] || role !== 'protector' || !currentProfile?.isVerified || isSOSBlocked) {
      return;
    }

    // 🎖️ PROTECTOR ELITE STATUS DETERMINATION
    const occupation = (currentProfile as any)?.protectorVetting?.occupation || '';
    const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police'].some(r => 
      occupation.toLowerCase().includes(r.toLowerCase())
    );

    let activeBreachIdentified = false;

    alertsDatabaseRef.current.forEach((alertData, alertId) => {
      const vLat = alertData.location?.latitude || alertData.coords?.[0];
      const vLng = alertData.location?.longitude || alertData.coords?.[1];
      if (!vLat || !vLng) return;

      // Compute exact distance delta from current position
      const distance = calculateHaversineDistance(currentPos[0], currentPos[1], vLat, vLng);
      const maxAllowedRadius = alertData.dispatchRadius || 1.0;
      
      // Elite responders get an expanded 5km dispatch perimeter
      const isWithinTargetZone = isElite ? (distance <= 5.0) : (distance <= maxAllowedRadius);

      if (isWithinTargetZone) {
        activeBreachIdentified = true;

        if (!activeAlertsRef.current.has(alertId)) {
          activeAlertsRef.current.add(alertId);
          triggerBreachHardwareAlert(alertId, distance, isElite);
        }
      } else {
        // Automatically remove the alert if the responder moves out of range
        if (activeAlertsRef.current.has(alertId)) {
          activeAlertsRef.current.delete(alertId);
        }
      }
    });

    // Automatically manage siren hardware state based on active alerts
    if (!activeBreachIdentified && isSirenPlayingRef.current) {
      isSirenPlayingRef.current = false;
      if (Capacitor.isNativePlatform()) {
        KavachNative.stopContinuousSiren().catch(() => {});
      }
    }
  };

  const triggerBreachHardwareAlert = (alertId: string, distance: number, isElite: boolean) => {
    const distanceInMeters = Math.round(distance * 1000);
    console.warn(`🚨 KAVACH SENTINEL: DISTRESS PERIMETER BREACH -> ID: ${alertId} | DISTANCE: ${distanceInMeters}m`);

    // Synchronize store layer to surface intercept map telemetry
    useKavachStore.getState().setActiveTab('dashboard');

    if (Capacitor.isNativePlatform()) {
      if (!isSirenPlayingRef.current) {
        isSirenPlayingRef.current = true;
        KavachNative.startContinuousSiren().catch(() => {});
      }
      KavachNative.triggerHapticPulse().catch(() => {});
      KavachNative.showUrgentNotification({
        title: isElite ? "🚨 ELITE OVERRIDE: IMMEDIATE SOS" : "🚨 RAKSHAK ALERT: NEARBY DISTRESS",
        body: `Intercept target detected ${distanceInMeters}m away. Deploy immediately!`,
        id: alertId,
        sound: 'siren'
      }).catch(() => {});
    }

    toast.error(isElite ? "ELITE OVERRIDE: SOS DETECTED" : "MISSION CRITICAL: NEARBY SOS", {
      description: `Distress signal tracking within perimeter. Distance: ${distanceInMeters}m.`,
      duration: 15000,
      icon: '🚨',
      action: {
        label: 'INTERCEPT',
        onClick: () => {
          useKavachStore.getState().setActiveTab('dashboard');
        }
      }
    });
  };

  useEffect(() => {
    if (!isRegistered || role !== 'protector' || !profile?.isVerified || isSOSBlocked) return;

    const activeDistressQuery = query(
      collection(db, 'alerts'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(activeDistressQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const alertId = change.doc.id;
        const alertData = change.doc.data();

        if (change.type === 'added' || change.type === 'modified') {
          alertsDatabaseRef.current.set(alertId, alertData);
        }
        
        if (change.type === 'removed' || alertData.status === 'resolved' || alertData.status === 'cancelled') {
          alertsDatabaseRef.current.delete(alertId);
          activeAlertsRef.current.delete(alertId);
        }
      });

      // Run evaluation loop using the fresh dataset
      evaluatePerimeterBreaches();
    }, (error) => {
      console.error("KAVACH Sentinel Link Interrupted:", error);
    });

    return () => {
      unsubscribe();
      if (isSirenPlayingRef.current) {
        isSirenPlayingRef.current = false;
        if (Capacitor.isNativePlatform()) {
          KavachNative.stopContinuousSiren().catch(() => {});
        }
      }
    };
  }, [role, isRegistered, isSOSBlocked, profile?.isVerified]);

  return null;
}
