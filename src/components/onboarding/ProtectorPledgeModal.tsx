import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

interface ProtectorPledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ProtectorPledgeModal({ isOpen, onClose, onConfirm }: ProtectorPledgeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[40px] p-8 sm:p-10 shadow-2xl border border-white"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                <ShieldCheck size={40} strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Protector's Pledge</h2>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[3px]">Institutional Enrollment</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-100">
                <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase tracking-wider">
                  As a member of the <span className="text-gray-900">Kavach Protector Grid</span>, you pledge to assist fellow citizens in distress, maintain the highest standards of integrity, and respond to tactical alerts within your sector.
                </p>
              </div>
              <div className="w-full space-y-3 pt-4">
                <button
                  onClick={onConfirm}
                  className="w-full py-5 bg-blue-600 text-white rounded-[24px] text-xs font-black uppercase tracking-[4px] shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                >
                  Confirm Enrollment
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-5 bg-gray-50 text-gray-400 rounded-[24px] text-xs font-black uppercase tracking-[4px] hover:bg-gray-100 transition-all"
                >
                  Not Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
