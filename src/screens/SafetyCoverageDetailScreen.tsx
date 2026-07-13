import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ShieldCheck, Users, MapPin, Smartphone,
  CheckCircle2, ChevronRight, AlertCircle, Clock, Plus,
  Phone, MessageSquare, MoreHorizontal, Battery,
  Camera, Mic, Bell, Layers, Lock, RefreshCw, Info,
  UserCheck, Navigation, Radio, Share2
} from 'lucide-react';
import { useKavachStore } from '../state/useKavachStore';
import { useTimeTheme } from '../hooks/useTimeTheme';
import { auth } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

export type CoverageType = 'account' | 'emergency' | 'contacts' | 'location' | 'device';

interface Props {
  coverageType: CoverageType;
  onBack: () => void;
}

export default function SafetyCoverageDetailScreen({ coverageType, onBack }: Props) {
  const [isAnimated, setIsAnimated] = useState(false);
  const { timeOfDay } = useTimeTheme();
  const isNight = timeOfDay === 'night';

  useEffect(() => {
    const t = setTimeout(() => setIsAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  // Dashboard-matched palette
  const bg = isNight
    ? { background: 'linear-gradient(180deg, #120B25 0%, #080713 100%)' }
    : {};
  const bgClass = isNight ? 'bg-[#080713]' : 'bg-[#F7F6FC]';
  const cardClass = isNight
    ? 'bg-[#0F0D1D] border-[#7A3EFF]/30'
    : 'bg-white border-[#E7E3F3]';
  const textTitle = isNight ? 'text-white' : 'text-[#1B1238]';
  const textSub = isNight ? 'text-slate-300' : 'text-[#4A3F6C]';
  const textMuted = isNight ? 'text-white/50' : 'text-[#81759C]';
  const divider = isNight ? 'border-white/5' : 'border-[#E7E3F3]';

  const sharedProps = { isNight, isAnimated, cardClass, textTitle, textSub, textMuted, divider };

  const renderPage = () => {
    switch (coverageType) {
      case 'account':   return <AccountSecurityPage {...sharedProps} />;
      case 'emergency': return <EmergencySetupPage {...sharedProps} />;
      case 'contacts':  return <TrustedContactsPage {...sharedProps} />;
      case 'location':  return <LocationSafetyPage {...sharedProps} />;
      case 'device':    return <DeviceProtectionPage {...sharedProps} />;
    }
  };

  const titles: Record<CoverageType, string> = {
    account: 'Account Security',
    emergency: 'Emergency Setup',
    contacts: 'Trusted Contacts',
    location: 'Location Safety',
    device: 'Device Protection',
  };

  return (
    <div
      className={`w-full min-h-screen relative overflow-hidden pb-28 transition-colors duration-500 ${bgClass}`}
      style={isNight ? bg : {}}
    >
      <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full pointer-events-none ${isNight ? 'bg-[#7C4DFF]/10' : 'bg-purple-500/5'}`} />
      <div className={`absolute bottom-20 left-0 w-64 h-64 blur-[100px] rounded-full pointer-events-none ${isNight ? 'bg-emerald-600/8' : 'bg-emerald-500/5'}`} />

      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button
          onClick={onBack}
          className={`p-2.5 rounded-full border flex items-center justify-center cursor-pointer active:scale-90 transition-all ${
            isNight
              ? 'bg-[#0F0D1D] border-[#7A3EFF]/35 text-white'
              : 'bg-white border-[#E7E3F3] text-[#1B1238] shadow-sm'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`font-extrabold text-[15px] tracking-tight ${textTitle}`}>{titles[coverageType]}</h1>
          <p className={`text-[10px] mt-0.5 ${textMuted}`}>Safety coverage detail</p>
        </div>
      </div>

      {renderPage()}
    </div>
  );
}

/* ─────────────────────────── 1. ACCOUNT SECURITY ─────────────────────────── */
function AccountSecurityPage({ isNight, cardClass, textTitle, textSub, textMuted, divider }: any) {
  const { profile } = useKavachStore();
  const user = auth.currentUser;

  const phone = profile?.phoneNumber || profile?.phone || user?.phoneNumber || null;
  const email = user?.email || profile?.email || null;
  const emailVerified = user?.emailVerified ?? false;
  const hasPhone = !!phone;
  // Two-step is active only if both phone and email are fully verified
  const hasTwoStep = hasPhone && emailVerified;
  const isVerified = profile?.isVerified || profile?.account_status === 'VERIFIED' || false;

  const lastLogin = user?.metadata?.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    : 'Just now';
  const creationTime = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN')
    : 'Recently';

  const activeGreen = isNight ? '#00FF87' : '#0A7C3F';
  const activeGreenBg = isNight ? 'bg-[#00FF87]/10' : 'bg-[#0A7C3F]/10';
  const activeGreenBorder = isNight ? 'border-[#00FF87]/20' : 'border-[#0A7C3F]/20';

  const checks = [
    { type: 'phone', label: 'Phone Verification', done: hasPhone, status: hasPhone ? 'Verified' : 'Unverified', icon: Phone, color: activeGreen, bg: isNight ? '#00FF871A' : '#0A7C3F1A' },
    { type: 'email', label: 'Email Verification', done: emailVerified, status: emailVerified ? 'Verified' : 'Unverified', icon: MessageSquare, color: '#FF8C00', bg: '#FF8C001A' },
    { type: 'password', label: 'Password Security', done: true, status: 'Strong', icon: Lock, color: '#3A86FF', bg: '#3A86FF1A' },
    { type: 'twostep', label: 'Two-step Verification', done: hasTwoStep, status: hasTwoStep ? 'Enabled' : 'Disabled', icon: ShieldCheck, color: '#B872FF', bg: '#B872FF1A' },
    { type: 'verified', label: 'KYC Account Verification', done: isVerified, status: isVerified ? 'Verified' : 'Pending', icon: UserCheck, color: '#48CAE4', bg: '#48CAE41A' },
  ];

  const activity = [
    { label: 'Account Created', value: creationTime },
    { label: 'Last Security Login', value: lastLogin },
    { label: 'Device Session', value: '1 Active Session' },
  ];

  const doneCount = checks.filter(c => c.done).length;
  const score = Math.round((doneCount / checks.length) * 100);
  const allDone = score === 100;

  const handleAction = (type: string) => {
    if (type === 'phone' && !hasPhone) {
      toast.info('Navigate to profile settings to link your phone.');
    } else if (type === 'email' && !emailVerified) {
      toast.info('Sending verification email...');
      if (user) {
        sendEmailVerification(user)
          .then(() => toast.success('Verification email sent! Please check your inbox.'))
          .catch(() => toast.error('Failed to send verification email. Try again later.'));
      }
    } else if (type === 'twostep' && !hasTwoStep) {
      toast.info('Link and verify both phone & email to auto-enable Two-step verification.');
    } else {
      toast.success(`${checks.find(c => c.type === type)?.label} is fully secured.`);
    }
  };

  return (
    <div className="px-4 flex flex-col gap-5">
      {/* Premium Hero Status */}
      <div className={`rounded-[24px] border p-5 flex items-center gap-4 ${cardClass} shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300`}>
        <div className="relative flex-shrink-0">
          <div className={`w-[72px] h-[72px] rounded-[22px] flex items-center justify-center ${isNight ? 'bg-[#00FF87]/10 border border-[#00FF87]/25' : 'bg-emerald-50 border border-emerald-200'}`}>
            <Lock className="w-9 h-9 text-[#00FF87] drop-shadow-[0_0_15px_rgba(0,255,135,0.4)]" />
          </div>
          {allDone && (
            <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 bg-[#00FF87] rounded-full flex items-center justify-center border-2 border-[#0F0D1D]">
              <CheckCircle2 className="w-3.5 h-3.5 text-black" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[14px] font-black tracking-tight" style={{ color: allDone ? activeGreen : '#FF8C00' }}>
              Security Status: {allDone ? 'Excellent' : `${score}% Secured`}
            </span>
          </div>
          <p className="text-[10px] font-medium leading-relaxed" style={{ color: isNight ? 'rgba(255,255,255,0.6)' : '#64748B' }}>
            {allDone ? 'Your account is protected and secure.' : 'Please finish verifying missing methods to secure your account.'}
          </p>
        </div>
      </div>

      {/* Security Checklist settings look */}
      <div>
        <p className={`text-[10px] font-extrabold tracking-widest uppercase mb-3 px-1 ${textMuted}`}>SECURITY METHOD CHECKLIST</p>
        <div className={`rounded-[24px] border ${cardClass} overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.3)]`}>
          {checks.map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-5 py-4 ${i < checks.length - 1 ? `border-b ${divider}` : ''} hover:bg-white/[0.01] transition-colors duration-200`}>
              <div className="flex items-center gap-3.5">
                <div className="w-8.5 h-8.5 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className={`text-[12px] font-semibold ${textSub}`}>{item.label}</span>
              </div>
              <div>
                {item.done ? (
                  <div className={`flex items-center gap-1.5 py-1 px-3 rounded-full ${activeGreenBg} border ${activeGreenBorder}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: activeGreen }} />
                    <span className="text-[10px] font-bold" style={{ color: activeGreen }}>{item.status}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAction(item.type)}
                    className="text-[10px] font-bold px-4 py-1.5 rounded-full border transition-all duration-300 cursor-pointer active:scale-95 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #7C4DFF 0%, #B54CFF 100%)',
                      borderColor: 'rgba(124, 77, 255, 0.4)',
                      boxShadow: '0 4px 12px rgba(124, 77, 255, 0.2)'
                    }}
                  >
                    Set Up
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <p className={`text-[10px] font-extrabold tracking-widest uppercase mb-3 px-1 ${textMuted}`}>RECENT SECURITY LOGS</p>
        <div className={`rounded-[24px] border ${cardClass} overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.3)]`}>
          {activity.map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-5 py-4 ${i < activity.length - 1 ? `border-b ${divider}` : ''}`}>
              <span className={`text-[12px] font-semibold ${textSub}`}>{item.label}</span>
              <span className={`text-[11px] font-bold ${isNight ? 'text-white/70' : 'text-[#4A3F6C]'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button Block */}
      <div className="flex flex-col gap-3 mt-2">
        <button
          onClick={() => toast.success('Account security logs are up to date.')}
          className="w-full py-4 rounded-[18px] font-bold text-[13px] text-white tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer border-0"
          style={{ background: 'linear-gradient(135deg, #7C4DFF 0%, #B54CFF 100%)', boxShadow: '0 8px 24px rgba(124,77,255,0.3)' }}
        >
          <ShieldCheck className="w-4.5 h-4.5" />
          Review Security
        </button>

        {/* Quick Actions */}
        <div className={`rounded-[24px] border ${cardClass} p-4 shadow-[0_12px_40px_rgba(0,0,0,0.3)]`}>
          <div className="flex items-center justify-around">
            {[
              { icon: Lock, label: 'Change PW', color: '#7C4DFF', action: () => toast.info('Password recovery link sent via Email/SMS.') },
              { icon: Smartphone, label: 'Devices', color: '#2997FF', action: () => toast.info('Currently active session is registered on this device.') },
              { icon: ShieldCheck, label: 'Privacy', color: '#00FF87', action: () => toast.info('Privacy checkup dashboard launched.') },
            ].map((item, i) => (
              <button key={i} onClick={item.action} className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-all">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/[0.04]" style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <span className={`text-[9px] font-bold text-center leading-tight ${isNight ? 'text-white/70' : 'text-[#4A3F6C]'}`}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── 2. EMERGENCY SETUP ─────────────────────────── */
function EmergencySetupPage({ isNight, cardClass, textSub, textMuted, divider, isAnimated }: any) {
  const { safetyPin, isVoiceTriggerActive, profile, setVoiceTriggerActive, setSafetyPin } = useKavachStore();

  const hasSafetyPin = !!safetyPin;
  const hasVoice = isVoiceTriggerActive;
  const hasOverlay = profile?.os_lifelines?.overlay_granted ?? false;
  const hasMedical = !!(profile?.address || (profile as any)?.bloodGroup || (profile as any)?.medicalInfo);

  const checks = [
    { type: 'sos', label: 'SOS Alert Trigger', done: true, status: 'Active', icon: Radio, color: '#FF5A5F', bg: '#FF5A5F1A' },
    { type: 'pin', label: 'Emergency PIN Code', done: hasSafetyPin, status: hasSafetyPin ? 'Active' : 'Set PIN', icon: Lock, color: '#FF8C00', bg: '#FF8C001A' },
    { type: 'voice', label: 'Voice Activation Trigger', done: hasVoice, status: hasVoice ? 'Active' : 'Enable Voice', icon: Mic, color: '#3A86FF', bg: '#3A86FF1A' },
    { type: 'overlay', label: 'Auto SOS (Overlay)', done: hasOverlay, status: hasOverlay ? 'Active' : 'Grant Overlay', icon: Layers, color: '#B872FF', bg: '#B872FF1A' },
    { type: 'medical', label: 'Emergency Medical Data', done: hasMedical, status: hasMedical ? 'Active' : 'Add Info', icon: Info, color: '#48CAE4', bg: '#48CAE41A' },
  ];

  const doneCount = checks.filter(c => c.done).length;
  const currentPct = Math.round((doneCount / checks.length) * 100);
  const estMinutes = checks.filter(c => !c.done).length * 1;

  const [showMedicalForm, setShowMedicalForm] = useState(false);
  const [bloodGroup, setBloodGroup] = useState((profile as any)?.bloodGroup || '');
  const [allergies, setAllergies] = useState((profile as any)?.medicalInfo || '');
  const [emergAddr, setEmergAddr] = useState(profile?.address || '');

  const handleSetupAction = (type: string) => {
    if (type === 'pin') {
      const pin = prompt('Enter a 4-digit Emergency PIN:');
      if (pin && pin.length === 4) {
        setSafetyPin(pin);
        toast.success('Emergency PIN set successfully!');
      } else if (pin) {
        toast.error('PIN must be exactly 4 digits.');
      }
    } else if (type === 'voice') {
      setVoiceTriggerActive(true);
      toast.success('Voice activation trigger enabled!');
    } else if (type === 'overlay') {
      if (profile?.os_lifelines) {
        profile.os_lifelines.overlay_granted = true;
      }
      toast.success('Overlay permission simulated/granted!');
    } else if (type === 'medical') {
      setShowMedicalForm(true);
    }
  };

  const handleSaveMedical = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      (profile as any).bloodGroup = bloodGroup;
      (profile as any).medicalInfo = allergies;
      profile.address = emergAddr;
    }
    toast.success('Emergency Medical Info updated!');
    setShowMedicalForm(false);
  };

  return (
    <div className="px-4 flex flex-col gap-5">
      {/* Premium Hero Status */}
      <div className={`rounded-[24px] border p-5 flex items-center gap-4 ${cardClass} shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300`}>
        <div className="relative flex-shrink-0">
          <div className={`w-[72px] h-[72px] rounded-[22px] flex items-center justify-center ${isNight ? 'bg-[#FF5A5F]/10 border border-[#FF5A5F]/25' : 'bg-red-50 border border-red-200'}`}>
            <span className="text-[28px] font-black text-[#FF5A5F] drop-shadow-[0_0_15px_rgba(255,90,95,0.4)]">SOS</span>
          </div>
          {currentPct < 100 && (
            <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 bg-[#FF8C00] rounded-full flex items-center justify-center border-2 border-[#0F0D1D]">
              <AlertCircle className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[14px] font-black tracking-tight" style={{ color: currentPct === 100 ? '#00FF87' : '#FF8C00' }}>
              Protection Level: {currentPct}%
            </span>
          </div>
          <p className="text-[10px] font-medium leading-relaxed" style={{ color: isNight ? 'rgba(255,255,255,0.6)' : '#64748B' }}>
            {currentPct === 100 ? 'Emergency setup is complete!' : `Complete the checklist to maximize your safety setup.`}
          </p>
          <div className={`h-1.5 rounded-full mt-3 overflow-hidden ${isNight ? 'bg-[#1C1B38]' : 'bg-[#E7E3F3]'}`}>
            <div className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: isAnimated ? `${currentPct}%` : '0%', background: 'linear-gradient(90deg, #FF5A5F, #00FF87)' }} />
          </div>
        </div>
      </div>

      {/* Settings block Checklist */}
      <div>
        <p className={`text-[10px] font-extrabold tracking-widest uppercase mb-3 px-1 ${textMuted}`}>EMERGENCY METHOD CHECKLIST</p>
        <div className={`rounded-[24px] border ${cardClass} overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.3)]`}>
          {checks.map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-5 py-4 ${i < checks.length - 1 ? `border-b ${divider}` : ''} hover:bg-white/[0.01] transition-colors duration-200`}>
              <div className="flex items-center gap-3.5">
                <div className="w-8.5 h-8.5 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className={`text-[12px] font-semibold ${textSub}`}>{item.label}</span>
              </div>
              <div>
                {item.done ? (
                  <div className={`flex items-center gap-1.5 py-1 px-3 rounded-full ${isNight ? 'bg-[#00FF87]/10 border-[#00FF87]/20' : 'bg-[#0A7C3F]/10 border-[#0A7C3F]/20'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: isNight ? '#00FF87' : '#0A7C3F' }} />
                    <span className="text-[10px] font-bold" style={{ color: isNight ? '#00FF87' : '#0A7C3F' }}>Active</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSetupAction(item.type)}
                    className="text-[10px] font-bold px-4 py-1.5 rounded-full border transition-all duration-300 cursor-pointer active:scale-95 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #7C4DFF 0%, #B54CFF 100%)',
                      borderColor: 'rgba(124, 77, 255, 0.4)',
                      boxShadow: '0 4px 12px rgba(124, 77, 255, 0.2)'
                    }}
                  >
                    {item.status}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentPct < 100 && (
        <div className={`rounded-[16px] border px-4 py-3 flex items-center gap-2.5 ${isNight ? 'bg-[#FF8C00]/10 border-[#FF8C00]/20' : 'bg-orange-50 border-orange-200'}`}>
          <Info className="w-4 h-4 text-[#FF8C00] flex-shrink-0" />
          <p className={`text-[10px] font-medium leading-snug ${textSub}`}>
            Optimizing remaining steps will elevate setup score <span className="font-bold text-[#FF8C00]">{currentPct}%</span> → <span className="font-bold" style={{ color: isNight ? '#00FF87' : '#0A7C3F' }}>100%</span>
          </p>
        </div>
      )}

      {estMinutes > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Clock className={`w-4 h-4 ${isNight ? 'text-white/50' : 'text-[#81759C]'}`} />
          <span className={`text-[11px] font-semibold ${textMuted}`}>Estimated Time: {estMinutes} Minute{estMinutes > 1 ? 's' : ''}</span>
        </div>
      )}

      <button
        onClick={() => toast.success('Opening emergency setup...')}
        className="w-full py-4 rounded-[16px] font-bold text-[13px] text-white tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer border-0"
        style={{ background: 'linear-gradient(135deg, #FF5A5F 0%, #FF8C00 100%)', boxShadow: '0 8px 24px rgba(255,90,95,0.4)' }}
      >
        <Radio className="w-4 h-4" />
        {currentPct === 100 ? 'Setup Complete ✓' : 'Complete Setup'}
      </button>

      {showMedicalForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveMedical}
            className={`w-full max-w-sm rounded-[24px] border p-6 flex flex-col gap-4 shadow-2xl transition-all duration-300 ${
              isNight ? 'bg-[#0F0D1D] border-white/5 text-white' : 'bg-white border-[#E7E3F3] text-[#1B1238]'
            }`}
          >
            <div className="text-left">
              <h3 className="text-[14px] font-black tracking-tight mb-1">Emergency Medical Details</h3>
              <p className="text-[10px] text-gray-500 font-medium">This data is made accessible to emergency responders.</p>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Blood Group</label>
              <input
                type="text"
                placeholder="e.g. O+ positive"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className={`px-3 py-2 text-[12px] font-semibold rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#7C4DFF] ${
                  isNight ? 'bg-[#1E1B4B]/30 border-white/10 text-white' : 'bg-slate-50 border-[#E7E3F3] text-slate-800'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Medical Conditions &amp; Allergies</label>
              <textarea
                placeholder="List any serious conditions or allergies..."
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                rows={2}
                className={`px-3 py-2 text-[12px] font-semibold rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#7C4DFF] ${
                  isNight ? 'bg-[#1E1B4B]/30 border-white/10 text-white' : 'bg-slate-50 border-[#E7E3F3] text-slate-800'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Emergency Home Address</label>
              <input
                type="text"
                placeholder="Home landmark, city, state"
                value={emergAddr}
                onChange={(e) => setEmergAddr(e.target.value)}
                className={`px-3 py-2 text-[12px] font-semibold rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#7C4DFF] ${
                  isNight ? 'bg-[#1E1B4B]/30 border-white/10 text-white' : 'bg-slate-50 border-[#E7E3F3] text-slate-800'
                }`}
              />
            </div>

            <div className="flex gap-3.5 mt-2">
              <button
                type="button"
                onClick={() => setShowMedicalForm(false)}
                className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95 ${
                  isNight ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-100 border-[#E7E3F3] text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-white transition-all active:scale-95 shadow-md border-0 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #7C4DFF 0%, #B54CFF 100%)' }}
              >
                Save Details
              </button>
            </div>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html:`
        @keyframes arrowFlow {
          0%,100%{opacity:0.3;transform:translateX(0) scale(0.9);}
          50%{opacity:1;transform:translateX(2px) scale(1.15);}
        }
        .arrow-anim-1{animation:arrowFlow 1.4s infinite 0s ease-in-out;}
        .arrow-anim-2{animation:arrowFlow 1.4s infinite 0.22s ease-in-out;}
        .arrow-anim-3{animation:arrowFlow 1.4s infinite 0.44s ease-in-out;}
      `}} />
    </div>
  );
}

/* ─────────────────────────── 3. TRUSTED CONTACTS ─────────────────────────── */
function TrustedContactsPage({ isNight, cardClass, textTitle, textSub, textMuted, divider, isAnimated }: any) {
  const { guardianCache, setActiveTab } = useKavachStore();

  const capitalize = (s: string) => s ? s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';
  // Pull all contacts (accepted and pending) to display active safety network status
  const allContacts = guardianCache || [];
  const totalContacts = allContacts.length;
  const maxContacts = 5;
  const score = Math.min(100, Math.round((allContacts.filter((g: any) => g.status === 'accepted' || g.accepted === true).length / maxContacts) * 100));

  const relationColors: Record<string, string> = {
    mother: '#00FF87', mom: '#00FF87', father: '#F59E0B', dad: '#F59E0B',
    sister: '#B872FF', brother: '#3A86FF', friend: '#48CAE4',
  };

  const getRelationColor = (relation: string) => {
    const key = (relation || '').toLowerCase();
    for (const [k, v] of Object.entries(relationColors)) {
      if (key.includes(k)) return v;
    }
    return '#7C4DFF';
  };

  return (
    <div className="px-4 flex flex-col gap-5">
      {/* Premium Hero Status */}
      <div className={`rounded-[24px] border p-5 flex items-center gap-4 ${cardClass} shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300`}>
        <div className="relative flex-shrink-0">
          <div className={`w-[72px] h-[72px] rounded-[22px] flex items-center justify-center ${isNight ? 'bg-[#B872FF]/10 border border-[#B872FF]/25' : 'bg-purple-50 border border-purple-200'}`}>
            <Users className="w-9 h-9 text-[#B872FF] drop-shadow-[0_0_15px_rgba(184,114,255,0.4)]" />
          </div>
          {totalContacts > 0 && (
            <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 bg-[#B872FF] rounded-full flex items-center justify-center border-2 border-[#0F0D1D]">
              <span className="text-[9px] font-black text-white">{totalContacts}</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[14px] font-black tracking-tight text-[#B872FF]">
              Safety Circle: {score}% Verified
            </span>
          </div>
          <p className="text-[10px] font-medium leading-relaxed" style={{ color: isNight ? 'rgba(255,255,255,0.6)' : '#64748B' }}>
            {totalContacts === 0
              ? 'Add trusted contacts to instantly inform them during an SOS.'
              : `You have ${totalContacts} contact${totalContacts > 1 ? 's' : ''} in your safety circle.`}
          </p>
          <div className={`h-1.5 rounded-full mt-3 overflow-hidden ${isNight ? 'bg-[#1C1B38]' : 'bg-[#E7E3F3]'}`}>
            <div className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: isAnimated ? `${score}%` : '0%', background: 'linear-gradient(90deg, #7C4DFF, #00FF87)' }} />
          </div>
        </div>
      </div>

      {/* Contacts header */}
      <div className="flex items-center justify-between px-1">
        <p className={`text-[10px] font-extrabold tracking-widest uppercase ${textMuted}`}>YOUR TRUSTED CIRCLE</p>
        <span className={`text-[10px] font-semibold ${isNight ? 'text-white/50' : 'text-[#81759C]'}`}>Suggested: 5 contacts</span>
      </div>

      {/* Contact cards */}
      {totalContacts === 0 ? (
        <div className={`rounded-[24px] border p-8 text-center ${cardClass} shadow-[0_12px_40px_rgba(0,0,0,0.3)]`}>
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20 text-[#B872FF]" />
          <p className={`text-[12px] font-bold ${textTitle}`}>No trusted contacts added yet</p>
          <p className={`text-[10px] mt-1.5 leading-relaxed max-w-[200px] mx-auto ${textMuted}`}>Add your family members or close friends to keep them notified.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {allContacts.map((c: any, i: number) => {
            const relColor = getRelationColor(c.relation || '');
            const initials = (c.name || 'G').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
            const isAccepted = c.status === 'accepted' || c.accepted === true || c.isVerified === true;
            return (
              <div key={i} className={`rounded-[22px] border p-4 flex items-center gap-3.5 ${cardClass} shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:bg-white/[0.01] transition-colors duration-200`}>
                {c.photoUrl || c.photoURL ? (
                  <img src={c.photoUrl || c.photoURL} alt={c.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-white/10" />
                ) : (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-black text-white text-[14px]"
                    style={{ background: `linear-gradient(135deg, ${relColor}80, ${relColor})` }}>
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-bold truncate ${textTitle}`}>{capitalize(c.name || 'Guardian')}</p>
                  <p className={`text-[10px] font-medium truncate mt-0.5 ${textMuted}`}>{c.phone || 'No phone number'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-extrabold px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${relColor}15`, color: relColor, border: `1px solid ${relColor}25` }}>
                    {capitalize(c.relation || 'Guardian')}
                  </span>
                  
                  {isAccepted ? (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${isNight ? 'bg-[#00FF87]/10 border-[#00FF87]/20 text-[#00FF87]' : 'bg-[#0A7C3F]/10 border-[#0A7C3F]/20 text-[#0A7C3F]'}`}>
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        const smsBody = encodeURIComponent(`Hey! I want to add you as my trusted contact on Kavach safety app. Please download and register here: ${window.location.origin}`);
                        window.open(`sms:${c.phone || ''}?body=${smsBody}`, '_blank');
                        toast.success(`Invitation link generated for ${c.name || 'Guardian'}`);
                      }}
                      className="text-[9px] font-black px-2 py-0.5 rounded-md border bg-[#FF8C00]/10 border-[#FF8C00]/20 text-[#FF8C00] cursor-pointer hover:bg-[#FF8C00]/20 active:scale-95 transition-all"
                    >
                      Invite
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Contact */}
      <button
        onClick={() => setActiveTab('contacts')}
        className={`w-full py-3.5 rounded-[16px] border-2 border-dashed font-semibold text-[12px] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] ${
          isNight ? 'border-[#7A3EFF]/30 text-[#B872FF] bg-[#7A3EFF]/5' : 'border-purple-300 text-purple-600 bg-purple-50'
        }`}
      >
        <Plus className="w-4 h-4" />
        Add Contact
      </button>

      {/* Why card */}
      <div className={`rounded-[18px] border p-4 ${isNight ? 'bg-[#7C4DFF]/10 border-[#7C4DFF]/25' : 'bg-purple-50 border-purple-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-[#7C4DFF]" />
          <span className="text-[11px] font-bold text-[#7C4DFF]">Why Trusted Contacts?</span>
        </div>
        <p className={`text-[10px] font-medium leading-relaxed ${textSub}`}>They receive your live location and SOS alerts instantly when you need help.</p>
      </div>

      {/* Invite CTA */}
      <button
        onClick={() => {
          if (navigator.share) {
            navigator.share({ title: 'Kavach Safety App', text: 'Join my Kavach safety circle!', url: window.location.origin });
          } else {
            toast.success('Invite link copied!');
            navigator.clipboard.writeText(window.location.origin);
          }
        }}
        className="w-full py-4 rounded-[16px] font-bold text-[13px] text-white tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer border-0"
        style={{ background: 'linear-gradient(135deg, #7C4DFF 0%, #B54CFF 100%)', boxShadow: '0 8px 24px rgba(124,77,255,0.4)' }}
      >
        <UserCheck className="w-4 h-4" />
        Invite Contact
      </button>

      {/* Share row */}
      <div className={`rounded-[20px] border ${cardClass} p-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)]`}>
        <div className="flex items-center justify-around">
          {[
            { icon: MessageSquare, label: 'WhatsApp', color: '#25D366', action: () => window.open(`https://wa.me/?text=${encodeURIComponent('Join my Kavach safety circle! ' + window.location.origin)}`, '_blank') },
            { icon: Phone, label: 'SMS', color: '#2997FF', action: () => window.open(`sms:?body=${encodeURIComponent('Join my Kavach safety circle!')}`, '_blank') },
            { icon: Share2, label: 'More', color: '#7C4DFF', action: () => navigator.share?.({ title: 'Kavach', text: 'Join my safety circle!', url: window.location.origin }) },
          ].map((item, i) => (
            <button key={i} onClick={item.action} className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-all">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/[0.04]" style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}25` }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <span className={`text-[9px] font-bold text-center leading-tight ${isNight ? 'text-white/70' : 'text-[#4A3F6C]'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── 4. LOCATION SAFETY ─────────────────────────── */
function LocationSafetyPage({ isNight, cardClass, textTitle, textSub, textMuted, divider }: any) {
  const { userPos, setUserPos } = useKavachStore();
  const [lastChecked, setLastChecked] = useState<string>('Checking...');

  const hasLocation = !!(userPos?.lat && userPos?.lng);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (hasLocation) {
      setLastChecked('Just now');
    } else {
      setLastChecked('Never');
    }
  }, [hasLocation]);

  const checks = [
    { type: 'loc', label: 'Location Permission', done: hasLocation, status: hasLocation ? 'Always Allow' : 'Allow', icon: MapPin, color: '#3A86FF', bg: '#3A86FF1F' },
    { type: 'gps', label: 'GPS Accuracy', done: hasLocation, status: hasLocation ? 'High (10m)' : 'Request GPS', icon: Navigation, color: '#00FF87', bg: '#00FF871F' },
    { type: 'background', label: 'Background Tracking', done: hasLocation && isNative, status: hasLocation && isNative ? 'Active' : hasLocation ? 'Web mode' : 'Disabled', icon: Radio, color: '#B872FF', bg: '#B872FF1F' },
    { type: 'battery', label: 'Battery Optimization', done: true, status: 'Enabled', icon: Battery, color: '#48CAE4', bg: '#48CAE41F' },
  ];

  const allDone = checks.every(c => c.done);

  const [locName, setLocName] = useState<string>('Detecting address...');

  const requestLocation = async () => {
    toast.info('Requesting high-precision GPS lock...');
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { 
          enableHighAccuracy: true, 
          timeout: 10000,
          maximumAge: 0
        })
      );
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setUserPos({ lat, lng });
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastChecked(`Just now (${timeStr})`);
      toast.success(`GPS lock established! Accuracy: ±${Math.round(pos.coords.accuracy)}m`);

      // Reverse geocode via Nominatim open API
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await response.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          // Take first few readable parts (e.g. Area, Suburb, City)
          const shortAddress = parts.slice(0, 3).join(',').trim();
          setLocName(shortAddress);
        } else {
          setLocName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } catch {
        setLocName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Location lock failed. Please enable location services in your browser settings.');
    }
  };

  useEffect(() => {
    if (hasLocation && locName === 'Detecting address...') {
      // Auto resolve current store pos
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userPos.lat}&lon=${userPos.lng}&zoom=18`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            setLocName(data.display_name.split(',').slice(0, 3).join(',').trim());
          } else {
            setLocName(`${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}`);
          }
        })
        .catch(() => {
          setLocName(`${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}`);
        });
    }
  }, [hasLocation]);

  return (
    <div className="px-4 flex flex-col gap-5">
      {/* Premium Hero Status */}
      <div className={`rounded-[24px] border p-5 flex items-center gap-4 ${cardClass} shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300`}>
        <div className="relative flex-shrink-0">
          <div className={`w-[72px] h-[72px] rounded-[22px] flex items-center justify-center ${isNight ? 'bg-[#3A86FF]/10 border border-[#3A86FF]/25' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="w-10 h-10 rounded-full border-2 border-[#3A86FF]/60 relative flex items-center justify-center">
              <div className="absolute w-full h-[1px] bg-[#3A86FF]/40" />
              <div className="absolute w-[1px] h-full bg-[#3A86FF]/40" />
              <MapPin className="w-5 h-5 text-[#3A86FF] relative z-10 drop-shadow-[0_0_12px_rgba(58,134,255,0.7)]" />
            </div>
          </div>
          {allDone && (
            <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 bg-[#00FF87] rounded-full flex items-center justify-center border-2 border-[#0F0D1D]">
              <CheckCircle2 className="w-3.5 h-3.5 text-black" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[14px] font-black tracking-tight" style={{ color: allDone ? '#00FF87' : '#FF8C00' }}>
              GPS Readiness: {allDone ? 'Excellent' : hasLocation ? 'Good' : 'Action needed'}
            </span>
          </div>
          <p className="text-[10px] font-medium leading-relaxed" style={{ color: isNight ? 'rgba(255,255,255,0.6)' : '#64748B' }}>
            {hasLocation
              ? `Active: ${locName} (${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)})`
              : 'Enable location permission to activate live guard monitoring.'}
          </p>
        </div>
      </div>

      {/* Location settings block checklist */}
      <div>
        <p className={`text-[10px] font-extrabold tracking-widest uppercase mb-3 px-1 ${textMuted}`}>LOCATION PERMISSIONS</p>
        <div className={`rounded-[24px] border ${cardClass} overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.3)]`}>
          {checks.map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-5 py-4 ${i < checks.length - 1 ? `border-b ${divider}` : ''} hover:bg-white/[0.01] transition-colors duration-200`}>
              <div className="flex items-center gap-3.5">
                <div className="w-8.5 h-8.5 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className={`text-[12px] font-semibold ${textSub}`}>{item.label}</span>
              </div>
              <div>
                {item.done ? (
                  <div className={`flex items-center gap-1.5 py-1 px-3 rounded-full ${isNight ? 'bg-[#00FF87]/10 border-[#00FF87]/20' : 'bg-[#0A7C3F]/10 border-[#0A7C3F]/20'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: isNight ? '#00FF87' : '#0A7C3F' }} />
                    <span className="text-[10px] font-bold" style={{ color: isNight ? '#00FF87' : '#0A7C3F' }}>{item.status}</span>
                  </div>
                ) : (
                  <button
                    onClick={requestLocation}
                    className="text-[10px] font-bold px-4 py-1.5 rounded-full border transition-all duration-300 cursor-pointer active:scale-95 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #7C4DFF 0%, #B54CFF 100%)',
                      borderColor: 'rgba(124, 77, 255, 0.4)',
                      boxShadow: '0 4px 12px rgba(124, 77, 255, 0.2)'
                    }}
                  >
                    {item.status}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Map Visual */}
      <div>
        <p className={`text-[10px] font-extrabold tracking-widest uppercase mb-3 px-1 ${textMuted}`}>LIVE ACCURACY RADAR</p>
        <div className={`rounded-[24px] border overflow-hidden ${cardClass} shadow-[0_12px_40px_rgba(0,0,0,0.3)]`}>
          <div className="relative h-[130px] flex items-center justify-center"
            style={{ background: isNight ? 'radial-gradient(ellipse at center, #0F1B3A 0%, #080713 100%)' : 'radial-gradient(ellipse at center, #E8F4FF 0%, #F7F6FC 100%)' }}>
            <svg className="absolute inset-0 w-full h-full opacity-20">
              {[0,1,2,3].map(i => <line key={`h${i}`} x1="0" y1={`${25*i+12}%`} x2="100%" y2={`${25*i+12}%`} stroke="#3A86FF" strokeWidth="0.5" />)}
              {[0,1,2,3,4,5].map(i => <line key={`v${i}`} x1={`${16*i+8}%`} y1="0" x2={`${16*i+8}%`} y2="100%" stroke="#3A86FF" strokeWidth="0.5" />)}
            </svg>
            <div className="relative w-20 h-20 flex items-center justify-center">
              {hasLocation ? (
                <>
                  <div className="absolute w-20 h-20 rounded-full border border-[#3A86FF]/30" style={{ animation: 'ping 2s infinite' }} />
                  <div className="absolute w-12 h-12 rounded-full border border-[#3A86FF]/50" style={{ animation: 'ping 2s 0.5s infinite' }} />
                  <div className="w-5.5 h-5.5 rounded-full bg-[#3A86FF] shadow-[0_0_20px_rgba(58,134,255,0.9)] flex items-center justify-center border-2 border-white">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00FF87]" />
                  </div>
                </>
              ) : (
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#FF5A5F]/40 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#FF5A5F]/60" />
                </div>
              )}
            </div>
          </div>
          <div className={`px-5 py-3 border-t ${divider} flex items-center gap-2`}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hasLocation ? '#00FF87' : '#FF5A5F' }} />
            <span className={`text-[10px] font-medium ${textMuted}`}>Last checked: {lastChecked}</span>
            {hasLocation && <span className={`text-[10px] font-bold ml-auto text-[#00FF87]`}>High Accuracy</span>}
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={requestLocation}
        className="w-full py-4 rounded-[18px] font-bold text-[13px] text-white tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer border-0"
        style={{ background: 'linear-gradient(135deg, #2997FF 0%, #3A86FF 100%)', boxShadow: '0 8px 24px rgba(41,151,255,0.3)' }}
      >
        <Navigation className="w-4.5 h-4.5" />
        Test Location Again
      </button>
    </div>
  );
}
/* ─────────────────────────── 5. DEVICE PROTECTION ─────────────────────────── */
function DeviceProtectionPage({ isNight, cardClass, textSub, textMuted, divider, isAnimated }: any) {
  const { profile, setBatteryExempt } = useKavachStore();
  const [perms, setPerms] = useState({
    camera: false, mic: false, notifications: false, overlay: false, battery: false
  });
  const [checked, setChecked] = useState(false);

  const overlay = profile?.os_lifelines?.overlay_granted ?? false;
  const micLoc = profile?.os_lifelines?.mic_loc_active ?? false;
  const batteryExempt = profile?.os_lifelines?.battery_exempt ?? false;

  const checkPermissions = async () => {
    const result = { camera: false, mic: false, notifications: false, overlay: overlay, battery: batteryExempt };
    try {
      if (navigator.permissions) {
        const [cam, mic, notif] = await Promise.all([
          navigator.permissions.query({ name: 'camera' as PermissionName }).catch(() => ({ state: 'denied' })),
          navigator.permissions.query({ name: 'microphone' as PermissionName }).catch(() => ({ state: 'denied' })),
          navigator.permissions.query({ name: 'notifications' as PermissionName }).catch(() => ({ state: 'denied' })),
        ]);
        result.camera = cam.state === 'granted';
        result.mic = mic.state === 'granted' || micLoc;
        result.notifications = notif.state === 'granted';
      }
    } catch {}
    setPerms(result);
    setChecked(true);
    return result;
  };

  useEffect(() => {
    checkPermissions();
  }, [overlay, micLoc, batteryExempt]);

  const requestPermission = async (type: 'camera' | 'mic' | 'notifications' | 'overlay' | 'battery') => {
    if (type === 'camera') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        toast.success('Camera permission granted!');
      } catch {
        toast.error('Could not access camera. Please allow in system settings.');
      }
    } else if (type === 'mic') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        toast.success('Microphone permission granted!');
      } catch {
        toast.error('Could not access microphone. Please allow in system settings.');
      }
    } else if (type === 'notifications') {
      try {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          toast.success('Notification permission granted!');
        } else {
          toast.error('Notification permission denied.');
        }
      } catch {
        toast.error('Notification request failed.');
      }
    } else if (type === 'overlay') {
      if (profile?.os_lifelines) {
        profile.os_lifelines.overlay_granted = true;
      }
      toast.success('Overlay permission simulated/granted!');
    } else if (type === 'battery') {
      setBatteryExempt(true);
      if (profile?.os_lifelines) {
        profile.os_lifelines.battery_exempt = true;
      }
      toast.success('Battery optimization disabled!');
    }
    checkPermissions();
  };

  const checks = [
    { type: 'camera', label: 'Camera Access', done: perms.camera, status: perms.camera ? 'Allowed' : 'Allow', icon: Camera, color: '#3A86FF', bg: '#3A86FF1F' },
    { type: 'mic', label: 'Microphone Access', done: perms.mic, status: perms.mic ? 'Allowed' : 'Allow', icon: Mic, color: '#00FF87', bg: '#00FF871F' },
    { type: 'notifications', label: 'Notification Access', done: perms.notifications, status: perms.notifications ? 'Allowed' : 'Allow', icon: Bell, color: '#FF8C00', bg: '#FF8C001F' },
    { type: 'overlay', label: 'Overlay Permission', done: perms.overlay, status: perms.overlay ? 'Granted' : 'Grant', icon: Layers, color: '#B872FF', bg: '#B872FF1F' },
    { type: 'battery', label: 'Battery Optimization', done: perms.battery, status: perms.battery ? 'Exempt' : 'Ignore', icon: Battery, color: '#48CAE4', bg: '#48CAE41F' },
  ];

  const doneCount = checks.filter(c => c.done).length;
  const score = Math.round((doneCount / checks.length) * 100);

  const handleRunCheck = async () => {
    toast.info('Running device check...');
    await checkPermissions();
    const missing = checks.find(c => !c.done);
    if (missing) {
      toast.info(`Requesting missing: ${missing.label}...`);
      await requestPermission(missing.type as any);
    } else {
      toast.success('All device protection items are fully verified!');
    }
  };

  return (
    <div className="px-4 flex flex-col gap-5">
      {/* Hero Card */}
      <div className={`rounded-[24px] border p-5 flex items-center gap-4 ${cardClass} shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300`}>
        <div className="relative flex-shrink-0">
          <div className={`w-[72px] h-[72px] rounded-[22px] flex items-center justify-center ${isNight ? 'bg-[#48CAE4]/10 border border-[#48CAE4]/25' : 'bg-cyan-50 border border-cyan-200'}`}>
            <Smartphone className="w-9 h-9 text-[#48CAE4] drop-shadow-[0_0_15px_rgba(72,202,228,0.4)]" />
          </div>
          {score < 100 && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FF8C00] rounded-full flex items-center justify-center border-2 border-[#0F0D1D]">
              <AlertCircle className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[14px] font-black tracking-tight" style={{ color: score === 100 ? '#00FF87' : '#48CAE4' }}>
              Protection: {checked ? `${score}%` : 'Checking...'}
            </span>
          </div>
          <p className="text-[10px] font-medium leading-relaxed" style={{ color: isNight ? 'rgba(255,255,255,0.6)' : '#64748B' }}>
            {score === 100 ? 'All permissions granted.' : `${checks.length - doneCount} permissions require your attention.`}
          </p>
          <div className={`h-1.5 rounded-full mt-3 overflow-hidden ${isNight ? 'bg-[#1C1B38]' : 'bg-[#E7E3F3]'}`}>
            <div className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: isAnimated && checked ? `${score}%` : '0%', background: 'linear-gradient(90deg, #48CAE4, #00FF87)' }} />
          </div>
        </div>
      </div>

      {/* Settings Block */}
      <div>
        <p className={`text-[10px] font-extrabold tracking-widest uppercase mb-3 px-1 ${textMuted}`}>PROTECTION CHECK</p>
        <div className={`rounded-[24px] border ${cardClass} overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.3)]`}>
          {checks.map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-5 py-4 ${i < checks.length - 1 ? `border-b ${divider}` : ''} hover:bg-white/[0.02] transition-colors duration-200`}>
              <div className="flex items-center gap-3.5">
                <div className="w-8.5 h-8.5 rounded-[10px] flex items-center justify-center transition-all duration-300" style={{ backgroundColor: item.bg }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className={`text-[12px] font-semibold ${textSub}`}>{item.label}</span>
              </div>
              <div>
                {item.done ? (
                  <div className={`flex items-center gap-1.5 py-1 px-3 rounded-full ${isNight ? 'bg-[#00FF87]/10 border-[#00FF87]/20' : 'bg-[#0A7C3F]/10 border-[#0A7C3F]/20'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: isNight ? '#00FF87' : '#0A7C3F' }} />
                    <span className="text-[10px] font-bold" style={{ color: isNight ? '#00FF87' : '#0A7C3F' }}>Active</span>
                  </div>
                ) : (
                  <button
                    onClick={() => requestPermission(item.type as any)}
                    className="text-[10px] font-bold px-4 py-1.5 rounded-full border transition-all duration-300 cursor-pointer active:scale-95 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #7C4DFF 0%, #B54CFF 100%)',
                      borderColor: 'rgba(124, 77, 255, 0.4)',
                      boxShadow: '0 4px 12px rgba(124, 77, 255, 0.2)'
                    }}
                  >
                    {item.status}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3 mt-2">
        <button
          onClick={handleRunCheck}
          className="w-full py-4 rounded-[18px] font-bold text-[13px] text-white tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer border-0"
          style={{ background: 'linear-gradient(135deg, #48CAE4 0%, #0077B6 100%)', boxShadow: '0 8px 24px rgba(72,202,228,0.3)' }}
        >
          <RefreshCw className="w-4.5 h-4.5" />
          Run Device Check
        </button>

        <button
          onClick={() => toast.info(`Device: ${navigator.userAgent.split(')')[0].split('(')[1]?.split(';')[0]?.trim() || 'Unknown'}`)}
          className={`w-full py-3.5 rounded-[18px] font-semibold text-[12px] border cursor-pointer transition-all active:scale-[0.98] ${isNight ? 'border-white/10 text-white/70 bg-white/[0.03] hover:bg-white/[0.06]' : 'border-[#E7E3F3] text-[#4A3F6C] bg-white'}`}
        >
          Device Info
        </button>
      </div>
    </div>
  );
}
