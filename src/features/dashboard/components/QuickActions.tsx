import React, { useState } from 'react';
import { ShieldCheck, Car, PhoneCall, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QuickActionsProps {
  isNight: boolean;
  safetyMode: string;
  setIsRideSafeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFakeCallHubOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSafeTimerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAllToolsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOverlay: (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => void;
}

export const QuickActions = ({
  isNight,
  safetyMode,
  setIsRideSafeOpen,
  setIsFakeCallHubOpen,
  setIsSafeTimerOpen,
  setIsAllToolsOpen,
  toggleOverlay
}: QuickActionsProps) => {
  const [isSafeClicked, setIsSafeClicked] = useState(false);

  const handleSafeClick = () => {
    setIsSafeClicked(true);
    setTimeout(() => {
      toast.success("Safety Check-in Sent successfully");
      setTimeout(() => setIsSafeClicked(false), 2000);
    }, 600);
  };

  if (safetyMode !== 'personal') return null;

  return (
    <div className={`w-full rounded-[24px] py-3 px-4 flex flex-row items-center justify-between border ${isNight ? 'bg-[#0a0518]/90 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]' : 'bg-[#FFF8F1]/90 backdrop-blur-md border-white/45 shadow-[0_14px_45px_rgba(255,170,120,0.12)]'}`}>

      {/* 1. I'M SAFE */}
      <div onClick={handleSafeClick} className={`flex flex-col items-center flex-1 cursor-pointer transition-all ${isSafeClicked ? 'scale-110 drop-shadow-[0_0_15px_rgba(0,255,102,0.5)]' : 'active:scale-95'}`}>
        <div className={`relative w-[48px] h-[48px] rounded-full flex items-center justify-center ${isNight ? 'border border-[#00ff66]/20 shadow-[0_0_15px_rgba(0,255,102,0.15)]' : 'border border-[#00ff66]/10'}`}>
          {isSafeClicked && <div className="absolute inset-0 rounded-full bg-[#00ff66]/30 animate-[ping_0.6s_ease-out_forwards]" />}
          <div className={`rounded-full flex items-center justify-center transition-colors duration-300 ${isSafeClicked ? 'w-[44px] h-[44px] bg-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.8)]' : isNight ? 'w-[42px] h-[42px] bg-[#00ff66]/10 border border-[#00ff66]/40 shadow-[inset_0_0_8px_rgba(0,255,102,0.3)]' : 'w-[44px] h-[44px] bg-[#e6f4ea]'}`}>
            {isSafeClicked ? <CheckCircle size={24} className="text-white" /> : <ShieldCheck size={20} className={isNight ? "text-[#00ff66]" : "text-green-600"} />}
          </div>
        </div>
        <span className={`text-[8.5px] tracking-wide uppercase mt-2 ${isNight ? 'text-white font-semibold drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]' : 'text-gray-900 font-extrabold'}`}>
          {isSafeClicked ? 'Sent!' : "I'm Safe"}
        </span>
        <span className={`text-[6.5px] font-normal mt-0.5 ${isNight ? 'text-white/60' : 'text-gray-500'}`}>
          {isSafeClicked ? 'Family notified' : 'Update status'}
        </span>
      </div>

      {/* Divider */}
      <div className={`w-[1px] h-14 ${isNight ? 'bg-white/5' : 'bg-gray-200/50'} rounded-full mx-0.5`} />

      {/* 2. RIDE SAFE */}
      <div onClick={() => toggleOverlay(setIsRideSafeOpen, true)} className="flex flex-col items-center flex-1 cursor-pointer active:scale-95 transition-transform">
        <div className={`w-[48px] h-[48px] rounded-full flex items-center justify-center ${isNight ? 'border border-[#3b82f6]/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : ''}`}>
          <div className={`rounded-full flex items-center justify-center ${isNight ? 'w-[42px] h-[42px] bg-[#3b82f6]/10 border border-[#3b82f6]/40 shadow-[inset_0_0_8px_rgba(59,130,246,0.3)]' : 'w-[44px] h-[44px] bg-[#eff6ff]'}`}>
            <Car size={20} className={isNight ? "text-[#3b82f6]" : "text-blue-600"} />
          </div>
        </div>
        <span className={`text-[8.5px] tracking-wide uppercase mt-2 ${isNight ? 'text-white font-semibold drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]' : 'text-gray-900 font-extrabold'}`}>Ride Safe</span>
        <span className={`text-[6.5px] font-normal mt-0.5 ${isNight ? 'text-white/60' : 'text-gray-500'}`}>Track your ride</span>
      </div>

      {/* Divider */}
      <div className={`w-[1px] h-14 ${isNight ? 'bg-white/5' : 'bg-gray-200/50'} rounded-full mx-0.5`} />

      {/* 3. FAKE CALL */}
      <div onClick={() => toggleOverlay(setIsFakeCallHubOpen, true)} className="flex flex-col items-center flex-1 cursor-pointer active:scale-95 transition-transform">
        <div className={`w-[48px] h-[48px] rounded-full flex items-center justify-center ${isNight ? 'border border-[#d946ef]/20 shadow-[0_0_15px_rgba(217,70,239,0.15)]' : ''}`}>
          <div className={`rounded-full flex items-center justify-center ${isNight ? 'w-[42px] h-[42px] bg-[#d946ef]/10 border border-[#d946ef]/40 shadow-[inset_0_0_8px_rgba(217,70,239,0.3)]' : 'w-[44px] h-[44px] bg-[#f3e8ff]'}`}>
            <PhoneCall size={20} className={isNight ? "text-[#d946ef]" : "text-purple-600"} />
          </div>
        </div>
        <span className={`text-[8.5px] tracking-wide uppercase mt-2 ${isNight ? 'text-white font-semibold drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]' : 'text-gray-900 font-extrabold'}`}>Fake Call</span>
        <span className={`text-[6.5px] font-normal mt-0.5 ${isNight ? 'text-white/60' : 'text-gray-500'}`}>Instant call</span>
      </div>

      {/* Divider */}
      <div className={`w-[1px] h-14 ${isNight ? 'bg-white/5' : 'bg-gray-200/50'} rounded-full mx-0.5`} />

      {/* 4. TIMER */}
      <div onClick={() => toggleOverlay(setIsSafeTimerOpen, true)} className="flex flex-col items-center flex-1 cursor-pointer active:scale-95 transition-transform">
        <div className={`w-[48px] h-[48px] rounded-full flex items-center justify-center ${isNight ? 'border border-[#f97316]/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : ''}`}>
          <div className={`rounded-full flex items-center justify-center ${isNight ? 'w-[42px] h-[42px] bg-[#f97316]/10 border border-[#f97316]/40 shadow-[inset_0_0_8px_rgba(249,115,22,0.3)]' : 'w-[44px] h-[44px] bg-[#fff7ed]'}`}>
            <Clock size={20} className={isNight ? "text-[#f97316]" : "text-orange-500"} />
          </div>
        </div>
        <span className={`text-[8.5px] tracking-wide uppercase mt-2 ${isNight ? 'text-white font-semibold drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]' : 'text-gray-900 font-extrabold'}`}>Timer</span>
        <span className={`text-[6.5px] font-normal mt-0.5 ${isNight ? 'text-white/60' : 'text-gray-500'}`}>Set safety timer</span>
      </div>

      {/* Divider */}
      <div className={`w-[1px] h-14 ${isNight ? 'bg-white/5' : 'bg-gray-200/50'} rounded-full mx-0.5`} />

      {/* 5. MORE */}
      <div onClick={() => setIsAllToolsOpen(true)} className="flex flex-col items-center flex-1 cursor-pointer active:scale-95 transition-transform">
        <div className={`w-[48px] h-[48px] rounded-full flex items-center justify-center ${isNight ? 'border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : ''}`}>
          <div className={`rounded-full flex items-center justify-center ${isNight ? 'w-[42px] h-[42px] bg-white/5 border border-white/20' : 'w-[44px] h-[44px] bg-[#f3f4f6]'}`}>
            <div className="flex gap-[3px]">
              <div className={`w-1.5 h-1.5 rounded-full ${isNight ? 'bg-white/80' : 'bg-gray-600'}`} />
              <div className={`w-1.5 h-1.5 rounded-full ${isNight ? 'bg-white/80' : 'bg-gray-600'}`} />
              <div className={`w-1.5 h-1.5 rounded-full ${isNight ? 'bg-white/80' : 'bg-gray-600'}`} />
            </div>
          </div>
        </div>
        <span className={`text-[8.5px] tracking-wide uppercase mt-2 ${isNight ? 'text-white font-semibold drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]' : 'text-gray-900 font-extrabold'}`}>More</span>
        <span className={`text-[6.5px] font-normal mt-0.5 ${isNight ? 'text-white/60' : 'text-gray-500'}`}>More tools</span>
      </div>

    </div>
  );
};
