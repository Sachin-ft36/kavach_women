import { useEffect, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';

/**
 * 🛰️ KAVACH KINETIC SENTINEL
 * Detects 'Violent Shakes' as a primary emergency trigger.
 * Logic: 3 high-force movements within 1 second.
 */
export const useShakeTrigger = () => {
  const { isSOSActive, setPendingSOS, role, pendingSOS, isBriefingActive } = useKavachStore();
  const lastShakeRef = useRef(0);
  const shakeCountRef = useRef(0);
  
  // 🛡️ High Force Threshold (m/s²) - Prevents false triggers from walking/biking
  const THRESHOLD = 45; 
  const WINDOW = 1500; // 1.5s mission window

  useEffect(() => {
    // 🛡️ Trigger Gating
    if (isSOSActive || pendingSOS || role !== 'citizen' || isBriefingActive) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      // 🛡️ ANTI-WALK FIX: Use linear acceleration
      const acc = event.acceleration;
      if (!acc) return;

      // Calculate total force vector
      const force = Math.sqrt(
        (acc.x || 0) ** 2 + 
        (acc.y || 0) ** 2 + 
        (acc.z || 0) ** 2
      );

      if (force > THRESHOLD) {
        const now = Date.now();
        
        // Check if this shake is within the window of the previous ones
        if (now - lastShakeRef.current < WINDOW) {
          shakeCountRef.current++;
          
          console.log(`📳 KINETIC SENTINEL [BG]: Shake Detected [${shakeCountRef.current}/3] - Force: ${force.toFixed(1)}`);

          if (shakeCountRef.current >= 3) {
            console.error("🚨 KINETIC SENTINEL [BG]: VIOLENT SHAKE PATTERN VERIFIED. TRIGGERING SOS.");
            setPendingSOS(true, 'shake');
            shakeCountRef.current = 0;
          }
        } else {
          // Reset if the window expired
          shakeCountRef.current = 1;
          console.log("📳 KINETIC SENTINEL [BG]: Window Reset.");
        }
        lastShakeRef.current = now;
      }
    };

    // 🛡️ Request Permission for iOS 13+ if needed
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((state: string) => {
          if (state === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isSOSActive, pendingSOS, role, isBriefingActive]);
};
