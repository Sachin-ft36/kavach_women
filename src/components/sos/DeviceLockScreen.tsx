import React from 'react';
import { Lock, Fingerprint } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';

interface Props {
  handleManualUnlock: () => void | Promise<void>;
  setShowPinOverlay: (show: boolean) => void;
}

export default function DeviceLockScreen({ handleManualUnlock, setShowPinOverlay }: Props) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#060000] flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-12">
        <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-accent-blue shadow-2xl">
          <Lock size={48} className="animate-pulse" />
        </div>
      </div>
      <h2 className="text-[44px] font-black italic uppercase tracking-tighter mb-4">{t('shield_locked')}</h2>
      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px] mb-12 opacity-60">{t('identity_verification')}</p>
      <button
        onClick={async () => {
          try {
            await handleManualUnlock();
          } catch (e) {
            setShowPinOverlay(true);
            toast.error("Biometric handshake failed. Fallback to PIN active.");
          }
        }}
        className="px-10 py-5 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-4 active:scale-95 transition-all shadow-2xl"
      >
        <Fingerprint size={20} /> {t('use_biometrics')}
      </button>
    </div>
  );
}
