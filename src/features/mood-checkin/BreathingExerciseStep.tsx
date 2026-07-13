import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft, Shield, Wind, Pause, CheckCircle2, Home, RotateCcw, HeartPulse, Brain, Moon, Play, Lock, Square, Check, Sparkles, Heart } from 'lucide-react';
import { useTimeTheme } from '../../hooks/useTimeTheme';

// ====================== VORTEX ENGINE ======================
const vortexLayers = [
  { size: 300, scale: 1.00, duration: 22, blur: 0.8, opacity: .42, border:1, color:"#FF6BD5", reverse:false, ratio:.34, phase:0 },
  { size: 282, scale: .94, duration: 27, blur: 0.7, opacity: .40, border:1, color:"#B45CFF", reverse:true , ratio:.36, phase:8 },
  { size: 264, scale: .88, duration: 33, blur: 0.6, opacity: .38, border:1.1, color:"#8A4DFF", reverse:false, ratio:.33, phase:16 },
  { size: 246, scale: .82, duration: 41, blur: .55, opacity: .36, border:1.2, color:"#FF6BD5", reverse:true , ratio:.38, phase:24 },
  { size: 228, scale: .76, duration: 51, blur: .45, opacity: .34, border:1.3, color:"#B45CFF", reverse:false, ratio:.31, phase:32 },
  { size: 208, scale: .69, duration: 63, blur: .35, opacity: .31, border:1.4, color:"#8A4DFF", reverse:true , ratio:.40, phase:40 },
  { size: 188, scale: .61, duration: 78, blur: .25, opacity: .28, border:1.6, color:"#FF6BD5", reverse:false, ratio:.35, phase:48 },
  { size: 168, scale: .53, duration: 96, blur:.18, opacity: .25, border:1.8, color:"#B45CFF", reverse:true , ratio:.37, phase:56 },
  { size: 148, scale: .45, duration: 118, blur:.12, opacity: .22, border:2.0, color:"#8A4DFF", reverse:false, ratio:.32, phase:64 },
  { size: 128, scale: .37, duration: 145, blur:.08, opacity: .19, border:2.2, color:"#FF6BD5", reverse:true , ratio:.39, phase:72 },
  { size: 108, scale: .30, duration: 178, blur:.04, opacity: .15, border:2.4, color:"#B45CFF", reverse:false, ratio:.34, phase:80 },
  { size: 88 , scale: .24, duration: 220, blur:0, opacity: .12, border:2.6, color:"#8A4DFF", reverse:true , ratio:.36, phase:88 },
  { size: 70 , scale: .19, duration: 270, blur:0, opacity: .10, border:2.8, color:"#FF6BD5", reverse:false, ratio:.33, phase:96 },
  { size: 54 , scale: .14, duration: 330, blur:0, opacity: .08, border:3, color:"#B45CFF", reverse:true , ratio:.35, phase:104 },
  { size: 40 , scale: .10, duration: 400, blur:0, opacity: .06, border:3.2, color:"#8A4DFF", reverse:false, ratio:.34, phase:112 },
];

interface BreathingExerciseStepProps {
  onBack?: () => void;
  onComplete?: () => void;
}

