import React, { useState, useEffect, useRef, useContext } from 'react';
import { PhoneCall, Phone, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useKavachStore } from '../state/useKavachStore';
import { useTimeTheme } from '../hooks/useTimeTheme';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../services/KavachNative';
import { auth } from '../firebase';

export default function SOSButton({ forceIsNight }: { forceIsNight?: boolean } = {}) {
  const {
    user, isSOSActive, setSOSActive,
    logIncidentToBlackBox, gender
  } = useKavachStore();
  const { themeFolder } = useTimeTheme();

  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<any | null>(null);

  // ── Shake Detection System ───────────
  const [shakeProgress, setShakeProgress] = useState(0);
  const shakeCountRef = useRef(0);
  const lastShakeTimeRef = useRef(0);
  const shakeWindowRef = useRef<number | null>(null);
  const cooldownRef = useRef(0);

  // Determine if it's night based on current time
  const hour = new Date().getHours();
  const calculatedIsNight = hour >= 18 || hour < 5;
  const isNight = forceIsNight !== undefined ? forceIsNight : calculatedIsNight;

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      if (isSOSActive || Date.now() - cooldownRef.current < 10000) return;

      const acc = event.acceleration;
      if (!acc) return;

      const force = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      const accelThreshold = 55; // Bohot high threshold taaki sirf intentional shake pe kaam kare

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

  // 🛡️ EMERGENCY PROTOCOLS (Apatkalin Niyam)
  const goLive = async (source: 'button' | 'shake' | 'voice' | 'ride' | 'silent' = 'button') => {
    try {
      const { userPos, profile } = useKavachStore.getState();
      const isOnline = navigator.onLine;

      logIncidentToBlackBox({
        source,
        lat: userPos.lat,
        lng: userPos.lng,
        uid: user?.uid,
        status: isOnline ? 'syncing' : 'offline_pending'
      });

      const currentUid = auth.currentUser?.uid || user?.uid || localStorage.getItem('kavach_user_uid') || 'GUEST';
      const alertId = `alert_${currentUid}_${Date.now()}`;

      if (isOnline) {
        await setSOSActive(true, alertId, source);
        toast.success("SOS Alert Broadcasted Locally!");
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
    <div className="relative w-full mt-4 mb-0 select-none z-20 drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]">

      {/* LIGHT MODE: Seamless Masked Background Layer */}
      {!isNight && (
        <div
          className="absolute inset-0 -top-[17px] z-0 pointer-events-none"
          style={{
            WebkitMaskImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 17"><path d="M0 17 C12 17 12 0 26 0 L64 0 C78 0 78 17 90 17 Z" fill="black"/></svg>'), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100%25"><rect width="100%25" height="100%25" rx="28" fill="black"/></svg>')`,
            WebkitMaskPosition: 'top center, center bottom',
            WebkitMaskSize: '90px 17px, 100% calc(100% - 17px)',
            WebkitMaskRepeat: 'no-repeat, no-repeat',
            maskImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 17"><path d="M0 17 C12 17 12 0 26 0 L64 0 C78 0 78 17 90 17 Z" fill="black"/></svg>'), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100%25"><rect width="100%25" height="100%25" rx="28" fill="black"/></svg>')`,
            maskPosition: 'top center, center bottom',
            maskSize: '90px 17px, 100% calc(100% - 17px)',
            maskRepeat: 'no-repeat, no-repeat'
          }}
        >
          {/* Solid Cream White Background */}
          <div className="absolute inset-0 bg-[#fef9f4]" />

          {/* Subtle White Border perfectly tracing the edge */}
          <div className="absolute inset-0 mt-[17px] border-[1.5px] border-white/60 rounded-[28px]"
            style={{ WebkitMaskImage: 'linear-gradient(to right, black 0%, black calc(50% - 45px), transparent calc(50% - 45px), transparent calc(50% + 45px), black calc(50% + 45px), black 100%)' }}
          ></div>
          <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[17px] overflow-visible" viewBox="0 0 90 17">
            <path d="M0 17 C12 17 12 0 26 0 L64 0 C78 0 78 17 90 17" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          </svg>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className={`relative w-full py-[6px] px-[10px] grid grid-cols-[1fr_auto_1fr] items-center z-10 ${isNight ? 'bg-gradient-to-b from-[#1e0307] to-[#090204] border border-red-600 rounded-[28px] shadow-[inset_0_4px_16px_rgba(220,38,38,0.25),0_0_30px_rgba(220,38,38,0.15)]' : 'bg-transparent'}`}>

        {/* Arch bump at the top center for DARK MODE */}
        {isNight && (
          <div className="absolute -top-[17px] left-1/2 -translate-x-1/2 w-[90px] h-[18px] z-30 pointer-events-none">
            <svg width="90" height="18" viewBox="0 0 90 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
              <path
                d="M 0 17 C 12 17, 12 1, 26 1 L 64 1 C 78 1, 78 17, 90 17 L 90 20 L 0 20 Z"
                fill="url(#notchGrad)"
              />
              <path
                d="M 0 17 C 12 17, 12 1, 26 1 L 64 1 C 78 1, 78 17, 90 17"
                stroke="#ff3b30"
                strokeWidth="5"
                opacity="0.32"
                filter="url(#blurGlow)"
              />
              <path
                d="M 0 17 C 12 17, 12 1, 26 1 L 64 1 C 78 1, 78 17, 90 17"
                stroke="#dc2626"
                strokeWidth="1.2"
              />
              <defs>
                <linearGradient id="notchGrad" x1="45" y1="1" x2="45" y2="20" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#5c0d16" />
                  <stop offset="60%" stopColor="#30060b" />
                  <stop offset="100%" stopColor="#1e0307" />
                </linearGradient>
                <filter id="blurGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                </filter>
              </defs>
            </svg>
          </div>
        )}

        {/* Chevron Arrow */}
        <ChevronUp size={13} className={`absolute -top-[14px] left-1/2 -translate-x-1/2 ${isNight ? 'text-red-500' : 'text-slate-800'} stroke-[3.5] z-40 pointer-events-auto drop-shadow-sm`} />

        {/* LEFT COLUMN: EMERGENCY TITLE */}
        <div className="flex flex-col text-left justify-center pl-2 min-w-0 pr-1">
          <span className={`text-[13px] font-black tracking-wider uppercase leading-none ${isNight ? 'text-red-500' : 'text-[#ff5c4a]'}`}>EMERGENCY</span>
          <span className={`text-[9.5px] mt-1 leading-[1.3] ${isNight ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>Hold or tap to<br />open SOS panel</span>
        </div>

        {/* CENTER COLUMN: Core Glowing SOS Button */}
        <div className="relative flex items-center justify-center mx-1 shrink-0">
          {/* Animated Glow Rings */}
          <div className={`absolute w-[50px] h-[50px] rounded-full blur-[8px] pointer-events-none ${isNight ? 'bg-red-600/20 ' : 'bg-[#e60033]/30 animate-heartbeat'}`} />
          <button
            onMouseDown={handleManualTrigger}
            onMouseUp={() => { if (timerRef.current) clearInterval(timerRef.current); setCountdown(3); }}
            onMouseLeave={() => { if (timerRef.current) clearInterval(timerRef.current); setCountdown(3); }}
            onTouchStart={handleManualTrigger}
            onTouchEnd={() => { if (timerRef.current) clearInterval(timerRef.current); setCountdown(3); }}
            className={`
              relative flex items-center justify-center
              w-[54px] h-[54px] rounded-full z-10 
              transition-all duration-300 transform active:scale-95
              ${isNight
                ? 'bg-gradient-to-br from-red-600 to-red-900 border-[2px] border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5),inset_0_2px_5px_rgba(255,255,255,0.2)]'
                : 'bg-gradient-to-br from-[#ff4066] to-[#e60033] border-[2px] border-white shadow-[0_8px_20px_rgba(225,29,72,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] animate-heartbeat'
              }
            `}
          >
            <span className="text-white font-black text-[18px] tracking-tight leading-none drop-shadow-sm">
              {countdown < 3 ? countdown : "SOS"}
            </span>

            {/* Shake progress indicator */}
            {shakeProgress > 0 && (
              <div className="absolute bottom-2 w-10 h-0.5 bg-black/30 rounded-full overflow-hidden z-20">
                <div className="h-full bg-white transition-all duration-300" style={{ width: `${shakeProgress}%` }} />
              </div>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN: Quick Contacts Row */}
        <div className="flex items-center justify-end gap-[5px] shrink-0 pl-1 pr-1">
          {/* Card 1: 112 Police */}
          <div
            onClick={() => KavachSafe.initiateEmergencyCall({ number: '112' })}
            className={`${isNight ? 'bg-[#170909] border-red-500/20' : 'bg-[#fff0e6] border-orange-500/10'} border rounded-[10px] px-[8px] py-[5px] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform`}
          >
            <div className={`w-[20px] h-[20px] ${isNight ? 'bg-red-500/10' : 'bg-[#ff9e80]/20'} rounded-full flex items-center justify-center shrink-0`}>
              <Phone size={9} className={isNight ? "text-red-500 fill-red-500" : "text-[#ff5c4a] fill-[#ff5c4a]"} />
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className={`text-[10px] font-extrabold ${isNight ? 'text-white' : 'text-gray-900'}`}>112</span>
              <span className={`text-[7px] mt-0.5 ${isNight ? 'text-gray-400' : 'text-gray-600'}`}>Police</span>
            </div>
          </div>

          {/* Card 2: 1091 Helpline */}
          <div
            onClick={() => KavachSafe.initiateEmergencyCall({ number: gender === 'female' ? '1091' : '100' })}
            className={`${isNight ? 'bg-[#0e0717] border-purple-500/20' : 'bg-[#f3e5f5] border-purple-500/10'} border rounded-[10px] px-[8px] py-[5px] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform`}
          >
            <div className={`w-[20px] h-[20px] ${isNight ? 'bg-purple-500/10' : 'bg-[#ce93d8]/30'} rounded-full flex items-center justify-center shrink-0`}>
              <PhoneCall size={9} className={isNight ? "text-purple-400 fill-purple-400/10" : "text-[#9c27b0] fill-[#9c27b0]/20"} />
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className={`text-[10px] font-extrabold ${isNight ? 'text-white' : 'text-gray-900'}`}>{gender === 'female' ? '1091' : '100'}</span>
              <span className={`text-[7px] mt-0.5 ${isNight ? 'text-gray-400' : 'text-gray-600'}`}>Helpline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
