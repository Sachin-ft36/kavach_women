import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X } from 'lucide-react';

interface PcrAuthModalProps {
  isOpen: boolean;
  passcode: string;
  setPasscode: (val: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function PcrAuthModal({ isOpen, passcode, setPasscode, onSubmit, onCancel }: PcrAuthModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-sm bg-white rounded-md p-6 shadow-2xl relative border-2 border-[#000080]"
          >
            <button onClick={onCancel} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-sm">
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center space-y-3 mb-6">
              <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-sm flex items-center justify-center text-red-700 mb-1">
                <Lock size={28} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#000080] tracking-widest uppercase">Restricted Clearance</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Enter Department Passcode to proceed.</p>
              </div>
            </div>

            <div className="space-y-4">
              <input 
                type="password" 
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="AUTHORIZATION CODE"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-sm outline-none focus:border-[#000080] focus:bg-blue-50/30 font-mono font-bold text-center tracking-[0.3em] text-sm uppercase placeholder:tracking-widest placeholder:text-xs"
              />
              <button 
                onClick={onSubmit}
                className="w-full py-3.5 bg-[#000080] text-white rounded-sm font-black uppercase tracking-widest text-[11px] active:scale-[0.98] transition-all"
              >
                Verify Clearance
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
