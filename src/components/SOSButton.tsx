import React, { useState, useEffect, useRef } from 'react';
import { Shield, Phone, Mic, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { KavachSafe } from '../services/KavachNative';
import { auth } from '../firebase';
import { motion } from 'motion/react';

export default function SOSButton() {
  const {
    user, profile, isSOSActive, setSOSActive,
    isFakeCallActive, setFakeCallActive,
    isVoiceTriggerActive, setVoiceTriggerActive,
    logIncidentToBlackBox, setPendingSOS
  } = useKavachStore();

  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<any | null>(null);

  // ── Shake Detection Sentinel ───────────
  const [shakeProgress, setShakeProgress] = useState(0);
  const shakeCountRef = useRef(0);
  const lastShakeTimeRef = useRef(0);
  const shakeWindowRef = useRef<number | null>(null);
  const cooldownRef = useRef(0);

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      if (isSOSActive || Date.now() - cooldownRef.current < 10000) return;

      const acc = event.acceleration;
      if (!acc) return;

      const force = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      const accelThreshold = 55; // Extremely high threshold for explicit human intent

      if (force > accelThreshold) {
        const now = Date.now();

        if (shakeCountRef.current === 0) {
          shakeWindowRef.current = now;
        }

        if (shakeWindowRef.current && now - shakeWindowRef.current < 2000) {
          if (now - lastShakeTimeRef.current > 250) {
            shakeCountRef.current += 1;
            lastShakeTimeRef.current = now;
            setShakeProgress(Math.min((shakeCountRef.current / 5) * 100, 100));

            if (shakeCountRef.current >= 5) {
              cooldownRef.current = now;
              goLive('shake');
              shakeCountRef.current = 0;
              shakeWindowRef.current = null;
              setShakeProgress(0);
            }
          }
        } else {
          shakeCountRef.current = 1;
          shakeWindowRef.current = now;
          lastShakeTimeRef.current = now;
          setShakeProgress(33);
        }
      }
    };

    const requestPermission = async () => {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          if (permission === 'granted') window.addEventListener('devicemotion', handleMotion);
        } catch (e) { console.error("Motion Permission Denied"); }
      } else window.addEventListener('devicemotion', handleMotion);
    };
    requestPermission();

    const timer = setInterval(() => {
      if (Date.now() - lastShakeTimeRef.current > 2000 && shakeCountRef.current > 0) {
        shakeCountRef.current = 0;
        setShakeProgress(0);
      }
    }, 1000);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      clearInterval(timer);
    };
  }, [isSOSActive]);

  // 🛡️ EMERGENCY PROTOCOLS
  const goLive = async (source: 'button' | 'shake' | 'voice' | 'ride' | 'silent' = 'button') => {
    try {
      const { userPos } = useKavachStore.getState();
      const isOnline = navigator.onLine;

      logIncidentToBlackBox({
        source,
        lat: userPos[0],
        lng: userPos[1],
        uid: user?.uid,
        status: isOnline ? 'syncing' : 'offline_pending'
      });

      const currentUid = auth.currentUser?.uid || user?.uid || localStorage.getItem('kavach_user_uid') || 'GUEST';
      const alertId = `alert_${currentUid}_${Date.now()}`;

      if (isOnline) {
        await setSOSActive(true, alertId, source);
      } else {
        await setSOSActive(true, null, source);
        toast.error("OFFLINE MODE Dispatched via Local Signal.");
      }

      if (Capacitor.isNativePlatform()) KavachSafe.triggerHapticPulse();
    } catch (e) {
      setSOSActive(true, null, source);
    }
  };

  const handleManualTrigger = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(2);

    let currentVal = 2;
    timerRef.current = setInterval(() => {
      currentVal -= 1;
      if (currentVal <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setCountdown(3);
        goLive('button');
      } else {
        setCountdown(currentVal);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-1">
      <div className="relative flex items-center justify-center">

        {/* Soft, warm glowing protective waves (Rose/Crimson tones) */}
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-rose-500/10 blur-xl pointer-events-none"
          animate={{ scale: [0.95, 1.15, 0.95], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-56 h-56 rounded-full border border-rose-500/20 bg-rose-500/5 pointer-events-none"
          animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Matte-Glossy Red Emergency Button */}
        <button
          onMouseDown={handleManualTrigger}
          onMouseUp={() => { if (timerRef.current) clearInterval(timerRef.current); setCountdown(3); }}
          onTouchStart={handleManualTrigger}
          onTouchEnd={() => { if (timerRef.current) clearInterval(timerRef.current); setCountdown(3); }}
          className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center z-10 select-none bg-red-600 shadow-[0_15px_45px_rgba(220,38,38,0.35)] active:scale-[0.96] transition-all duration-300 cursor-pointer overflow-hidden group"
        >

          {/* Delicate protective grid pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8),transparent_80%)]" />

          {/* Glowing Shield Badge above SOS */}
          <Shield size={16} className="text-white/95 mb-1.5 z-10 drop-shadow-md animate-pulse" />

          <p className="text-white font-black text-5xl sm:text-6xl tracking-tight leading-none select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            {countdown < 3 ? countdown : "SOS"}
          </p>

          <p className="text-[7.5px] sm:text-[8.5px] font-extrabold text-white/90 uppercase tracking-[3px] mt-2 select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
            {countdown < 3 ? "HOLDING..." : "PRESS & HOLD"}
          </p>

          {shakeProgress > 0 && (
            <div className="absolute bottom-6 w-20 h-1 bg-white/30 rounded-full overflow-hidden z-20">
              <div className="h-full bg-white transition-all duration-300" style={{ width: `${shakeProgress}%` }} />
            </div>
          )}
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 z-10 w-full max-w-sm px-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-[#DC2626] rounded-full shrink-0" />
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest whitespace-nowrap">Power Button 3x or Shake to Blast</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-[260px]">
          <button
            onClick={() => setFakeCallActive(true)}
            className="py-3 px-4 bg-gray-800 rounded-2xl flex items-center gap-3 active:scale-95 transition-transform"
          >
            <Phone size={14} className="text-blue-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Fake Call</span>
          </button>

          <button
            onClick={() => setVoiceTriggerActive(!isVoiceTriggerActive)}
            className={cn(
              "py-3 px-4 rounded-2xl flex items-center gap-3 active:scale-95 transition-transform",
              isVoiceTriggerActive ? "bg-blue-600" : "bg-gray-800"
            )}
          >
            <Mic size={14} className={cn("shrink-0", isVoiceTriggerActive ? "text-white" : "text-gray-400")} />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              isVoiceTriggerActive ? "text-white" : "text-gray-300"
            )}>
              {isVoiceTriggerActive ? "Voice On" : "Voice Off"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
