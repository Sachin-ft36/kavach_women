import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useKavachStore } from '../store/useKavachStore';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { KavachNative } from '../services/KavachNative';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield } from 'lucide-react';

// 🛡️ Onboarding Components
import ShieldsStep from './onboarding/ShieldsStep';
import GenderStep from './onboarding/GenderStep';
import RoleStep from './onboarding/RoleStep';
import IdentityStep from './onboarding/IdentityStep';
import GuardiansStep from './onboarding/GuardiansStep';
import SecurityPinStep from './onboarding/SecurityPinStep';
import ProtectorVerificationStep from './onboarding/ProtectorVerificationStep';

// 🛡️ Verhoeff Algorithm for Aadhaar Checksum Validation
const verhoeffTableD = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]];
const verhoeffTableP = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]];
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
  const { setRole: setStoreRole, setGender: setStoreGender, isSentinelActive, setSentinelActive } = useKavachStore();
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
  const [role, setRole] = useState<'citizen' | 'protector' | null>(null);
  const [gender, setGender] = useState<'female' | 'male' | null>(null);
  const [aadhaar, setAadhaar] = useState('');
  const [guardians, setGuardians] = useState<{ name: string; phone: string; relation: string }[]>([]);
  const [tosChecked, setTosChecked] = useState({ terms: false, permissions: false });
  const [isFinishing, setIsFinishing] = useState(false);
  const [protectorData, setProtectorData] = useState({
    fullName: '',
    address: '',
    occupation: '',
    customOccupation: '',
    reason: '',
    agreement: false
  });

  useEffect(() => {
    if (isReturningUser) setStep(7); // Skip Guardians and jump straight to Shields/Permissions
  }, [isReturningUser]);

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
      checkInterval = setInterval(checkHardwareStatus, 300);
    }
    return () => { if (checkInterval) clearInterval(checkInterval); };
  }, [step]);

  const handleShieldToggle = async (id: string) => {
    if (!Capacitor.isNativePlatform()) {
      if (id === 'lifeline') setBatteryExempt(true);
      if (id === 'evidence') setOverlayGranted(true);
      if (id === 'guardian') setPerms({ sms: 'granted', call: 'granted', location: 'granted', camera: 'granted', microphone: 'granted' });
      return;
    }
    try {
      if (id === 'guardian') {
        await KavachNative.requestSensitivePermissions();
        await Geolocation.requestPermissions();
        await Camera.requestPermissions();
        await checkHardwareStatus();
      } else if (id === 'lifeline') await KavachNative.openBatterySettings();
      else if (id === 'evidence') await KavachNative.openOverlaySettings();
    } catch (e) {
      console.warn("Shield Toggle Error:", e);
    }
  };

  const finishOnboarding = async () => {
    if (!user) return;
    setIsFinishing(true);
    try {
      if (aadhaar) {
        // Master Ledger Check (Everyone is in 'users')
        const q = query(collection(db, 'users'), where('aadhar', '==', aadhaar));
        const snap = await getDocs(q);
        const duplicate = snap.docs.find(d => d.id !== user.uid);
        if (duplicate) {
          toast.error("Aadhaar already linked to another account.");
          setIsFinishing(false);
          return;
        }
      }
      if (userPhone) {
        const q = query(collection(db, 'users'), where('phoneNumber', '==', userPhone));
        const snap = await getDocs(q);
        const duplicate = snap.docs.find(d => d.id !== user.uid);
        if (duplicate) {
          toast.error("Phone number already linked to another account.");
          setIsFinishing(false);
          return;
        }
      }

      let initialLocation = null;
      let fullAddress = "Sector Unknown";
      try {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        initialLocation = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy };
        
        // 🛰️ RESOLVE PRECISION ADDRESS (FALLBACK TO COORDINATES)
        fullAddress = `Sector Grid: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      } catch (geoError) {}

        const userProfile = {
        uid: user.uid,
        name: (userName || "User"),
        email: user.email || "",
        phoneNumber: userPhone || user.phoneNumber || "",
        safetyPin: safetyPin,
        role: role || 'citizen',
        gender: gender || 'female',
        isRegistered: true,
        isVerified: role === 'citizen' ? true : (gender === 'female' ? true : false),
        aadhaarMask: aadhaar ? `XXXX-XXXX-${aadhaar.slice(-4)}` : null,
        aadhar: aadhaar || null,
        onboardedAt: serverTimestamp(),
        
        // 🛰️ FORENSIC LOCATION PACKET (Professional Standard)
        lastLocation: initialLocation, // { lat, lng, accuracy }
        locationData: {
          lat: initialLocation?.lat || null,
          lng: initialLocation?.lng || null,
          accuracy: initialLocation?.accuracy || null,
          city: fullAddress.split(',').slice(-3, -2)[0]?.trim() || "Unknown",
          district: fullAddress.split(',').slice(-4, -3)[0]?.trim() || "Unknown",
          state: fullAddress.split(',').slice(-2, -1)[0]?.trim() || "Unknown",
          pincode: fullAddress.match(/\b\d{6}\b/)?.[0] || "Unknown",
          formattedAddress: fullAddress
        },
        fullAddress: fullAddress,
        state: fullAddress.split(',').slice(-2, -1)[0]?.trim() || "Unknown",
        
        primaryGuardian: guardians.length > 0 ? {
          name: guardians[0].name,
          phone: `+91${guardians[0].phone.replace(/\D/g, '')}`,
          relation: guardians[0].relation
        } : null,
        onboardedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        protectorVetting: role === 'protector' && gender === 'male' ? protectorData : null
      };

      // 🛰️ MULTI-PATH SYSTEMATIC SYNC WITH TACTICAL TIMEOUT
      const syncTasks = async () => {
        // 1. Master Ledger
        const cleanProfile = Object.fromEntries(
          Object.entries(userProfile).filter(([_, v]) => v !== "" && v !== null)
        );
        await setDoc(doc(db, 'users', user.uid), cleanProfile, { merge: true });

        // 2. Gender-Specific Partitioning
        if (gender === 'male') {
          await setDoc(doc(db, 'male_users', user.uid), userProfile, { merge: true });
        } else {
          await setDoc(doc(db, 'women_users', user.uid), userProfile, { merge: true });
          if (role === 'citizen') {
            await setDoc(doc(db, 'women_users', user.uid, 'safety_data', 'status'), {
              active: true, setupAt: serverTimestamp(), type: 'Citizen/Safety'
            });
          }
          if (role === 'protector') {
            await setDoc(doc(db, 'women_users', user.uid, 'protector_data', 'status'), {
              active: true, setupAt: serverTimestamp(), type: 'Protector/Rakshak'
            });
          }
        }

        if (role === 'citizen' && guardians.length > 0) {
          const guardianCol = collection(db, 'users', user.uid, 'guardians');
          for (const g of guardians) {
            if (g.name && g.phone) {
              const cleanPhone = g.phone.replace(/\D/g, '');
              await addDoc(guardianCol, { 
                name: g.name, phone: `+91${cleanPhone}`, relation: g.relation || 'Guardian', createdAt: serverTimestamp() 
              }).catch(() => {});
            }
          }
        }

        if (Capacitor.isNativePlatform()) {
          // 🛡️ NATIVE HANDSHAKE: Non-blocking to prevent UI hang
          KavachNative.initializeService({ userId: user.uid, role: role }).catch(() => {});
        }
      };

      // ⚡ FAST-TRACK EXECUTION: Don't wait for everything if it's taking too long
      await Promise.race([
        syncTasks(),
        new Promise(resolve => setTimeout(resolve, 3000)) // 3s Max Wait
      ]);

      setStoreRole(role || 'citizen');
      setStoreGender(gender || 'female');
      const store = useKavachStore.getState();
      store.setSafetyPin(safetyPin);
      store.setRegistered(true);
      store.setVerified(role === 'citizen' ? true : (gender === 'female' ? true : false));
      localStorage.setItem('kavach_hardware_synced', 'true');
      onComplete();
    } catch (e: any) {
      toast.error(`Configuration Error: ${e.message}`);
    } finally {
      setIsFinishing(false);
    }
  };

  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);

  const nextStep = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) {
      if (role === 'protector') {
         if (gender === 'male') setStep(4);
         else setStep(5);
      } else {
         setStep(5);
      }
    }
    else if (step === 4) {
       if (gender === 'male') setStep(7); // Skip Pin for Males
       else setStep(5);
    }
    else if (step === 5) {
       if (role === 'citizen') setStep(6);
       else setStep(7);
    }
    else if (step === 6) setStep(7);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-white flex flex-col text-gray-900 font-sans overflow-hidden">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col relative z-10 px-4 sm:px-8 py-3 sm:py-8">
        {/* Step Progress Indicator */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-10">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div 
              key={s} 
              className={cn(
                "h-2 flex-1 rounded-full transition-all duration-500",
                s === step ? "bg-[#2563EB] shadow-lg shadow-[#2563EB]/20" : s < step ? "bg-[#10B981]" : "bg-gray-100"
              )} 
            />
          ))}
        </div>

        <div 
          key={`step-${step}`} 
          className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar -mx-2 px-2 pb-4"
        >
          {step === 1 && <IdentityStep aadhaar={aadhaar} setAadhaar={setAadhaar} phone={userPhone} setPhone={setUserPhone} setUserName={setUserName} setRole={setRole} setIsVerified={setIsAadhaarVerified} onNext={nextStep} />}
          {step === 2 && <GenderStep gender={gender} setGender={setGender} userName={userName} setUserName={setUserName} userPhone={userPhone} setUserPhone={setUserPhone} />}
          {step === 3 && <RoleStep role={role} setRole={setRole} gender={gender} />}
          {step === 4 && <ProtectorVerificationStep data={protectorData} setData={setProtectorData} />}
          {step === 5 && <SecurityPinStep pin={safetyPin} setPin={setLocalSafetyPin} />}
          {step === 6 && <GuardiansStep guardians={guardians} setGuardians={setGuardians} />}
          {step === 7 && (
            <ShieldsStep
              batteryExempt={batteryExempt} overlayGranted={overlayGranted} perms={perms} isReturningUser={isReturningUser}
              tosChecked={tosChecked} setTosChecked={setTosChecked} onActivate={finishOnboarding} authStatus={isFinishing ? 'saving' : 'idle'}
              tr={t} onOpenBattery={() => handleShieldToggle('lifeline')} onOpenOverlay={() => handleShieldToggle('evidence')}
              onRequestPerms={() => handleShieldToggle('guardian')} onOpenAppSettings={async () => { if (Capacitor.isNativePlatform()) await KavachNative.openAppSettings(); }}
              isNative={Capacitor.isNativePlatform()}
              isSentinelActive={isSentinelActive}
              setSentinelActive={setSentinelActive}
            />
          )}
        </div>

        <div className="pt-2 sm:pt-8">
          {step < 7 ? (
            <button
              disabled={
                (step === 1 && !isAadhaarVerified) || 
                (step === 2 && !gender) || 
                (step === 3 && !role) || 
                (step === 4 && (!protectorData.fullName || !protectorData.address || !protectorData.occupation || !protectorData.agreement)) ||
                (step === 5 && safetyPin.length < 4) || 
                (step === 6 && role === 'citizen' && guardians.length === 0)
              }
              onClick={nextStep}
              className={cn(
                "w-full py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all shadow-xl active:scale-[0.98]", 
                (
                  (step === 1 && isAadhaarVerified) || 
                  (step === 2 && gender) || 
                  (step === 3 && role) || 
                  (step === 4 && (protectorData.fullName && protectorData.address && protectorData.occupation && protectorData.agreement)) ||
                  (step === 5 && safetyPin.length === 4) || 
                  (step === 6 && guardians.length > 0)
                ) 
                  ? "bg-[#2563EB] text-white shadow-[#2563EB]/25" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
              )}
            >
              {step === 1 ? "Verify & Link" : step === 2 ? "Confirm Category" : step === 3 ? "Confirm Profile" : step === 4 ? "Submit Verification" : step === 5 ? "Configure Pin" : "Setup Guardians"}
            </button>
          ) : null}
          
          <div className="mt-4 sm:mt-8 flex flex-col items-center gap-2 sm:gap-4">
             <div className="flex items-center justify-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                   <Shield size={16} className="text-[#2563EB]" />
                </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-[2px] sm:tracking-[3px]">Kavach Safety Grid</span>
             </div>
             
             <div className="flex flex-col items-center gap-3 pt-2 opacity-80">
                <img src="/digitalindia.png" alt="Digital India" className="h-12 w-auto object-contain" />
                <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest text-center px-6">
                  © 2024 Unique Identification Authority of India (UIDAI) | All Rights Reserved
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
