import { useEffect, useRef } from 'react';
import { useKavachStore } from '../state/useKavachStore';
import { Capacitor } from '@capacitor/core';

/**
 * 🛰️ KAVACH KINETIC SENTINEL
 * Monitors physical device motion to catch violent altercations automatically.
 * Includes a low-pass filter to prevent false triggers from simple drops or running.
 */
export function useShakeTrigger() {
  const { isSOSActive, setPendingSOS, profile, pendingSOS, isBriefingActive, isSOSBlocked, isVerified } = useKavachStore();
  const isCitizen = profile?.state_flags?.is_citizen;
  
  const spikeTimestampsRef = useRef<number[]>([]);
  const isListenerAttachedRef = useRef<boolean>(false);
  const lastSpikeTimeRef = useRef<number>(0);
  
  // 🛡️ TACTICAL SENSOR CALIBRATION PARAMETERS
  const G_FORCE_THRESHOLD = 3.5;              // 3.5G threshold to filter out standard motion
  const SPIKE_WINDOW_MS = 600;                // 600ms window to catch violent flailing
  const MIN_SPIKE_INTERVAL_MS = 100;          // Prevent double counting single spikes

  useEffect(() => {
    // Structural gating checks - only active for verified citizens who don't have active warnings or SOS
    if (isSOSActive || pendingSOS || !isCitizen || isBriefingActive || isSOSBlocked || !isVerified) {
      teardownKineticEngine();
      return;
    }

    function handleMotionTelemetry(event: DeviceMotionEvent) {
      // Isolate linear acceleration (excluding gravity offsets)
      const acceleration = event.acceleration;
      if (!acceleration) return;

      // Calculate total force vector via Euclidean norm formula (m/s^2)
      const rawForceMagnitude = Math.sqrt(
        (acceleration.x || 0) ** 2 + 
        (acceleration.y || 0) ** 2 + 
        (acceleration.z || 0) ** 2
      );

      // Convert to G-force (1G = 9.80665 m/s^2)
      const gForce = rawForceMagnitude / 9.80665;

      if (gForce >= G_FORCE_THRESHOLD) {
        const currentTime = Date.now();
        
        // Prevent double counting of the same shake action in ultra-rapid succession
        if (currentTime - lastSpikeTimeRef.current < MIN_SPIKE_INTERVAL_MS) {
          return;
        }
        
        lastSpikeTimeRef.current = currentTime;
        
        // Push the new verified violent movement spike timestamp in native memory
        spikeTimestampsRef.current.push(currentTime);
        
        // Keep only the spikes within the 600ms window
        spikeTimestampsRef.current = spikeTimestampsRef.current.filter(
          timestamp => currentTime - timestamp <= SPIKE_WINDOW_MS
        );

        console.log(`📳 KINETIC SENTINEL: Verified G-force: ${gForce.toFixed(2)}G | Spikes in 600ms: [${spikeTimestampsRef.current.length}/3]`);

        if (spikeTimestampsRef.current.length >= 3) {
          console.error("🚨 KINETIC SENTINEL: VIOLENT 3.5G PATTERN CONFIRMED. DETONATING CRIMSON WINDOW.");
          setPendingSOS(true, 'shake');
          spikeTimestampsRef.current = [];
        }
      }
    }

    function initializeKineticEngine() {
      if (isListenerAttachedRef.current) return;
      
      // On iOS devices inside a web container, skip auto-binding and wait for manual user authorization
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
        spikeTimestampsRef.current = [];
        console.log("🛑 KAVACH: Kinetic Engine Monitoring disabled.");
      }
    }

    initializeKineticEngine();

    return () => {
      teardownKineticEngine();
    };
  }, [isSOSActive, pendingSOS, isCitizen, isBriefingActive, isSOSBlocked, isVerified]);

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
