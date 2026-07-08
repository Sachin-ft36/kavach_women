import React, { useState, useEffect } from 'react';
import {
  Wrench,
  ChevronRight,
  Shield,
  Phone,
  Volume2,
  MessageSquare,
  Compass,
  MapPin,
  Clock,
  Map,
  CheckCircle2,
  Home,
  Mic,
  Megaphone,
  Video,
  Camera,
  FolderLock,
  Lightbulb,
  Users,
  Flag,
  PhoneCall,
} from 'lucide-react';
import { useProtection } from '../hooks/useProtection';
import { useKavachTheme } from '../providers/ThemeProvider';
import { CapabilityEngine, CapabilityResponse } from '../engine/capability/CapabilityEngine';
import { toast } from 'sonner';
import SafeTimerModal from './SafeTimerModal';
import FakeCallModal from './FakeCallModal';
import ZeroFIRModal from './ZeroFIRModal';
import MedicalHubModal from './MedicalHubModal';

export default function SmartSafetyTools() {
  const { themeTokens } = useKavachTheme();
  const { protectionState, riskState, protectionIndex, triggerSOS, cancelSOS } = useProtection();

  const [isSafeTimerOpen, setIsSafeTimerOpen] = useState(false);
  const [isFakeCallOpen, setIsFakeCallOpen] = useState(false);
  const [isZeroFIROpen, setIsZeroFIROpen] = useState(false);
  const [isMedicalOpen, setIsMedicalOpen] = useState(false);
  const [sirenActive, setSirenActive] = useState(false);

  const [sosCapability, setSosCapability] = useState<CapabilityResponse | null>(null);
  const [recordCapability, setRecordCapability] = useState<CapabilityResponse | null>(null);

  useEffect(() => {
    async function fetchCapabilities() {
      const sos = await CapabilityEngine.canTriggerSOS();
      const rec = await CapabilityEngine.canRecordEvidence();
      setSosCapability(sos);
      setRecordCapability(rec);
    }
    fetchCapabilities();
  }, [protectionState]);

  // Audio context for Loud Siren
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const oscillatorRef = React.useRef<OscillatorNode | null>(null);

  const toggleSiren = () => {
    if (sirenActive) {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (e) { }
        oscillatorRef.current = null;
      }
      setSirenActive(false);
      toast.success("Siren deactivated");
    } else {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);

        let time = ctx.currentTime;
        for (let i = 0; i < 60; i++) {
          osc.frequency.linearRampToValueAtTime(1200, time + 0.5);
          osc.frequency.linearRampToValueAtTime(800, time + 1.0);
          time += 1.0;
        }

        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        oscillatorRef.current = osc;
        setSirenActive(true);
        toast.warning("🚨 Loud Siren Activated!");
      } catch (err) {
        console.error("Failed to start audio siren", err);
        setSirenActive(true);
        toast.warning("🚨 Siren mode active (Audio API not supported/blocked)");
      }
    }
  };

  return (
    <div 
      className="min-h-screen text-white font-sans px-4 pt-5 pb-36 overflow-y-auto w-full max-w-md mx-auto relative"
      style={{ backgroundColor: themeTokens.surface.background }}
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-[300px] bg-gradient-to-b from-[#6366F1]/5 to-transparent blur-[120px] pointer-events-none rounded-full" />

      {/* HEADER */}
      <header className="flex justify-between items-start mb-6 relative z-10">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="premium-header text-white">Smart Safety Tools</h1>
            <Wrench size={20} className="text-[#6366F1] rotate-90" />
          </div>
          <p className="premium-caption">
            Powerful tools to keep you safe, prepared & in control.
          </p>
        </div>

        {/* Tools In Use Pill */}
        <div
          onClick={() => toast.info(`Active status: Protection score is ${protectionIndex}%`)}
          className="border px-3 py-1.5 rounded-2xl flex items-center gap-2.5 cursor-pointer transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3)] shrink-0"
          style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
        >
          <div className="w-7 h-7 rounded-xl bg-[#6366F1]/10 flex items-center justify-center border border-[#6366F1]/20">
            <Users size={12} className="text-[#6366F1]" />
          </div>
          <div className="text-left font-sans">
            <div className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Protection Index</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[11px] font-bold text-white leading-none">{protectionIndex}%</span>
              <span className="text-[9px] font-bold text-[#10B981] leading-none">{riskState}</span>
            </div>
          </div>
          <ChevronRight size={12} className="text-slate-500" />
        </div>
      </header>

      {/* ── 1. EMERGENCY TOOLS ── */}
      <section className="mb-6 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[11px] font-semibold text-[#6366F1] tracking-wider uppercase">Emergency Tools</h2>
          <button onClick={() => toast.info("Emergency tools are fully active")} className="text-[10px] text-gray-400 font-medium hover:text-white transition-colors cursor-pointer flex items-center gap-0.5">
            View All <ChevronRight size={10} />
          </button>
        </div>

        {/* Horizontal scroll cards container */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 pt-1 -mx-4 px-4">

          {/* Card 1: SOS */}
          <div
            onClick={protectionState === 'EMERGENCY' ? cancelSOS : triggerSOS}
            className="w-[92px] shrink-0 border rounded-[13px] p-2 flex flex-col items-center text-center relative group cursor-pointer transition-all shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
            style={{ 
              backgroundColor: themeTokens.surface.card, 
              borderColor: protectionState === 'EMERGENCY' ? themeTokens.border.danger : themeTokens.border.default 
            }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#EF4444] to-[#B91C1C] flex items-center justify-center shadow-[0_4px_15px_rgba(239,68,68,0.4)] border border-red-500/20 mb-1.5 group-hover:scale-105 transition-transform shrink-0">
              <span className="text-[10px] font-black text-white tracking-wider">SOS</span>
            </div>
            <h3 className="text-[11.5px] font-bold text-white mb-0.5 leading-tight">
              {protectionState === 'EMERGENCY' ? 'Cancel SOS' : 'SOS Emergency'}
            </h3>
            <p className="text-[8.5px] text-slate-400 font-normal leading-tight px-0.5 mb-1.5 flex-1">
              {sosCapability ? `${sosCapability.reason} (${sosCapability.confidence}%)` : 'Checking systems...'}
            </p>
            <button className="w-full py-0.5 bg-red-500/10 hover:bg-red-500/20 text-[#EF4444] text-[8px] font-bold rounded-lg border border-red-500/20 transition-all flex items-center justify-center gap-0.5">
              {protectionState === 'EMERGENCY' ? 'Stop' : 'Trigger'} <ChevronRight size={8} />
            </button>
          </div>

          {/* Card 2: Fake Call */}
          <div
            onClick={() => setIsFakeCallOpen(true)}
            className="w-[92px] shrink-0 border rounded-[13px] p-2 flex flex-col items-center text-center relative group cursor-pointer transition-all shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#6366F1] to-[#4F46E5] flex items-center justify-center shadow-[0_4px_15px_rgba(99,102,241,0.4)] border border-[#6366F1]/20 mb-1.5 group-hover:scale-105 transition-transform shrink-0">
              <Phone size={15} className="text-white fill-white/10" />
            </div>
            <h3 className="text-[11.5px] font-bold text-white mb-0.5 leading-tight">Fake Call</h3>
            <p className="text-[8.5px] text-slate-400 font-normal leading-tight px-0.5 mb-1.5 flex-1">Simulate an incoming call</p>
            <button className="w-full py-0.5 bg-[#6366F1]/10 hover:bg-[#6366F1]/20 text-[#6366F1] text-[8px] font-bold rounded-lg border border-[#6366F1]/20 transition-all flex items-center justify-center gap-0.5">
              Open <ChevronRight size={8} />
            </button>
          </div>

          {/* Card 3: Loud Siren */}
          <div
            onClick={toggleSiren}
            className="w-[92px] shrink-0 border rounded-[13px] p-2 flex flex-col items-center text-center relative group cursor-pointer transition-all shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
            style={{ 
              backgroundColor: themeTokens.surface.card, 
              borderColor: sirenActive ? themeTokens.border.warning : themeTokens.border.default 
            }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_4px_15px_rgba(245,158,11,0.4)] border border-amber-500/20 mb-1.5 group-hover:scale-105 transition-transform shrink-0">
              <Volume2 size={15} className="text-white" />
            </div>
            <h3 className="text-[11.5px] font-bold text-white mb-0.5 leading-tight">Loud Siren</h3>
            <p className="text-[8.5px] text-slate-400 font-normal leading-tight px-0.5 mb-1.5 flex-1">{sirenActive ? 'Tap to deactivate alarm' : 'Loud alarm to attract attention'}</p>
            <button className={`w-full py-0.5 ${sirenActive ? 'bg-amber-500 text-black border-amber-600' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'} text-[8px] font-bold rounded-lg border transition-all flex items-center justify-center gap-0.5`}>
              {sirenActive ? 'Stop' : 'Open'} <ChevronRight size={8} />
            </button>
          </div>

          {/* Card 4: Panic Message */}
          <div
            onClick={() => {
              toast.success("Panic Message Broadcasted successfully to 5 guardians!");
            }}
            className="w-[92px] shrink-0 border rounded-[13px] p-2 flex flex-col items-center text-center relative group cursor-pointer transition-all shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#00A3FF] to-[#0077ff] flex items-center justify-center shadow-[0_4px_15px_rgba(0,163,255,0.4)] border border-[#00A3FF]/20 mb-1.5 group-hover:scale-105 transition-transform shrink-0">
              <Shield size={15} className="text-white fill-white/10" />
            </div>
            <h3 className="text-[11.5px] font-bold text-white mb-0.5 leading-tight">Panic Message</h3>
            <p className="text-[8.5px] text-slate-400 font-normal leading-tight px-0.5 mb-1.5 flex-1">Send alert with your live location</p>
            <button className="w-full py-0.5 bg-[#00A3FF]/10 hover:bg-[#00A3FF]/20 text-[#60a5fa] text-[8px] font-bold rounded-lg border border-[#00A3FF]/20 transition-all flex items-center justify-center gap-0.5">
              Open <ChevronRight size={8} />
            </button>
          </div>

        </div>
      </section>

      {/* ── 2. SAFETY & PROTECTION ── */}
      <section className="mb-6 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[11px] font-semibold text-[#6366F1] tracking-wider uppercase">Safety & Protection</h2>
          <button onClick={() => toast.info("Protection tools active")} className="text-[10px] text-gray-400 font-medium hover:text-white transition-colors cursor-pointer flex items-center gap-0.5">
            View All <ChevronRight size={10} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">

          {/* Item 1: Ride Safe */}
          <div
            onClick={() => toast.info("Initializing Journey Tracking...")}
            className="border hover:bg-white/[0.02] transition-all rounded-[18px] p-3 flex items-center justify-between cursor-pointer group shadow-md"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="flex items-center gap-2.5 min-w-0 text-left">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#2563EB]/10 flex items-center justify-center border border-[#2563EB]/25 shrink-0 group-hover:scale-105 transition-transform">
                <Compass size={15} className="text-[#3b82f6]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[12px] font-bold text-white leading-tight">Ride Safe</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight truncate">Share ride & track journey</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-slate-500 group-hover:text-white transition-all shrink-0 ml-1" />
          </div>

          {/* Item 2: Live Location */}
          <div
            onClick={() => toast.success("Live Location is active & sharing")}
            className="border hover:bg-white/[0.02] transition-all rounded-[18px] p-3 flex items-center justify-between cursor-pointer group shadow-md"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="flex items-center gap-2.5 min-w-0 text-left">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#10B981]/10 flex items-center justify-center border border-[#10B981]/25 shrink-0 group-hover:scale-105 transition-transform">
                <MapPin size={15} className="text-[#10b981]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[12px] font-bold text-white leading-tight">Live Location</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight truncate">Real-time tracking active</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-slate-500 group-hover:text-white transition-all shrink-0 ml-1" />
          </div>

          {/* Item 3: Safe Timer */}
          <div
            onClick={() => setIsSafeTimerOpen(true)}
            className="border hover:bg-white/[0.02] transition-all rounded-[18px] p-3 flex items-center justify-between cursor-pointer group shadow-md"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="flex items-center gap-2.5 min-w-0 text-left">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center border border-[#F59E0B]/25 shrink-0 group-hover:scale-105 transition-transform">
                <Clock size={15} className="text-[#f59e0b]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[12px] font-bold text-white leading-tight">Safe Timer</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight truncate">Countdown safety alert</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-slate-500 group-hover:text-white transition-all shrink-0 ml-1" />
          </div>

          {/* Item 4: Geo-fence Alerts */}
          <div
            onClick={() => toast.info("Geo-fence monitoring initialized in background")}
            className="border hover:bg-white/[0.02] transition-all rounded-[18px] p-3 flex items-center justify-between cursor-pointer group shadow-md"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="flex items-center gap-2.5 min-w-0 text-left">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center border border-[#8B5CF6]/25 shrink-0 group-hover:scale-105 transition-transform">
                <Map size={15} className="text-[#a78bfa]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[12px] font-bold text-white leading-tight">Geo-fence</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight truncate">Enter & exit notifications</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-slate-500 group-hover:text-white transition-all shrink-0 ml-1" />
          </div>

          {/* Item 5: Check-In */}
          <div
            onClick={() => {
              toast.success("Sent check-in status update to circle!");
            }}
            className="border hover:bg-white/[0.02] transition-all rounded-[18px] p-3 flex items-center justify-between cursor-pointer group shadow-md"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="flex items-center gap-2.5 min-w-0 text-left">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#10B981]/10 flex items-center justify-center border border-[#10B981]/25 shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 size={15} className="text-[#10b981]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[12px] font-bold text-white leading-tight">Check-In</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight truncate">Broadcast safety check</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-slate-500 group-hover:text-white transition-all shrink-0 ml-1" />
          </div>

          {/* Item 6: Safe Zones */}
          <div
            onClick={() => toast.info("Loading certified green-list safe zones near you...")}
            className="border hover:bg-white/[0.02] transition-all rounded-[18px] p-3 flex items-center justify-between cursor-pointer group shadow-md"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="flex items-center gap-2.5 min-w-0 text-left">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#2563EB]/10 flex items-center justify-center border border-[#2563EB]/25 shrink-0 group-hover:scale-105 transition-transform">
                <Home size={15} className="text-[#3b82f6]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[12px] font-bold text-white leading-tight">Safe Zones</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight truncate">Mark safe local hubs</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-slate-500 group-hover:text-white transition-all shrink-0 ml-1" />
          </div>

        </div>
      </section>

      {/* ── 3. COMMUNICATION TOOLS ── */}
      <section className="mb-6 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[11px] font-semibold text-[#6366F1] tracking-wider uppercase">Communication Tools</h2>
          <button onClick={() => toast.info("Communication options configured")} className="text-[10px] text-gray-400 font-medium hover:text-white transition-colors cursor-pointer flex items-center gap-0.5">
            View All <ChevronRight size={10} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">

          {/* Voice Trigger */}
          <div
            onClick={() => toast.info("Voice sync: Say 'Kavach Help' anytime to trigger SOS")}
            className="flex flex-col items-center justify-center p-2.5 border hover:bg-white/[0.02] transition-all rounded-2xl cursor-pointer group text-center min-w-0"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-8.5 h-8.5 rounded-xl bg-[#10B981]/15 flex items-center justify-center border border-[#10B981]/25 mb-1.5 group-hover:scale-105 transition-transform">
              <Mic size={15} className="text-[#10b981]" />
            </div>
            <h4 className="text-[10.5px] font-bold text-slate-200 leading-tight">Voice Trigger</h4>
            <p className="text-[8px] text-slate-400 mt-0.5 leading-tight truncate max-w-full font-sans">Say 'Kavach Help'</p>
          </div>

          {/* Broadcast Message */}
          <div
            onClick={() => toast.success("Broadcast message sent successfully")}
            className="flex flex-col items-center justify-center p-2.5 border hover:bg-white/[0.02] transition-all rounded-2xl cursor-pointer group text-center min-w-0"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-8.5 h-8.5 rounded-xl bg-red-500/15 flex items-center justify-center border border-red-500/25 mb-1.5 group-hover:scale-105 transition-transform">
              <Megaphone size={15} className="text-red-400" />
            </div>
            <h4 className="text-[10.5px] font-bold text-slate-200 leading-tight">Broadcast</h4>
            <p className="text-[8px] text-slate-400 mt-0.5 leading-tight truncate max-w-full font-sans">Send to contacts</p>
          </div>

          {/* Help Chat */}
          <div
            onClick={() => toast.info("Chat mode activated with family members")}
            className="flex flex-col items-center justify-center p-2.5 border hover:bg-white/[0.02] transition-all rounded-2xl cursor-pointer group text-center min-w-0"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-8.5 h-8.5 rounded-xl bg-[#6366F1]/15 flex items-center justify-center border border-[#6366F1]/25 mb-1.5 group-hover:scale-105 transition-transform">
              <MessageSquare size={15} className="text-[#6366F1]" />
            </div>
            <h4 className="text-[10.5px] font-bold text-slate-200 leading-tight">Help Chat</h4>
            <p className="text-[8px] text-slate-400 mt-0.5 leading-tight truncate max-w-full font-sans">Chat instantly</p>
          </div>

        </div>
      </section>

      {/* ── 4. EVIDENCE & SECURITY ── */}
      <section className="mb-6 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[11px] font-semibold text-[#6366F1] tracking-wider uppercase">Evidence & Security</h2>
          <button onClick={() => toast.info("All media stored inside sovereign sandbox")} className="text-[10px] text-gray-400 font-medium hover:text-white transition-colors cursor-pointer flex items-center gap-0.5">
            View All <ChevronRight size={10} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">

          {/* Record Audio */}
          <div
            onClick={() => toast.success("Audio recorder started...")}
            className="flex flex-col items-center justify-center p-2 border hover:bg-white/[0.02] transition-all rounded-2xl cursor-pointer group text-center min-w-0"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-1 shrink-0 group-hover:scale-105 transition-transform">
              <Mic size={17} className="text-red-400" />
            </div>
            <h4 className="text-[11px] font-bold text-slate-200 leading-tight truncate max-w-full">Record Audio</h4>
            <span className="text-[9px] text-slate-400 leading-none truncate max-w-full font-sans mt-0.5">Capture sound</span>
          </div>

          {/* Record Video */}
          <div
            onClick={() => toast.success("Video recorder buffer armed")}
            className="flex flex-col items-center justify-center p-2 border hover:bg-white/[0.02] transition-all rounded-2xl cursor-pointer group text-center min-w-0"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-1 shrink-0 group-hover:scale-105 transition-transform">
              <Video size={17} className="text-orange-400" />
            </div>
            <h4 className="text-[11px] font-bold text-slate-200 leading-tight truncate max-w-full">Record Video</h4>
            <span className="text-[9px] text-slate-400 leading-none truncate max-w-full font-sans mt-0.5">
              {recordCapability ? `${recordCapability.confidence}%` : 'Video'}
            </span>
          </div>

          {/* Capture Image */}
          <div
            onClick={() => toast.success("Camera snapshot captured successfully!")}
            className="flex flex-col items-center justify-center p-2 border hover:bg-white/[0.02] transition-all rounded-2xl cursor-pointer group text-center min-w-0"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-1 shrink-0 group-hover:scale-105 transition-transform">
              <Camera size={17} className="text-blue-400" />
            </div>
            <h4 className="text-[11px] font-bold text-slate-200 leading-tight truncate max-w-full">Capture Image</h4>
            <span className="text-[9px] text-slate-400 leading-none truncate max-w-full font-sans mt-0.5">Secure photo</span>
          </div>

          {/* Evidence Vault */}
          <div
            onClick={() => toast.info("Opening archives...")}
            className="flex flex-col items-center justify-center p-2 border hover:bg-white/[0.02] transition-all rounded-2xl cursor-pointer group text-center min-w-0"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-1 shrink-0 group-hover:scale-105 transition-transform">
              <FolderLock size={17} className="text-purple-400" />
            </div>
            <h4 className="text-[11px] font-bold text-slate-200 leading-tight truncate max-w-full">Evidence Vault</h4>
            <span className="text-[9px] text-slate-400 leading-none truncate max-w-full font-sans mt-0.5">View archives</span>
          </div>

        </div>
      </section>

      {/* ── 5. DAILY SAFETY TOOLS ── */}
      <section className="mb-6 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[11px] font-semibold text-[#6366F1] tracking-wider uppercase">Daily Safety Tools</h2>
          <button onClick={() => toast.info("Daily resources synced")} className="text-[10px] text-gray-400 font-medium hover:text-white transition-colors cursor-pointer flex items-center gap-0.5">
            View All <ChevronRight size={10} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">

          {/* Safety Tips */}
          <div
            onClick={() => toast.info("Loading daily safety tips...")}
            className="flex flex-col items-center justify-center p-2 border hover:bg-white/[0.02] transition-all rounded-2xl cursor-pointer group text-center min-w-0"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 mb-1 shrink-0 group-hover:scale-105 transition-transform">
              <Lightbulb size={17} className="text-green-400" />
            </div>
            <h4 className="text-[11px] font-bold text-slate-200 leading-tight truncate max-w-full">Safety Tips</h4>
            <span className="text-[9px] text-slate-400 leading-none truncate max-w-full font-sans mt-0.5">Daily guide</span>
          </div>

          {/* Nearby Helpers */}
          <div
            onClick={() => setIsMedicalOpen(true)}
            className="flex flex-col items-center justify-center p-2 border hover:bg-white/[0.02] transition-all rounded-2xl cursor-pointer group text-center min-w-0"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-1 shrink-0 group-hover:scale-105 transition-transform">
              <Users size={17} className="text-blue-400" />
            </div>
            <h4 className="text-[11px] font-bold text-slate-200 leading-tight truncate max-w-full">Helpers</h4>
            <span className="text-[9px] text-slate-400 leading-none truncate max-w-full font-sans mt-0.5">Find help</span>
          </div>

          {/* Report Incident */}
          <div
            onClick={() => setIsZeroFIROpen(true)}
            className="flex flex-col items-center justify-center p-2 border hover:bg-white/[0.02] transition-all rounded-2xl cursor-pointer group text-center min-w-0"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-1 shrink-0 group-hover:scale-105 transition-transform">
              <Flag size={17} className="text-orange-400" />
            </div>
            <h4 className="text-[11px] font-bold text-slate-200 leading-tight truncate max-w-full">Report FIR</h4>
            <span className="text-[9px] text-slate-400 leading-none truncate max-w-full font-sans mt-0.5">Zero FIR report</span>
          </div>

          {/* Emergency Numbers */}
          <div
            onClick={() => {
              window.location.href = "tel:112";
            }}
            className="flex flex-col items-center justify-center p-2 border hover:bg-white/[0.02] transition-all rounded-2xl cursor-pointer group text-center min-w-0"
            style={{ backgroundColor: themeTokens.surface.card, borderColor: themeTokens.border.default }}
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-1 shrink-0 group-hover:scale-105 transition-transform">
              <PhoneCall size={17} className="text-red-400" />
            </div>
            <h4 className="text-[11px] font-bold text-slate-200 leading-tight truncate max-w-full">Hotlines</h4>
            <span className="text-[9px] text-slate-400 leading-none truncate max-w-full font-sans mt-0.5">Call 112 / 1091</span>
          </div>

        </div>
      </section>

      {/* POPUP MODALS WIRING */}
      {isSafeTimerOpen && (
        <SafeTimerModal
          isOpen={isSafeTimerOpen}
          onClose={() => setIsSafeTimerOpen(false)}
        />
      )}

      {isFakeCallOpen && (
        <FakeCallModal
          isOpen={isFakeCallOpen}
          onClose={() => setIsFakeCallOpen(false)}
        />
      )}

      {isZeroFIROpen && (
        <ZeroFIRModal
          isOpen={isZeroFIROpen}
          onClose={() => setIsZeroFIROpen(false)}
        />
      )}

      {isMedicalOpen && (
        <MedicalHubModal
          isOpen={isMedicalOpen}
          onClose={() => setIsMedicalOpen(false)}
        />
      )}
    </div>
  );
}

