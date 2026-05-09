import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, User, Shield, Zap, Radio } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import { cn } from '../lib/utils';

export const TacticalCallOverlay: React.FC = () => {
  const { callState, callerName, answerCall, declineCall, hangupCall, activeCallUserId } = useCall();

  if (callState === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed inset-x-0 top-0 z-[20000] p-4 lg:p-8 flex justify-center pointer-events-none"
      >
        <div className="w-full max-w-md bg-[#0a0a0f]/90 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden relative">
          {/* Background Signal Pulse */}
          <div className="absolute inset-0 bg-accent-blue/5 animate-pulse pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-blue/50 to-transparent" />

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent-blue animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[4px] text-accent-blue italic">KAVACH_SIGNAL: {callState.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-gray-600" />
              <span className="text-[8px] font-mono font-bold text-gray-600 uppercase tracking-widest">End-to-End Encrypted</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 mb-10">
            <div className="relative">
              <div className="absolute inset-0 bg-accent-blue blur-2xl opacity-20 animate-pulse rounded-full" />
              <div className="w-24 h-24 bg-black border-2 border-white/5 rounded-full flex items-center justify-center relative z-10 overflow-hidden shadow-2xl">
                <User size={48} className="text-gray-700" />
                {callState === 'connected' && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    className="absolute bottom-0 left-0 w-full bg-accent-blue/10 animate-pulse" 
                  />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#0a0a0f] border border-white/10 rounded-2xl flex items-center justify-center shadow-xl">
                 <Radio size={20} className={cn("text-accent-blue", callState === 'connected' ? "animate-spin-slow" : "animate-pulse")} />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">{callerName || 'Anonymous Operative'}</h2>
              <p className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-[4px]">UID: {activeCallUserId?.slice(-12).toUpperCase() || 'NODE_HANDSHAKE'}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            {callState === 'ringing' ? (
              <>
                <button
                  onClick={declineCall}
                  className="w-16 h-16 bg-accent-red/10 border border-accent-red/20 rounded-full flex items-center justify-center text-accent-red hover:bg-accent-red hover:text-white transition-all shadow-xl group"
                >
                  <PhoneOff size={28} className="group-hover:rotate-12 transition-transform" />
                </button>
                <button
                  onClick={answerCall}
                  className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-black hover:bg-white transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-bounce-slow"
                >
                  <Phone size={32} />
                </button>
              </>
            ) : (
              <button
                onClick={hangupCall}
                className="w-20 h-20 bg-accent-red rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-[0_0_30px_rgba(255,0,0,0.3)]"
              >
                <PhoneOff size={32} />
              </button>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex justify-center gap-8">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                <Zap size={14} />
              </div>
              <span className="text-[7px] font-black uppercase text-gray-600 tracking-widest">Low Latency</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                <Shield size={14} />
              </div>
              <span className="text-[7px] font-black uppercase text-gray-600 tracking-widest">Masked Link</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
