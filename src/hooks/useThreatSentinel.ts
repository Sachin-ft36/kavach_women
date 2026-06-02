import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { KavachNative } from '../services/KavachNative';
import { calculateHaversineDistance } from '../utils/geoUtils';

/**
 * 🛰️ KAVACH THREAT SENTINEL (Hardened)
 * Thread-safe multi-vector telemetry processor tracking device state anomalies.
 * Uses a low-pass gravity filter to isolate real physical impacts.
 */
export function useThreatSentinel() {
  const { 
    isRideModeActive, 
    userPos, 
    isSOSActive,
    isSentinelActive,
    lastSentinelPulse,
    resetSentinelPulse,
    isSOSBlocked
  } = useKavachStore();

  // Thread-isolated reference cells to prevent state-change race conditions
  const userPosRef = useRef(userPos);
  const lastPosRef = useRef<[number, number] | null>(null);
  const lastMoveTimeRef = useRef<number>(Date.now());
  const tapSequenceRef = useRef<{ time: number; force: number }[]>([]);

  // Keep references perfectly aligned with high-frequency stream state updates
  useEffect(() => {
    userPosRef.current = userPos;
    if (!lastPosRef.current && userPos) {
      lastPosRef.current = [userPos[0], userPos[1]];
    }
  }, [userPos]);

  // VECTOR LOOP A: INACTIVITY & KEEPALIVE SENTINEL PULSE MONITORING
  useEffect(() => {
    const isCitizen = useKavachStore.getState().role === 'citizen';
    if (isSOSActive || !isCitizen || isSOSBlocked) return;

    const executeThreatAssessmentVitals = () => {
      const currentPos = userPosRef.current;
      const now = Date.now();

      // 1. HIGH-PRECISION INACTIVITY MONITORING (Ride Mode Only)
      // Removed: This logic is now handled robustly by the dedicated `useRideProtocol.ts` module.
      // -----------------------------------------------------------------------------------------


      // 2. HOURLY SENTINEL KEEP-ALIVE PULSE MONITORING
      if (isSentinelActive && lastSentinelPulse) {
        const timeElapsedSinceLastPulseMS = now - lastSentinelPulse;
        const ONE_HOUR_MS = 3600000;
        const INTEGRATED_GRACE_PERIOD_MS = 300000; // 5-minute confirmation window

        if (timeElapsedSinceLastPulseMS > (ONE_HOUR_MS + INTEGRATED_GRACE_PERIOD_MS)) {
          console.error("🚨 SENTINEL: Keep-Alive pulse missed. Initializing emergency cascade.");
          window.dispatchEvent(new CustomEvent('sos-pulse-failed'));
        } else if (timeElapsedSinceLastPulseMS > ONE_HOUR_MS) {
          // Fire a warning pulse to prompt the user to check in
          if (Capacitor.isNativePlatform() && useKavachStore.getState().isHubReady) {
            KavachNative.triggerHapticPulse().catch(() => {});
          }
        }
      }
    };

    const evaluationIntervalEngine = setInterval(executeThreatAssessmentVitals, 5000);
    
    return () => clearInterval(evaluationIntervalEngine);
    // Dependencies are decoupled from raw coordinates to ensure steady background execution
  }, [isRideModeActive, isSOSActive, isSentinelActive, lastSentinelPulse, isSOSBlocked]);


  // VECTOR LOOP B: HIGH-FREQUENCY KINETIC AND IMPACT DETECTION
  useEffect(() => {
    const isCitizen = useKavachStore.getState().role === 'citizen';
    if (isSOSActive || !isCitizen || isSOSBlocked) return;

    // Linear filtering variables to isolate the Earth's natural gravity vector
    let gravityX = 0, gravityY = 0, gravityZ = 0;

    const handleHighFrequencyMotionTelemetry = (event: DeviceMotionEvent) => {
      const rawAcceleration = event.accelerationIncludingGravity;
      if (!rawAcceleration) return;

      const alphaConstant = 0.8; // Low-pass filter coefficient matrix
      
      // Isolate and subtract regular earth gravity using the low-pass filter
      gravityX = alphaConstant * gravityX + (1 - alphaConstant) * (rawAcceleration.x || 0);
      gravityY = alphaConstant * gravityY + (1 - alphaConstant) * (rawAcceleration.y || 0);
      gravityZ = alphaConstant * gravityZ + (1 - alphaConstant) * (rawAcceleration.z || 0);

      const linearAccX = (rawAcceleration.x || 0) - gravityX;
      const linearAccY = (rawAcceleration.y || 0) - gravityY;
      const linearAccZ = (rawAcceleration.z || 0) - gravityZ;

      // Calculate pure acceleration force using the isolated values
      const trueGForceMagnitude = Math.sqrt(
        linearAccX ** 2 + 
        linearAccY ** 2 + 
        linearAccZ ** 2
      ) / 9.80665;

      const currentTimeStamp = Date.now();

      // 1. TRIPLE-TAP LOGIC: Confirms intentional check-in taps through a pocket or bag
      if (trueGForceMagnitude > 1.8 && trueGForceMagnitude < 3.8) {
        const filteredRecentTaps = tapSequenceRef.current.filter(
          tap => (currentTimeStamp - tap.time) < 1500
        );
        
        // Enforce a minimum interval between taps to prevent a single bump from counting twice
        const lastRecordedTap = filteredRecentTaps[filteredRecentTaps.length - 1];
        if (!lastRecordedTap || (currentTimeStamp - lastRecordedTap.time) > 180) {
          filteredRecentTaps.push({ time: currentTimeStamp, force: trueGForceMagnitude });
          tapSequenceRef.current = filteredRecentTaps;

          if (tapSequenceRef.current.length === 3) {
            console.log("🛰️ SENTINEL: Triple-tap pattern confirmed. Resetting pulse timers.");
            resetSentinelPulse();
            
            if (Capacitor.isNativePlatform() && useKavachStore.getState().isHubReady) {
              KavachNative.triggerHapticPulse().catch(() => {});
            }
            tapSequenceRef.current = []; // Clear sequence state immediately
          }
        }
      }

      // 2. IMPACT DETECTION PROTOCOL: Registers severe accidents, drops, or physical attacks
      if (trueGForceMagnitude > 4.5) { 
        console.error(`🚨 SENTINEL: High G-force event detected: ${trueGForceMagnitude.toFixed(2)}G`);
        window.dispatchEvent(
          new CustomEvent('sos-impact-trigger', { 
            detail: { gForce: trueGForceMagnitude } 
          })
        );
      }
    };

    window.addEventListener('devicemotion', handleHighFrequencyMotionTelemetry, true);
    
    return () => {
      window.removeEventListener('devicemotion', handleHighFrequencyMotionTelemetry, true);
    };
  }, [isSOSActive, resetSentinelPulse, isSOSBlocked]);

  return null;
}
