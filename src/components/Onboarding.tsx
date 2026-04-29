import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useKavachStore } from '../store/useKavachStore';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

// 🛡️ Register Plugin Once at Top level to avoid memory leaks during polling
const KavachNative = registerPlugin<any>('KavachPlugin');

// 🛡️ Onboarding Components
import ShieldsStep from './onboarding/ShieldsStep';
import GenderStep from './onboarding/GenderStep';
import RoleStep from './onboarding/RoleStep';
import IdentityStep from './onboarding/IdentityStep';
import GuardiansStep from './onboarding/GuardiansStep';
import SecurityPinStep from './onboarding/SecurityPinStep';

// 🛡️ Verhoeff Algorithm for Aadhaar Checksum Validation
const verhoeffTableD = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
const verhoeffTableP = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
const validateAadhaar = (val: string) => {
  if (val.length !== 12) return false;
  let c = 0;
  let rev = val.split('').reverse().map(Number);
  for (let i = 0; i < rev.length; i++) c = verhoeffTableD[c][verhoeffTableP[(i % 8)][rev[i]]];
  return (c === 0);
};

interface OnboardingProps {
  user: any;
  onComplete: () => void;
  isReturningUser?: boolean;
}

export default function Onboarding({ user, onComplete, isReturningUser = false }: OnboardingProps) {
  const { setRole: setStoreRole, setGender: setStoreGender } = useKavachStore();
  const { t } = useLanguage();
  const [userName, setUserName] = useState(user?.displayName || '');
  const [userPhone, setUserPhone] = useState(user?.phoneNumber || '');
  const [safetyPin, setLocalSafetyPin] = useState('');
  const [step, setStep] = useState(1);
  const [perms, setPerms] = useState({
    sms: 'prompt',
    call: 'prompt',
    camera: 'prompt',
    location: 'prompt',
    microphone: 'prompt'
  });
  const [overlayGranted, setOverlayGranted] = useState(false);
  const [batteryExempt, setBatteryExempt] = useState(false);
  const [gender, setGender] = useState<'female' | 'male' | null>(null);
  const [role, setRole] = useState<'citizen' | 'protector' | null>(null);
  const [aadhaar, setAadhaar] = useState('');
  const [guardians, setGuardians] = useState<{ name: string; phone: string }[]>([]);
  const [tosChecked, setTosChecked] = useState({ terms: false, permissions: false });
  const [isFinishing, setIsFinishing] = useState(false);
  
  // 🛰️ AUTO-SYNC FOR RETURNING OPERATIVES
  useEffect(() => {
    if (isReturningUser) {
      setStep(6);
    }
  }, [isReturningUser]);

  // 1. HARDWARE STATUS SYNC
  const checkHardwareStatus = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const o = await KavachNative.isOverlayPermissionGranted();
      const b = await KavachNative.isIgnoringBatteryOptimizations();
      const p = await KavachNative.checkSafetyPermissions();
      const geo = await Geolocation.checkPermissions();
      const cam = await Camera.checkPermissions();

      setOverlayGranted(o.granted);
      setBatteryExempt(b.isExempt);
      setPerms({
        sms: p.sms || 'prompt',
        call: p.call || 'prompt',
        location: geo.location || 'prompt',
        camera: cam.camera || 'prompt',
        microphone: p.microphone || 'prompt'
      });
    } catch (e) {
      console.error("Hardware Sync Error:", e);
    }
  };

  useEffect(() => {
    let checkInterval: any;
    if (step === 6 && Capacitor.isNativePlatform()) {
      checkHardwareStatus();
      checkInterval = setInterval(checkHardwareStatus, 3000); // 3s for better stability
    }
    return () => { if (checkInterval) clearInterval(checkInterval); };
  }, [step]);

  // 2. PERMISSION HANDLERS
  const handleShieldToggle = async (id: string) => {
    if (!Capacitor.isNativePlatform()) {
      if (id === 'lifeline') setBatteryExempt(true);
      if (id === 'evidence') setOverlayGranted(true);
      if (id === 'guardian') setPerms({ sms: 'granted', call: 'granted', location: 'granted', camera: 'granted', microphone: 'granted' });
      toast.success(`DEBUG: ${id.toUpperCase()} Activated`);
      return;
    }

    try {
      if (id === 'guardian') {
        // 1. Native Sensitive (SMS, CALL, MIC, PHONE_STATE)
        await KavachNative.requestSensitivePermissions();
        await new Promise(r => setTimeout(r, 1200));

        // 2. High-Precision Location (GPS)
        await Geolocation.requestPermissions();
        await new Promise(r => setTimeout(r, 1200));

        // 3. Visual Forensics (Camera)
        await Camera.requestPermissions();
        
        await checkHardwareStatus();
      } else if (id === 'lifeline') {
        await KavachNative.openBatterySettings();
      } else if (id === 'evidence') {
        await KavachNative.openOverlaySettings();
      }
    } catch (e) {
      console.warn("Shield Toggle Error:", e);
      toast.error("Process interrupted. Please try again.");
    }
  };

  const finishOnboarding = async () => {
    if (!user) return;
    setIsFinishing(true);
    try {
      // 🛡️ IDENTITY LOCK: Check for duplicate Aadhaar registration
      if (aadhaar) {
        const q = query(collection(db, 'users'), where('aadhar', '==', aadhaar));
        const snap = await getDocs(q);
        const duplicate = snap.docs.find(d => d.id !== user.uid);
        if (duplicate) {
          toast.error("THIS AADHAAR IS ALREADY LINKED TO ANOTHER ACCOUNT.");
          setIsFinishing(false);
          return;
        }
      }

      // 🛡️ PHONE LOCK: Check for duplicate Phone registration
      if (userPhone) {
        const q = query(collection(db, 'users'), where('phoneNumber', '==', userPhone));
        const snap = await getDocs(q);
        const duplicate = snap.docs.find(d => d.id !== user.uid);
        if (duplicate) {
          toast.error("THIS PHONE NUMBER IS ALREADY LINKED TO ANOTHER ACCOUNT.");
          setIsFinishing(false);
          return;
        }
      }

      let initialLocation = null;
      try {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        initialLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
      } catch (geoError) {
        console.warn("Initial location capture failed:", geoError);
      }

      const currentRole = role || 'citizen';

      const userProfile = {
        uid: user.uid,
        name: userName.toUpperCase(),
        phoneNumber: userPhone,
        safetyPin: safetyPin,
        role: currentRole,
        gender: gender || 'female',
        isRegistered: true,
        isVerified: false, // 🛡️ MISSION CRITICAL: Initialize verification gate
        aadhaarMask: aadhaar ? `XXXX-XXXX-${aadhaar.slice(-4)}` : null,
        aadhar: aadhaar || null, // 🛡️ FULL IDENTITY UPLINK: For SuperCell Verification
        lastLocation: initialLocation, // 📍 HOME POINT CAPTURE
        onboardedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid), userProfile, { merge: true });

      if (role === 'citizen') {
        const guardianCol = collection(db, 'users', user.uid, 'guardians');
        for (const g of guardians) {
          if (g.name && g.phone) {
            const cleanPhone = g.phone.replace(/\D/g, '');
            await addDoc(guardianCol, {
              name: g.name.toUpperCase(),
              phone: `+91${cleanPhone}`,
              createdAt: serverTimestamp()
            });
          }
        }
      }

      if (Capacitor.isNativePlatform()) {
        await KavachNative.initializeService({ userId: user.uid, role: role }).catch(() => {});
      }

      setStoreRole(role || 'citizen');
      setStoreGender(gender || 'female');
      useKavachStore.getState().setSafetyPin(safetyPin);

      localStorage.setItem('kavach_registered', 'true');
      localStorage.setItem('kavach_hardware_synced', 'true');

      onComplete();
    } catch (e) {
      toast.error("Failed to sync profile.");
    } finally {
      setIsFinishing(false);
    }
  };

  const nextStep = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) {
      if (role === 'protector') setStep(6); // Protectors skip PIN and Guardians
      else setStep(4);
    }
    else if (step === 4) setStep(5);
    else if (step === 5) setStep(6);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[#050505] flex flex-col p-4 text-white font-sans select-none overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />

      {/* 🛰️ Consistent Branding Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-red/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-red/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-0 relative z-10 py-2 sm:py-6">
        <AnimatePresence mode="wait">
          <motion.div 
            key={`step-${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {step === 1 && (
              <GenderStep
                gender={gender} setGender={setGender}
                userName={userName} setUserName={setUserName}
                userPhone={userPhone} setUserPhone={setUserPhone}
              />
            )}
            {step === 2 && (
              <RoleStep role={role} setRole={setRole} gender={gender} />
            )}
            {step === 3 && (
              <IdentityStep 
                aadhaar={aadhaar} setAadhaar={setAadhaar} 
                phone={userPhone} setPhone={setUserPhone}
              />
            )}
            {step === 4 && (
              <SecurityPinStep pin={safetyPin} setPin={setLocalSafetyPin} />
            )}
            {step === 5 && (
              <GuardiansStep guardians={guardians} setGuardians={setGuardians} />
            )}
            {step === 6 && (
              <ShieldsStep
                batteryExempt={batteryExempt}
                overlayGranted={overlayGranted}
                perms={perms}
                isReturningUser={isReturningUser}
                tosChecked={tosChecked}
                setTosChecked={setTosChecked}
                onActivate={finishOnboarding}
                authStatus={isFinishing ? 'saving' : 'idle'}
                tr={t}
                onOpenBattery={() => handleShieldToggle('lifeline')}
                onOpenOverlay={() => handleShieldToggle('evidence')}
                onRequestPerms={() => handleShieldToggle('guardian')}
                onOpenAppSettings={async () => {
                  if (Capacitor.isNativePlatform()) {
                    await KavachNative.openAppSettings();
                  }
                }}
                isNative={Capacitor.isNativePlatform()}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="pt-6 mt-2 border-t border-white/5">
          {step < 6 ? (
            <button
              disabled={
                (step === 1 && !gender) ||
                (step === 2 && !role) ||
                (step === 3 && (!validateAadhaar(aadhaar) || !userPhone)) ||
                (step === 4 && safetyPin.length < 4) ||
                (step === 5 && role === 'citizen' && guardians.length === 0)
              }
              onClick={nextStep}
              className={cn(
                "w-full py-5 rounded-[24px] font-black uppercase text-[11px] border-2 transition-all italic tracking-[3px]",
                ((step === 1 && gender) ||
                  (step === 2 && role) ||
                  (step === 3 && validateAadhaar(aadhaar) && userPhone) ||
                  (step === 4 && safetyPin.length === 4) ||
                  (step === 5 && (role !== 'citizen' || guardians.length > 0)))
                  ? "bg-white text-black border-white shadow-2xl"
                  : "bg-white/5 text-gray-500 border-white/5"
              )}
            >
              {step === 1 ? t('confirm_profile_next') :
                step === 2 ? t('confirm_role_continue') :
                  step === 3 ? t('verify_aadhaar_btn') :
                    step === 4 ? "CONFIGURE SECURITY PIN" :
                      t('secure_network_btn')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
