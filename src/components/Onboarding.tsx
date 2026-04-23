// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ⚠️  KAVACH CORE — ONBOARDING ENGINE — DO NOT MODIFY ⚠️                ║
// ║  Status  : VERIFIED WORKING & USER-APPROVED (Locked: 2026-04-22)        ║
// ║  Owner   : singh.sachin16559@gmail.com                                  ║
// ║                                                                          ║
// ║  This file controls the entire user onboarding flow:                    ║
// ║    • Step 1  → Language selection (EN / HI / Hinglish + 8 more)        ║
// ║    • Step 2  → Role selection (Citizen / Protector / Admin)             ║
// ║    • Step 3  → Aadhaar + Phone identity anchor                          ║
// ║    • Step 4  → Guardian Circle (trusted contacts)                       ║
// ║    • Step 7  → Mission Readiness (3 toggle switches, ALL mandatory):    ║
// ║                  🔋 Persistent Guard (Battery Optimization bypass)       ║
// ║                  📺 Tactical Break-In (Display over other apps)          ║
// ║                  📱 Lifeline Grid (SMS + Call permissions)               ║
// ║    • Terms of Service (language-aware, unlocks only when 3 toggles ON)  ║
// ║    • Activate Shield (disabled until both ToS checkboxes ticked)        ║
// ║                                                                          ║
// ║  DO NOT:                                                                 ║
// ║    ✗ Remove or bypass the 3-toggle mandatory gate                       ║
// ║    ✗ Remove the ToS checkboxes or make them pre-checked                 ║
// ║    ✗ Change the tr() helper (breaks multi-language ToS)                 ║
// ║    ✗ Refactor finishOnboarding() without testing the full flow          ║
// ║    ✗ Add blocking code that prevents the activate button from working   ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { Shield, Languages, ChevronRight, CheckCircle2, User, UserRound, Smartphone, Key, ShieldCheck, Fingerprint, Activity, ScanLine } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language, translations } from '../lib/translations';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface KavachNativePlugin {
  openBatterySettings(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  openAppSettings(): Promise<void>;
  isOverlayPermissionGranted(): Promise<{granted: boolean}>;
  isIgnoringBatteryOptimizations(): Promise<{isExempt: boolean}>;
  startService(): Promise<void>;
  checkSafetyPermissions(): Promise<{sms: string, call: string}>;
  requestSensitivePermissions(): Promise<{sms: string, call: string}>;
}
const KavachNative = registerPlugin<KavachNativePlugin>('KavachPlugin');

interface OnboardingProps {
  user: any;
  onComplete: () => void;
  isReturningUser?: boolean;
}

