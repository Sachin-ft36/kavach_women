import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

export default function SosStatusCard() {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-full px-1"
    >
      <div className="bg-white rounded-2xl p-3 shadow-xl border border-slate-100">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0">
              <ShieldCheck size={16} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                KAVACH Emergency Response System
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                National Safety Network Active
              </p>
            </div>
          </div>
          <div className="px-3 py-2 bg-green-100 rounded-xl flex-shrink-0">
            <span className="text-[10px] font-bold text-green-700">
              ACTIVE
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
