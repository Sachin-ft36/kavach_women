import React, { useState } from 'react';
import { Phone, Clock, Zap, X, ChevronRight, User, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useKavachStore } from '../store/useKavachStore';
import { toast } from 'sonner';

export default function FakeCallModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { setFakeCallActive } = useKavachStore();
  const [isScheduling, setIsScheduling] = useState(false);

  const triggerCall = (delay: number = 0) => {
    if (delay === 0) {
      setFakeCallActive(true);
      onClose();
    } else {
      toast.info(`SCHEDULING CALL IN ${delay} SECONDS...`);
      setTimeout(() => {
        setFakeCallActive(true);
      }, delay * 1000);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
      />

      <motion.div 
        initial={{ y: 100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: 100, opacity: 0 }}
        className="relative w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
        
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="w-16 h-16 rounded-[24px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
             <Phone size={32} />
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all">
             <X size={24} />
          </button>
        </div>

        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 mb-2 leading-none relative z-10">Fake Call Hub</h2>
        <p className="text-[10px] text-amber-500 font-black uppercase tracking-[4px] mb-10 relative z-10">Immediate Escape Protocol</p>

        <div className="grid grid-cols-1 gap-4 mb-10">
          <button 
            onClick={() => triggerCall(0)}
            className="group flex items-center justify-between p-6 bg-amber-500 rounded-[32px] text-white shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
             <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                   <Zap size={24} />
                </div>
                <div className="text-left">
                   <span className="block text-[14px] font-black uppercase tracking-widest italic leading-none">Instant Call</span>
                   <span className="block text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">Trigger Now</span>
                </div>
             </div>
             <ChevronRight size={20} className="opacity-40" />
          </button>

          <div className="p-6 bg-gray-50 border border-gray-100 rounded-[32px] space-y-6">
             <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                   <Clock size={24} />
                </div>
                <div className="text-left">
                   <span className="block text-[14px] font-black uppercase tracking-widest italic leading-none text-gray-900">Schedule Call</span>
                   <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">Set Escape Timer</span>
                </div>
             </div>

             <div className="grid grid-cols-4 gap-3">
                {[10, 30, 60, 300].map((sec) => (
                  <button 
                    key={sec}
                    onClick={() => triggerCall(sec)}
                    className="py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-900 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm"
                  >
                    {sec >= 60 ? `${sec/60}m` : `${sec}s`}
                  </button>
                ))}
             </div>

             {/* 📟 MULTI-UNIT CUSTOM TIMER */}
             <div className="pt-4 flex flex-col gap-3">
                <div className="flex gap-2">
                   <input 
                     type="number"
                     placeholder="Duration..."
                     id="customValue"
                     className="flex-1 bg-white border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:border-amber-500/50 transition-all"
                   />
                   <select 
                     id="customUnit"
                     className="px-4 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none"
                   >
                      <option value="1">Sec</option>
                      <option value="60">Min</option>
                      <option value="3600">Hr</option>
                   </select>
                </div>
                <button 
                  onClick={() => {
                    const elVal = document.getElementById('customValue') as HTMLInputElement;
                    const elUnit = document.getElementById('customUnit') as HTMLSelectElement;
                    const val = parseInt(elVal.value);
                    const unit = parseInt(elUnit.value);
                    if (val > 0) triggerCall(val * unit);
                    else toast.error("Enter a valid duration");
                  }}
                  className="w-full py-4 bg-gray-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[4px] italic hover:bg-amber-500 transition-all shadow-lg"
                >
                  Confirm Safe Call
                </button>
             </div>
          </div>
        </div>

        <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[32px] flex items-center gap-4">
           <div className="relative">
              <ShieldCheck size={20} className="text-amber-500" />
              <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-20" />
           </div>
           <div className="text-left">
              <p className="text-[9px] text-amber-700 font-black uppercase tracking-widest leading-none">Safety Background Sync Active</p>
              <p className="text-[7px] text-amber-600/60 font-bold uppercase tracking-wider mt-1.5">Call will trigger even if phone is locked or app is closed.</p>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
