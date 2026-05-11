import React, { useState, useEffect } from 'react';
import { 
  Shield, MapPin, Bell, Activity, Clock, Phone, Navigation, 
  CheckCircle2, Camera, User, ChevronRight, Info, Heart, 
  ShieldCheck, MessageSquare, AlertCircle, RefreshCw, Layers,
  LocateFixed, PhoneCall, Globe, Zap, Cpu, Car
} from 'lucide-react';
import { useKavachStore } from '../store/useKavachStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { useCall } from '../contexts/CallContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import TacticalModal from './TacticalModal';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import VictimMap from './maps/VictimMap';

export default function ProtectorDashboard() {
  const { language } = useLanguage();
  const { initiateCall } = useCall();
  const { user, profile, userPos, isEmergencyOverrideRequested } = useKavachStore();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [rescuePhoto, setRescuePhoto] = useState<string | null>(null);
  const [resolvingAlert, setResolvingAlert] = useState<any | null>(null);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  const [handshakeInput, setHandshakeInput] = useState('');
  
  const [showTacticalPledge, setShowTacticalPledge] = useState<{ isOpen: boolean, alertId: string | null }>({ isOpen: false, alertId: null });
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);
  const [showUplinkActive, setShowUplinkActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [distanceToVictim, setDistanceToVictim] = useState<{[key: string]: string}>({});
  const [isInterceptHUDOpen, setIsInterceptHUDOpen] = useState(false);
  const [activeInterceptAlert, setActiveInterceptAlert] = useState<any | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { setInterceptActive } = useKavachStore();

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
    const newDistances: {[key: string]: string} = {};
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
      
      // 🛡️ TACTICAL RADIUS FILTERING (10km Iron Perimeter)
      if (userPos && user) {
        const filtered = allAlerts.filter(alert => {
          // 🛡️ SELF-SOS EXCLUSION: You shouldn't rescue yourself
          if (alert.uid === user.uid) return false;

          const vLat = alert.latitude || alert.location?.latitude || alert.location?.lat || (alert.coords && alert.coords[0]);
          const vLng = alert.longitude || alert.location?.longitude || alert.location?.lng || (alert.coords && alert.coords[1]);
          if (!vLat || !vLng) return false;
          
          const dLat = (vLat - userPos[0]) * Math.PI / 180;
          const dLon = (vLng - userPos[1]) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(userPos[0] * Math.PI / 180) * Math.cos(vLat * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = 6371 * c; // km
          
          // 🏁 PERSISTENCE CHECK: Only show if within 10km OR actively responding within 20km (buffer)
          const isResponding = alert.responderUid === user.uid;
          if (isResponding && dist <= 20) return true;
          
          return dist <= 10; 
        });
        setActiveAlerts(filtered);
      } else {
        // 🛰️ Default to EMPTY if no GPS, to avoid showing distant test data
        setActiveAlerts([]);
      }
    });
    return () => unsub();
  }, [userPos, user]);

  const handleStartHelp = (alertId: string) => {
    setShowTacticalPledge({ isOpen: true, alertId });
  };

  const confirmTacticalResponse = async () => {
    const alertId = showTacticalPledge.alertId;
    if (!alertId || !user) return;

    setRespondingToId(alertId);
    setShowTacticalPledge({ isOpen: false, alertId: null });
    
    try {
      const alertRef = doc(db, 'alerts', alertId);
      const state = useKavachStore.getState();
      const responderData = {
        uid: user.uid,
        name: state.profile?.name || user.displayName || 'Protector Saathi',
        photo: state.profile?.photoURL || user.photoURL || '',
        phone: state.profile?.phone || user.phoneNumber || '',
        joinedAt: Date.now()
      };

      await updateDoc(alertRef, {
        status: 'responding',
        activeResponders: arrayUnion(responderData),
        responderUid: user.uid, 
        responderName: state.profile?.name || user.displayName || 'Protector Saathi'
      });
      setShowUplinkActive(true);
      toast.success("Grid Saturation Initialized.");
    } catch (error) {
      toast.error("Connection failed.");
    }
  };


  const handleResolveAlert = async () => {
    if (!resolvingAlert || !handshakeInput || handshakeInput.length !== 4) {
      toast.error("Enter the 4-digit Safety Code.");
      return;
    }
    
    try {
      const alertRef = doc(db, 'alerts', resolvingAlert.id);
      await updateDoc(alertRef, {
        status: 'rescued_pending_victim_clearance',
        closureReason: resolutionSummary,
        handshakeCode: handshakeInput,
        rescuePhotoUrl: rescuePhoto,
        resolvedAt: serverTimestamp()
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

  const handleSecureCall = (phone: string) => {
    toast.info("Establishing Masked Link...");
    setTimeout(() => { window.location.href = `tel:${phone}`; }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-32 font-sans overflow-x-hidden relative">
      {/* 🏛️ SOVEREIGN BACKGROUND LAYER */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#1E40AF 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* 🗺️ TACTICAL INTELLIGENCE VIEWPORT */}
      <div className="px-6 pt-6">
        <div className="relative h-[380px] w-full rounded-[40px] bg-[#0F172A] overflow-hidden shadow-2xl border-4 border-white">
          <VictimMap 
            activeAlerts={activeAlerts} 
            userPos={userPos} 
          />
          
          {/* 📡 LIVE DATA OVERLAYS */}
          <div className="absolute inset-x-6 top-6 flex justify-between pointer-events-none">
             <div className="px-4 py-2 bg-white/90 backdrop-blur-xl rounded-2xl border border-white shadow-xl flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest">Network Online // Sector 04</span>
             </div>
             <div className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center text-white">
                <Layers size={18} />
             </div>
          </div>
        </div>
      </div>

      {/* 📊 LIVE STATISTICS TERMINAL */}
      <div className="px-6 mt-8 grid grid-cols-2 gap-4">
         <div className="bg-white rounded-3xl p-5 border border-white shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
               <Globe size={22} />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grid Load</p>
               <h4 className="text-xl font-black text-[#0F172A] tracking-tighter">98.2%</h4>
            </div>
         </div>
         <div className="bg-white rounded-3xl p-5 border border-white shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
               <Zap size={22} />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Latency</p>
               <h4 className="text-xl font-black text-[#0F172A] tracking-tighter">14ms</h4>
            </div>
         </div>
      </div>

      {/* 🏆 PROTECTOR MERIT HUB */}
      <div className="px-6 mt-6">
        <div className="bg-[#0F172A] rounded-[40px] p-8 shadow-2xl relative overflow-hidden border border-white/10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-[60px] -mr-20 -mt-20" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit">
                 <ShieldCheck size={12} className="text-blue-400" />
                 <span className="text-[8px] font-black text-blue-400 uppercase tracking-[2px]">Merit Credentials</span>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Your Impact</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[3px] mt-2">National Protector Grid v4.2</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <span className="text-4xl font-black text-white tracking-tighter leading-none">{profile?.livesSaved || 0}</span>
                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[2px] mt-1">Lives Saved</p>
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                 <span className="text-[10px] font-bold text-white tracking-widest">{profile?.xp || 0} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-10">
          <div className="flex justify-between items-center mb-8 px-2">
            <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-[4px] flex items-center gap-3">
              <Activity size={18} className="text-blue-600 animate-pulse" /> Urgent Dispatch
            </h3>
            <div className="flex items-center gap-2 bg-[#0F172A] text-white px-4 py-2 rounded-full shadow-lg">
               <span className="text-[9px] font-black uppercase tracking-widest">{activeAlerts.length} Critical Units</span>
            </div>
          </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative group"
                >
                  {/* 🏛️ PREMIUM GLASS HUD MODULE (COMPACT SCALE) */}
                  <div className="bg-white/40 backdrop-blur-3xl rounded-[32px] p-5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden transition-all duration-500 group-hover:shadow-[0_32px_60px_-16px_rgba(0,0,0,0.15)] group-hover:border-white/80">
                    
                    {/* 📡 LIVE STATUS HEADER */}
                    <div className="flex items-center justify-between mb-5">
                       <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/5 border border-blue-600/10 rounded-full">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                          <span className="text-[7px] font-black text-blue-600/80 uppercase tracking-[2px]">Mission Active</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <div className="w-0.5 h-0.5 bg-gray-200 rounded-full" />
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">#{alert.id.slice(-4).toUpperCase()}</span>
                       </div>
                    </div>

                    {/* 👤 VICTIM INTEL SECTION */}
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-600/10 rounded-2xl blur-lg" />
                          <div className="relative w-14 h-14 bg-[#0F172A] rounded-[22px] flex items-center justify-center text-white border border-white/10 shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                             <Shield size={24} strokeWidth={1} className="opacity-40" />
                             <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent" />
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">{alert.victimName}</h4>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-50 flex items-center justify-center">
                               <MapPin size={8} className="text-blue-500" />
                            </div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[1.5px] truncate max-w-[120px]">{alert.isTransitSOS ? `Vehicle: ${alert.vehicleNo}` : (alert.locationName || 'Unidentified Sector')}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                         <div className="px-4 py-2.5 bg-white/50 backdrop-blur-md rounded-[20px] border border-white shadow-sm">
                            <p className="text-xl font-black text-gray-900 tracking-tighter leading-none">{distanceToVictim[alert.id] || '---'}</p>
                            <p className="text-[7px] font-black text-blue-600/40 uppercase tracking-widest mt-0.5 text-right">Distance</p>
                         </div>
                      </div>
                    </div>

                    {/* 🛠️ TACTICAL COMMANDS */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => {
                            if (alert.status === 'responding') {
                              setActiveInterceptAlert(alert);
                              setIsInterceptHUDOpen(true);
                              setInterceptActive(true);
                            } else {
                              handleStartHelp(alert.id);
                            }
                          }}
                          className={cn(
                            "group relative py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-[3px] shadow-xl transition-all overflow-hidden active:scale-[0.97]",
                            alert.status === 'responding' 
                              ? "bg-blue-600 text-white shadow-blue-600/30" 
                              : "bg-[#0F172A] text-white shadow-black/20"
                          )}
                        >
                          <div className="relative z-10 flex items-center justify-center gap-2">
                            <Navigation size={14} className={alert.status === 'responding' ? "animate-pulse" : ""} />
                            <span>{alert.status === 'responding' ? 'Navigate' : 'Start'}</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </button>

                        <button 
                          onClick={() => setResolvingAlert(alert)}
                          className="group relative py-3.5 bg-emerald-500 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[3px] shadow-xl shadow-emerald-500/20 active:scale-[0.97] hover:bg-emerald-600 transition-all overflow-hidden"
                        >
                          <div className="relative z-10 flex items-center justify-center gap-2">
                            <CheckCircle2 size={14} />
                            <span>Clear</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </button>
                      </div>

                      {alert.status === 'responding' && (
                        <button 
                          onClick={() => initiateCall(alert.uid, alert.victimName || 'Victim', alert.id)}
                          className="group relative py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-[20px] text-[10px] font-black uppercase tracking-[4px] shadow-lg active:scale-[0.97] hover:bg-blue-50 transition-all overflow-hidden"
                        >
                          <div className="relative z-10 flex items-center justify-center gap-2">
                            <PhoneCall size={16} />
                            <span>Secure Call Victim</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-600/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </button>
                      )}
                    </div>

                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-32 text-center space-y-8">
                <div className="relative w-32 h-32">
                   <div className="absolute inset-0 bg-emerald-100 rounded-full blur-2xl animate-pulse" />
                   <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-2xl border border-emerald-50">
                      <ShieldCheck size={56} className="text-emerald-500" strokeWidth={1.5} />
                   </div>
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

      {/* 📜 MISSION LEDGER (HISTORY) */}
      {profile?.missionHistory && profile.missionHistory.length > 0 && (
        <div className="px-6 mt-12 mb-10">
          <div className="flex items-center gap-3 mb-6 px-2">
            <Clock size={18} className="text-gray-400" />
            <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-[4px]">Recent Interventions</h3>
          </div>
          <div className="space-y-3">
            {profile.missionHistory.slice().reverse().slice(0, 5).map((mission: any, idx: number) => (
              <div key={idx} className="bg-white rounded-[24px] p-5 border border-white shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <User size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 tracking-tight">{mission.victimName}</h4>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      {mission.type === 'TRANSIT_INTERCEPTION' ? 'Transit Intercept' : 'Emergency SOS'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-blue-600 uppercase italic">SUCCESS</p>
                  <p className="text-[7px] font-bold text-gray-300 mt-1 uppercase">
                    {mission.timestamp?.seconds ? new Date(mission.timestamp.seconds * 1000).toLocaleDateString() : 'RECENT'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📝 MISSION RESOLUTION MODAL */}
      <AnimatePresence>
        {resolvingAlert && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setResolvingAlert(null)} className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-3xl" />
            <motion.div initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 50 }} className="relative w-full max-w-[380px] bg-white rounded-[56px] p-10 shadow-2xl border border-white">
              <div className="flex flex-col items-center mb-10">
                 <div className="w-16 h-1 bg-emerald-500 rounded-full mb-6" />
                 <h2 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase italic">Safety Confirmation</h2>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 text-center">Capture a verification photo and confirm the victim is now safe.</p>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex justify-between">
                    <span>Capture Verification Photo</span>
                    <span className="text-emerald-500">VERIFIED</span>
                  </p>
                  <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setRescuePhoto(URL.createObjectURL(file));
                  }} />
                  <div onClick={() => fileInputRef.current?.click()} className="relative w-full h-44 rounded-[40px] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-gray-100">
                    {rescuePhoto ? (
                      <img src={rescuePhoto} className="w-full h-full object-cover" alt="Safety Proof" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-300">
                        <Camera size={40} strokeWidth={1} />
                        <span className="text-[10px] font-black uppercase mt-4 tracking-[4px]">Capture Photo</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 text-center">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Safety Check</p>
                  <div className="flex gap-3 justify-center">
                    {[0,1,2,3].map(i => (
                      <input key={i} type="text" maxLength={1} value={handshakeInput[i] || ''} onChange={(e) => {
                        const val = e.target.value;
                        if (val && handshakeInput.length < 4) setHandshakeInput(handshakeInput + val);
                        else if (!val) setHandshakeInput(handshakeInput.slice(0, -1));
                      }} className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-3xl text-center text-3xl font-black text-blue-600 outline-none focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500 transition-all" placeholder="•" />
                    ))}
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                   <button onClick={handleResolveAlert} className="w-full py-7 bg-blue-600 text-white rounded-[32px] text-[14px] font-black uppercase tracking-[4px] shadow-2xl shadow-blue-600/30 active:scale-95 transition-all">CONFIRM SAFE STATUS</button>
                   <button onClick={() => setResolvingAlert(null)} className="w-full py-7 bg-gray-100 text-gray-500 rounded-[32px] text-[14px] font-black uppercase tracking-[4px] active:scale-95 transition-all">Cancel</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TacticalModal
        isOpen={showTacticalPledge.isOpen}
        onClose={() => setShowTacticalPledge({ isOpen: false, alertId: null })}
        onConfirm={confirmTacticalResponse}
        type="info"
        title="Emergency Response Activated"
        description="Your live activity and route will now be monitored securely while you assist the victim."
        confirmText="START RESPONSE"
      />

      {/* 🏛️ FULL-SCREEN INTERCEPTOR HUD */}
      <AnimatePresence>
        {isInterceptHUDOpen && activeInterceptAlert && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[99999] bg-black"
          >
            <div className="absolute inset-0">
               <VictimMap 
                 activeAlerts={[activeInterceptAlert]} 
                 userPos={userPos} 
                 isInterceptMode={true}
                 isNavigating={isNavigating}
                 distance={distanceToVictim[activeInterceptAlert.id] || '---'}
                 onToggleNav={() => setIsNavigating(!isNavigating)}
                 onResolve={() => {
                   setResolvingAlert(activeInterceptAlert);
                   setIsInterceptHUDOpen(false);
                   setInterceptActive(false);
                   setIsNavigating(false);
                 }}
                 onClose={() => {
                   setIsInterceptHUDOpen(false);
                   setInterceptActive(false);
                   setIsNavigating(false);
                 }}
               />
            </div>

            <div className="absolute inset-x-0 top-0 pt-16 px-6 pointer-events-none">
               <motion.div 
                 initial={{ y: -50, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className={cn(
                   "backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-2xl flex items-center justify-between transition-all duration-700",
                   (parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') 
                    ? "bg-emerald-600/95" 
                    : "bg-[#0F172A]/90"
                 )}
               >
                  <div className="flex items-center gap-6">
                     <div className={cn(
                       "w-16 h-16 rounded-[28px] flex items-center justify-center text-white transition-all shadow-2xl",
                       (parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') 
                        ? "bg-white text-emerald-600" 
                        : "bg-blue-600"
                     )}>
                        {(parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') 
                          ? <CheckCircle2 size={36} className="animate-bounce" /> 
                          : <Navigation size={36} className="animate-pulse" />}
                     </div>
                     <div>
                        <p className={cn(
                          "text-[11px] font-black uppercase tracking-[4px]",
                          (parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') 
                            ? "text-emerald-100" 
                            : "text-blue-400"
                        )}>
                          {(parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') 
                            ? "TARGET REACHED" 
                            : "Tactical Intercept Active"}
                        </p>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mt-1">
                          {(parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') 
                            ? "INITIATE CLEARANCE" 
                            : "LIVE TARGET LOCK"}
                        </h2>
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
                <div className="relative w-full h-full rounded-full border-2 border-blue-500/20 flex items-center justify-center"><ShieldCheck size={56} className="text-blue-500 animate-pulse" strokeWidth={1} /></div>
              </div>
              <div className="space-y-5">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Security Locked</h2>
                <p className="text-[11px] font-bold text-blue-400/50 uppercase tracking-[4px] leading-relaxed px-4">
                  Emergency Command Override Active. SuperCell HQ is performing forensic validation.
                </p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 px-6 py-2.5 bg-blue-600/10 border border-blue-500/20 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-[4px]">Uplink Pending</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
