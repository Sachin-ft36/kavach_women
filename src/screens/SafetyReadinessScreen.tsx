import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  Share2, 
  ShieldCheck, 
  Users, 
  MapPin, 
  Smartphone, 
  CalendarCheck, 
  Lock, 
  ChevronRight,
  CheckCircle2,
  Radio,
  Bell,
  MessageSquare
} from 'lucide-react';
import { useKavachStore } from '../state/useKavachStore';
import { useTimeTheme } from '../hooks/useTimeTheme';
import { auth } from '../firebase';
import { toast } from 'sonner';
import SafetyCoverageDetailScreen, { CoverageType } from './SafetyCoverageDetailScreen';

export default function SafetyReadinessScreen() {
  const [isAnimated, setIsAnimated] = useState(false);
  const [activeCoverage, setActiveCoverage] = useState<CoverageType | null>(null);
  const { setActiveTab, guardianCache, safetyPin, isVoiceTriggerActive, userPos, profile, activeTab } = useKavachStore();
  const { timeOfDay } = useTimeTheme();
  const isNight = timeOfDay === 'night';

  // Force activeCoverage to reset to null when tab changes to dashboard or safety_readiness
  useEffect(() => {
    if (activeTab === 'safety_readiness') {
      setActiveCoverage(null);
    }
  }, [activeTab]);

  // ── Real data ──
  const user = auth.currentUser;
  const hasPhone = !!(profile?.phoneNumber || profile?.phone || user?.phoneNumber);
  const emailVerified = user?.emailVerified ?? false;
  const hasTwoStep = hasPhone && emailVerified; // verified state logic
  const isVerified = profile?.isVerified || profile?.account_status === 'VERIFIED';

  const activeContacts = useMemo(() => (
    (guardianCache || []).filter((g: any) => {
      return g.status === 'accepted' || g.accepted === true || g.isVerified === true || g.uid;
    })
  ), [guardianCache]);

  const hasLocation = !!(userPos?.lat && userPos?.lng);
  const hasPin = !!safetyPin;
  const overlayGranted = profile?.os_lifelines?.overlay_granted ?? false;
  const batteryExempt = profile?.os_lifelines?.battery_exempt ?? false;

  // ── Score per category (0–100) ──
  const accountScore = Math.round((
    (hasPhone ? 1 : 0) + (emailVerified ? 1 : 0) + 1 + (hasTwoStep ? 1 : 0) + (isVerified ? 1 : 0)
  ) / 5 * 100);

  const emergencyScore = Math.round((
    1 + (hasPin ? 1 : 0) + (isVoiceTriggerActive ? 1 : 0) + (overlayGranted ? 1 : 0) + (profile?.address ? 1 : 0)
  ) / 5 * 100);

  const contactsScore = Math.min(100, Math.round((activeContacts.length / 5) * 100));
  const locationScore = hasLocation ? 100 : 0;
  
  // Device protections include overlay, battery optimization, and static camera/mic permissions
  const deviceScore = Math.round((
    (overlayGranted ? 1 : 0) + (batteryExempt ? 1 : 0) + 1
  ) / 3 * 100);

  // ── Overall score ──
  const overallScore = Math.round((accountScore + emergencyScore + contactsScore + locationScore + deviceScore) / 5);
  const optimizedScore = 100;

  // Completed measures count
  const completedMeasures = Math.round((
    (hasPhone ? 1 : 0) + (emailVerified ? 1 : 0) + (hasTwoStep ? 1 : 0) + (isVerified ? 1 : 0) +
    (hasPin ? 1 : 0) + (isVoiceTriggerActive ? 1 : 0) + (overlayGranted ? 1 : 0) +
    (activeContacts.length >= 1 ? 1 : 0) + (hasLocation ? 1 : 0) + (batteryExempt ? 1 : 0)
  ));

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = () => {
    const msg = `My Kavach safety readiness score is ${overallScore}%. Download the Kavach app to stay protected!`;
    if (navigator.share) {
      navigator.share({ title: 'Kavach Safety Score', text: msg, url: window.location.href }).catch(console.log);
    } else {
      navigator.clipboard.writeText(msg);
      toast.success('Safety score copied to clipboard!');
    }
  };

  if (activeCoverage) {
    return (
      <SafetyCoverageDetailScreen
        coverageType={activeCoverage}
        onBack={() => setActiveCoverage(null)}
      />
    );
  }

  // Styled visual components
  const bgMain = isNight ? 'bg-[#080713]' : 'bg-[#F7F6FC]';
  const textTitle = isNight ? 'text-white' : 'text-[#1B1238]';
  const textSub = isNight ? 'text-slate-300' : 'text-[#4A3F6C]';
  const textMuted = isNight ? 'text-white/50' : 'text-[#81759C]';
  const bgCard = isNight 
    ? 'bg-[#0F0D1D] border-white/5 shadow-[0_16px_40px_rgba(0,0,0,0.4)]' 
    : 'bg-white border-[#E7E3F3] shadow-[0_16px_40px_rgba(168,85,247,0.05)]';
  const bgInner = isNight ? 'bg-[#1E1B4B]/30 border-white/5' : 'bg-[#F2EFFB]/90 border-[#E1DCEF]/80';
  const strokeTrack = isNight ? 'rgba(255, 255, 255, 0.05)' : '#E7E3F3';
  const buttonShare = isNight 
    ? 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]' 
    : 'border-[#A855F7]/25 bg-white text-[#A855F7] hover:bg-[#A855F7]/5 shadow-sm';

  return (
    <div className={`w-full min-h-screen relative overflow-hidden pb-32 transition-colors duration-500 ${bgMain}`}
      style={isNight ? { background: 'linear-gradient(180deg, #120B25 0%, #080713 100%)' } : {}}
    >
      {/* Decorative Orbs */}
      <div className={`absolute top-0 right-0 w-72 h-72 blur-[100px] rounded-full pointer-events-none ${isNight ? 'bg-[#7C4DFF]/10' : 'bg-purple-500/5'}`}></div>
      <div className={`absolute bottom-20 left-0 w-80 h-80 blur-[120px] rounded-full pointer-events-none ${isNight ? 'bg-emerald-600/5' : 'bg-emerald-500/3'}`}></div>

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-5 pt-6">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`p-3 rounded-full border flex items-center justify-center cursor-pointer active:scale-90 transition-all ${
            isNight 
              ? 'bg-[#0F0D1D] border-white/10 text-white hover:bg-white/[0.04]' 
              : 'bg-white border-[#E7E3F3] text-[#1B1238] hover:bg-[#F2EFFB] shadow-sm'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 ml-4 text-left">
          <h1 className={`font-black text-[14px] tracking-wider uppercase leading-none ${textTitle}`}>SAFETY READINESS</h1>
          <p className={`text-[10px] mt-1.5 font-bold ${textMuted}`}>Your safety status &amp; optimization</p>
        </div>
        <button 
          onClick={handleShare}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${buttonShare}`}
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>

      {/* HERO CIRCULAR SCORE CARD */}
      <div className={`mx-5 mt-6 p-5 rounded-[24px] border backdrop-blur-md relative overflow-hidden transition-all duration-300 ${bgCard}`}>
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-[#00FF87]/5 blur-[25px] rounded-full"></div>
        
        <div className="flex items-center gap-5 relative z-10">
          {/* Circular Progress Layout */}
          <div className="relative w-[130px] h-[130px] flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#00FF87" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="none" stroke={strokeTrack} strokeWidth="6" />
              <circle 
                cx="50" cy="50" r="42" 
                fill="none" 
                stroke="url(#scoreGrad)" 
                strokeWidth="6" 
                strokeDasharray="264" 
                strokeDashoffset={isAnimated ? `${264 - (264 * overallScore / 100)}` : '264'} 
                strokeLinecap="round" 
                className="transition-all duration-1000 ease-out"
                style={{ transitionDelay: '200ms' }}
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
              <ShieldCheck className="w-[18px] h-[18px] text-[#A855F7] fill-[#A855F7]/10 mb-0.5" />
              <span className={`text-[28px] font-black tracking-tight leading-none mb-1 ${textTitle}`}>{overallScore}%</span>
              <span className="text-[8px] font-extrabold tracking-wider" style={{ color: overallScore >= 80 ? (isNight ? '#00FF87' : '#0A7C3F') : overallScore >= 60 ? '#FF8C00' : '#FF5A5F' }}>
                {overallScore >= 80 ? 'PROTECTED' : overallScore >= 60 ? 'MODERATE' : 'AT RISK'}
              </span>
            </div>
          </div>

          {/* Text and stats side */}
          <div className="flex flex-col text-left justify-center flex-1">
            <h2 className="font-black text-[12px] tracking-wide leading-tight mb-1.5" style={{ color: isNight ? '#00FF87' : '#0A7C3F' }}>
              {overallScore >= 80 ? 'Excellent Protection!' : overallScore >= 60 ? 'Good protection — improve it!' : 'Action required to secure account.'}
            </h2>
            <p className={`text-[10px] leading-relaxed mb-3.5 font-medium ${textSub}`}>
              You've completed <span className="text-[#A855F7] font-black">{completedMeasures}</span> out of 10 safety checkpoints.
            </p>
            
            <div className={`flex gap-2 items-center border rounded-2xl p-2.5 shadow-inner ${bgInner}`}>
              <ShieldCheck className="w-4 h-4 text-[#A855F7] flex-shrink-0" />
              <p className={`text-[9px] font-bold leading-normal ${textMuted}`}>Your devices are actively guarded by Kavach Shield Engine.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SAFETY COVERAGE BLOCK */}
      <div className="mt-7 mx-5 text-left">
        <p className={`text-[10px] font-extrabold tracking-widest mb-3 px-1 uppercase ${textMuted}`}>SAFETY COVERAGE</p>
        <div className={`border rounded-[24px] p-2.5 flex flex-col gap-2.5 backdrop-blur-sm transition-all duration-300 ${isNight ? 'bg-[#0F0D1D] border-white/5 shadow-[0_16px_40px_rgba(0,0,0,0.4)]' : 'bg-white border-[#E7E3F3] shadow-[0_12px_40px_rgba(0,0,0,0.02)]'}`}>
          
          <CoverageItem 
            icon={<ShieldCheck className="w-4 h-4 text-[#00FF87]" />}
            iconBg="rgba(0, 255, 135, 0.1)"
            title="Account Security"
            progress={accountScore}
            barColor="#00FF87"
            status={accountScore === 100 ? 'Complete' : `${accountScore}%`}
            statusColor={isNight ? '#00FF87' : '#0A7C3F'}
            isComplete={accountScore === 100}
            isNight={isNight}
            onClick={() => setActiveCoverage('account')}
          />
          <CoverageItem 
            icon={<Radio className="w-4 h-4 text-[#FF5A5F]" />}
            iconBg="rgba(255, 90, 95, 0.1)"
            title="Emergency Setup"
            progress={emergencyScore}
            barColor="#FF8C00"
            status={emergencyScore === 100 ? 'Complete' : `${emergencyScore}%`}
            statusColor={emergencyScore === 100 ? (isNight ? '#00FF87' : '#0A7C3F') : '#FF8C00'}
            isComplete={emergencyScore === 100}
            isNight={isNight}
            onClick={() => setActiveCoverage('emergency')}
          />
          <CoverageItem 
            icon={<Users className="w-4 h-4 text-[#B872FF]" />}
            iconBg="rgba(184, 114, 255, 0.1)"
            title="Trusted Contacts"
            progress={contactsScore}
            barColor="#B872FF"
            status={contactsScore === 100 ? 'Complete' : `${contactsScore}%`}
            statusColor={contactsScore === 100 ? (isNight ? '#00FF87' : '#0A7C3F') : '#B872FF'}
            isComplete={contactsScore === 100}
            isNight={isNight}
            onClick={() => setActiveCoverage('contacts')}
          />
          <CoverageItem 
            icon={<MapPin className="w-4 h-4 text-[#3A86FF]" />}
            iconBg="rgba(58, 134, 255, 0.1)"
            title="Location Safety"
            progress={locationScore}
            barColor="#3A86FF"
            status={locationScore === 100 ? 'Complete' : `${locationScore}%`}
            statusColor={locationScore === 100 ? '#3A86FF' : '#FF8C00'}
            isComplete={locationScore === 100}
            isNight={isNight}
            onClick={() => setActiveCoverage('location')}
          />
          <CoverageItem 
            icon={<Smartphone className="w-4 h-4 text-[#48CAE4]" />}
            iconBg="rgba(72, 202, 228, 0.1)"
            title="Device Protection"
            progress={deviceScore}
            barColor="#48CAE4"
            status={deviceScore === 100 ? 'Complete' : `${deviceScore}%`}
            statusColor={deviceScore === 100 ? (isNight ? '#00FF87' : '#0A7C3F') : '#48CAE4'}
            isComplete={deviceScore === 100}
            isNight={isNight}
            onClick={() => setActiveCoverage('device')}
          />

        </div>
      </div>

      {/* IMPROVE PROTECTION BLOCK */}
      {(activeContacts.length < 3 || !isVoiceTriggerActive || !hasPin) && (
        <div className="mt-7 mx-5 text-left animate-fade-in">
          <p className={`text-[10px] font-extrabold tracking-widest mb-3 px-1 uppercase ${textMuted}`}>IMPROVE PROTECTION</p>
          <div className={`border rounded-[24px] flex flex-col backdrop-blur-sm overflow-hidden transition-all duration-300 ${
            isNight ? 'bg-[#0F0D1D] border-white/5 shadow-[0_16px_40px_rgba(0,0,0,0.4)]' : 'bg-white border-[#E7E3F3] shadow-[0_12px_40px_rgba(0,0,0,0.02)]'
          }`}>
            
            {activeContacts.length < 3 && (
              <ActionItem 
                icon={<Users className="w-5 h-5 text-[#B872FF]" />}
                iconBg="rgba(184, 114, 255, 0.1)"
                title="Link and Invite Circle Contact"
                subtitle={`You have ${activeContacts.length}/3 active guardians. Add more to maximize coverages.`}
                time="2 min"
                onClick={() => setActiveCoverage('contacts')}
                isNight={isNight}
                showBorder={!isVoiceTriggerActive || !hasPin}
              />
            )}
            
            {!isVoiceTriggerActive && (
              <ActionItem 
                icon={<Radio className="w-5 h-5 text-[#FF5A5F]" />}
                iconBg="rgba(255, 90, 95, 0.1)"
                title="Enable Voice Trigger Activation"
                subtitle="Set word triggers for hands-free help alert"
                time="1 min"
                onClick={() => setActiveCoverage('emergency')}
                isNight={isNight}
                showBorder={!hasPin}
              />
            )}
            
            {!hasPin && (
              <ActionItem 
                icon={<CalendarCheck className="w-5 h-5 text-[#FF8C00]" />}
                iconBg="rgba(255, 140, 0, 0.1)"
                title="Register Emergency Medical PIN"
                subtitle="Configure 4-digit code to bypass screen"
                time="1 min"
                onClick={() => setActiveCoverage('emergency')}
                isNight={isNight}
                showBorder={false}
              />
            )}

          </div>
        </div>
      )}

      {/* OPTIMIZATION COMPARISON BOARD */}
      <div className={`mt-7 mx-5 p-5 rounded-[24px] border backdrop-blur-sm transition-all duration-300 ${
        isNight ? 'bg-[#0F0D1D] border-white/5 shadow-[0_16px_40px_rgba(0,0,0,0.4)]' : 'bg-white border-[#E7E3F3] shadow-[0_12px_40px_rgba(0,0,0,0.02)]'
      }`}>
        <div className="flex justify-between items-center">
          
          {/* Left Column */}
          <div className="w-[42%] text-left">
            <p className={`text-[8.5px] font-extrabold uppercase tracking-wider mb-3.5 leading-tight h-[24px] ${textMuted}`}>CURRENT READINESS</p>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full flex items-center justify-center border transition-all ${
                isNight ? 'bg-white/[0.03] border-white/10' : 'bg-purple-50 border-[#8B5CF6]/10'
              } shadow-sm`}>
                <ShieldCheck className="w-4 h-4 text-[#A855F7] fill-[#A855F7]/10" />
              </div>
              <span className="text-[26px] font-black text-[#A855F7] tracking-tight leading-none">{overallScore}%</span>
            </div>
            <div className={`h-1.5 w-[90%] rounded-full mt-4 overflow-hidden ${isNight ? 'bg-[#1C1B38]' : 'bg-[#E7E3F3]'}`}>
              <div 
                className="h-full bg-[#A855F7] rounded-full transition-all duration-1000 ease-out"
                style={{ width: isAnimated ? `${overallScore}%` : '0%' }}
              ></div>
            </div>
          </div>

          {/* Center Arrows */}
          <div className="flex-1 flex justify-center items-center gap-0.5 text-purple-400/60 font-black text-lg select-none">
            <span className="arrow-anim-1">&gt;</span>
            <span className="arrow-anim-2">&gt;</span>
            <span className="arrow-anim-3">&gt;</span>
          </div>

          {/* Right Column */}
          <div className="w-[42%] text-left pl-2">
            <p className={`text-[8.5px] font-extrabold uppercase tracking-wider mb-3.5 leading-tight h-[24px] ${textMuted}`}>OPTIMIZED READINESS</p>
            <div className="flex items-center justify-between w-full">
              <span className="text-[26px] font-black tracking-tight leading-none" style={{ color: isNight ? '#00FF87' : '#0A7C3F' }}>{optimizedScore}%</span>
              <div className={`p-2 rounded-full flex items-center justify-center border transition-all ${
                isNight ? 'bg-white/[0.03] border-white/10' : 'bg-emerald-50 border-[#0A7C3F]/10'
              } shadow-sm`}>
                <ShieldCheck className="w-4 h-4 fill-current" style={{ color: isNight ? '#00FF87' : '#0A7C3F' }} />
              </div>
            </div>
            <div className={`h-1.5 w-[90%] rounded-full mt-4 overflow-hidden ${isNight ? 'bg-[#1C1B38]' : 'bg-[#E7E3F3]'}`}>
              <div 
                className="h-full bg-[#00FF87] rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: isAnimated ? `${optimizedScore}%` : '0%',
                  transitionDelay: '300ms'
                }}
              ></div>
            </div>
          </div>

        </div>
      </div>

      {/* ACTION CTA BUTTON */}
      <button 
        onClick={() => {
          toast.success('Analyzing configurations...');
          setActiveCoverage('emergency');
        }}
        className="mx-5 mt-6 w-[calc(100%-2.5rem)] py-4 rounded-[18px] bg-gradient-to-r from-[#7C4DFF] via-[#B54CFF] to-[#E040FB] text-white font-bold text-[13px] tracking-wide flex items-center justify-center gap-2.5 shadow-[0_8px_24px_rgba(181,76,255,0.35)] relative overflow-hidden active:scale-98 transition-all border-0 cursor-pointer"
      >
        <ShieldCheck className="w-4.5 h-4.5" />
        <span>Complete Recommended Steps</span>
        <ChevronRight className="w-4.5 h-4.5 absolute right-4" />
      </button>

      {/* SECURITY MEMO FOOTER */}
      <div className="flex items-center justify-center gap-1.5 mt-6 mb-8">
        <Lock className={`w-3.5 h-3.5 ${isNight ? 'text-gray-500' : 'text-[#81759C]'}`} />
        <p className={`text-[10px] font-bold ${isNight ? 'text-gray-500' : 'text-[#81759C]'}`}>Your details are 100% private and protected by Kavach Shield</p>
      </div>

      {/* Styled keyframe flow arrow anim */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes arrowFlow {
          0%, 100% { 
            opacity: 0.25; 
            transform: translateX(0) scale(0.9); 
            color: rgba(168, 85, 247, 0.4);
          }
          50% { 
            opacity: 1; 
            transform: translateX(2px) scale(1.15); 
            color: #C084FC; 
          }
        }
        .arrow-anim-1 { animation: arrowFlow 1.5s infinite 0s ease-in-out; }
        .arrow-anim-2 { animation: arrowFlow 1.5s infinite 0.25s ease-in-out; }
        .arrow-anim-3 { animation: arrowFlow 1.5s infinite 0.5s ease-in-out; }
      `}} />
    </div>
  );
}

// Coverage List Item Component
const CoverageItem = ({ icon, iconBg, title, progress, barColor, status, statusColor, isComplete, isNight, onClick }: any) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between w-full rounded-xl px-1.5 py-2 transition-all cursor-pointer active:scale-[0.98] ${
      isNight ? 'active:bg-white/[0.04] hover:bg-white/[0.02]' : 'active:bg-purple-50 hover:bg-purple-50/50'
    }`}
  >
    <div className="flex items-center gap-2 w-[46%] min-w-0">
      <div className="p-2 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <span className={`text-[10.5px] font-bold truncate ${isNight ? 'text-white/95' : 'text-[#1B1238]'}`}>{title}</span>
    </div>
    <div className="w-[28%] px-1">
      <div className={`h-1 w-full rounded-full overflow-hidden ${isNight ? 'bg-[#1C1B38]' : 'bg-[#E7E3F3]'}`}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: barColor }}></div>
      </div>
    </div>
    <div className="flex items-center justify-end w-[26%] gap-0.5 shrink-0">
      <span className="text-[10px] font-black" style={{ color: statusColor }}>{status}</span>
      <ChevronRight className="w-3 h-3 text-gray-400 opacity-60" />
    </div>
  </div>
);

