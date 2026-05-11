import React, { useState, useEffect } from 'react';
import { 
  Shield, Power, Bell, Camera, Activity, 
  Smartphone, Cpu, Zap, Lock, ShieldAlert,
  ChevronRight, Terminal, Wifi, Battery, RefreshCcw, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export function TacticalLab() {
  const [phoneStatus, setPhoneStatus] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const TEST_ID = "TEST_NODE_001";

  // 🛰️ INITIALIZE TEST NODE
  useEffect(() => {
    const initNode = async () => {
      await setDoc(doc(db, 'journeys', TEST_ID), {
        userName: "Virtual Citizen 01",
        status: "active",
        remoteCommand: null,
        lastUpdate: new Date()
      }, { merge: true });
      addLog("System: Test Node initialized in National Grid.");
    };
    initNode();

    // 📡 VIRTUAL PHONE LISTENER (Simulating Mobile App)
    const unsub = onSnapshot(doc(db, 'journeys', TEST_ID), (snap) => {
      const data = snap.data();
      if (data) {
        setPhoneStatus(data);
        if (data.remoteCommand && data.commandStatus !== 'executed') {
          handleIncomingCommand(data.remoteCommand);
        }
      }
    });
    return () => unsub();
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const handleIncomingCommand = async (cmd: string) => {
    addLog(`Phone: Tactical signal detected -> ${cmd}`);
    // Simulate hardware execution time
    setTimeout(async () => {
      await updateDoc(doc(db, 'journeys', TEST_ID), {
        commandStatus: 'executed',
        executionLog: `Hardware responded to ${cmd}`
      });
      addLog(`Phone: ${cmd} executed successfully.`);
    }, 800);
  };

  const triggerCommand = async (type: string) => {
    setIsProcessing(true);
    addLog(`Hub: Broadcasting ${type} to Node ${TEST_ID}`);
    try {
      await updateDoc(doc(db, 'journeys', TEST_ID), {
        remoteCommand: type,
        commandStatus: 'pending',
        commandTimestamp: new Date()
      });
      toast.success(`Signal Sent: ${type}`);
    } catch (err) {
      toast.error("Bridge Failure");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] p-10 flex gap-10 overflow-hidden font-['Outfit']">
      
      {/* 🏛️ LEFT: COMMAND HUB INTERFACE */}
      <div className="flex-1 bg-white rounded-[40px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-blue-600">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white"><Shield size={24} /></div>
              <div>
                 <h2 className="text-xl font-black text-white uppercase tracking-tighter">Tactical Command Hub</h2>
                 <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Sovereign Bridge Control</p>
              </div>
           </div>
        </div>

        <div className="p-10 flex-1 space-y-8">
           <div className="grid grid-cols-2 gap-6">
              <button 
                onClick={() => triggerCommand('LOCKOUT')}
                disabled={isProcessing}
                className="group relative bg-rose-600 p-8 rounded-[32px] text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-rose-600/20"
              >
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:rotate-12 transition-all"><Power size={24} /></div>
                 <h3 className="text-lg font-black text-white uppercase leading-none mb-2">Execute Lockout</h3>
                 <p className="text-[10px] font-bold text-white/60 uppercase leading-relaxed">Freeze citizen UI & Biometrics</p>
              </button>

              <button 
                onClick={() => triggerCommand('SIREN')}
                disabled={isProcessing}
                className="group relative bg-amber-500 p-8 rounded-[32px] text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-amber-500/20"
              >
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:rotate-12 transition-all"><Bell size={24} /></div>
                 <h3 className="text-lg font-black text-white uppercase leading-none mb-2">Trigger Siren</h3>
                 <p className="text-[10px] font-bold text-white/60 uppercase leading-relaxed">110dB Audio Countermeasure</p>
              </button>

              <button 
                onClick={() => triggerCommand('SNAPSHOT')}
                disabled={isProcessing}
                className="group relative bg-blue-600 p-8 rounded-[32px] text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-600/20"
              >
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:rotate-12 transition-all"><Camera size={24} /></div>
                 <h3 className="text-lg font-black text-white uppercase leading-none mb-2">Forensic Snapshot</h3>
                 <p className="text-[10px] font-bold text-white/60 uppercase leading-relaxed">Capture evidence from device</p>
              </button>

              <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 flex flex-col justify-center">
                 <div className="flex items-center gap-3 mb-2">
                    <Zap size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Stats</span>
                 </div>
                 <p className="text-2xl font-black text-gray-900 tracking-tighter italic">14ms <span className="text-sm font-bold text-gray-400 uppercase">Latency</span></p>
              </div>
           </div>

           <div className="bg-[#0F172A] rounded-[24px] p-6 font-mono">
              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                 <Terminal size={14} className="text-blue-400" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Handshake Logs</span>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[120px] custom-scrollbar">
                 {logs.map((log, i) => (
                    <p key={i} className="text-[10px] text-blue-300 opacity-80">{log}</p>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* 📱 RIGHT: VIRTUAL CITIZEN PHONE */}
      <div className="w-[400px] flex flex-col items-center justify-center">
         <div className="relative w-[320px] h-[640px] bg-[#1E293B] rounded-[60px] border-[8px] border-gray-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Phone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-gray-900 rounded-b-3xl z-50 flex items-center justify-center gap-2">
               <div className="w-2 h-2 rounded-full bg-gray-800" />
               <div className="w-12 h-1.5 rounded-full bg-gray-800" />
            </div>

            {/* Status Bar */}
            <div className="p-6 pt-10 flex justify-between items-center text-white/60">
               <span className="text-[10px] font-black tracking-widest">11:11</span>
               <div className="flex items-center gap-2">
                  <Wifi size={12} />
                  <Battery size={12} />
               </div>
            </div>

            {/* App Interface */}
            <div className="p-8 flex flex-col h-full relative">
               <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Shield size={20} /></div>
                  <div>
                     <h4 className="text-sm font-black text-white uppercase leading-none">Kavach Mobile</h4>
                     <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-1">Status: Active Track</p>
                  </div>
               </div>

               <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-6 relative">
                     <div className="absolute inset-0 bg-blue-600/10 rounded-full animate-ping" />
                     <ShieldCheck size={48} className="text-blue-500" />
                  </div>
                  <h2 className="text-xl font-black text-white uppercase italic mb-2 tracking-tighter">You Are Safe</h2>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-relaxed">Continuous Satellite <br/> Link Established</p>
               </div>

               {/* 🛡️ OVERRIDE MASK (Visible when command received) */}
               <AnimatePresence>
                  {phoneStatus?.remoteCommand === 'LOCKOUT' && (
                     <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-rose-600 z-[100] flex flex-col items-center justify-center p-10 text-center"
                     >
                        <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center text-white mb-8 animate-pulse">
                           <Lock size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4 leading-tight">Sovereign Command Active</h2>
                        <p className="text-[11px] font-bold text-white/60 uppercase leading-loose">This device is now under <br/> National SuperCell Override. <br/> Do not attempt to bypass.</p>
                     </motion.div>
                  )}
               </AnimatePresence>

               {/* 🔊 SIREN INDICATOR */}
               <AnimatePresence>
                  {phoneStatus?.remoteCommand === 'SIREN' && (
                     <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        exit={{ scale: 0 }}
                        className="absolute top-40 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full z-[90] flex flex-col items-center justify-center"
                     >
                        <div className="absolute inset-0 border-4 border-amber-500 rounded-full animate-ping" />
                        <Bell size={40} className="text-amber-500 animate-bounce" />
                        <span className="mt-4 text-[10px] font-black text-amber-500 uppercase">SIREN ACTIVE</span>
                     </motion.div>
                  )}
               </AnimatePresence>

               {/* 📸 SNAPSHOT INDICATOR */}
               <AnimatePresence>
                  {phoneStatus?.remoteCommand === 'SNAPSHOT' && (
                     <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white z-[110] flex items-center justify-center"
                     >
                        <Camera size={64} className="text-gray-900" />
                        <motion.div 
                           initial={{ opacity: 0 }} 
                           animate={{ opacity: [0, 1, 0] }}
                           transition={{ duration: 0.2 }}
                           className="absolute inset-0 bg-white"
                        />
                     </motion.div>
                  )}
               </AnimatePresence>

               <div className="h-2 w-32 bg-white/10 rounded-full mx-auto mb-6" />
            </div>
         </div>
         <p className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Node: TEST_NODE_001</p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
