import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Shield, MapPin, Bell, Activity, Clock, Phone, Navigation,
  CheckCircle2, Camera, User, ChevronRight, Info, Heart,
  ShieldCheck, MessageSquare, AlertCircle, RefreshCw, Layers,
  LocateFixed, PhoneCall, Globe, Zap, Cpu, Car, Volume2
} from 'lucide-react';
import { useKavachStore } from '../store/useKavachStore';
import { supabase } from '../lib/supabase';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, arrayUnion, getDoc } from 'firebase/firestore';
import { useCall } from '../contexts/CallContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import TacticalModal from './TacticalModal';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import VictimMap from './maps/VictimMap';
import NearbyHubModal from './NearbyHubModal';
import MedicalHubModal from './MedicalHubModal';

export default function ProtectorDashboard() {
  const { language } = useLanguage();
  const { initiateCall } = useCall();
  const { user, profile, userPos, isEmergencyOverrideRequested, activeTab } = useKavachStore();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [rescuePhoto, setRescuePhoto] = useState<string | null>(null);
  const [resolvingAlert, setResolvingAlert] = useState<any | null>(null);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  const [handshakeInput, setHandshakeInput] = useState('');
  const [isNearbyHubOpen, setIsNearbyHubOpen] = useState(false);
  const [isMedicalHubOpen, setIsMedicalHubOpen] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');

  const [showTacticalPledge, setShowTacticalPledge] = useState<{ isOpen: boolean, alertId: string | null }>({ isOpen: false, alertId: null });
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);
  const [showUplinkActive, setShowUplinkActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [distanceToVictim, setDistanceToVictim] = useState<{ [key: string]: string }>({});
  const [isInterceptHUDOpen, setIsInterceptHUDOpen] = useState(false);
  const [activeInterceptAlert, setActiveInterceptAlert] = useState<any | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { setInterceptActive } = useKavachStore();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isBriefingPlaying, setIsBriefingPlaying] = useState(false);
  const [showSuccessMotivation, setShowSuccessMotivation] = useState(false);
  const [lastResolvedVictim, setLastResolvedVictim] = useState('');

  useEffect(() => {
    if (!respondingToId) return;

    const unsub = onSnapshot(doc(db, 'alerts', respondingToId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === 'resolved') {
          setLastResolvedVictim(data.victimName || data.userName || 'Citizen');
          setShowSuccessMotivation(true);
          setRespondingToId(null);
          setInterceptActive(false);
          setIsInterceptHUDOpen(false);
          
          // 🎊 Haptic Victory Pulse
          if (Capacitor.isNativePlatform()) {
             navigator.vibrate([100, 50, 100, 50, 200]);
          }
        }
      }
    });
    return () => unsub();
  }, [respondingToId]);

  const handleVoiceBriefing = (isManual = false) => {
    if (isBriefingPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsBriefingPlaying(false);
      return;
    }

    if (isBriefingPlaying) return;

    const audioPath = '/voice/protectorenglish.mp3';
    const audio = new Audio(audioPath);
    audioRef.current = audio;
    
    setIsBriefingPlaying(true);

    audio.onended = () => {
      setIsBriefingPlaying(false);
      localStorage.setItem('kavach_protector_briefing_completed', 'true');
    };

    audio.play().catch(err => {
      setIsBriefingPlaying(false);
      console.log("Voice blocked by browser autoplay policy.");
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`;
  };

  useEffect(() => {
    if (!userPos) return;
    const newDistances: { [key: string]: string } = {};
    activeAlerts.forEach(alert => {
      const vLat = alert.latitude || alert.location?.latitude || alert.location?.lat || (alert.coords && alert.coords[0]);
      const vLng = alert.longitude || alert.location?.longitude || alert.location?.lng || (alert.coords && alert.coords[1]);
      if (vLat && vLng) {
        newDistances[alert.id] = calculateDistance(userPos[0], userPos[1], vLat, vLng);
      }
    });
    setDistanceToVictim(newDistances);
  }, [userPos, activeAlerts]);

  useEffect(() => {
    const q = query(collection(db, 'alerts'), where('status', 'in', ['active', 'responding', 'rescued_pending_victim_clearance']));
    const unsub = onSnapshot(q, (snap) => {
      const allAlerts = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));

      if (userPos && user) {
        const filtered = allAlerts.filter(alert => {
          if (alert.uid === user.uid) return false;
          const vLat = alert.latitude || alert.location?.latitude || alert.location?.lat || (alert.coords && alert.coords[0]);
          const vLng = alert.longitude || alert.location?.longitude || alert.location?.lng || (alert.coords && alert.coords[1]);
          if (!vLat || !vLng) return false;
          const dLat = (vLat - userPos[0]) * Math.PI / 180;
          const dLon = (vLng - userPos[1]) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(userPos[0] * Math.PI / 180) * Math.cos(vLat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = 6371 * c;
          const isResponding = alert.responderUid === user.uid;
          if (isResponding && dist <= 20) return true;
          
          // 🛡️ TACTICAL Interception/Safe Ride fallback or debug mode: Allow up to 1000km for Transit alerts or testing
          const isTransit = !!alert.isTransitSOS;
          const isDebug = localStorage.getItem('kavach_debug_mode') === 'true' || alert.type === 'TEST_ALERT' || alert.type?.includes('TEST');
          if (isTransit || isDebug) {
            return dist <= 1000;
          }
          
          return dist <= 10;
        });
        setActiveAlerts(filtered);
      } else {
        setActiveAlerts([]);
      }
    });
    return () => unsub();
  }, [userPos, user]);

  useEffect(() => {
    if (!user || !activeTab) return;
    const respondingAlert = activeAlerts.find(a => a.responderUid === user.uid);
    if (respondingAlert) {
      const alertRef = doc(db, 'alerts', respondingAlert.id);
      const unsub = onSnapshot(alertRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.status === 'resolved') {
            toast.success(`MISSION RESOLVED: Victim confirmed safety [${data.verification?.closureReason || 'Manual'}]`, {
              duration: 6000,
              icon: <ShieldCheck className="text-emerald-500" />
            });
            setIsInterceptHUDOpen(false);
            setInterceptActive(false);
          }
        }
      });
      return () => unsub();
    }
  }, [activeAlerts, user, activeTab]);

  useEffect(() => {
    const isJustLoggedIn = sessionStorage.getItem('kavach_just_logged_in');
    if (isJustLoggedIn) {
      handleVoiceBriefing();
      const playOnInteract = () => {
        handleVoiceBriefing();
        document.removeEventListener('click', playOnInteract);
      };
      document.addEventListener('click', playOnInteract);
    }
  }, []);

  const handleStartHelp = (alertId: string) => {
    setShowTacticalPledge({ isOpen: true, alertId });
  };

  const [isProcessingResponse, setIsProcessingResponse] = useState(false);

  const confirmTacticalResponse = async () => {
    if (isProcessingResponse) return;
    const alertId = showTacticalPledge.alertId;
    if (!alertId || !user) return;

    setIsProcessingResponse(true);
    
    // 🛡️ TACTICAL GUARD: Prevent duplicate responders
    const alertDoc = await getDoc(doc(db, 'alerts', alertId));
    if (!alertDoc.exists()) return;
    
    const alertData = alertDoc.data();
    const isAlreadyResponding = (alertData.activeResponders || []).some((r: any) => r.uid === user.uid);
    
    setRespondingToId(alertId);
    setShowTacticalPledge({ isOpen: false, alertId: null });

    try {
      const state = useKavachStore.getState();
      const responderData = {
        uid: user.uid,
        name: state.profile?.name || user.displayName || 'Protector Saathi',
        photo: state.profile?.photoURL || user.photoURL || '',
        phone: state.profile?.phone || user.phoneNumber || '',
        joinedAt: isAlreadyResponding ? (alertData.activeResponders.find((r: any) => r.uid === user.uid)?.joinedAt || Date.now()) : Date.now()
      };

      if (!isAlreadyResponding) {
        await updateDoc(doc(db, 'alerts', alertId), {
          status: 'responding',
          activeResponders: arrayUnion(responderData),
          responderUid: user.uid,
          responderName: state.profile?.name || user.displayName || 'Protector Saathi'
        });
        
        // ⚡ SUPABASE MISSION LOG
        supabase
          .from('missions')
          .insert({
            alert_id: alertId.startsWith('alert_') ? undefined : alertId,
            protector_id: user.uid,
            status: 'en_route',
            merit_earned: 0
          })
          .then(({ error }) => {
            if (error) console.error("⚡ SUPABASE: Mission Sync Failed.", error);
          });
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        status: 'responding',
        respondingToAlertId: alertId,
        lastUpdated: serverTimestamp()
      });

      // 🛰️ UPDATE GLOBAL STATE
      useKavachStore.setState({ 
        respondingToAlertId: alertId 
      });

      const activeAlert = activeAlerts.find(a => a.id === alertId);
      if (activeAlert) {
        useKavachStore.setState({ activeAlertId: alertId });
        setActiveInterceptAlert(activeAlert);
        setIsInterceptHUDOpen(true);
        setInterceptActive(true);
        setIsNavigating(true);
      }
      setShowUplinkActive(true);
      toast.success("Grid Connection Stabilized.");
    } catch (error) {
      toast.error("Tactical Uplink Failed.");
    }
  };

  const handleResolveAlert = async () => {
    if (!resolvingAlert) return;
    if (handshakeInput !== resolvingAlert.handshakeCode) {
      toast.error("Invalid Tactical Handshake Code. Access Denied.");
      return;
    }
    try {
      const alertRef = doc(db, 'alerts', resolvingAlert.id);
      await updateDoc(alertRef, {
        status: 'rescued_pending_victim_clearance',
        verification: {
          closureReason: resolutionSummary,
          handshakeCode: handshakeInput,
          rescuePhotoUrl: rescuePhoto,
          resolvedAt: serverTimestamp(),
          verifiedBy: user.uid
        }
      });
      toast.success("Verification Uplinked. Awaiting Victim Clearance.");
      setResolvingAlert(null);
      setHandshakeInput('');
      setResolutionSummary('');
      setRescuePhoto(null);
      setRespondingToId(null);
    } catch (e) {
      toast.error("Failed to finalize.");
    }
  };

  const maskName = (name: string) => {
    if (!name || name === 'Kavach Citizen') return name;
    const parts = name.split(' ');
    return parts.map(part => {
      if (part.length <= 1) return part;
      return part[0] + '*'.repeat(Math.min(part.length - 1, 7));
    }).join(' ');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-32 font-sans overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#1E40AF 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="px-6 pt-10 flex justify-between items-end mb-6">
        <div>
          <h1 className="text-[22px] font-black text-[#0F172A] tracking-tighter uppercase italic leading-none">Protector</h1>
          <p className="text-[8px] font-bold text-blue-600 uppercase tracking-[2px] mt-1.5">Mission Control Dashboard</p>
        </div>
        
        <button 
          disabled={!localStorage.getItem('kavach_protector_briefing_completed') && isBriefingPlaying}
          onClick={() => handleVoiceBriefing(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-blue-100 text-[8px] font-black transition-all shadow-sm uppercase tracking-wider active:scale-95",
            (!localStorage.getItem('kavach_protector_briefing_completed') && isBriefingPlaying)
              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-75" 
              : "text-[#0F172A] hover:bg-blue-50"
          )}
        >
          <Volume2 size={11} className={isBriefingPlaying ? "text-gray-400" : "text-blue-600"} />
          {isBriefingPlaying 
            ? "Stop" 
            : "Listen Now"}
        </button>
      </div>

      <div className="px-6">
        <div className="relative h-[380px] w-full rounded-[40px] bg-[#0F172A] overflow-hidden shadow-2xl border-4 border-white">
          <VictimMap activeAlerts={activeAlerts} mapStyle={mapStyle} />
          <div className="absolute inset-x-6 top-6 flex justify-between pointer-events-none">
            <div className="px-4 py-2 bg-white/90 backdrop-blur-xl rounded-2xl border border-white shadow-xl flex items-center justify-center">
              <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Network Online</span>
            </div>
            <button 
              onClick={() => {
                const nextStyle = mapStyle === 'streets' ? 'satellite' : mapStyle === 'satellite' ? 'dark' : 'streets';
                setMapStyle(nextStyle);
                toast.success(`Map Mode: ${nextStyle.toUpperCase()}`);
              }}
              className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/80 active:scale-95 transition-all shadow-lg"
            >
              <Layers size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 🛠️ TACTICAL RESOURCE HUB TRIGGERS */}
      <div className="px-6 mt-4 grid grid-cols-2 gap-3">
        <button 
          onClick={() => setIsNearbyHubOpen(true)}
          className="p-3.5 bg-slate-900 border border-slate-800 text-white rounded-[24px] flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform duration-300">
            <Shield size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 italic">Police Station</span>
          <span className="text-[5px] text-slate-400 font-bold uppercase tracking-[1.5px] mt-0.5">HQ & Local Outposts</span>
        </button>

        <button 
          onClick={() => setIsMedicalHubOpen(true)}
          className="p-3.5 bg-slate-900 border border-slate-800 text-white rounded-[24px] flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform duration-300">
            <Activity size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 italic">Medical Hub</span>
          <span className="text-[5px] text-slate-400 font-bold uppercase tracking-[1.5px] mt-0.5">Ambulance & Trauma</span>
        </button>
      </div>




      <div className="px-6 mt-6">
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-[10px] font-black text-[#0F172A] uppercase tracking-[2px] flex items-center gap-2"><Activity size={14} className="text-blue-600" /> Urgent Dispatch</h3>
          <div className="flex items-center gap-1.5 bg-[#0F172A] text-white px-2.5 py-1 rounded-full shadow-md"><span className="text-[7px] font-black uppercase tracking-wider">{activeAlerts.length} Critical Units</span></div>
        </div>
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
                <motion.div key={alert.id} layout initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative group">
                  <div className="bg-white/40 backdrop-blur-3xl rounded-[24px] p-3.5 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden transition-all duration-500 group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] group-hover:border-white/80">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-600/5 border border-blue-600/10 rounded-full">
                        <div className="w-1 h-1 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                        <span className="text-[6px] font-black text-blue-600/80 uppercase tracking-[1.5px]">Mission Active</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <div className="w-0.5 h-0.5 bg-gray-200 rounded-full" />
                        <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">#{alert.id.slice(-4).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 mb-4.5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-600/10 rounded-xl blur-md" />
                          <div className="relative w-10 h-10 bg-[#0F172A] rounded-[16px] flex items-center justify-center text-white border border-white/10 shadow-lg overflow-hidden group-hover:scale-105 transition-transform duration-500">
                            <Shield size={16} strokeWidth={1} className="opacity-40" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent" />
                          </div>
                        </div>
                        <div className="space-y-0">
                          <h4 className="text-md font-black text-gray-900 tracking-tighter uppercase italic leading-none">{maskName(alert.victimName)}</h4>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-blue-50 flex items-center justify-center"><MapPin size={6} className="text-blue-500" /></div>
                            <p className="text-[7px] font-bold text-gray-400 uppercase tracking-[1px] truncate max-w-[100px]">{alert.isTransitSOS ? `Vehicle: ${alert.vehicleNo}` : (alert.locationName || 'Unidentified Sector')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="px-3 py-1.5 bg-white/50 backdrop-blur-md rounded-[16px] border border-white shadow-sm">
                          <p className="text-md font-black text-gray-900 tracking-tighter leading-none">{distanceToVictim[alert.id] || '---'}</p>
                          <p className="text-[6px] font-black text-blue-600/40 uppercase tracking-widest mt-0.5 text-right">Distance</p>
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const isMeResponding = (alert.activeResponders || []).some((r: any) => r.uid === user?.uid);
                      return (
                        <div className="grid grid-cols-1 gap-3">
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => isMeResponding ? (setActiveInterceptAlert(alert), setIsInterceptHUDOpen(true), setInterceptActive(true)) : handleStartHelp(alert.id)} 
                              className={cn(
                                "group relative py-2.5 rounded-[16px] text-[8px] font-black uppercase tracking-[2px] shadow-lg transition-all overflow-hidden active:scale-[0.97]", 
                                isMeResponding ? "bg-blue-600 text-white shadow-blue-600/30" : "bg-[#0F172A] text-white shadow-black/20"
                              )}
                            >
                              <div className="relative z-10 flex items-center justify-center gap-2">
                                <Navigation size={12} />
                                <span>{isMeResponding ? 'Navigate' : 'Start'}</span>
                              </div>
                            </button>
                            <button onClick={() => setResolvingAlert(alert)} className="group relative py-2.5 bg-emerald-500 text-white rounded-[16px] text-[8px] font-black uppercase tracking-[2px] shadow-lg shadow-emerald-500/20 active:scale-[0.97] hover:bg-emerald-600 transition-all overflow-hidden">
                              <div className="relative z-10 flex items-center justify-center gap-2"><CheckCircle2 size={12} /><span>Clear</span></div>
                            </button>
                          </div>
                          {isMeResponding && (
                            <button onClick={() => initiateCall(alert.uid, alert.victimName || 'Victim', alert.id)} className="group relative py-3 bg-white border border-blue-600 text-blue-600 rounded-[16px] text-[8px] font-black uppercase tracking-[3px] shadow-md active:scale-[0.97] hover:bg-blue-50 transition-all overflow-hidden">
                              <div className="relative z-10 flex items-center justify-center gap-2"><PhoneCall size={14} /><span>Secure Call Victim</span></div>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-center space-y-8">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 bg-emerald-100 rounded-full blur-2xl" />
                  <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-2xl border border-emerald-50"><ShieldCheck size={56} className="text-emerald-500" strokeWidth={1.5} /></div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-[6px]">Sector Secured</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[3px]">National Safety Network Monitoring Active</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {profile?.missionHistory && profile.missionHistory.length > 0 && (
        <div className="px-6 mt-12 pb-12">
          <div className="flex items-center gap-3 mb-8 px-2">
            <Clock size={18} className="text-gray-400" />
            <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-[4px]">Recent Interventions</h3>
          </div>
          <div className="space-y-4">
            {profile.missionHistory.slice().reverse().slice(0, 5).map((mission: any, idx: number) => (
              <motion.div key={idx} initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="bg-white/60 backdrop-blur-3xl rounded-[32px] p-5 border border-white shadow-xl flex items-center justify-between group transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", mission.outcome === 'VERIFIED_RESCUE' ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600")}>
                    {mission.outcome === 'VERIFIED_RESCUE' ? <ShieldCheck size={24} /> : <Zap size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-gray-900 tracking-tight uppercase">
                        {(() => {
                          const missionDate = mission.timestamp ? new Date(mission.timestamp) : new Date();
                          const hoursSince = (Date.now() - missionDate.getTime()) / (1000 * 60 * 60);
                          return hoursSince > 24 ? `ANONYMOUS #${mission.id.slice(-4).toUpperCase()}` : maskName(mission.victimName);
                        })()}
                      </h4>
                      <span className={cn("text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest", mission.outcome === 'VERIFIED_RESCUE' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500")}>
                        {mission.outcome === 'VERIFIED_RESCUE' ? 'Saved' : 'Assisted'}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-1">
                      {mission.reason || (mission.outcome === 'VERIFIED_RESCUE' ? 'Verification Handshake Complete' : 'Mission De-escalated')}
                    </p>
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1 italic">
                      {mission.timestamp ? new Date(mission.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-black text-[#0F172A] italic tabular-nums">+{mission.meritEarned || 0} XP</p>
                  <p className="text-[7px] font-black text-blue-600/40 uppercase tracking-widest mt-0.5">Merit Point</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {resolvingAlert && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setResolvingAlert(null)} className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-3xl" />
            <motion.div initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 50 }} className="relative w-full max-w-[340px] bg-white rounded-[40px] p-6 shadow-2xl border border-white">
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-1 bg-emerald-500 rounded-full mb-4" />
                <h2 className="text-lg font-black text-[#0F172A] tracking-tighter uppercase italic">Safety Confirmation</h2>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-center">Capture a verification photo and confirm safe status.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest flex justify-between"><span>Capture Verification Photo</span><span className="text-emerald-500">VERIFIED</span></p>
                  <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setRescuePhoto(URL.createObjectURL(file));
                  }} />
                  <div onClick={() => fileInputRef.current?.click()} className="relative w-full h-32 rounded-[24px] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-gray-100">
                    {rescuePhoto ? <img src={rescuePhoto} className="w-full h-full object-cover" alt="Safety Proof" /> : <div className="flex flex-col items-center text-gray-300"><Camera size={32} strokeWidth={1} /><span className="text-[8px] font-black uppercase mt-2 tracking-[3px]">Capture Photo</span></div>}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Tactical Summary (Closure Reason)</p>
                  <textarea value={resolutionSummary} onChange={(e) => setResolutionSummary(e.target.value)} placeholder="e.g. Victim safe, suspect fled..." className="w-full h-20 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[10px] font-bold text-gray-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Victim Safety Code</p>
                  <div className="flex gap-2 justify-center">
                    {[0, 1, 2, 3].map(i => (
                      <input key={i} type="text" maxLength={1} value={handshakeInput[i] || ''} onChange={(e) => {
                        const val = e.target.value;
                        if (val && handshakeInput.length < 4) setHandshakeInput(handshakeInput + val);
                        else if (!val) setHandshakeInput(handshakeInput.slice(0, -1));
                      }} className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl text-center text-xl font-black text-blue-600 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="•" />
                    ))}
                  </div>
                </div>
                <div className="pt-2 space-y-2">
                  <button onClick={handleResolveAlert} className="w-full py-4 bg-blue-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[2px] shadow-lg shadow-blue-600/20 active:scale-95 transition-all">CONFIRM SAFE STATUS</button>
                  <button onClick={() => setResolvingAlert(null)} className="w-full py-3 bg-gray-100 text-gray-400 rounded-[20px] text-[11px] font-black uppercase tracking-[2px] active:scale-95 transition-all">Cancel</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TacticalModal isOpen={showTacticalPledge.isOpen} onClose={() => setShowTacticalPledge({ isOpen: false, alertId: null })} onConfirm={confirmTacticalResponse} type="info" title="Emergency Response Activated" description="Your live activity and route will now be monitored securely while you assist the victim." confirmText="START RESPONSE" />

      <AnimatePresence>
        {isInterceptHUDOpen && activeInterceptAlert && (
          <motion.div initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="fixed inset-0 z-[2000000] bg-black">
            <div className="absolute inset-0">
              <VictimMap activeAlerts={[activeInterceptAlert]} isInterceptMode={true} isNavigating={isNavigating} distance={distanceToVictim[activeInterceptAlert.id] || '---'} onToggleNav={() => setIsNavigating(!isNavigating)} onResolve={() => { setResolvingAlert(activeInterceptAlert); setIsInterceptHUDOpen(false); setInterceptActive(false); setIsNavigating(false); }} onClose={() => { setIsInterceptHUDOpen(false); setInterceptActive(false); setIsNavigating(false); }} />
            </div>
            <div className="absolute inset-x-0 top-0 pt-16 px-6 pointer-events-none">
              <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("backdrop-blur-3xl rounded-3xl p-4 border border-white/10 shadow-2xl flex items-center justify-between transition-all duration-700", (parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "bg-emerald-600/90" : "bg-[#0F172A]/90")}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all shadow-2xl", (parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "bg-white text-emerald-600" : "bg-blue-600")}>
                    {(parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? <CheckCircle2 size={20} /> : <Navigation size={20} />}
                  </div>
                  <div>
                    <p className={cn("text-[8px] font-black uppercase tracking-[2px]", (parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "text-emerald-100" : "text-blue-400")}>{(parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "TARGET REACHED" : "Tactical Intercept Active"}</p>
                    <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none mt-1">{(parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "INITIATE CLEARANCE" : "LIVE TARGET LOCK"}</h2>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEmergencyOverrideRequested && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#0F172A]/98 backdrop-blur-3xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-[340px] text-center space-y-10">
              <div className="relative mx-auto w-32 h-32">
                <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute inset-0 bg-blue-600 rounded-full blur-[60px]" />
                <div className="relative w-full h-full rounded-full border-2 border-blue-500/20 flex items-center justify-center"><ShieldCheck size={56} className="text-blue-500" strokeWidth={1} /></div>
              </div>
              <div className="space-y-5">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Security Locked</h2>
                <p className="text-[11px] font-bold text-blue-400/50 uppercase tracking-[4px] leading-relaxed px-4">Emergency Command Override Active. SuperCell HQ is performing forensic validation.</p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 px-6 py-2.5 bg-blue-600/10 border border-blue-500/20 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-[4px]">Uplink Pending</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessMotivation && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full space-y-10 relative"
            >
              <div className="relative mx-auto w-40 h-40">
                <motion.div 
                   animate={{ 
                     scale: [1, 1.2, 1],
                     rotate: [0, 180, 360],
                     opacity: [0.5, 0.2, 0.5] 
                   }}
                   transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-yellow-200 rounded-full blur-3xl" 
                />
                <div className="relative w-full h-full rounded-full border-2 border-amber-500/30 flex items-center justify-center bg-black/40 backdrop-blur-xl">
                  <ShieldCheck size={80} className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" strokeWidth={1} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-amber-500 text-[10px] font-black uppercase tracking-[6px]"
                  >
                    Grid Victory Secured
                  </motion.p>
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none"
                  >
                    Mission <br/> Accomplished
                  </motion.h2>
                </div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-4"
                >
                  <p className="text-sm font-bold text-gray-300 uppercase leading-relaxed tracking-tight italic">
                    "The citizen {lastResolvedVictim} is safe. Your tactical response ensured the National Grid remained unbreakable."
                  </p>
                  <div className="h-px w-12 bg-amber-500/30 mx-auto" />
                  <p className="text-[9px] font-black text-amber-500/80 uppercase tracking-[4px]">Kavach Honor: Unblemished</p>
                </motion.div>
              </div>

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={() => setShowSuccessMotivation(false)}
                className="w-full py-5 bg-amber-500 text-black rounded-[24px] text-[11px] font-black uppercase tracking-[4px] shadow-[0_20px_50px_rgba(245,158,11,0.2)] active:scale-95 transition-all"
              >
                Return to Grid
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <NearbyHubModal isOpen={isNearbyHubOpen} onClose={() => setIsNearbyHubOpen(false)} />
      <MedicalHubModal isOpen={isMedicalHubOpen} onClose={() => setIsMedicalHubOpen(false)} />
    </div>
  );
}
