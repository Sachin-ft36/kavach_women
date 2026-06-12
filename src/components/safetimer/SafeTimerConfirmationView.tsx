import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
  showConfirmation: boolean;
  setShowConfirmation: (show: boolean) => void;
  startTimer: () => void;
}

export default function SafeTimerConfirmationView({
  showConfirmation, setShowConfirmation, startTimer
}: Props) {
  return (
    <AnimatePresence>
      {showConfirmation && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-[#121214] border border-white/10 rounded-[32px] p-8 space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-accent-red/10 border border-accent-red/20 mx-auto flex items-center justify-center mb-2">
              <AlertCircle className="text-accent-red" size={24} />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-white italic tracking-tight">KAVACH OFFLINE TRACKING</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                Please read the rules carefully
              </p>
            </div>

            <div className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-[20px]">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">1</div>
                <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                  Even if you close the app, the timer will keep running natively in the background.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">2</div>
                <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                  If time ends, <span className="text-emerald-500 font-bold">Phase 1</span> begins: App opens and asks for your PIN. You get a 5-minute grace period to confirm safety or extend time.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">3</div>
                <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                  <span className="text-amber-500 font-bold">Phase 1.5:</span> If no response after 5 minutes, your live location is sent via SMS and an auto-call is made to your guardian.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-accent-red/20 text-accent-red flex items-center justify-center text-[10px] font-black mt-0.5 shrink-0">4</div>
                <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                  <span className="text-accent-red font-bold">Phase 2:</span> If not turned off within 30 minutes after the guardian alert, a <span className="font-bold">Full SOS Alarm</span> is triggered automatically.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button 
                onClick={startTimer}
                className="w-full py-4 bg-accent-red text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent-red/20 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} /> I Understand, Start Timer
              </button>
              <button 
                onClick={() => setShowConfirmation(false)}
                className="w-full py-4 bg-white/5 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