export function BreathingExerciseStep({ onBack, onComplete }: BreathingExerciseStepProps) {
  const { timeOfDay } = useTimeTheme();
  const isNight = timeOfDay === 'night';

  const [sessionState, setSessionState] = useState('intro'); // 'intro', 'breathing', 'completed'
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(120);
  const [cycleTime, setCycleTime] = useState(0);
  const [subtitle, setSubtitle] = useState('');
  const [introTitle, setIntroTitle] = useState<string | null>(null);
  const [activePhaseName, setActivePhaseName] = useState('');

  const [selectedResetOption, setSelectedResetOption] = useState<string | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  const resetOptions = useMemo(() => [
    { id: 'rain', label: 'Rain', desc: 'Soothing rain to relax you', img: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=300&q=80', icon: 'ðŸŒ§ï¸' },
    { id: 'ocean', label: 'Ocean', desc: 'Waves that calm your mind', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80', icon: 'ðŸŒŠ' },
    { id: 'forest', label: 'Forest', desc: 'Nature sounds to relax', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=80', icon: 'ðŸŒ²' },
    { id: 'campfire', label: 'Campfire', desc: 'Warm crackling for comfort', img: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=300&q=80', icon: 'ðŸ”¥' },
    { id: 'night', label: 'Night', desc: 'Peaceful night ambience', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80', icon: 'ðŸŒ™' },
    { id: 'morning', label: 'Morning Light', desc: 'Gentle light to uplift your mood', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80', icon: 'ðŸŒ…' },
  ], []);

  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);
  const previousPhaseRef = useRef('');
  const sessionTimeLeftRef = useRef(120);
  const audioContextUnlocked = useRef(false);
  const lastSpokenRef = useRef('');

  const CYCLE_DURATION = 18000; // 18 seconds

  // --- AI Voice Engine (Browser TTS Wrapper) ---
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    if (lastSpokenRef.current === text) return;

    window.speechSynthesis.cancel();
    lastSpokenRef.current = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.75;
    utterance.pitch = 1.15;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = ['Microsoft Aria', 'Microsoft Zira', 'Samantha', 'Google US English', 'Google UK English Female', 'Natural'];

    let selectedVoice = null;
    for (let pv of preferredVoices) {
      selectedVoice = voices.find(v => v.name.includes(pv));
      if (selectedVoice) break;
    }

    if (selectedVoice) utterance.voice = selectedVoice;

    window.speechSynthesis.speak(utterance);
  }, []);

  // --- Intro Sequence Effect ---
  useEffect(() => {
    if (sessionState === 'intro') {
      const seq1 = setTimeout(() => {
        const text = "Welcome back... Take a moment to settle in.";
        setSubtitle(text);
        speak(text);
      }, 800);
      const seq2 = setTimeout(() => {
        const text = "Relax your shoulders...";
        setSubtitle(text);
        speak(text);
      }, 5500);
      const seq3 = setTimeout(() => {
        const text = "Let's breathe together in 3, 2, 1, start";
        setSubtitle("Let's breathe together...");
        speak(text);
      }, 9000);

      // Visual countdown synced approximately with TTS
      const seq3_1 = setTimeout(() => setIntroTitle("3"), 10800);
      const seq3_2 = setTimeout(() => setIntroTitle("2"), 11600);
      const seq3_3 = setTimeout(() => setIntroTitle("1"), 12400);
      const seq3_4 = setTimeout(() => setIntroTitle("Start!"), 13200);
      const seq3_5 = setTimeout(() => setIntroTitle("02:00"), 14200);

      const seq4 = setTimeout(() => {
        setSessionState('breathing');
        setIsPlaying(true);
      }, 15200); // Delayed slightly to let '02:00' show before ticking begins

      return () => {
        clearTimeout(seq1); clearTimeout(seq2); clearTimeout(seq3);
        clearTimeout(seq3_1); clearTimeout(seq3_2); clearTimeout(seq3_3); clearTimeout(seq3_4); clearTimeout(seq3_5);
        clearTimeout(seq4);
      };
    }
  }, [sessionState, speak]);

  // --- Main Engine Loop ---
  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined && isPlaying && sessionState === 'breathing') {
        const deltaTime = time - previousTimeRef.current;

        setCycleTime((prevTime) => {
          let newTime = prevTime + deltaTime;
          if (newTime >= CYCLE_DURATION) {
            return 0; // Reset cycle
          }

          const tSec = newTime / 1000;
          let phaseStr = '';
          if (tSec < 4) phaseStr = 'inhale';
          else if (tSec < 8) phaseStr = 'hold1';
          else if (tSec < 14) phaseStr = 'exhale';
          else phaseStr = 'hold2';

          if (phaseStr !== previousPhaseRef.current) {
            previousPhaseRef.current = phaseStr;
            setActivePhaseName(phaseStr);
          }

          return newTime;
        });

        setSessionTimeLeft((prev) => {
          if (Math.floor(cycleTime / 1000) !== Math.floor((cycleTime - deltaTime) / 1000)) {
            return Math.max(0, prev - 1);
          }
          return prev;
        });
      }

      previousTimeRef.current = time;
      if (isPlaying && sessionState !== 'completed') {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying && sessionState !== 'completed') {
      requestRef.current = requestAnimationFrame(animate);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, sessionState, cycleTime]);

  // --- Session Completion Logic ---
  useEffect(() => {
    if (sessionTimeLeft === 0 && sessionState === 'breathing') {
      setSessionState('completed');
      setIsPlaying(false);
    }
  }, [sessionTimeLeft, sessionState]);

  // --- Background Music Logic ---
  useEffect(() => {
    if (sessionState === 'breathing' && bgAudioRef.current) {
      const selectedTheme = localStorage.getItem('kavach_breathing_theme') || 'rain';
      const themeUrls: Record<string, string> = {
        'rain': 'https://actions.google.com/sounds/v1/water/rain_on_roof.ogg',
        'ocean': 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
        'forest': 'https://actions.google.com/sounds/v1/water/water_stream_in_forest.ogg',
        'campfire': 'https://actions.google.com/sounds/v1/weather/fire.ogg',
        'night': 'https://actions.google.com/sounds/v1/weather/crickets.ogg',
        'morning': 'https://actions.google.com/sounds/v1/birds/birds_in_forest.ogg',
      };
      
      const audioUrl = themeUrls[selectedTheme] || themeUrls['rain'];

      bgAudioRef.current.src = audioUrl;
      bgAudioRef.current.volume = 0.35; // Increased volume as requested
      bgAudioRef.current.loop = true;
      bgAudioRef.current.play().catch(e => console.warn("Bg audio play failed", e));
    } else if (sessionState === 'completed' || sessionState === 'pre-intro') {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
    }
  }, [sessionState]);

  // --- Voice Guide Engine ---
  useEffect(() => {
    if (!isPlaying || sessionState !== 'breathing') return;

    const timeSecs = sessionTimeLeftRef.current;

    let encText = "";
    if (timeSecs % 30 === 0 && timeSecs < 110 && timeSecs > 10) {
      const encouragements = [
        "You're doing great... ",
        "Just one breath at a time... ",
        "You are safe here... ",
        "Let your shoulders relax... "
      ];
      encText = encouragements[Math.floor(timeSecs / 30) % encouragements.length];
    }

    if (activePhaseName === 'inhale') {
      speak(encText + "Take a slow... deep breath in...");
    } else if (activePhaseName === 'hold1') {
      speak("Hold it... right there...");
    } else if (activePhaseName === 'exhale') {
      speak("Now... slowly let it all out...");
    } else if (activePhaseName === 'hold2') {
      speak("Hold... the stillness...");
    }
  }, [activePhaseName, isPlaying, sessionState, speak]);

  // --- Calculate Phase and UI State ---
  const t = cycleTime / 1000;

  // Continuous rotation: Starts at Left (180 degrees) and completes 360 clockwise over 18s.
  // This perfectly traces the 4 quadrants for Inhale (TL), Hold (TR), Exhale (BR), Hold (BL).
  const progressPercent = t / 18;
  const angle = progressPercent * 360;

  let lotusScale = 1;
  let moonGlow = 0.2;
  let orbPulse = false;
  let voicePrompt = subtitle;
  let isExhaling = false;
  let isInhaling = false;
  let displayPhase = "Breathe In";

  if (sessionState === 'breathing') {
    if (t < 4) {
      lotusScale = 1 + (t / 4) * 0.18;
      moonGlow = 0.2 + (t / 4) * 0.25;
      isInhaling = true;
      displayPhase = "Breathe In";
    } else if (t < 8) {
      lotusScale = 1.18;
      moonGlow = 0.45;
      orbPulse = true;
      displayPhase = "Hold";
    } else if (t < 14) {
      lotusScale = 1.18 - ((t - 8) / 6) * 0.18;
      moonGlow = 0.45 - ((t - 8) / 6) * 0.25;
      isExhaling = true;
      displayPhase = "Breathe Out";
    } else {
      lotusScale = 1.0;
      moonGlow = 0.2;
      orbPulse = true;
      displayPhase = "Hold";
    }
  }

  // --- Particles Engine ---
  const particles = useMemo(() => Array.from({ length: 15 }).map(() => ({
    angle: Math.random() * Math.PI * 2,
    baseR: 90 + Math.random() * 40,
    color: ['#FF6BD5', '#B45CFF', '#8A4DFF'][Math.floor(Math.random() * 3)],
    size: Math.random() * 3 + 2,
    speedFactor: 0.5 + Math.random()
  })), []);

  // --- SVG Math ---
  const ringRadius = 180;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference - (progressPercent * ringCircumference);

  // Start at 180 degrees (Left) and go clockwise
  const dotAngleRad = (angle + 180) * (Math.PI / 180);
  const dotX = Math.cos(dotAngleRad) * ringRadius;
  const dotY = Math.sin(dotAngleRad) * ringRadius;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const resetSession = () => {
    setSessionState('intro');
    setSessionTimeLeft(120);
    setCycleTime(0);
    setIsPlaying(false);
  };

  return (
    <div className={`min-h-screen font-sans select-none flex flex-col ${isNight ? 'bg-[#090714] text-white' : 'bg-[#F4F7FB] text-slate-900'}`}>
      <style>{`
        /* Previous Keyframes */
        @keyframes slow-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slow-spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes orb-pulse { 
          0%, 100% { transform: scale(1); box-shadow: 0 0 24px rgba(255,107,213,0.5); } 
          50% { transform: scale(1.08); box-shadow: 0 0 35px rgba(255,107,213,0.8); } 
        }
        @keyframes fog-move {
          0% { background-position: 0% 0%; }
          100% { background-position: 1000px 0%; }
        }
        @keyframes pop-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-glow-btn {
          0%, 100% { transform: scale(1); box-shadow: 0 0 35px rgba(255,120,190,.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 50px rgba(255,120,190,.6); }
        }

        /* --- Advanced Vortex Illusion Keyframes (UNCHANGED) --- */
        @keyframes vortex-outer-spin {
          0% { transform: translate(-0.8px, 0.6px) rotate(0deg); }
          50% { transform: translate(0.3px, -0.4px) rotate(180deg); }
          100% { transform: translate(-0.8px, 0.6px) rotate(360deg); }
        }
        @keyframes vortex-mid-spin {
          0% { transform: translate(0.5px, -0.2px) rotate(360deg); }
          50% { transform: translate(-0.4px, 0.5px) rotate(180deg); }
          100% { transform: translate(0.5px, -0.2px) rotate(0deg); }
        }
        @keyframes vortex-inner-spin {
          0% { transform: translate(-0.2px, 0.3px) rotate(0deg); }
          50% { transform: translate(0.4px, -0.5px) rotate(180deg); }
          100% { transform: translate(-0.2px, 0.3px) rotate(360deg); }
        }
        @keyframes vortex-spin {
          0% { transform: translate3d(0px,0px,0px) rotate(0deg) scale(1); }
          25% { transform: translate3d(.8px,-.6px,0) rotate(90deg) scale(1.008); }
          50% { transform: translate3d(-.6px,.8px,0) rotate(180deg) scale(.992); }
          75% { transform: translate3d(.6px,.5px,0) rotate(270deg) scale(1.006); }
          100% { transform: translate3d(0px,0px,0px) rotate(360deg) scale(1); }
        }
        @keyframes tunnel-breath {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.025); filter: brightness(1.08); }
        }
        @keyframes opacity-pulse-outer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.42; } }
        @keyframes opacity-pulse-mid { 0%, 100% { opacity: 0.65; } 50% { opacity: 0.78; } }
        @keyframes glow-pulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.55; transform: scale(1.05); } }
        @keyframes grad-rev { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .morph-text { font-variant-numeric: tabular-nums; }
      `}</style>

      {/* Main Canvas - Full Page */}
      <div className={`w-full flex-grow min-h-screen relative overflow-hidden flex flex-col bg-gradient-to-b hide-scrollbar overflow-y-auto ${isNight ? 'from-[#090714] via-[#0E0A1D] to-[#080611]' : 'from-[#FFFFFF] via-[#F6F9FC] to-[#E9F0F8]'}`}>

        {/* --- Background Environment --- */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-2000" style={{ opacity: sessionState === 'completed' ? 0.3 : 1 }}>

          <div className={`absolute bottom-0 w-full h-[55%] ${isNight ? 'opacity-30' : 'opacity-80'}`}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,100 L0,60 L20,40 L40,70 L60,30 L85,65 L100,45 L100,100 Z" fill="url(#mountain1)" />
              <path d="M0,100 L0,75 L15,55 L35,80 L55,45 L75,75 L100,55 L100,100 Z" fill="url(#mountain2)" opacity="0.8" />
              <defs>
                <linearGradient id="mountain1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isNight ? "#1A1333" : "#FFEADD"} />
                  <stop offset="100%" stopColor={isNight ? "#080611" : "#FFFFFF"} />
                </linearGradient>
                <linearGradient id="mountain2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isNight ? "#241B44" : "#FFDFCA"} />
                  <stop offset="100%" stopColor={isNight ? "#080611" : "#FFFFFF"} />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className={`absolute inset-0 mix-blend-overlay ${isNight ? 'bg-[#070512] opacity-55' : 'bg-gradient-to-t from-[#FFE4D6]/50 to-transparent opacity-80'}`} />
        </div>

        {/* Exactly Matching Header (Global) */}
        <header className="relative z-50 shrink-0 w-full flex justify-center items-center pt-3 pb-2">
          <button onClick={onBack} className={`absolute top-1.5 left-4 w-11 h-11 z-50 rounded-full border flex justify-center items-center transition ${isNight ? 'bg-[#151028] border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'}`}>
            <ArrowLeft size={20} className={isNight ? "text-white" : "text-slate-700"} />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                    ${step < 3 ? (isNight ? 'bg-[#8A4DFF] text-white' : 'bg-[#5B21B6] text-white') :
                      step === 3 ? (isNight ? 'bg-gradient-to-br from-[#FF4FD8] to-[#FF7A18] text-white shadow-[0_0_20px_rgba(255,90,220,0.45)]' : 'bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] text-white shadow-md') :
                        (isNight ? 'bg-[#2A2540] text-gray-400' : 'bg-slate-200 text-slate-400')}`}>
                    {step < 3 ? <Check size={14} strokeWidth={3} /> : step}
                  </div>
                  {i < 4 && (
                    <div className={`w-6 h-[2px] ${step < 3 ? (isNight ? 'bg-[#8A4DFF]' : 'bg-[#5B21B6]') : (isNight ? 'bg-[#2A2540]' : 'bg-slate-200')}`} />
                  )}
                </div>
              ))}
            </div>
            <span className={`text-[10px] mt-0.5 font-medium px-2 py-0.5 rounded-full border ${isNight ? 'text-[#A9A5C8] bg-[#151028] border-white/5' : 'text-slate-500 bg-white border-slate-200 shadow-sm'}`}>STEP 3 OF 5</span>
          </div>

          <button className={`absolute top-1.5 right-4 w-11 h-11 z-50 rounded-full border flex justify-center items-center transition ${isNight ? 'bg-[#151028] border-[#8A4DFF]/50 shadow-[0_0_15px_rgba(138,77,255,0.2)] hover:bg-white/10' : 'bg-white border-purple-200 shadow-sm hover:bg-purple-50'}`}>
            <Shield size={18} className={isNight ? "text-[#B45CFF]" : "text-purple-500"} fill="currentColor" />
          </button>
        </header>



        {/* --- STATE: BREATHING / MAIN UI --- */}
        {(sessionState === 'intro' || sessionState === 'breathing') && (
          <div className="relative z-10 flex-1 flex flex-col w-full pb-8 animate-[pop-in_1s_ease-out]">

            {/* Titles */}
            <div className="text-center px-6 mt-1 z-20 min-h-[90px] flex flex-col justify-center">
              <h1 className="text-2xl font-bold tracking-tight mb-2 min-h-[50px] flex items-center justify-center relative overflow-hidden">
                {sessionState === 'breathing' ? (
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-[#FF6BD5] to-[#B45CFF]' : 'from-[#FF6B6B] to-[#FFA07A]'} text-[3rem] drop-shadow-sm animate-[pop-in_0.6s_ease-out]`}>
                    {formatTime(sessionTimeLeft)}
                  </span>
                ) : introTitle ? (
                  <span key={introTitle} className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-[#FF6BD5] to-[#B45CFF]' : 'from-[#FF6B6B] to-[#FFA07A]'} text-[3.2rem] drop-shadow-sm animate-[pop-in_0.3s_ease-out]`}>
                    {introTitle}
                  </span>
                ) : (
                  <span className="animate-[pop-in_0.8s_ease-out] flex items-center justify-center">
                    Your <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-[#FF6BD5] to-[#B45CFF]' : 'from-[#FF6B6B] to-[#FFA07A]'} mx-2`}>2-Min</span> Reset
                  </span>
                )}
              </h1>

              {sessionState === 'breathing' ? (
                <div className="flex flex-col items-center animate-[pop-in_0.5s_ease-out]">
                  <span className={`text-[15px] font-medium tracking-wide mb-1.5 transition-opacity duration-300 ${isNight ? 'text-[#D8D2FF]' : 'text-slate-600'}`}>{displayPhase}</span>
                  <span className={`text-[10px] font-semibold tracking-[0.2em] px-3 py-1 rounded-full backdrop-blur-md ${isNight ? 'text-[#B45CFF] bg-black/10 border border-[#B45CFF]/20' : 'text-purple-600 bg-white/50 border border-purple-100 shadow-sm'}`}>4 - 4 - 6</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <p className={`text-[13px] mb-0.5 font-medium ${isNight ? 'text-[#C7C5D8]' : 'text-slate-600'}`}>Breathe. Relax. Reset.</p>
                  <p className={`text-[13px] ${isNight ? 'text-[#8F8AA8]' : 'text-slate-500'}`}>You've got this. We're here with you.</p>
                </div>
              )}
            </div>

            {/* Interactive Breathing Area with Side Controls */}
            <div className="relative flex-grow flex justify-center items-center mt-3 mb-1">

              {/* Side Indicators (Arranged for continuous clockwise rotation) */}
              <div className="absolute inset-0 flex justify-between items-center px-4 -mt-6 pointer-events-none z-30">
                <div className="flex flex-col space-y-32">
                  {/* Top Left: Breathe In (0-4s) */}
                  <div className={`flex flex-col items-center transition-opacity duration-300 ${activePhaseName === 'inhale' ? 'opacity-100 scale-110' : 'opacity-40'}`}>
                    <div className={`w-[36px] h-[36px] rounded-full border flex justify-center items-center mb-1 ${isNight ? 'bg-[#151028] border-white/5 shadow-[0_0_15px_rgba(255,107,213,0.15)]' : 'bg-white border-pink-100 shadow-[0_4px_10px_rgba(255,107,213,0.15)]'}`}>
                      <Wind size={16} color={isNight ? "#FF6BD5" : "#FF6B6B"} />
                    </div>
                    <span className={`text-[10px] font-semibold ${isNight ? 'text-white' : 'text-slate-700'}`}>Breathe In</span>
                    <span className={`text-[8px] ${isNight ? 'text-gray-400' : 'text-slate-400'}`}>4 sec</span>
                  </div>
                  {/* Bottom Left: Hold 2 (14-18s) */}
                  <div className={`flex flex-col items-center transition-opacity duration-300 ${activePhaseName === 'hold2' ? 'opacity-100 scale-110' : 'opacity-40'}`}>
                    <div className={`w-[36px] h-[36px] rounded-full border flex justify-center items-center mb-1 ${isNight ? 'bg-[#151028] border-white/5 shadow-[0_0_15px_rgba(180,92,255,0.15)]' : 'bg-white border-purple-100 shadow-[0_4px_10px_rgba(180,92,255,0.15)]'}`}>
                      <Pause size={14} color={isNight ? "#B45CFF" : "#9333EA"} fill="currentColor" />
                    </div>
                    <span className={`text-[10px] font-semibold ${isNight ? 'text-white' : 'text-slate-700'}`}>Hold</span>
                    <span className={`text-[8px] ${isNight ? 'text-gray-400' : 'text-slate-400'}`}>4 sec</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-32">
                  {/* Top Right: Hold 1 (4-8s) */}
                  <div className={`flex flex-col items-center transition-opacity duration-300 ${activePhaseName === 'hold1' ? 'opacity-100 scale-110' : 'opacity-40'}`}>
                    <div className={`w-[36px] h-[36px] rounded-full border flex justify-center items-center mb-1 ${isNight ? 'bg-[#151028] border-white/5 shadow-[0_0_15px_rgba(180,92,255,0.15)]' : 'bg-white border-purple-100 shadow-[0_4px_10px_rgba(180,92,255,0.15)]'}`}>
                      <Pause size={14} color={isNight ? "#B45CFF" : "#9333EA"} fill="currentColor" />
                    </div>
                    <span className={`text-[10px] font-semibold ${isNight ? 'text-white' : 'text-slate-700'}`}>Hold</span>
                    <span className={`text-[8px] ${isNight ? 'text-gray-400' : 'text-slate-400'}`}>4 sec</span>
                  </div>
                  {/* Bottom Right: Breathe Out (8-14s) */}
                  <div className={`flex flex-col items-center transition-opacity duration-300 ${activePhaseName === 'exhale' ? 'opacity-100 scale-110' : 'opacity-40'}`}>
                    <div className={`w-[36px] h-[36px] rounded-full border flex justify-center items-center mb-1 ${isNight ? 'bg-[#151028] border-white/5 shadow-[0_0_15px_rgba(89,183,255,0.15)]' : 'bg-white border-blue-100 shadow-[0_4px_10px_rgba(89,183,255,0.15)]'}`}>
                      <Wind size={16} color={isNight ? "#59B7FF" : "#3B82F6"} className="rotate-180" />
                    </div>
                    <span className={`text-[10px] font-semibold ${isNight ? 'text-white' : 'text-slate-700'}`}>Breathe Out</span>
                    <span className={`text-[8px] ${isNight ? 'text-gray-400' : 'text-slate-400'}`}>6 sec</span>
                  </div>
                </div>
              </div>

              {/* The Central Breathing Mechanism */}
              <div className="relative w-[240px] h-[240px] flex justify-center items-center z-10">
                <div className="absolute w-[340px] h-[340px] flex justify-center items-center scale-[0.7] origin-center">

                  {/* Dynamic Particles matching lotus scale */}
                  <div className="absolute inset-0 z-0">
                    {particles.map((p, i) => {
                      const currentRadius = p.baseR + ((lotusScale - 1) * 200 * p.speedFactor);
                      const px = Math.cos(p.angle) * currentRadius;
                      const py = Math.sin(p.angle) * currentRadius;
                      return (
                        <div key={`p-${i}`}
                          className={`absolute top-1/2 left-1/2 rounded-full transition-all duration-300 ease-out ${isNight ? 'mix-blend-screen' : 'mix-blend-multiply'}`}
                          style={{
                            width: `${p.size}px`, height: `${p.size}px`,
                            backgroundColor: p.color,
                            transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`,
                            opacity: isExhaling ? 0.05 : isInhaling ? 0.2 : 0.1,
                            boxShadow: `0 0 8px ${p.color}`
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Rotating Outer Glow */}
                  <div className="absolute inset-[10px] rounded-full bg-gradient-to-br from-[#7A3CFF] via-transparent to-[#FF4FD8] animate-[slow-spin_24s_linear_infinite] opacity-30 blur-sm" style={{ padding: '2px', maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />

                  {/* ---------------------------------------------------------------- */}
                  {/* --- Lotus Core: Infinite Energy Vortex (UNCHANGED AS REQUESTED) --- */}
                  {/* ---------------------------------------------------------------- */}
                  <div className="absolute inset-0 flex justify-center items-center">
                    <div className="relative w-full h-full flex justify-center items-center transition-transform duration-300 ease-out" style={{ transform: `scale(${lotusScale})` }}>

                      {/* --- PARALLAX MOIRÃ                      {/* Tunnel Layers (Unmasked so center layers are fully visible) */}
                      <div className="absolute inset-0 z-10" style={{ animation: "tunnel-breath 9s ease-in-out infinite" }}>
                        
                        {/* Background Moire */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="relative flex items-center justify-center"
                            style={{
                              animation:"vortex-spin 180s linear infinite"
                            }}
                          >
                            {Array.from({length:24}).map((_,i)=>(
                              <div
                                key={`bg-petal-${i}`}
                                className="absolute rounded-full border border-[#B45CFF]/[0.045]"
                                style={{
                                  width:330,
                                  height:330,
                                  transform:`rotate(${i*15}deg) scaleX(.37)`,
                                  filter:"blur(.6px)"
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Main Tunnel */}
                        <div className="absolute inset-0 flex justify-center items-center">
                          {vortexLayers.map((layer,index)=>(
                            <div
                              key={`vortex-layer-${index}`}
                              className="absolute flex items-center justify-center"
                              style={{
                                filter:`blur(${layer.blur}px)`,
                                opacity: layer.opacity * (0.92 + Math.sin(index * 0.8) * 0.08)
                              }}
                            >
                              <div
                                className="relative flex items-center justify-center"
                                style={{
                                  animation:`vortex-spin ${layer.duration}s linear infinite ${layer.reverse?"reverse":"normal"}`
                                }}
                              >
                                {Array.from({length:12}).map((_,i)=>(
                                  <div
                                    key={`petal-${index}-${i}`}
                                    className="absolute rounded-full"
                                    style={{
                                      width:layer.size,
                                      height:layer.size,
                                      border:`${layer.border}px solid ${layer.color}`,
                                      borderRadius:`${48+(i%5)}%`,
                                      transform:`rotate(${i*30+layer.phase}deg) scaleX(${layer.ratio + Math.sin(index)*0.015}) scale(${layer.scale})`,
                                      background: isNight ? 'transparent' : `radial-gradient(circle, rgba(255,255,255,.03), rgba(255,255,255,.008), transparent)`,
                                      boxShadow:`
                                        0 0 ${20-index}px rgba(255,91,210,.08),
                                        0 0 ${42-index*2}px rgba(140,70,255,.05)
                                        ${!isNight ? `, inset 0 0 ${14-index}px rgba(255,255,255,.03)` : ''}
                                      `,
                                      transformOrigin: "center center",
                                      willChange: "transform",
                                      mixBlendMode: isNight ? "screen" : "multiply"
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}

                          {/* Center Hole Removed */}
                        </div>
                      </div>

                    </div>
                  </div>
                  {/* ---------------------------------------------------------------- */}
                  {/* --- END OF UNTOUCHED VORTEX SECTION --- */}
                  {/* ---------------------------------------------------------------- */}

                  {/* Main Progress Ring Track */}
                  <svg className="absolute w-[400px] h-[400px] max-w-none rotate-[180deg] overflow-visible" viewBox="-200 -200 400 400">
                    <defs>
                      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF4FD8" />
                        <stop offset="100%" stopColor="#FF7A18" />
                      </linearGradient>
                    </defs>
                    <circle cx="0" cy="0" r={ringRadius} fill="none" stroke={isNight ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"} strokeWidth="10" />

                    {/* Dynamic Filled Ring */}
                    <circle
                      cx="0" cy="0" r={ringRadius}
                      fill="none"
                      stroke="url(#ringGrad)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-100 ease-linear"
                    />
                  </svg>

                  {/* Progress Orb Wrapper (Handles position) */}
                  <div
                    className="absolute z-20 transition-all duration-100 ease-linear"
                    style={{
                      transform: `translate(${dotX}px, ${dotY}px)`
                    }}
                  >
                    {/* Progress Orb Inner (Handles pulse effect) */}
                    <div
                      className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-[#FF6BD5] to-[#FF9A42]"
                      style={{
                        animation: orbPulse ? 'orb-pulse 4s ease-in-out infinite' : 'none',
                        boxShadow: '0 0 24px rgba(255,107,213,0.5)'
                      }}
                    />
                  </div>

                  {/* Exact UI Center Text removed per user request to keep center fully empty */}
                </div>
              </div>
            </div>

            {/* Scrollable Cards Area */}
            <div className="px-4 mt-4 space-y-3 relative z-20 shrink-0">

              {/* Encouragement Card */}
              <div className={`backdrop-blur-xl border rounded-[16px] py-2 px-3 flex items-center ${isNight ? 'bg-[#151026]/90 border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className={`w-[36px] h-[36px] rounded-full border shrink-0 mr-3 flex justify-center items-center ${isNight ? 'bg-[#151028] border-white/5 shadow-[0_0_20px_rgba(255,90,210,0.2)]' : 'bg-white border-pink-100 shadow-sm'}`}>
                  <div className={`w-full h-full rounded-full flex justify-center items-center ${isNight ? 'text-[#FF6BD5]' : 'text-pink-500'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className={`font-semibold text-[12px] flex items-center ${isNight ? 'text-white' : 'text-slate-800'}`}>
                    You're doing great <Heart size={10} fill="currentColor" className={`ml-1 inline-block ${isNight ? 'text-[#B45CFF]' : 'text-pink-500'}`} />
                  </h3>
                  <p className={`text-[10px] mt-0.5 leading-snug ${isNight ? 'text-[#A9A5C8]' : 'text-slate-500'}`}>Every breath is a step towards peace.</p>
                </div>
                {/* CSS Avatar Representation */}
                <div className={`w-[70px] h-[70px] rounded-2xl border flex justify-center items-center shrink-0 relative overflow-hidden ml-2 shadow-inner scale-[0.65] origin-right ${isNight ? 'bg-[#2A1B44] border-white/5' : 'bg-indigo-50 border-indigo-100'}`}>
                  <div className="absolute bottom-0 w-[50px] h-[40px] bg-[#6B31B2] rounded-t-[30px]" />
                  <div className="absolute bottom-[30px] w-[30px] h-[35px] bg-[#E5C3A6] rounded-[15px]" />
                  <div className="absolute bottom-[48px] w-[34px] h-[20px] bg-[#2D1B1B] rounded-t-[20px]" />
                  <div className="absolute bottom-[42px] left-[26px] w-[6px] h-[1px] bg-[#5C4033] rounded-full" />
                  <div className="absolute bottom-[42px] right-[26px] w-[6px] h-[1px] bg-[#5C4033] rounded-full" />
                  <div className={`absolute bottom-[10px] flex items-center justify-center ${isNight ? 'text-[#FF6BD5]' : 'text-pink-400'}`}><Heart size={12} fill="currentColor" /></div>
                  <div className={`absolute top-[10px] left-[10px] flex items-center justify-center animate-[float-up_4s_linear_infinite] ${isNight ? 'text-[#B45CFF]' : 'text-purple-400'}`}><Heart size={10} fill="currentColor" /></div>
                  <div className={`absolute top-[30px] right-[10px] flex items-center justify-center animate-[float-up_5s_linear_infinite_1s] ${isNight ? 'text-[#FF6BD5]' : 'text-pink-400'}`}><Heart size={8} fill="currentColor" /></div>
                </div>
              </div>

              {/* Why This Helps Card */}
              <div className={`backdrop-blur-xl border rounded-[20px] p-4 ${isNight ? 'bg-[#151026]/90 border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`text-xs ${isNight ? 'text-[#8A4DFF]' : 'text-purple-500'}`}>ðŸŒ¿</span>
                  <span className={`text-[13px] font-semibold ${isNight ? 'text-white' : 'text-slate-800'}`}>Why this helps</span>
                </div>

                <div className="grid grid-cols-3 gap-2 relative">
                  <div className={`absolute top-0 bottom-0 left-[33%] w-[1px] ${isNight ? 'bg-white/[0.04]' : 'bg-slate-200'}`} />
                  <div className={`absolute top-0 bottom-0 left-[66%] w-[1px] ${isNight ? 'bg-white/[0.04]' : 'bg-slate-200'}`} />

                  <div className="flex flex-col items-center text-center px-0.5">
                    <div className="h-8 flex items-center justify-center mb-1.5">
                      <Brain size={22} color={isNight ? "#FF6BD5" : "#FF6B6B"} />
                    </div>
                    <h4 className={`text-[11px] font-semibold mb-0.5 ${isNight ? 'text-white' : 'text-slate-800'}`}>Reduces Stress</h4>
                    <p className={`text-[9px] leading-tight ${isNight ? 'text-[#8F8AA8]' : 'text-slate-500'}`}>Calms your mind</p>
                  </div>

                  <div className="flex flex-col items-center text-center px-0.5">
                    <div className="h-8 flex items-center justify-center mb-1.5">
                      <HeartPulse size={22} color={isNight ? "#59B7FF" : "#3B82F6"} />
                    </div>
                    <h4 className={`text-[11px] font-semibold mb-0.5 ${isNight ? 'text-white' : 'text-slate-800'}`}>Balances Mood</h4>
                    <p className={`text-[9px] leading-tight ${isNight ? 'text-[#8F8AA8]' : 'text-slate-500'}`}>Helps you feel in control</p>
                  </div>

                  <div className="flex flex-col items-center text-center px-0.5">
                    <div className="h-8 flex items-center justify-center mb-1.5">
                      <Moon size={22} color={isNight ? "#B45CFF" : "#9333EA"} fill="currentColor" />
                    </div>
                    <h4 className={`text-[11px] font-semibold mb-0.5 ${isNight ? 'text-white' : 'text-slate-800'}`}>Better Sleep</h4>
                    <p className={`text-[9px] leading-tight ${isNight ? 'text-[#8F8AA8]' : 'text-slate-500'}`}>Relaxes you for rest</p>
                  </div>
                </div>
              </div>

              {/* Bottom Control Panel */}
              <div className={`backdrop-blur-xl border rounded-[20px] p-2 flex justify-between items-center mt-1.5 ${isNight ? 'bg-[#151026]/95 border-[#8A4DFF]/30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' : 'bg-white/95 border-purple-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]'}`}>

                <button
                  onClick={resetSession}
                  className={`flex items-center justify-center px-2 space-x-1.5 rounded-2xl transition group ${isNight ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                  <RotateCcw size={14} className={`group-hover:-rotate-90 transition-transform duration-300 ${isNight ? 'text-[#8A4DFF]' : 'text-purple-500'}`} />
                  <span className={`text-[11px] ${isNight ? 'text-[#C7C5D8]' : 'text-slate-600'}`}>Reset</span>
                </button>

                {/* Central Play/Pause */}
                <div className="relative -mt-6 mb-0.5">
                  <div className={`absolute inset-[-8px] rounded-full bg-gradient-to-br from-[#FF4FD8] to-[#FF7A18] opacity-20 blur-xl ${isPlaying ? 'animate-[pulse-glow-btn_4s_ease-in-out_infinite]' : ''}`} />
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`relative w-[65px] h-[65px] rounded-full p-[2px] shadow-[0_0_35px_rgba(255,120,190,0.45)] transition-transform duration-300 active:scale-95 ${isPlaying ? 'animate-[pulse-glow-btn_4s_ease-in-out_infinite]' : ''} ${isNight ? 'bg-gradient-to-br from-[#FF4FD8] to-[#FF7A18]' : 'bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A]'}`}>
                    <div className={`w-full h-full rounded-full flex justify-center items-center border-[2px] ${isNight ? 'bg-gradient-to-br from-[#FF5CCB] to-[#FF8C42] border-black/10' : 'bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] border-white/20'}`}>
                      {isPlaying ? (
                        <Pause size={24} className="text-white" fill="currentColor" />
                      ) : (
                        <Play size={24} className="text-white ml-0.5" fill="currentColor" />
                      )}
                    </div>
                  </button>
                </div>

                <button onClick={onComplete} className={`flex items-center justify-center px-2 space-x-1.5 rounded-2xl transition ${isNight ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                  <span className={`text-[11px] ${isNight ? 'text-[#C7C5D8]' : 'text-slate-600'}`}>End</span>
                  <div className={`w-[14px] h-[14px] rounded-sm bg-transparent border-[1.5px] flex justify-center items-center ${isNight ? 'border-white/50' : 'border-slate-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-[1px] ${isNight ? 'bg-white' : 'bg-slate-400'}`} />
                  </div>
                </button>
              </div>

              {/* Footer Trust Message */}
              <div className="flex justify-center items-center pt-2 pb-6 text-center space-x-2">
                <Lock size={14} className={isNight ? "text-[#FF6BD5]" : "text-pink-500"} />
                <p className={`text-[11px] ${isNight ? 'text-[#A9A5C8]' : 'text-slate-500'} flex flex-col items-center`}>
                  <span>This is your safe space.</span>
                  <span className="flex items-center mt-0.5">You're not alone. <Heart size={10} fill="currentColor" className={`ml-1.5 ${isNight ? 'text-[#8A4DFF]' : 'text-purple-500'}`} /></span>
                </p>
              </div>

            </div>
          </div>
        )}

        {/* --- STATE: COMPLETED --- */}
        {sessionState === 'completed' && (
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center w-full px-6 animate-[pop-in_1s_ease-out]">
            <div className="relative w-32 h-32 mb-10 flex justify-center items-center">
              {/* Expanding Ripple Rings */}
              <div className="absolute inset-0 border-[2px] border-[#FF4FD8] rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-30" />
              <div className="absolute inset-0 border-[1px] border-[#8A4DFF] rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite_1s] opacity-20" />
              
              <div className="absolute inset-0 bg-[#B45CFF] rounded-full opacity-20 blur-3xl animate-[orb-pulse_4s_ease-in-out_infinite]" />
              <div className={`absolute inset-0 rounded-full opacity-20 blur-xl ${isNight ? 'bg-gradient-to-tr from-[#8A4DFF] to-[#FF6BD5]' : 'bg-gradient-to-tr from-[#B45CFF] to-[#FF9A42]'}`} />
              <div className={`relative w-24 h-24 rounded-full flex justify-center items-center shadow-[0_0_50px_rgba(180,100,255,0.6)] ${isNight ? 'bg-gradient-to-br from-[#FF4FD8] to-[#8A4DFF]' : 'bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A]'}`}>
                <CheckCircle2 size={54} className="text-white drop-shadow-md" />
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className={isNight ? 'text-[#FF4FD8]' : 'text-[#FF6B6B]'} size={24} />
              <h2 className={`text-3xl font-bold tracking-tight bg-clip-text text-transparent ${isNight ? 'bg-gradient-to-r from-white to-[#FFB4EB]' : 'bg-gradient-to-r from-slate-800 to-slate-500'}`}>
                Reset Complete
              </h2>
            </div>
            
            <p className={`text-center text-[15px] leading-relaxed mb-12 max-w-[260px] ${isNight ? 'text-[#C7C5D8]' : 'text-slate-600'}`}>
              You took 2 minutes for yourself today. <br />
              <span className={`font-semibold ${isNight ? 'text-[#FFB4EB]' : 'text-[#FF6B6B]'} drop-shadow-sm`}>Well done.</span>
            </p>

            <div className="w-full space-y-4">
              <button
                onClick={resetSession}
                className={`w-full py-4 rounded-2xl text-white font-semibold text-base shadow-[0_5px_20px_rgba(180,100,255,0.3)] transition active:scale-[0.98] flex justify-center items-center ${isNight ? 'bg-gradient-to-r from-[#FF4FD8] to-[#8A4DFF] hover:opacity-90' : 'bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] hover:shadow-lg'}`}>
                <RotateCcw size={18} className="mr-2" /> Start Again
              </button>

              <button
                onClick={onComplete}
                className={`w-full py-4 rounded-2xl border font-medium text-base transition active:scale-[0.98] flex justify-center items-center backdrop-blur-lg ${isNight ? 'bg-[#151028] border-white/10 text-white hover:bg-white/5' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'}`}>
                <Home size={18} className={`mr-2 ${isNight ? 'text-[#A9A5C8]' : 'text-slate-400'}`} /> Return Home
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio ref={bgAudioRef} />
    </div>
  );
}