import React, { useState, useEffect, useRef } from 'react';
import { Shield, Phone, Mic, Radio, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { executeEmergencyBlast } from '../services/sosService';
import { KavachSafe } from '../App';

export default function SOSButton() {
  const { 
    user, profile, isSOSActive, setSOSActive,
    isFakeCallActive, setFakeCallActive,
    isVoiceTriggerActive, setVoiceTriggerActive,
    logIncidentToBlackBox
  } = useKavachStore();

  const [countdown, setCountdown] = useState(3);
  const [isListening, setIsListening] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const helpCountRef = useRef(0);

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
      const accelThreshold = 45; 

      if (force > accelThreshold) {
        const now = Date.now();
        
        if (shakeCountRef.current === 0) {
          shakeWindowRef.current = now;
        }

        if (shakeWindowRef.current && now - shakeWindowRef.current < 1500) {
          if (now - lastShakeTimeRef.current > 250) {
            shakeCountRef.current += 1;
            lastShakeTimeRef.current = now;
            setShakeProgress(Math.min((shakeCountRef.current / 3) * 100, 100));
            console.log(`📳 KINETIC SENTINEL: Shake Detected [${shakeCountRef.current}/3] | Force: ${force.toFixed(1)}`);

            if (shakeCountRef.current >= 3) {
              console.error("🚨 KINETIC SENTINEL: VIOLENT MOTION VERIFIED. TRIGGERING SOS.");
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
          console.log("📳 KINETIC SENTINEL: Mission Window Reset.");
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
  }, []);

  // 🛡️ EMERGENCY PROTOCOLS
  const goLive = async (source: 'button' | 'shake' | 'voice' | 'ride' | 'silent' = 'button') => {
    try {
      const { userPos, batteryLevel } = useKavachStore.getState();
      const isOnline = navigator.onLine;

      // 1. BLACKBOX LOGGING (LOCAL FIRST)
      logIncidentToBlackBox({
        source,
        lat: userPos[0],
        lng: userPos[1],
        uid: user?.uid,
        status: isOnline ? 'syncing' : 'offline_pending'
      });

      // 2. TACTICAL DISPATCH: SMS & CALLS (PHYSICAL SIGNALS)
      const alertId = `alert_${user?.uid || 'GUEST'}_${Date.now()}`;
      
      if (Capacitor.isNativePlatform()) {
        const googleMapsLink = `https://www.google.com/maps?q=${userPos[0]},${userPos[1]}`;
        const timestamp = new Date().toLocaleTimeString();
        const smsMessage = `🚨 EMERGENCY SOS (KAVACH) 🚨\n\nI need help immediately!\n\nLocation: ${googleMapsLink}\nBattery: ${batteryLevel}%\nTime: ${timestamp}\n\nSent automatically via Kavach Safety System.`;
        
        // Native Broadcast (All Guardians)
        await KavachSafe.broadcastEmergencySMS({
          message: smsMessage,
          location: { lat: userPos[0], lng: userPos[1] }
        });
      }

      // 3. CLOUD SYNC & SECONDARY DISPATCH
      if (isOnline) {
        await setSOSActive(true, alertId, source);
        await executeEmergencyBlast(profile || user, userPos, { type: source, alertId });
      } else {
        await setSOSActive(true, null, source);
        // Secondary blast handles local SMS loop if broadcast failed
        await executeEmergencyBlast(profile || user, userPos, { type: source, skipCloud: true });
        toast.error("OFFLINE MODE: Guardian Alerts Dispatched via SMS.", {
          icon: '📡',
          duration: 4000
        });
      }

      if (Capacitor.isNativePlatform()) KavachSafe.triggerHapticPulse();
    } catch (e) {
      console.error("Critical Failure in SOS Broadcast:", e);
      setSOSActive(true, null, source);
    }
  };

  const handleManualTrigger = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(2);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          goLive('button');
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Voice Sentinel ──────────
  const startRecognition = () => {
    if (isSOSActive) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      try {
        const rc = new SpeechRecognition();
        rc.continuous = true;
        rc.interimResults = true;
        rc.lang = 'en-IN';
        rc.onstart = () => { setIsListening(true); helpCountRef.current = 0; setVoiceProgress(0); };
        rc.onerror = () => setIsListening(false);
        rc.onend = () => { 
          setIsListening(false); 
          recognitionRef.current = null; 
          if (isVoiceTriggerActive && !isSOSActive) setTimeout(startRecognition, 1000);
        };
        rc.onresult = (e: any) => {
          const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase();
          if (transcript.includes('help') || transcript.includes('kavach')) {
            helpCountRef.current += 1;
            setVoiceProgress(Math.min((helpCountRef.current / 3) * 100, 100));
            if (helpCountRef.current >= 3) goLive('voice');
          }
        };
        rc.start();
        recognitionRef.current = rc;
      } catch (e) {}
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }
    setIsListening(false);
    setVoiceProgress(0);
  };

  useEffect(() => {
    if (isVoiceTriggerActive && !isSOSActive) startRecognition();
    else stopRecognition();
    return () => stopRecognition();
  }, [isVoiceTriggerActive, isSOSActive]);

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-4">
        <div className="relative group">
          {/* 🌊 DYNAMIC RADAR WAVES (PULSING BACKGROUND) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-44 h-44 rounded-full bg-[#DC2626]/20 animate-ping" />
            <div className="absolute w-56 h-56 rounded-full bg-[#DC2626]/10 animate-ping [animation-delay:1s]" />
            <div className="absolute w-64 h-64 rounded-full bg-[#DC2626]/5 animate-ping [animation-delay:2s]" />
          </div>

          <button
            onMouseDown={handleManualTrigger}
            onMouseUp={() => { if (timerRef.current) clearInterval(timerRef.current); setCountdown(3); }}
            onTouchStart={handleManualTrigger}
            onTouchEnd={() => { if (timerRef.current) clearInterval(timerRef.current); setCountdown(3); }}
            className="relative w-40 h-40 rounded-full flex flex-col items-center justify-center z-10 select-none bg-[#DC2626] shadow-[0_10px_40px_rgba(220,38,38,0.3)] active:scale-95 transition-all duration-300 overflow-hidden border-none"
          >
            <div className="relative z-10 flex flex-col items-center">
              <p className="text-white font-black text-6xl tracking-tighter leading-none">
                {countdown < 3 ? countdown : "SOS"}
              </p>
            </div>

          {/* 🔘 SUBTLE DEPTH */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] pointer-events-none" />
          
          {/* Shake Progress Sentinel */}
          {shakeProgress > 0 && (
            <div className="absolute -bottom-4 w-40 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-[#DC2626] transition-all duration-300" style={{ width: `${shakeProgress}%` }} />
            </div>
          )}
        </button>
      </div>

      {/* Stealth Utilities */}
      <div className="flex flex-col items-center gap-6 z-10 w-full max-w-sm px-6">
        <div className="flex items-center gap-3">
           <div className="w-1.5 h-1.5 bg-[#DC2626] rounded-full animate-pulse" />
           <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[2px]">Hold 3s or Shake to Blast</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 w-full max-w-[260px]">
          <button 
            onClick={() => setFakeCallActive(true)} 
            className="py-2.5 px-3 bg-white/5 border border-white/10 rounded-[20px] flex items-center gap-3 hover:bg-white/10 active:scale-95 transition-all shadow-sm group"
          >
            <div className="w-8 h-8 bg-[#2563EB]/20 rounded-lg flex items-center justify-center text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-all">
              <Phone size={14} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Fake Call</span>
          </button>
          
          <button 
            onClick={() => setVoiceTriggerActive(!isVoiceTriggerActive)}
            className={cn(
              "py-2.5 px-3 border rounded-[20px] flex items-center gap-3 relative overflow-hidden active:scale-95 transition-all shadow-sm group",
              isVoiceTriggerActive 
                ? "bg-[#2563EB]/10 border-[#2563EB] shadow-[0_0_15px_rgba(37,99,235,0.1)]" 
                : "bg-white/5 border-white/10 hover:bg-white/10"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              isVoiceTriggerActive ? "bg-[#2563EB] text-white" : "bg-white/5 text-white/20"
            )}>
              <Mic size={14} className={cn(isVoiceTriggerActive && "animate-pulse")} />
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest",
              isVoiceTriggerActive ? "text-[#2563EB]" : "text-white/50"
            )}>
              {isVoiceTriggerActive ? "On" : "Voice"}
            </span>
            {voiceProgress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-[#2563EB]/10" style={{ height: `${voiceProgress}%`, transition: 'height 0.3s ease' }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