export default function Onboarding({ user, onComplete, isReturningUser }: OnboardingProps) {
  const { t, language, setLanguage } = useLanguage();

  // ── Language-aware ToS reader ─────────────────────────────────────────
  // t() only works for keys typed in translations['en'].
  // For dynamic keys added later (tos_*) we read directly from translations.
  const tr = (key: string): string =>
    (translations as any)[language]?.[key] ||
    (translations as any)['en']?.[key] ||
    key;
  // ─────────────────────────────────────────────────────────────────────

  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<'female' | 'male' | null>(null);
  const [role, setRole] = useState<'citizen' | 'protector' | 'admin'>('citizen');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [authStatus, setAuthStatus] = useState<'idle' | 'signaling' | 'verifying' | 'locking' | 'saving' | 'error'>('idle');
  const [guardians, setGuardians] = useState<{name: string, phone: string}[]>([]);
  const [newGuardian, setNewGuardian] = useState({name: '', phone: ''});
  const [perms, setPerms] = useState<{sms: string, call: string}>({sms: 'prompt', call: 'prompt'});
  const [overlayGranted, setOverlayGranted] = useState(false);
  const [batteryExempt, setBatteryExempt] = useState(false);
  const [tosChecked, setTosChecked] = useState({ terms: false, permissions: false });

  React.useEffect(() => {
    const checkInterval = setInterval(async () => {
      if (Capacitor.isNativePlatform()) {
         const o = await KavachNative.isOverlayPermissionGranted();
         const b = await KavachNative.isIgnoringBatteryOptimizations();
         setOverlayGranted(o.granted);
         setBatteryExempt(b.isExempt);
      }
    }, 2000);
    return () => clearInterval(checkInterval);
  }, []);

  const checkPerms = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const KavachDirect = (window as any).KavachDirect;
        try {
          const status = await KavachNative.checkSafetyPermissions();
          setPerms(status);
        } catch (e: any) {
          // GHOST BRIDGE FALLBACK
          if (e.message?.includes("not implemented") && KavachDirect?.checkDirectPermissions) {
            console.log("KAVACH: Bridge Detached. Using Ghost Bridge for check...");
            const status = JSON.parse(KavachDirect.checkDirectPermissions());
            setPerms(status);
          } else { throw e; }
        }
      }
    } catch (err) { console.error("Perm Check Failed:", err); }
  };

  const requestPerms = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Step 1: Browser-level permissions (Camera, Mic)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getTracks().forEach(t => t.stop()); // Release immediately
        } catch (e) {
          console.warn('Camera/Mic permission skipped:', e);
        }

        // Step 2: Location
        try {
          navigator.geolocation.getCurrentPosition(() => {}, () => {});
        } catch (e) {}

        // Step 3: SMS + Call via Capacitor plugin (with 1s gap to avoid race)
        await new Promise(r => setTimeout(r, 1000));
        try {
          const result = await KavachNative.requestSensitivePermissions();
          setPerms(result);
        } catch (e) {
          console.warn('SMS/Call permission request failed:', e);
        }

        // Final check
        await checkPerms();
      } else {
        // Web: just request camera/mic
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getTracks().forEach(t => t.stop());
        } catch (e) {}
      }
    } catch (err) { console.error('Perm Request Failed:', err); }
  };

  const languages = [
    { id: 'en', label: 'English' }, { id: 'hi', label: 'हिन्दी' }, { id: 'hinglish', label: 'Hinglish' },
    { id: 'ml', label: 'മലയാളമ' }, { id: 'ta', label: 'தமிழ்' }, { id: 'te', label: 'తెలుగు' },
    { id: 'kn', label: 'ಕನ್ನಡ' }, { id: 'mr', label: 'मराठी' }, { id: 'gu', label: 'ગુજરાતી' },
    { id: 'bn', label: 'বাংলা' }, { id: 'pa', label: 'ਪੰਜਾਬੀ' }
  ];

  const handleGenderSelect = (selectedGender: 'female' | 'male' | 'admin') => {
    if (selectedGender === 'admin') {
      if (user?.email === 'singh.sachin16559@gmail.com') {
        setRole('admin');
        setGender('male');
        setStep(4);
      } else {
        alert("ACCESS DENIED: Neural link restricted to Command Personnel only.");
      }
      return;
    }

    // BLOCK: Non-admin roles for command personnel
    if (user?.email === 'singh.sachin16559@gmail.com' && (selectedGender as string) !== 'admin') {
      alert("COMMAND LOCK ACTIVE: This identity is restricted to Home Ministry operations.");
      return;
    }

    setGender(selectedGender as 'female' | 'male');
    if (selectedGender === 'male') {
      setRole('protector');
      setStep(4);
    } else {
      setStep(3);
    }
  };

  const handleIdentityAnchoring = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const cleanAadhaar = aadhaar.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10 || cleanAadhaar.length !== 12) {
      alert("CRITICAL: Valid 10-digit Phone and 12-digit Aadhaar UID required for mission entry.");
      return;
    }
    console.log("KAVACH: Identity Anchored. Phone:", cleanPhone, "Aadhaar:", cleanAadhaar);
    setStep(6);
  };

  const addGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newGuardian.phone.replace(/\D/g, '');
    if (!newGuardian.name || cleaned.length !== 10) {
      alert("Please enter a valid name and 10-digit number.");
      return;
    }
    setGuardians([...guardians, { ...newGuardian, phone: `+91${cleaned}` }]);
    setNewGuardian({name: '', phone: ''});
  };

  const finishOnboarding = async () => {
    console.log("KAVACH DEBUG: Entering finishOnboarding. User:", user?.uid);
    if (!user) {
      alert("MISSION ERROR: Tactical ID not found. Please re-authenticate.");
      return;
    }
    
    try {
      setAuthStatus('saving');
      const userProfile = {
        uid: user.uid,
        name: user.displayName || (role === 'admin' ? 'Command Admin' : role === 'protector' ? 'Verified Protector' : 'Verified Citizen'),
        role,
        gender: gender || 'female',
        phoneNumber: `+91${phoneNumber.replace(/\D/g, '')}`,
        aadhaar: aadhaar.replace(/\D/g, ''),
        xp: 0,
        createdAt: serverTimestamp()
      };

      console.log("KAVACH DEBUG: Anchoring profile to Firestore...");
      if (!isReturningUser && !user.uid.startsWith('dev-user')) {
        await setDoc(doc(db, 'users', user.uid), userProfile);
        console.log("KAVACH DEBUG: Profile anchored. Registering guardians...");
        for (const g of guardians) {
          await setDoc(doc(db, 'users', user.uid, 'guardians', `g_${Date.now()}`), {
            ...g,
            relation: 'Primary',
            createdAt: serverTimestamp()
          });
        }
      }
      
      if (!isReturningUser) {
        localStorage.setItem('kavach_registered', 'true');
        localStorage.setItem('kavach_uid', user.uid);
        localStorage.setItem('kavach_role', role);
        localStorage.setItem('kavach_gender', gender || 'female');
        localStorage.setItem('kavach_phone', `+91${phoneNumber.replace(/\D/g, '')}`);
        localStorage.setItem('kavach_aadhaar', aadhaar.replace(/\D/g, ''));
      }
      
      if (Capacitor.isNativePlatform()) {
        console.log("KAVACH DEBUG: Initializing Native Background Service...");
        const KavachDirect = (window as any).KavachDirect;
        try {
          await KavachNative.startService();
        } catch (e: any) {
          if (e.message?.includes("not implemented") && KavachDirect?.triggerEmergency) {
            console.log("KAVACH: Bridge Detached. Starting Service via Ghost Bridge...");
            KavachDirect.triggerEmergency();
          } else { throw e; }
        }
      }
      
      console.log("KAVACH DEBUG: Mission Readiness Complete.");
      onComplete();
    } catch (error: any) {
      console.error("KAVACH DEBUG Onboarding Error:", error);
      const errorMessage = error.message || "Unknown error";
      alert(`KAVACH Protocol Error: Failed to save profile.\n\nReason: ${errorMessage}`);
    } finally {
      setAuthStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-md w-full py-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto shadow-2xl">
                  <Languages className="text-accent-blue" size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">{t('protocol_language')}</h1>
                  <p className="text-text-dim text-[10px] font-bold uppercase tracking-[3px]">{t('select_dialect')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {languages.map((lang) => (
                  <button key={lang.id} onClick={() => setLanguage(lang.id as Language)} className={cn("p-4 rounded-xl border-2 transition-all text-center font-black uppercase text-xs tracking-widest leading-none", language === lang.id ? "bg-accent-blue/10 border-accent-blue text-white" : "bg-white/5 border-white/5 text-gray-500")}>
                    {lang.label}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => isReturningUser ? setStep(7) : setStep(2)} 
                className="w-full bg-white text-black py-5 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                {t('continue') || "Continue"} <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                  <User size={32} className="text-accent-blue" />
                </div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">{t('your_profile') || "Your Profile"}</h1>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[2px] opacity-60">Identity anchoring restricted to verified profiles.</p>
              </div>
              
              <div className="space-y-4">
                {/* GENDER-BASED ACCESS CONTROL: Admin lockdown */}
                {user?.email !== 'singh.sachin16559@gmail.com' ? (
                  <>
                    <button 
                      onClick={() => handleGenderSelect('female')}
                      className="w-full p-6 bg-white/2 border border-white/5 rounded-xl flex items-center gap-6 hover:border-accent-blue hover:bg-accent-blue/5 transition-all text-left"
                    >
                      <div className="w-14 h-14 bg-accent-red/10 rounded-xl flex items-center justify-center"><UserRound className="text-accent-red" /></div>
                      <div><h3 className="font-black italic uppercase text-xl leading-none mb-1">{t('female_profile')}</h3><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('women_safety_access')}</p></div>
                    </button>

                    <button 
                      onClick={() => handleGenderSelect('male')}
                      className="w-full p-6 bg-white/2 border border-white/5 rounded-xl flex items-center gap-6 hover:border-accent-blue hover:bg-accent-blue/5 transition-all text-left"
                    >
                      <div className="w-14 h-14 bg-accent-blue/10 rounded-xl flex items-center justify-center"><UserRound className="text-accent-blue" /></div>
                      <div><h3 className="font-black italic uppercase text-xl leading-none mb-1">{t('male_profile')}</h3><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('protector_onboarding')}</p></div>
                    </button>
                  </>
                ) : (
                  <div className="bg-accent-red/5 p-6 rounded-xl border border-accent-red/20 mb-4">
                    <p className="text-[10px] text-accent-red font-black uppercase tracking-[3px] italic">National Command Identity Verified</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase mt-2">Citizen and Protector paths restricted for Command Personnel.</p>
                  </div>
                )}

                {/* GENDER-BASED ACCESS CONTROL: Admin lockdown */}
                {user?.email === 'singh.sachin16559@gmail.com' && (
                  <button 
                    onClick={() => handleGenderSelect('admin')}
                    className="w-full p-6 border rounded-xl flex items-center gap-6 transition-all text-left bg-accent-red/10 border-accent-red shadow-[0_0_30px_rgba(255,59,48,0.2)]"
                  >
                    <div className="w-14 h-14 bg-accent-red/20 rounded-xl flex items-center justify-center"><ShieldCheck className="text-accent-red" /></div>
                    <div><h3 className="font-black italic uppercase text-xl leading-none mb-1">{t('super_cell_access')}</h3><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('mha_command_access')}</p></div>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter">Choose Role</h1>
                <p className="text-gray-500 text-xs tracking-widest uppercase font-bold">Protocol Selection for Verified Females</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => { setRole('citizen'); setStep(4); }}
                  className="w-full p-6 bg-white/2 border border-white/5 rounded-xl flex items-center gap-6 hover:border-accent-blue hover:bg-accent-blue/5 transition-all text-left"
                >
                  <div className="w-14 h-14 bg-accent-blue/10 rounded-xl flex items-center justify-center"><Shield className="text-accent-blue" /></div>
                  <div><h3 className="font-black italic uppercase text-xl leading-none mb-1">{t('women_safety')}</h3><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('sos_forensic')}</p></div>
                </button>

                <button 
                  onClick={() => { setRole('protector'); setStep(4); }}
                  className="w-full p-6 bg-white/2 border border-white/5 rounded-xl flex items-center gap-6 hover:border-accent-blue hover:bg-accent-blue/5 transition-all text-left"
                >
                  <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center"><CheckCircle2 className="text-green-500" /></div>
                  <div><h3 className="font-black italic uppercase text-xl leading-none mb-1">{t('protector')}</h3><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('rakshak_network_join')}</p></div>
                </button>
              </div>
              
              <button onClick={() => setStep(2)} className="w-full py-4 text-gray-500 font-bold uppercase text-[10px] tracking-widest">Go Back</button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl">
                <Smartphone className="text-accent-blue" size={40} />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{t('identity_anchor')}</h1>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px] leading-relaxed opacity-60">{t('secure_device_params')}</p>
              </div>

              <form onSubmit={handleIdentityAnchoring} className="space-y-5">
                <div className="space-y-4">
                  {/* Phone Input */}
                  <div className="relative flex items-center">
                    <span className="absolute left-6 text-white font-black italic text-xl opacity-40">+91</span>
                    <input 
                      required 
                      type="tel" 
                      maxLength={10} 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} 
                      placeholder={t('phone') || "Phone Number"} 
                      className="w-full bg-white/2 border border-white/10 rounded-xl pl-16 pr-6 py-5 text-xl font-mono tracking-tighter focus:border-accent-blue outline-none transition-all" 
                    />
                  </div>

                  {/* Aadhaar Input */}
                  <div className="space-y-3">
                    <input 
                      required 
                      type="tel" 
                      maxLength={12} 
                      value={aadhaar} 
                      onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))} 
                      placeholder={t('aadhaar_placeholder')} 
                      className="w-full bg-white/2 border border-white/10 rounded-xl px-6 py-5 text-xl font-mono tracking-tighter focus:border-accent-blue outline-none transition-all" 
                    />
                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest text-left ml-4 opacity-50">Note: Mission entry restricted via Government UID grid.</p>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-[9px] font-black text-accent-red uppercase tracking-widest leading-relaxed mb-8 italic opacity-80">
                    CRITICAL: Identity anchors are permanent for mission duration.
                  </p>
                  
                  <button type="submit" className="w-full bg-white text-black py-5 rounded-xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                    {t('identity_anchor')}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto shadow-2xl"><ShieldCheck size={40} className="text-accent-blue" /></div>
                  <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">{t('guardian_circle') || "Guardians"}</h1>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px] leading-relaxed opacity-60">{t('trust_contacts')}</p>
                </div>
                <div className="space-y-4">
                  {guardians.map((g, i) => (
                    <div key={i} className="bg-white/2 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                      <div className="font-mono">
                        <p className="text-[11px] font-black uppercase tracking-tight">{g.name}</p>
                        <p className="text-[9px] text-gray-500 font-bold">{g.phone}</p>
                      </div>
                      <button onClick={() => setGuardians(guardians.filter((_, idx) => idx !== i))} className="text-accent-red text-[9px] font-black uppercase tracking-widest px-3 py-1 hover:bg-accent-red/10 rounded-lg">DEL</button>
                    </div>
                  ))}
                  <form onSubmit={addGuardian} className="space-y-4 bg-white/5 p-4 rounded-3xl border border-dashed border-white/20">
                    <input type="text" placeholder="Guardian Name" value={newGuardian.name} onChange={(e) => setNewGuardian({...newGuardian, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none" />
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-gray-500 font-bold text-sm">+91</span>
                      <input type="tel" placeholder="Mobile Number" value={newGuardian.phone} onChange={(e) => setNewGuardian({...newGuardian, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="w-full bg-white/5 border border-white/10 rounded-xl pl-14 pr-4 py-3 text-sm focus:border-accent-blue outline-none" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-accent-blue/20 text-accent-blue rounded-xl font-black uppercase text-[10px] tracking-widest">Add Guardian</button>
                  </form>
                </div>
                <button disabled={guardians.length === 0} onClick={() => setStep(7)} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all">
                  Next: Safety Check
                </button>
              </div>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div key="step7" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* ── Sticky Heading ── */}
              <div className="text-center space-y-3 pb-2">
                <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-2xl relative">
                  <div className="absolute inset-0 bg-red-500/10 rounded-2xl animate-pulse" />
                  <ShieldCheck className="text-red-400 relative z-10" size={32} />
                </div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-white">
                  Mission Readiness
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[3px] text-red-400">
                  {isReturningUser ? "⚠️ Neural profile found — Need hardware sync" : "⚠️ All 3 shields must be activated to proceed"}
                </p>
              </div>

              {/* ── Toggle Cards ── */}
              <div className="space-y-3">

                {/* 1. Persistent Guard — Battery */}
                <div className={cn(
                  "p-4 rounded-2xl border-2 transition-all",
                  batteryExempt ? "bg-green-500/10 border-green-500/40" : "bg-white/3 border-white/10"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Activity className={cn("flex-shrink-0", batteryExempt ? "text-green-400" : "text-gray-400")} size={22} />
                      <div>
                        <p className={cn("text-[11px] font-black uppercase tracking-widest", batteryExempt ? "text-green-300" : "text-white")}>
                          Persistent Guard
                        </p>
                        <p className="text-[8px] text-gray-500 font-bold mt-0.5">Battery optimization bypass</p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      onClick={() => KavachNative.openBatterySettings()}
                      className={cn(
                        "relative w-14 h-7 rounded-full transition-all flex-shrink-0 border-2",
                        batteryExempt ? "bg-green-500 border-green-400" : "bg-gray-700 border-gray-600"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full shadow-lg transition-all duration-300",
                        batteryExempt ? "right-0.5 bg-white" : "left-0.5 bg-gray-400"
                      )} />
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
                    KAVACH will never sleep — continuous shake detection even when device is inactive.
                  </p>
                  {!batteryExempt && (
                    <p className="text-[8px] text-amber-400 font-black mt-1 uppercase tracking-wider">
                      → Tap toggle to open Battery Settings. Set KAVACH to Unrestricted.
                    </p>
                  )}
                </div>

                {/* 2. Tactical Break-In — Overlay */}
                <div className={cn(
                  "p-4 rounded-2xl border-2 transition-all",
                  overlayGranted ? "bg-green-500/10 border-green-500/40" : "bg-white/3 border-white/10"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <ScanLine className={cn("flex-shrink-0", overlayGranted ? "text-green-400" : "text-gray-400")} size={22} />
                      <div>
                        <p className={cn("text-[11px] font-black uppercase tracking-widest", overlayGranted ? "text-green-300" : "text-white")}>
                          Tactical Break-In
                        </p>
                        <p className="text-[8px] text-gray-500 font-bold mt-0.5">Display over other apps</p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      onClick={() => KavachNative.openOverlaySettings()}
                      className={cn(
                        "relative w-14 h-7 rounded-full transition-all flex-shrink-0 border-2",
                        overlayGranted ? "bg-green-500 border-green-400" : "bg-gray-700 border-gray-600"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full shadow-lg transition-all duration-300",
                        overlayGranted ? "right-0.5 bg-white" : "left-0.5 bg-gray-400"
                      )} />
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
                    SOS alert will hijack your lock-screen for instant zero-touch response.
                  </p>
                  {!overlayGranted && (
                    <p className="text-[8px] text-amber-400 font-black mt-1 uppercase tracking-wider">
                      → Tap toggle → Enable "Display over other apps".
                    </p>
                  )}
                </div>

                {/* 3. Lifeline Grid — SMS + Call */}
                <div className={cn(
                  "p-4 rounded-2xl border-2 transition-all",
                  perms.sms === 'granted' && perms.call === 'granted' ? "bg-green-500/10 border-green-500/40" : "bg-white/3 border-white/10"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Smartphone className={cn("flex-shrink-0", perms.sms === 'granted' && perms.call === 'granted' ? "text-green-400" : "text-gray-400")} size={22} />
                      <div>
                        <p className={cn("text-[11px] font-black uppercase tracking-widest", perms.sms === 'granted' && perms.call === 'granted' ? "text-green-300" : "text-white")}>
                          Lifeline Grid
                        </p>
                        <p className="text-[8px] text-gray-500 font-bold mt-0.5">SMS + Emergency Call permission</p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      onClick={requestPerms}
                      className={cn(
                        "relative w-14 h-7 rounded-full transition-all flex-shrink-0 border-2",
                        perms.sms === 'granted' && perms.call === 'granted' ? "bg-green-500 border-green-400" : "bg-gray-700 border-gray-600"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full shadow-lg transition-all duration-300",
                        perms.sms === 'granted' && perms.call === 'granted' ? "right-0.5 bg-white" : "left-0.5 bg-gray-400"
                      )} />
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-2 leading-relaxed">
                    Auto-dispatch: Instant SMS and emergency calls to your guardians — no screen interaction needed.
                  </p>
                  {Capacitor.isNativePlatform() && (perms.sms !== 'granted' || perms.call !== 'granted') && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-[8px] text-amber-400 font-black uppercase tracking-wider">
                        → Tap toggle to request permission. Dialog not appearing?
                      </p>
                      <button
                        onClick={() => KavachNative.openAppSettings()}
                        className="w-full py-1.5 bg-amber-500/15 text-amber-400 rounded-lg text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all border border-amber-500/20"
                      >
                        📱 Open App Settings → Grant Manually
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Gate: All 3 must be ON ── */}
              {!(batteryExempt && overlayGranted && perms.sms === 'granted' && perms.call === 'granted') && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="text-lg">🔒</span>
                  <div>
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">All 3 shields required</p>
                    <p className="text-[8px] text-gray-500 mt-0.5">Activate all toggles above to proceed to Terms & Activate</p>
                  </div>
                </div>
              )}

              {/* ── ToS + Activate — only shown when all 3 are ON ── */}
              {batteryExempt && overlayGranted && perms.sms === 'granted' && perms.call === 'granted' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* ToS Card - Skip for returning users */}
                  {!isReturningUser && (
                    <div className="rounded-2xl overflow-hidden border border-red-500/30 bg-[#0f0a0a]">
                      <div className="bg-red-900/60 px-5 py-4 flex items-start gap-3">
                        <span className="text-lg mt-0.5">⚖️</span>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[2px] text-red-300">{tr('tos_title')}</p>
                          <p className="text-[9px] text-red-400/70 mt-0.5">{tr('tos_updated')}</p>
                        </div>
                      </div>
                      <div className="p-4 space-y-4 max-h-52 overflow-y-auto">
                        <p className="text-[10px] text-white font-semibold leading-relaxed">{tr('tos_intro')}</p>
                        <div className="space-y-1"><p className="text-[9px] font-black text-white uppercase tracking-wider">{tr('tos_s1_title')}</p><p className="text-[9px] text-gray-300 leading-relaxed">{tr('tos_s1')}</p></div>
                        <div className="space-y-1"><p className="text-[9px] font-black text-amber-300 uppercase tracking-wider">{tr('tos_s2_title')}</p><p className="text-[9px] text-gray-300 leading-relaxed">{tr('tos_s2')}</p></div>
                        <div className="space-y-1"><p className="text-[9px] font-black text-red-400 uppercase tracking-wider">{tr('tos_s3_title')}</p><p className="text-[9px] text-gray-300 leading-relaxed">{tr('tos_s3')}</p></div>
                        <div className="space-y-1"><p className="text-[9px] font-black text-blue-400 uppercase tracking-wider">{tr('tos_s4_title')}</p><p className="text-[9px] text-gray-300 leading-relaxed">{tr('tos_s4')}</p></div>
                        <div className="space-y-1"><p className="text-[9px] font-black text-green-400 uppercase tracking-wider">{tr('tos_s5_title')}</p><p className="text-[9px] text-gray-300 leading-relaxed">{tr('tos_s5')}</p></div>
                      </div>
                      <div className="px-4 pb-4 pt-3 border-t border-white/10 space-y-4 bg-black/30">
                        <button onClick={() => setTosChecked(p => ({ ...p, terms: !p.terms }))} className="flex items-start gap-3 w-full text-left">
                          <div className={cn("mt-0.5 w-5 h-5 min-w-[20px] rounded border-2 flex items-center justify-center transition-all flex-shrink-0", tosChecked.terms ? "bg-green-500 border-green-500" : "border-gray-400")}>
                            {tosChecked.terms && <CheckCircle2 size={13} className="text-black" />}
                          </div>
                          <p className="text-[10px] text-white leading-relaxed">{tr('tos_check1')}</p>
                        </button>
                        <button onClick={() => setTosChecked(p => ({ ...p, permissions: !p.permissions }))} className="flex items-start gap-3 w-full text-left">
                          <div className={cn("mt-0.5 w-5 h-5 min-w-[20px] rounded border-2 flex items-center justify-center transition-all flex-shrink-0", tosChecked.permissions ? "bg-green-500 border-green-500" : "border-gray-400")}>
                            {tosChecked.permissions && <CheckCircle2 size={13} className="text-black" />}
                          </div>
                          <p className="text-[10px] text-white leading-relaxed">{tr('tos_check2')}</p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Activate Button */}
                  <button
                    disabled={( !isReturningUser && (!tosChecked.terms || !tosChecked.permissions) ) || authStatus === 'saving'}
                    onClick={async () => {
                      setAuthStatus('saving');
                      try {
                        await finishOnboarding();
                      } catch (err: any) {
                        setAuthStatus('idle');
                        alert(`Activation failed: ${err.message || 'Try again'}`);
                      }
                    }}
                    className={cn(
                      "w-full py-5 rounded-2xl font-black uppercase tracking-[3px] text-xs shadow-2xl transition-all",
                      (isReturningUser || (tosChecked.terms && tosChecked.permissions))
                        ? "bg-white text-black active:scale-95"
                        : "bg-white/10 text-white/40 cursor-not-allowed border border-white/10"
                    )}
                  >
                    {authStatus === 'saving'
                      ? "SYNCING GRID..."
                      : isReturningUser
                        ? "Restore Mission Shield"
                        : tosChecked.terms && tosChecked.permissions
                          ? tr('tos_confirm')
                          : "✋ Accept Terms To Continue"}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
