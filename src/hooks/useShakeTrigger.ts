import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';

/**
 * 🛰️ KAVACH KINETIC SENTINEL
 * Monitors physical device motion to catch violent altercations automatically.
 * Includes a low-pass filter to prevent false triggers from simple drops or running.
 */
export function useShakeTrigger() {
  const { isSOSActive, setPendingSOS, role, pendingSOS, isBriefingActive, isSOSBlocked, isVerified } = useKavachStore();
  
  const lastShakeTimestampRef = useRef<number>(0);
  const shakeCountRef = useRef<number>(0);
  const isListenerAttachedRef = useRef<boolean>(false);
  
  // 🛡️ TACTICAL SENSOR CALIBRATION PARAMETERS
  const ACCELERATION_FORCE_THRESHOLD = 55.0;  // Extremely high force to ignore casual sofa bounces
  const MAX_SESSION_WINDOW_MS = 2000;         // Tightened back to 2s. 5 shakes in 2s is intentional.
  const MIN_SHAKE_INTERVAL_MS = 250;          // Allowed fast frantic shaking (force handles false positives)

  useEffect(() => {
    // Structural gating checks
    if (isSOSActive || pendingSOS || role !== 'citizen' || isBriefingActive || isSOSBlocked || !isVerified) {
      teardownKineticEngine();
      return;
    }

    function handleMotionTelemetry(event: DeviceMotionEvent) {
      // Isolate linear acceleration (excluding gravity offsets)
      const acceleration = event.acceleration;
      if (!acceleration) return;

      // Calculate total force vector via Euclidean norm formula
      const forceMagnitude = Math.sqrt(
        (acceleration.x || 0) ** 2 + 
        (acceleration.y || 0) ** 2 + 
        (acceleration.z || 0) ** 2
      );

      if (forceMagnitude > ACCELERATION_FORCE_THRESHOLD) {
        const currentTime = Date.now();
        const timeDeltaSinceLastShake = currentTime - lastShakeTimestampRef.current;

        // 🛡️ LOW-PASS FILTER GAUNTLET: Stop instant micro-vibrations from counting twice
        if (timeDeltaSinceLastShake < MIN_SHAKE_INTERVAL_MS) {
          return; 
        }

        // Verify if this movement falls within the active tracking window
        if (timeDeltaSinceLastShake < MAX_SESSION_WINDOW_MS) {
          shakeCountRef.current += 1;
          console.log(`📳 KINETIC SENTINEL: Verified movement [${shakeCountRef.current}/5] | Force: ${forceMagnitude.toFixed(1)} m/s²`);

          if (shakeCountRef.current >= 5) {
            console.error("🚨 KINETIC SENTINEL: VIOLENT PATTERN CONFIRMED. INITIALIZING SOS PROTOCOL.");
            setPendingSOS(true, 'shake');
            shakeCountRef.current = 0;
          }
        } else {
          // The window expired, treat this as the first shake of a new pattern
          shakeCountRef.current = 1;
          console.log("📳 KINETIC SENTINEL: Tracking window reset. Starting new count.");
        }

        lastShakeTimestampRef.current = currentTime;
      }
    }

    function initializeKineticEngine() {
      if (isListenerAttachedRef.current) return;
      
      // On iOS devices inside a web container, skip auto-binding and wait for manual user initialization
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        return; 
      }

      window.addEventListener('devicemotion', handleMotionTelemetry, true);
      isListenerAttachedRef.current = true;
      console.log("🛰️ KAVACH: Native Kinetic Engine Monitoring active.");
    }

    function teardownKineticEngine() {
      if (isListenerAttachedRef.current) {
        window.removeEventListener('devicemotion', handleMotionTelemetry, true);
        isListenerAttachedRef.current = false;
        shakeCountRef.current = 0;
        console.log("🛑 KAVACH: Kinetic Engine Monitoring disabled.");
      }
    }

    initializeKineticEngine();

    return () => {
      teardownKineticEngine();
    };
  }, [isSOSActive, pendingSOS, role, isBriefingActive, isSOSBlocked, isVerified]);

  return null;
}

/**
 * 🍏 iOS CRITICAL PERMISSION SECURE PLUG
 * Must be called directly via a UI click action (e.g., onboarding or a dashboard toggle button).
 */
export async function requestKineticSensorAccess(): Promise<boolean> {
  if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
    try {
      const authorizationState = await (DeviceMotionEvent as any).requestPermission();
      if (authorizationState === 'granted') {
        console.log("🍏 iOS SENSOR BRIDGE: Access granted.");
        return true;
      }
      return false;
    } catch (fault) {
      console.error("Sensor initialization rejected on iOS hardware:", fault);
      return false;
    }
  }
  return true; // Android or standard web views that do not restrict initialization
}
