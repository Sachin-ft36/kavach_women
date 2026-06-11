import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useKavachStore } from '../store/useKavachStore';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { getLiveLocation, getReverseMetadata } from '../services/locationService';
import { KavachNative } from '../services/KavachNative';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, ChevronLeft } from 'lucide-react';

// 🛡️ Onboarding Components
import ShieldsStep from './onboarding/ShieldsStep';
import RoleStep from './onboarding/RoleStep';
import IdentityStep from './onboarding/IdentityStep';
import GuardiansStep from './onboarding/GuardiansStep';
import SecurityPinStep from './onboarding/SecurityPinStep';
import ProtectorVerificationStep from './onboarding/ProtectorVerificationStep';
import ReviewStep from './onboarding/ReviewStep';

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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [roleSubStep, setRoleSubStep] = useState<'select' | 'vetting'>('select');
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);

  const [perms, setPerms] = useState({
    sms: 'prompt',
    call: 'prompt',
    camera: 'prompt',
    location: 'prompt',
    microphone: 'prompt'
  });
  const [overlayGranted, setOverlayGranted] = useState(false);
  const [fullScreenGranted, setFullScreenGranted] = useState(true);
  const [batteryExempt, setBatteryExempt] = useState(false);
  const [role, setRole] = useState<'citizen' | 'protector' | 'pcr_officer' | null>(null);
  const [gender, setGender] = useState<'female' | 'male' | null>(null);
  const [aadhaar, setAadhaar] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [dob, setDob] = useState('');
  const [guardians, setGuardians] = useState<{ name: string; phone: string; relation: string }[]>([]);
  const [tosChecked, setTosChecked] = useState({ terms: false, permissions: false });
  const [isFinishing, setIsFinishing] = useState(false);
  const [protectorData, setProtectorData] = useState({
    fullName: '',
    address: '',
    occupation: '',
    customOccupation: '',
    reason: '',
    agreement: false,
    serviceNumber: '',
    isServiceNumberValid: false,
    badgeId: '',
    vehicleNo: '',
    rank: '',
    thanaName: ''
  });

  useEffect(() => {
    if (isReturningUser) {
      setStep(5); // Skip to Shields/Permissions (now Step 5)
      setTosChecked({ terms: true, permissions: true }); // Auto-check for existing users
    }
  }, [isReturningUser]);

  // 📱 KEYBOARD SENTINEL: Hide footer when software keyboard is open
  useEffect(() => {
    const initialHeight = window.visualViewport?.height ?? window.innerHeight;

    const handleViewportResize = () => {
      const currentHeight = window.visualViewport?.height ?? window.innerHeight;
      // Keyboard is open if viewport shrinks by more than 25%
      setIsKeyboardOpen(currentHeight < initialHeight * 0.75);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      return () => window.visualViewport!.removeEventListener('resize', handleViewportResize);
    }
  }, []);

  // Synchronize base identity info (name and address) to protector/vetting state when they change
  useEffect(() => {
    if (role && role !== 'citizen') {
      setProtectorData(prev => ({
        ...prev,
        fullName: prev.fullName || userName || '',
        address: prev.address || address || ''
      }));
    }
  }, [userName, address, role]);

  const checkHardwareStatus = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const o = await KavachNative.isOverlayPermissionGranted().catch(() => ({ granted: false }));
      setOverlayGranted(o.granted);
    } catch (e) { }

    try {
      const fs = await KavachNative.hasFullScreenIntentPermission().catch(() => ({ granted: true }));
      setFullScreenGranted(fs.granted);
    } catch (e) { }

    try {
      const b = await KavachNative.isIgnoringBatteryOptimizations().catch(() => ({ isExempt: false }));
      setBatteryExempt(b.isExempt);
    } catch (e) { }

    try {
      const p = await KavachNative.checkSafetyPermissions().catch(() => ({ sms: 'prompt', call: 'prompt', microphone: 'prompt' }));
      const geo = await Geolocation.checkPermissions().catch(() => ({ location: 'prompt' } as any));
      const cam = await Camera.checkPermissions().catch(() => ({ camera: 'prompt' } as any));

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
    const isShieldsStep = step === 5;

    if (isShieldsStep && Capacitor.isNativePlatform()) {
      checkHardwareStatus();
      // 🛰️ CONTINUOUS POLLING: Ensure UI updates immediately when permissions are granted
      checkInterval = setInterval(checkHardwareStatus, 1000);

      // 🛡️ FOCUS SENTINEL: Re-check immediately when user returns from System Settings
      const listener = import('@capacitor/app').then(m => m.App.addListener('appStateChange', (state) => {
        if (state.isActive) checkHardwareStatus();
      }));

      // 🛡️ BROWSER/WEBVIEW VISIBILITY SENTINEL: Unbreakable fallback
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') checkHardwareStatus();
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (checkInterval) clearInterval(checkInterval);
        listener.then(l => l.remove());
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [step]);

  const handleShieldToggle = async (id: string) => {
    if (!Capacitor.isNativePlatform()) {
      if (id === 'lifeline') setBatteryExempt(!batteryExempt);
      if (id === 'evidence') setOverlayGranted(!overlayGranted);
      if (id === 'guardian') setPerms({ sms: 'granted', call: 'granted', location: 'granted', camera: 'granted', microphone: 'granted' });
      return;
    }
    try {
      if (id === 'guardian') {
        await KavachNative.requestSensitivePermissions();
        await Geolocation.requestPermissions();
        await Camera.requestPermissions();
        await checkHardwareStatus();
      } else if (id === 'lifeline') {
        toast.info("Opening Battery Settings...");
        await KavachNative.openBatterySettings();
      } else if (id === 'evidence') {
        toast.info("Opening Settings...");
        if (!overlayGranted) {
          await KavachNative.openOverlaySettings();
        } else if (!fullScreenGranted) {
          await KavachNative.openFullScreenIntentSettings();
        }
      }
    } catch (e: any) {
      toast.error("Toggle Error: " + (e?.message || e));
      console.warn("Shield Toggle Error:", e);
    }
  };

  useEffect(() => {
    // 🛡️ DATA HYDRATION SENTINEL: Pre-load existing profile data to prevent empty state overwrites
    const hydrateState = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.name) setUserName(data.name);
          if (data.phoneNumber) setUserPhone(data.phoneNumber);
          if (data.gender) setGender(data.gender);
          if (data.role) setRole(data.role);
          if (data.aadhar) setAadhaar(data.aadhar);
          if (data.safetyPin) setLocalSafetyPin(data.safetyPin);
          if (data.protectorVetting) setProtectorData(data.protectorVetting);
          if (data.photoUrl) setPhotoUrl(data.photoUrl);
          if (data.address) setAddress(data.address);
          if (data.bloodGroup) setBloodGroup(data.bloodGroup);
          if (data.dob) setDob(data.dob);
          console.log("🛰️ KAVACH ONBOARDING: Profile Hydrated. Existing records protected.");
        }
      } catch (e) {
        console.warn("Hydration Error:", e);
      }
    };
    hydrateState();
  }, [user?.uid]);

  const finishOnboarding = async () => {
    if (!user) return;
    setIsFinishing(true);
    try {
      // 🛡️ PRE-FLIGHT SYNC: Get current data one last time to merge safely
      const currentSnap = await getDoc(doc(db, 'users', user.uid));
      const existingData = currentSnap.exists() ? currentSnap.data() : {};

      let initialLocation = existingData.lastLocation || null;
      let fullAddress = existingData.fullAddress || "Sector Unknown";
      let locationMeta: any = null;

      try {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        initialLocation = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy };

        // 🛰️ RESOLVE PRECISION ADDRESS 
        locationMeta = await getReverseMetadata(position.coords.latitude, position.coords.longitude);
        fullAddress = locationMeta.display || `Sector Grid: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      } catch (geoError) { }

      const isCitizen = role === 'citizen';
      const isPcr = role === 'pcr_officer';

      // 🛡️ TACTICAL MERGE PAYLOAD: Only update what we have, preserve what we don't
      const userProfile = {
        uid: user.uid,
        name: (userName || protectorData.fullName || existingData.name || user?.displayName || "User"),
        email: user.email || existingData.email || "",
        phoneNumber: userPhone || existingData.phoneNumber || user.phoneNumber || "",
        safetyPin: safetyPin || existingData.safetyPin || "",
        role: role || existingData.role || 'citizen',
        gender: gender || existingData.gender || 'female',
        isRegistered: true,
        photoUrl: photoUrl || existingData.photoUrl || "",
        address: address || existingData.address || "",
        bloodGroup: bloodGroup || existingData.bloodGroup || "",
        dob: dob || existingData.dob || "",
        // ⏳ COMMAND CENTER VETTING: Everyone must be verified by admin, except master admin
        isVerified: user.role === 'admin' || user.role === 'super_cell' ? true : false,
        verificationStatus: user.role === 'admin' || user.role === 'super_cell' ? 'approved' : 'pending',
        aadhaarMask: aadhaar ? `XXXX-XXXX-${aadhaar.slice(-4)}` : (existingData.aadhaarMask || null),
        aadhaarHash: aadhaar ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(aadhaar)).then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('')) : (existingData.aadhaarHash || null),

        // PCR/Patrol specific operational properties
        vehicleNo: isPcr ? (protectorData.vehicleNo || 'PCR-TBD') : (existingData.vehicleNo || null),
        badgeId: isPcr ? (protectorData.badgeId || 'BADGE-TBD') : (existingData.badgeId || null),
        rank: isPcr ? (protectorData.rank || 'Officer') : (existingData.rank || null),
        thanaName: isPcr ? (protectorData.thanaName || 'Headquarters') : (existingData.thanaName || null),
        isOnDuty: isPcr ? true : (existingData.isOnDuty || false),
        currentDispatchStatus: isPcr ? 'idle' : (existingData.currentDispatchStatus || null),

        lastLocation: initialLocation,
        locationData: {
          lat: initialLocation?.lat || null,
          lng: initialLocation?.lng || null,
          accuracy: initialLocation?.accuracy || null,
          city: locationMeta?.city || fullAddress.split(',').slice(-3, -2)[0]?.trim() || "Unknown",
          district: locationMeta?.suburb || fullAddress.split(',').slice(-4, -3)[0]?.trim() || "Unknown",
          state: locationMeta?.state || fullAddress.split(',').slice(-2, -1)[0]?.trim() || "Unknown",
          pincode: locationMeta?.pincode || fullAddress.match(/\b\d{6}\b/)?.[0] || "Unknown",
          formattedAddress: fullAddress
        },
        fullAddress: fullAddress,
        state: locationMeta?.state || fullAddress.split(',').slice(-2, -1)[0]?.trim() || "Unknown",

        primaryGuardian: (guardians.length > 0) ? {
          name: guardians[0].name,
          phone: `+91${guardians[0].phone.replace(/\D/g, '')}`,
          relation: guardians[0].relation
        } : (existingData.primaryGuardian || null),

        onboardedAt: existingData.onboardedAt || serverTimestamp(),
        lastActive: serverTimestamp(),
        protectorVetting: (!isCitizen) ? (protectorData.fullName ? protectorData : existingData.protectorVetting) : null
      };

      // 🛰️ MULTI-PATH SYSTEMATIC SYNC WITH TACTICAL TIMEOUT
      const syncTasks = async () => {
        // 1. Master Ledger
        const cleanProfile = Object.fromEntries(
          Object.entries(userProfile).filter(([_, v]) => v !== undefined && v !== null && v !== "")
        );

        await setDoc(doc(db, 'users', user.uid), cleanProfile, { merge: true });

        // 2. Gender-Specific Partitioning
        const finalGender = gender || existingData.gender || 'female';
        if (finalGender === 'male') {
          await setDoc(doc(db, 'male_users', user.uid), cleanProfile, { merge: true });
        } else {
          await setDoc(doc(db, 'women_users', user.uid), cleanProfile, { merge: true });
          if (userProfile.role === 'citizen') {
            await setDoc(doc(db, 'women_users', user.uid, 'safety_data', 'status'), {
              active: true, setupAt: serverTimestamp(), type: 'Citizen/Safety'
            }, { merge: true });
          }
          if (userProfile.role === 'protector') {
            await setDoc(doc(db, 'women_users', user.uid, 'protector_data', 'status'), {
              active: true, setupAt: serverTimestamp(), type: 'Protector/Rakshak'
            }, { merge: true });
          }
        }

        if (userProfile.role === 'citizen' && guardians.length > 0) {
          const guardianCol = collection(db, 'users', user.uid, 'guardians');
          const localGuardians = guardians.map(g => ({
            name: g.name,
            phone: `+91${g.phone.replace(/\D/g, '')}`,
            relation: g.relation
          }));
          localStorage.setItem('kavach_guardian_cache', JSON.stringify(localGuardians));

          for (const g of guardians) {
            if (g.name && g.phone) {
              const cleanPhone = g.phone.replace(/\D/g, '');
              await addDoc(guardianCol, {
                name: g.name, phone: `+91${cleanPhone}`, relation: g.relation || 'Guardian', createdAt: serverTimestamp()
              }).catch(() => { });
            }
          }
        }

        if (Capacitor.isNativePlatform()) {
          KavachNative.startBackgroundSentinel().catch(() => { });
        }
      };

      await syncTasks();

      const finalRole = userProfile.role;
      const finalGender = userProfile.gender;

      setStoreRole(finalRole);
      setStoreGender(finalGender);
      const store = useKavachStore.getState();
      if (userProfile.safetyPin) store.setSafetyPin(userProfile.safetyPin);
      store.setRegistered(true);
      store.setVerified(userProfile.isVerified);
      localStorage.setItem('kavach_hardware_synced', 'true');
      onComplete();
    } catch (e: any) {
      console.error("Configuration Sync Failure:", e);
      toast.error(`Configuration Error: ${e.message}`);
    } finally {
      setIsFinishing(false);
    }
  };

  const checkDuplicatePhone = async (phoneStr: string) => {
    try {
      const q = query(collection(db, 'users'), where('phoneNumber', '==', phoneStr));
      const snap = await getDocs(q);
      const duplicate = snap.docs.find(d => d.id !== user.uid);
      return !!duplicate;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const nextStep = () => {
    if (step === 1) {
      setStep(2);
      setRoleSubStep('select');
    } else if (step === 2) {
      if (role === 'citizen') {
        setStep(3);
      } else {
        if (roleSubStep === 'select') {
          setRoleSubStep('vetting');
        } else {
          if (gender === 'male') {
            setStep(5);
          } else {
            setStep(4);
          }
        }
      }
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      setStep(6);
    }
  };

  const handleBack = () => {
    if (step === 1) return;
    if (step === 2) {
      if (roleSubStep === 'vetting') {
        setRoleSubStep('select');
      } else {
        setStep(1);
      }
    } else if (step === 3) {
      setStep(2);
      setRoleSubStep('select');
    } else if (step === 4) {
      if (role === 'citizen') {
        setStep(3);
      } else {
        setStep(2);
        setRoleSubStep('vetting');
      }
    } else if (step === 5) {
      if (role === 'citizen') {
        setStep(4);
      } else {
        if (gender === 'male') {
          setStep(2);
          setRoleSubStep('vetting');
        } else {
          setStep(4);
        }
      }
    } else if (step === 6) {
      setStep(5);
    }
  };

  // Helper to calculate active visual step and step count based on selected role path
  const getVisualStepInfo = () => {
    const isCitizen = role === 'citizen' || !role;
    const isMaleProtector = !isCitizen && gender === 'male';

    if (isCitizen) {
      return {
        current: step,
        total: 6,
        steps: [1, 2, 3, 4, 5, 6]
      };
    } else if (isMaleProtector) {
      let current = step;
      if (step === 5) current = 3;
      if (step === 6) current = 4;
      return {
        current: current,
        total: 4,
        steps: [1, 2, 3, 4]
      };
    } else {
      let current = step;
      if (step === 4) current = 3;
      if (step === 5) current = 4;
      if (step === 6) current = 5;
      return {
        current: current,
        total: 5,
        steps: [1, 2, 3, 4, 5]
      };
    }
  };

  const visualStepInfo = getVisualStepInfo();

  return (
    <div className="fixed inset-0 z-[2000] bg-[#F5F7FB] flex flex-col text-gray-900 font-sans overflow-hidden">

      {/* Unified Top Header Row with White Background */}
      <div className="w-full bg-white shrink-0 relative z-20">
        <div className="w-full max-w-md mx-auto px-4 pt-3 pb-3 flex flex-col gap-2">
          {/* Logo Row */}
          <div className="flex items-center justify-between">
            {/* Back button + KAVACH Logo */}
            <div className="flex items-center gap-2">
              {step > 1 ? (
                <button onClick={handleBack} className="p-1.5 -ml-1 rounded-full hover:bg-slate-100 transition-colors">
                  <ChevronLeft size={20} className="text-slate-700" />
                </button>
              ) : null}

              <div className="flex items-center gap-2">
                {/* KAVACH Original Logo */}
                <img src="/logo.jpeg" alt="KAVACH Logo" className="h-14 w-14 rounded-xl object-contain" />
                <div className="flex flex-col">
                  <span className="text-base font-extrabold text-[#0B2545] leading-none tracking-tight">KAVACH</span>
                  <span className="text-[6.5px] font-black text-slate-400 tracking-wider mt-0.5 leading-none">NATIONAL SAFETY NETWORK</span>
                </div>
              </div>
            </div>

            {/* Digital India Logo */}
            <div className="flex items-center">
              <img src="/digitalindia.png" alt="Digital India" className="h-9 w-auto object-contain" />
            </div>
          </div>

          {/* STEP indicator label */}
          <div className="text-center mt-1">
            <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-widest">
              STEP {visualStepInfo.current} OF {visualStepInfo.total}
            </span>
          </div>

          {/* Circular Progress Indicator row */}
          <div className="relative w-full flex items-center justify-between px-2 py-1">
            {/* Background line */}
            <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-slate-200 -translate-y-1/2 z-0" />

            {/* Active line */}
            <div className="absolute top-1/2 left-2 right-2 h-[2px] -translate-y-1/2 z-0">
              <div
                className="h-full bg-[#0B2545] transition-all duration-500"
                style={{ width: `${((visualStepInfo.current - 1) / (visualStepInfo.total - 1)) * 100}%` }}
              />
            </div>

            {/* Steps */}
            {visualStepInfo.steps.map((s) => (
              <div
                key={s}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] z-10 transition-all duration-300 border-2",
                  s === visualStepInfo.current
                    ? "bg-[#0B2545] border-[#0B2545] text-white shadow-sm scale-110"
                    : s < visualStepInfo.current
                      ? "bg-white border-[#0B2545] text-[#0B2545]"
                      : "bg-white border-slate-200 text-slate-400"
                )}
              >
                {s}
              </div>
            ))}
          </div>

          {/* Quad-color stripe */}
          <div className="flex h-[3.5px] w-full rounded-full overflow-hidden mt-1.5">
            <div className="w-[20%] bg-[#2563EB]" />
            <div className="w-[22%] bg-[#FF9933]" />
            <div className="w-[30%] bg-[#F59E0B]" />
            <div className="w-[28%] bg-[#10B981]" />
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-0 relative px-4 pt-4 pb-2">
        <div
          key={`step-${step}-${roleSubStep}`}
          className="flex-1 flex flex-col min-h-0"
        >
          {step === 1 && (
            <IdentityStep
              phone={userPhone}
              setPhone={setUserPhone}
              userName={userName}
              setUserName={setUserName}
              setIsVerified={setIsIdentityVerified}
              onNext={nextStep}
              checkDuplicatePhone={checkDuplicatePhone}
              photoUrl={photoUrl}
              setPhotoUrl={setPhotoUrl}
              gender={gender}
              setGender={(g) => {
                setGender(g);
                setStoreGender(g);
              }}
              isGoogleLogin={!!user?.displayName}
              isKeyboardOpen={isKeyboardOpen}
            />
          )}

          {step === 2 && (
            roleSubStep === 'select' ? (
              <RoleStep
                role={role}
                setRole={(r) => {
                  setRole(r);
                  setStoreRole(r);
                }}
                gender={gender}
                onNext={nextStep}
                isKeyboardOpen={isKeyboardOpen}
              />
            ) : (
              <ProtectorVerificationStep
                role={role}
                data={protectorData}
                setData={setProtectorData}
              />
            )
          )}

          {step === 3 && (
            <GuardiansStep guardians={guardians} setGuardians={setGuardians} userPhone={userPhone} />
          )}

          {step === 4 && (
            <SecurityPinStep
              pin={safetyPin}
              setPin={setLocalSafetyPin}
              onNext={nextStep}
              isKeyboardOpen={isKeyboardOpen}
            />
          )}

          {step === 5 && (
            <ShieldsStep
              batteryExempt={batteryExempt} overlayGranted={overlayGranted && fullScreenGranted} perms={perms} isReturningUser={isReturningUser}
              tosChecked={tosChecked} setTosChecked={setTosChecked} onActivate={nextStep} authStatus={isFinishing ? 'saving' : 'idle'}
              tr={t} onOpenBattery={() => handleShieldToggle('lifeline')} onOpenOverlay={() => handleShieldToggle('evidence')}
              onRequestPerms={() => handleShieldToggle('guardian')}
              onOpenAppSettings={async () => { if (Capacitor.isNativePlatform()) await KavachNative.openAppSettings(); }}
              onOpenOEMSettings={async () => {
                if (Capacitor.isNativePlatform()) {
                  await KavachNative.requestLockScreenPermission();
                  setOverlayGranted(true);
                }
              }}
              onForceBatteryExempt={() => setBatteryExempt(true)}
              isNative={Capacitor.isNativePlatform()}
              isSentinelActive={isSentinelActive}
              setSentinelActive={setSentinelActive}
              role={role}
            />
          )}

          {step === 6 && (
            <ReviewStep
              photoUrl={photoUrl}
              setPhotoUrl={setPhotoUrl}
              name={userName}
              setName={setUserName}
              phone={userPhone}
              setPhone={setUserPhone}
              dob={dob}
              setDob={setDob}
              bloodGroup={bloodGroup}
              setBloodGroup={setBloodGroup}
              gender={gender}
              setGender={(g) => {
                setGender(g);
                setStoreGender(g);
              }}
              role={role}
              setRole={(r) => {
                setRole(r);
                setStoreRole(r);
              }}
              aadhaar={aadhaar}
              tosChecked={tosChecked}
              setTosChecked={setTosChecked}
              onSubmit={finishOnboarding}
              isSubmitting={isFinishing}
            />
          )}

          {/* Render global proceed button ONLY for steps that do not have their own actions */}
          {((step === 2 && roleSubStep !== 'select') || step === 3) && (
            <div className="pt-6 mt-auto">
              <button
                disabled={
                  (step === 2 && (
                    roleSubStep === 'select'
                      ? !role
                      : (role === 'pcr_officer'
                        ? (!protectorData.fullName || !protectorData.address || !protectorData.badgeId || !protectorData.vehicleNo || !protectorData.rank || !protectorData.agreement)
                        : (!protectorData.fullName || !protectorData.address || !protectorData.occupation || !protectorData.agreement ||
                          (['Army', 'Ex-Army', 'Police', 'Ex-Police'].includes(protectorData.occupation) && (!protectorData.serviceNumber || !protectorData.isServiceNumberValid)))
                      )
                  )) ||
                  (step === 3 && guardians.length === 0)
                }
                onClick={nextStep}
                className={cn(
                  "w-full py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all shadow-xl active:scale-[0.98]",
                  (
                    (step === 2 && (
                      roleSubStep === 'select'
                        ? !!role
                        : (role === 'pcr_officer'
                          ? (protectorData.fullName && protectorData.address && protectorData.badgeId && protectorData.vehicleNo && protectorData.rank && protectorData.agreement)
                          : (protectorData.fullName && protectorData.address && protectorData.occupation && protectorData.agreement &&
                            (!['Army', 'Ex-Army', 'Police', 'Ex-Police'].includes(protectorData.occupation) || (!!protectorData.serviceNumber && protectorData.isServiceNumberValid)))
                        )
                    )) ||
                    (step === 3 && guardians.length > 0)
                  )
                    ? "bg-[#2563EB] text-white shadow-[#2563EB]/25"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                )}
              >
                {step === 2
                  ? (roleSubStep === 'select' ? "Confirm Category" : "Confirm Profile")
                  : "Setup Guardians"
                }
              </button>

              {/* GOI Footer — hidden when keyboard is open */}
              {!isKeyboardOpen && step !== 3 && (
                <div className="flex flex-col items-center gap-1.5 pt-4 pb-6 mt-6 shrink-0">
                  <div className="flex items-center justify-between w-full border-t border-slate-200/60 pt-3 px-0.5">
                    <div className="flex items-center gap-2.5 text-left">
                      <img
                        src="/emblem-dark.png"
                        alt="Emblem of India"
                        className="h-10 w-auto object-contain shrink-0"
                      />
                      <div className="flex flex-col">
                        <span className="text-[9.5px] font-black text-slate-800 uppercase tracking-tight leading-none">
                          Government of India Initiative
                        </span>
                        <span className="text-[8.5px] text-slate-400 font-bold mt-1 leading-none">
                          Securing Citizens. Empowering India.
                        </span>
                      </div>
                    </div>

                    <img
                      src="/Made-In-India-Lion-PNG-Cutout.png"
                      alt="Made in India"
                      className="h-10 w-auto object-contain opacity-95"
                    />
                  </div>

                  <p className="text-[8.5px] font-extrabold uppercase tracking-widest text-[#94A3B8] text-center mt-1">
                    MINISTRY OF WOMEN &amp; CHILD DEVELOPMENT • GOVT. OF INDIA
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

