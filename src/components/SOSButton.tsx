import React, { useState, useEffect, useRef } from 'react';
import { Shield, Phone, Mic, Radio, Heart } from 'lucide-react';
import { cn } from '../lib/utils';
import { useKavachStore } from '../store/useKavachStore';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { executeEmergencyBlast } from '../services/sosService';

const KavachNative = registerPlugin<any>('KavachPlugin');

export default function SOSButton() {
  const { 
    user, isSOSActive, setSOSActive,
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

  // ── Tactical Shake Sentinel ───────────
  const [shakeProgress, setShakeProgress] = useState(0);
  const shakeCountRef = useRef(0);
  const lastShakeTimeRef = useRef(0);

  useEffect(() => {
    let accelThreshold = 18; // Tactical threshold for intentional shake
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      
      const totalAccel = Math.sqrt((acc.x || 0)**2 + (acc.y || 0)**2 + (acc.z || 0)**2);
      
      if (totalAccel > accelThreshold) {
        const now = Date.now();
        if (now - lastShakeTimeRef.current > 500) { 
          shakeCountRef.current += 1;
          lastShakeTimeRef.current = now;
          setShakeProgress(Math.min((shakeCountRef.current / 3) * 100, 100));
          
          if (shakeCountRef.current >= 3) {
            goLive('shake');
            shakeCountRef.current = 0;
            setShakeProgress(0);
          }
        }
      }
    };

    const requestPermission = async () => {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          if (permission === 'granted') {
             window.addEventListener('devicemotion', handleMotion);
          }
        } catch (e) { console.error("Motion Permission Denied"); }
      } else {
        window.addEventListener('devicemotion', handleMotion);
      }
    };

    requestPermission();

    // Reset progress after 2s of stillness
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
    console.log(`KAVACH: Executing Mission Blast via ${source}...`);
    try {
      const { userPos } = useKavachStore.getState();
      
      // 🛡️ FORENSIC BLACK-BOX: Log locally before sync attempting
      logIncidentToBlackBox({
        source,
        lat: userPos[0],
        lng: userPos[1],
        uid: user?.uid,
        status: 'pending_sync'
      });

      const results = await executeEmergencyBlast(user, userPos, { type: source });
      const alertId = (results[0] as any)?.status === 'fulfilled' ? (results[0] as any).value.id : null;
      
      setSOSActive(true, alertId, source);
      if (Capacitor.isNativePlatform()) KavachNative.triggerHapticPulse().catch(() => {});
    } catch (e) {
      console.error("Critical Failure in Mission Blast:", e);
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
    if (isSOSActive) return; // 🛑 MIC ARBITRATION: Stop listening if SOS recording is active
    
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
    <div className="flex flex-col items-center justify-center space-y-12 py-8">
      <div className="relative">
        <button
          onMouseDown={handleManualTrigger}
          onMouseUp={() => { if (timerRef.current) clearInterval(timerRef.current); setCountdown(3); }}
          onTouchStart={handleManualTrigger}
          onTouchEnd={() => { if (timerRef.current) clearInterval(timerRef.current); setCountdown(3); }}
          className="relative w-72 h-72 rounded-full flex flex-col items-center justify-center z-10 select-none bg-[#0a0a0a] border-4 border-red-600/30 shadow-[0_0_100px_rgba(220,38,38,0.2)]"
        >
          <div className="absolute inset-[-10px] rounded-full border border-red-600/10 animate-[spin_10s_linear_infinite]" />
          <p className="text-red-600 font-black text-6xl italic">{countdown < 3 ? countdown : ""}</p>
          <div className={cn("text-center transition-all duration-300", countdown < 3 ? "opacity-0 scale-50" : "opacity-100 scale-100")}>
            <Shield size={64} className="text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-black text-3xl italic tracking-tighter uppercase leading-none">SHIELD<br/>NEURAL</p>
          </div>
          
          {/* Shake Progress Bar */}
          {shakeProgress > 0 && (
            <div className="absolute -bottom-16 w-48 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${shakeProgress}%` }} />
            </div>
          )}
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 z-10 w-full max-w-sm px-6">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[3px]">Hold 3s or Shake 3 Times</p>
        <div className="grid grid-cols-2 gap-4 w-full">
          <button onClick={() => setFakeCallActive(true)} className="px-4 py-5 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-all">
            <Phone size={20} className="text-accent-blue" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">FAKE CALL</span>
          </button>
          <button 
            onClick={() => setVoiceTriggerActive(!isVoiceTriggerActive)}
            className={cn("px-4 py-5 border rounded-2xl flex flex-col items-center gap-2 relative overflow-hidden active:scale-95 transition-all", isVoiceTriggerActive ? "bg-blue-600/10 border-blue-500 text-white" : "bg-white/[0.03] border-white/10 text-gray-500")}
          >
            <Mic size={20} className={cn(isVoiceTriggerActive && "animate-pulse text-blue-400")} />
            <span className="text-[10px] font-black uppercase tracking-widest">{isVoiceTriggerActive ? "SENTINEL ON" : "VOICE GUARD"}</span>
            {voiceProgress > 0 && <div className="absolute bottom-0 left-0 right-0 bg-blue-500/20" style={{ height: `${voiceProgress}%`, transition: 'height 0.3s ease' }} />}
          </button>
        </div>
      </div>
    </div>
  );
}