// Action List Item Component
const ActionItem = ({ icon, iconBg, title, subtitle, time, onClick, isNight, showBorder }: any) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3.5 p-4 transition-all active:scale-[0.99] cursor-pointer ${
      showBorder ? (isNight ? 'border-b border-white/5' : 'border-b border-[#E7E3F3]/60') : ''
    } ${
      isNight 
        ? 'active:bg-white/[0.04] hover:bg-white/[0.02]' 
        : 'active:bg-[#F2EFFB]/60 hover:bg-[#F2EFFB]/30 text-[#1B1238]'
    }`}
  >
    <div className="p-3 rounded-xl border border-white/5 flex items-center justify-center flex-shrink-0 animate-fade-in" style={{ backgroundColor: iconBg }}>
      {icon}
    </div>
    <div className="flex-1 min-w-0 text-left">
      <h4 className={`text-[12px] font-bold mb-0.5 truncate ${isNight ? 'text-white' : 'text-[#1B1238]'}`}>{title}</h4>
      <p className={`text-[10px] font-medium truncate leading-tight ${isNight ? 'text-gray-400' : 'text-[#81759C]'}`}>{subtitle}</p>
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${
        isNight 
          ? 'bg-[#7C4DFF]/15 border-[#7C4DFF]/30 text-[#B54CFF]' 
          : 'bg-[#A855F7]/5 border-[#A855F7]/15 text-[#A855F7]'
      }`}>
        {time}
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
    </div>
  </div>
);
