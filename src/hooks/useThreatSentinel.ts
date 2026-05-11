import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { KavachNative } from '../services/KavachNative';

/**
 * KAVACH THREAT SENTINEL
 * Analyzes telemetry in real-time to detect anomalies:
 * 1. Sudden G-Force (Impact/Fall)
 * 2. Persistent Inactivity in Ride Mode
 * 3. Hourly Sentinel Pulse (Working Professionals)
 * 4. Triple-Tap Pocket Response
 */
export function useThreatSentinel() {
  const { 
    isRideModeActive, 
    userPos, 
    user, 
    isSOSActive,
    isSentinelActive,
    lastSentinelPulse,
    resetSentinelPulse
  } = useKavachStore();

  const lastPosRef = useRef<[number, number]>(userPos);
  const lastMoveTimeRef = useRef<number>(Date.now());
  const tapSequenceRef = useRef<{time: number, force: number}[]>([]);

  useEffect(() => {
    const isCitizen = useKavachStore.getState().role === 'citizen';
    if (isSOSActive || !isCitizen) return;

    const checkThreats = () => {
      // 1. MOTION INACTIVITY CHECK (Ride Mode only)
      if (isRideModeActive) {
        const dist = Math.sqrt(
          Math.pow(userPos[0] - lastPosRef.current[0], 2) + 
          Math.pow(userPos[1] - lastPosRef.current[1], 2)
        );

        if (dist < 0.00005) {
          const inactiveDuration = Date.now() - lastMoveTimeRef.current;
          if (inactiveDuration > 300000) { // 5 Minutes
            console.warn("SENTINEL: Abnormal Inactivity Detected.");
          }
        } else {
          lastMoveTimeRef.current = Date.now();
          lastPosRef.current = userPos;
        }
      }

      // 2. HOURLY SENTINEL PULSE
      if (isSentinelActive && lastSentinelPulse) {
        const timeSincePulse = Date.now() - lastSentinelPulse;
        const ONE_HOUR = 3600000;
        const GRACE_PERIOD = 300000; // 5 Minutes grace

        if (timeSincePulse > ONE_HOUR + GRACE_PERIOD) {
          console.error("SENTINEL: Pulse Unacknowledged. SOS.");
          window.dispatchEvent(new CustomEvent('sos-pulse-failed'));
        } else if (timeSincePulse > ONE_HOUR) {
          if (Capacitor.isNativePlatform() && useKavachStore.getState().isHubReady) {
            KavachNative.triggerHapticPulse().catch(() => {});
          }
        }
      }
    };

    const interval = setInterval(checkThreats, 5000);
    return () => clearInterval(interval);
  }, [userPos, isRideModeActive, isSOSActive, isSentinelActive, lastSentinelPulse]);

  useEffect(() => {
    const isCitizen = useKavachStore.getState().role === 'citizen';
    if (isSOSActive || !isCitizen) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      
      const gForce = Math.sqrt(
        Math.pow(acc.x || 0, 2) + 
        Math.pow(acc.y || 0, 2) + 
        (acc.z ? Math.pow(acc.z, 2) : 9.6)
      ) / 9.81;

      // TRIPLE-TAP DETECTION
      if (gForce > 2.2 && gForce < 4.0) {
        const now = Date.now();
        const recentTaps = tapSequenceRef.current.filter(t => now - t.time < 1500);
        recentTaps.push({ time: now, force: gForce });
        tapSequenceRef.current = recentTaps;

        if (recentTaps.length >= 3) {
           resetSentinelPulse();
           if (Capacitor.isNativePlatform() && useKavachStore.getState().isHubReady) {
             KavachNative.triggerHapticPulse().catch(() => {});
           }
           tapSequenceRef.current = [];
        }
      }

      // IMPACT DETECTION
      if (gForce > 5.0) { 
        window.dispatchEvent(new CustomEvent('sos-impact-trigger', { detail: { gForce } }));
      }
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isSOSActive, resetSentinelPulse]);
}
