import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, Activity, CheckCircle, ShieldAlert, Navigation, Zap, Shield, AlertTriangle } from 'lucide-react';
import { useKavachStore } from '../store/useKavachStore';
import SecurityRadarMap from './maps/SecurityRadarMap';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, limit, doc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function SOSActiveOverlay() {
  const { 
    isSOSActive, setSOSActive, activeAlertId,
    isSOSBlocked, sosBlockedReason,
    hasPendingWarning, warningMessage, acknowledgeWarning,
    handshakeCode
  } = useKavachStore();
  
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [showReasonEntry, setShowReasonEntry] = useState(false);
  const [closureReason, setClosureReason] = useState('');
  const [pin, setPin] = useState('');
  const [nearbyProtectors, setNearbyProtectors] = useState<any[]>([]);
  const [alertData, setAlertData] = useState<any>(null);
  const [dispatchNotif, setDispatchNotif] = useState<{ type: 'protector' | 'supercell', active: boolean }>({ type: 'protector', active: false });

  // 📡 LISTEN FOR ACTIVE ALERT STATUS CHANGES
  useEffect(() => {
    if (!activeAlertId || !isSOSActive) return;
    const unsub = onSnapshot(doc(db, 'alerts', activeAlertId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (!alertData?.responderUid && data.responderUid) {
          setDispatchNotif({ type: 'protector', active: true });
          toast.success("PROTECTOR DISPATCHED: Help is 1km away.", { className: 'bg-blue-600 text-white font-black uppercase text-[10px]' });
        }
        if (data.status === 'supercell_dispatched' && alertData?.status !== 'supercell_dispatched') {
          setDispatchNotif({ type: 'supercell', active: true });
          toast.error("SUPERCELL DISPATCH ON THE WAY.", { className: 'bg-red-600 text-white font-black uppercase text-[10px]' });
        }
        setAlertData(data);
      }
    });
    return () => unsub();
  }, [activeAlertId, isSOSActive, alertData]);

  useEffect(() => {
    if (!isSOSActive) return;
    const q = query(collection(db, 'users'), where('role', '==', 'protector'), where('isVerified', '==', true), limit(10));
    return onSnapshot(q, (snap) => {
      setNearbyProtectors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [isSOSActive]);

  const handleVerifyPIN = () => {
    if (pin === '1234') { // Should use safetyPin from store
      setShowPinEntry(false);
      setShowReasonEntry(true);
    } else {
      toast.error("Invalid Security PIN.");
      setPin('');
    }
  };

  const handleFinalClose = () => {
    if (closureReason.length < 5) {
      toast.error("Please provide a valid reason for the mission report.");
      return;
    }
    setSOSActive(false, activeAlertId, 'button', closureReason);
    setShowReasonEntry(false);
    setClosureReason('');
    setPin('');
    setAlertData(null);
  };

  // 🛡️ BLOCK OVERLAY
  if (isSOSBlocked) {
    return (
      <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <ShieldAlert size={48} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase italic mb-2 tracking-tighter">Account Blocked</h2>
        <p className="text-[10px] text-red-500 font-black uppercase tracking-[3px] mb-8">Grid Access Revoked by SuperCell</p>
        
        <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] w-full max-w-sm mb-8">
          <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-2 text-left">Reason for Suspension</p>
          <p className="text-sm font-bold text-white text-left leading-relaxed">
            {sosBlockedReason || "Multiple inappropriate SOS triggers detected. Your access to the KAVACH grid has been suspended pending forensic review."}
          </p>
        </div>

        <button className="w-full max-w-sm py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[3px]">
          Appeal Suspension
        </button>
      </div>
    );
  }

  // 🛡️ WARNING OVERLAY
  if (hasPendingWarning) {
    return (
      <div className="fixed inset-0 z-[1500] bg-[#0A0A0B]/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-yellow-500/20">
          <AlertTriangle size={40} className="text-yellow-500" />
        </div>
        <h2 className="text-xl font-black text-white uppercase italic mb-2 tracking-tighter text-yellow-500">Grid Warning Issued</h2>
        <p className="text-[9px] text-gray-500 font-black uppercase tracking-[2px] mb-8">Action Required to Restore Services</p>
        
        <div className="bg-white/5 border border-white/10 p-6 rounded-[28px] w-full max-w-sm mb-8">
          <p className="text-xs font-bold text-white/80 leading-relaxed italic">
            "{warningMessage || "Please refrain from testing the SOS button unnecessarily. Every trigger consumes emergency resources."}"
          </p>
        </div>

        <button 
          onClick={() => acknowledgeWarning()}
          className="w-full max-w-sm py-5 bg-yellow-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-[3px] shadow-xl shadow-yellow-500/20"
        >
          I Understand & Comply
        </button>
      </div>
    );
  }

  if (!isSOSActive) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col font-sans">
      <div className="flex-1 relative">
         <SecurityRadarMap protectors={nearbyProtectors} />
         <div className="absolute top-10 left-6 right-6 z-[1100] space-y-3">
            <div className="bg-red-600 px-4 py-2 rounded-2xl border border-red-500 shadow-2xl flex items-center gap-3 animate-pulse">
               <ShieldAlert size={20} className="text-white" />
               <span className="text-[10px] font-black text-white uppercase tracking-[2px]">Emergency SOS Active</span>
            </div>
            <AnimatePresence>
               {dispatchNotif.active && (
                 <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={cn("p-4 rounded-[24px] border shadow-2xl flex items-center gap-4 relative overflow-hidden", dispatchNotif.type === 'protector' ? "bg-blue-600 border-blue-500" : "bg-red-700 border-red-600")}>
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                       {dispatchNotif.type === 'protector' ? <Navigation size={20} className="text-white" /> : <Shield size={20} className="text-white" />}
                    </div>
                    <div className="relative z-10 flex-1">
                       <p className="text-[8px] font-black uppercase text-white/60 tracking-widest mb-0.5">{dispatchNotif.type === 'protector' ? 'Protector Dispatched' : 'National Command Alert'}</p>
                       <p className="text-[11px] font-black text-white uppercase leading-tight italic">{dispatchNotif.type === 'protector' ? 'They are moving to your location.' : 'SuperCell Dispatch on the way.'}</p>
                    </div>
                    <button onClick={() => setDispatchNotif({ ...dispatchNotif, active: false })} className="text-white/40 hover:text-white"><CheckCircle size={16} /></button>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>

      <div className="h-[40%] bg-[#0A0A0B] border-t border-white/10 p-8 flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        <AnimatePresence mode="wait">
          {!showPinEntry && !showReasonEntry ? (
            <motion.div key="safe-btn" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full space-y-6 text-center relative z-10">
              <div className="space-y-2">
                 <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Are you safe?</h2>
                 <p className="text-[10px] text-gray-500 font-black uppercase tracking-[3px]">Mission Resolution Protocol 03</p>
              </div>
               <button onClick={() => setShowPinEntry(true)} className="w-full py-6 bg-accent-green text-white rounded-[32px] text-xs font-black uppercase tracking-[4px] flex items-center justify-center gap-3 shadow-2xl">
                <CheckCircle size={20} /> I am Safe Now
              </button>

              {/* 🤝 TACTICAL HANDSHAKE DISPLAY */}
              <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-[24px]">
                 <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest mb-2">Safe Handshake Code</p>
                 <div className="flex justify-center gap-2">
                    {handshakeCode?.split('').map((char, i) => (
                      <div key={i} className="w-10 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl font-black text-accent-green border border-white/10">
                        {char}
                      </div>
                    ))}
                 </div>
                 <p className="text-[7px] text-gray-600 font-bold uppercase mt-2">Show this to your protector only when you are safe</p>
              </div>
            </motion.div>
          ) : showPinEntry ? (
            <motion.div key="pin-entry" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full space-y-6 text-center relative z-10">
              <div className="space-y-2">
                 <Lock size={32} className="text-accent-blue mx-auto mb-2" />
                 <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Clearance Code</h2>
              </div>
              <div className="flex justify-center gap-3 mb-4">
                {[1, 2, 3, 4].map((_, i) => (
                  <div key={i} className={cn("w-4 h-4 rounded-full border-2 border-white/20", pin.length > i ? "bg-white border-white" : "")} />
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2 max-w-[280px] mx-auto mb-4">
                {[1,2,3,4,5,6,7,8,9,0].map(n => (
                  <button key={n} onClick={() => pin.length < 4 && setPin(p => p + n)} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl text-sm font-black text-white">{n}</button>
                ))}
              </div>
              <button onClick={handleVerifyPIN} disabled={pin.length < 4} className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[3px]">Next: Mission Reason</button>
            </motion.div>
          ) : (
            <motion.div key="reason-entry" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="w-full space-y-6 text-center relative z-10">
               <div className="space-y-2">
                 <Activity size={32} className="text-accent-green mx-auto mb-2" />
                 <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Resolution Report</h2>
                 <p className="text-[9px] text-gray-500 font-black uppercase tracking-[2px]">Mandatory Forensic Reason</p>
               </div>
               <textarea 
                 value={closureReason}
                 onChange={(e) => setClosureReason(e.target.value)}
                 placeholder="Why was the SOS triggered? (e.g., Felt followed, Accident, Wrong trigger...)"
                 className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold placeholder:text-white/20 focus:outline-none focus:border-accent-green transition-all"
               />
               <button onClick={handleFinalClose} className="w-full py-5 bg-accent-green text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] shadow-lg shadow-accent-green/20">Close Mission & Exit Grid</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🕵️‍♂️ SILENT DURESS TRIGGER (Subtle Link) */}
        <button 
          onClick={async () => {
             const code = prompt("VERIFY SECURE HANDSHAKE:");
             if (code) {
                const duress = await useKavachStore.getState().triggerDuress(code);
                if (duress) {
                   toast.success("Security Handshake Confirmed.", { className: 'bg-green-600 text-white font-black uppercase text-[10px]' });
                } else {
                   toast.error("Handshake Verification Failed.");
                }
             }
          }}
          className="mt-6 text-[7px] text-gray-800 font-black uppercase tracking-[4px] hover:text-gray-400 transition-colors relative z-10"
        >
          UPLINK_STATUS: SECURE_ALPHA_v4.2
        </button>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
