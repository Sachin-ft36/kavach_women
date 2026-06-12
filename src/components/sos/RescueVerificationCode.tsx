import React from 'react';
import { motion } from 'motion/react';
import { Fingerprint } from 'lucide-react';

interface Props {
  handshakeCode: string;
  activeAlertData: any;
}

export default function RescueVerificationCode({ handshakeCode, activeAlertData }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mx-1 bg-white rounded-[28px] border border-[#DCE6F5] shadow-lg px-5 py-6"
    >
      <p className="text-center text-[10px] font-bold tracking-[2px] text-[#64748B] uppercase mb-5">
        Rescue Verification Code
      </p>

      <div className="mx-auto max-w-[250px] bg-[#EDF4FF] rounded-2xl px-4 py-4 flex items-center justify-center gap-4">
        <Fingerprint size={28} className="text-[#2563EB]" strokeWidth={2.2} />
        <span className="text-[44px] font-black tracking-[10px] text-[#0A2E6D] leading-none">
          {handshakeCode || activeAlertData?.verification?.handshakeCode || "----"}
        </span>
      </div>

      <p className="mt-5 text-center text-[11px] leading-6 text-[#64748B] max-w-[280px] mx-auto">
        Provide this code to your verified rescuer to formally close the emergency protocol.
      </p>
    </motion.div>
  );
}
