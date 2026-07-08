import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';
import { useKavachStore } from '../../state/useKavachStore';
import { auth } from '../../firebase';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../../services/KavachNative';

export default function FloatingSOSAnchor() {
  const { setSOSActive, isSOSActive, role, user, profile, gender } = useKavachStore();

  // 🔒 FORCED MALE RULE: Male users are protectors and don't get the Citizen SOS trigger anchor
  const isMale = gender === 'male' || (profile as any)?.gender === 'male';
  const effectiveRole = (isMale && role === 'citizen') ? 'protector' : role;

  if (effectiveRole !== 'citizen' || isSOSActive) return null;

  const triggerEmergencySOS = async () => {
    try {
      const currentUid = auth.currentUser?.uid || user?.uid || localStorage.getItem('kavach_user_uid') || 'GUEST';
      const alertId = `alert_${currentUid}_${Date.now()}`;
      
      await setSOSActive(true, alertId, 'button');
      
      if (Capacitor.isNativePlatform()) {
        KavachSafe.triggerHapticPulse().catch(() => {});
      }
    } catch (e) {
      console.error('Failed to trigger SOS from floating anchor:', e);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed right-6 bottom-44 z-[999999]"
    >
      <button
        onClick={triggerEmergencySOS}
        className="relative w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_4px_20px_rgba(220,38,38,0.4)] active:scale-95 transition-all border-4 border-white overflow-hidden group cursor-pointer"
      >

        
        {/* Shield Alert Icon */}
        <ShieldAlert size={24} className="relative z-10  text-white" />
      </button>
    </motion.div>
  );
}
