import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { supabase } from '../lib/supabase';

import { useHardwarePermissions } from '../components/onboarding/hooks/useHardwarePermissions';
import { useOnboardingNavigation } from '../components/onboarding/hooks/useOnboardingNavigation';
import { useOnboardingSync } from '../components/onboarding/hooks/useOnboardingSync';

export const useOnboardingLogic = (user: any, onComplete: () => void, isReturningUser: boolean = false) => {
  const [userName, setUserName] = useState(user?.displayName || '');
  const [userPhone, setUserPhone] = useState(user?.phoneNumber || '');
  const [safetyPin, setLocalSafetyPin] = useState('');
  const [step, setStep] = useState(1);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [roleSubStep, setRoleSubStep] = useState<'select' | 'vetting'>('select');
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [role, setRole] = useState<'citizen' | 'protector' | 'guardian' | null>(null);
  const [gender, setGender] = useState<'female' | 'male' | null>(null);
  const [aadhaar, setAadhaar] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [dob, setDob] = useState('');
  const [guardians, setGuardians] = useState<{ name: string; phone: string; relation: string }[]>([]);
  const [tosChecked, setTosChecked] = useState({ terms: false, permissions: false });
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
    thanaName: '',
    isGuardian: false,
    familyPhone: '',
    linkedFamilyName: ''
  });

  useEffect(() => {
    if (isReturningUser) {
      setStep(5);
      setTosChecked({ terms: true, permissions: true });
    }
  }, [isReturningUser]);

  useEffect(() => {
    const initialHeight = window.visualViewport?.height ?? window.innerHeight;
    const handleViewportResize = () => {
      const currentHeight = window.visualViewport?.height ?? window.innerHeight;
      setIsKeyboardOpen(currentHeight < initialHeight * 0.75);
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      return () => window.visualViewport!.removeEventListener('resize', handleViewportResize);
    }
  }, []);

  useEffect(() => {
    if (role && role !== 'citizen') {
      setProtectorData(prev => ({
        ...prev,
        fullName: prev.fullName || userName || '',
        address: prev.address || address || ''
      }));
    }
  }, [userName, address, role]);

  const {
    perms, setPerms,
    overlayGranted, setOverlayGranted,
    fullScreenGranted, setFullScreenGranted,
    batteryExempt, setBatteryExempt,
    handleShieldToggle
  } = useHardwarePermissions(step);

  const { nextStep, handleBack, getVisualStepInfo } = useOnboardingNavigation(
    step, setStep, role, gender, roleSubStep, setRoleSubStep
  );

  const { isFinishing, setIsFinishing, finishOnboarding } = useOnboardingSync(
    user, role, gender, userName, userPhone, safetyPin, photoUrl, address, bloodGroup, dob, aadhaar, guardians, protectorData, onComplete
  );

  useEffect(() => {
    const hydrateState = async () => {
      if (!user?.uid) return;
      try {
        let name = '';
        let phoneNumber = '';
        let currentGender: any = null;
        let currentRole: any = null;
        let aadhar = '';
        let safetyPin = '';
        let protectorVetting: any = null;
        let photoUrl = '';
        let address = '';
        let bloodGroup = '';
        let dob = '';

        // Try Supabase first
        try {
          const { data: sbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.uid)
            .single();
          if (sbProfile) {
            const meta = sbProfile.metadata || {};
            name = sbProfile.display_name || meta.name || '';
            phoneNumber = meta.phoneNumber || '';
            currentGender = sbProfile.gender || meta.gender || null;
            currentRole = sbProfile.role || meta.role || null;
            aadhar = meta.aadhar || '';
            safetyPin = meta.safetyPin || '';
            protectorVetting = meta.protectorVetting || null;
            photoUrl = meta.photoUrl || meta.photoURL || meta.displayPhotoUrl || '';
            address = meta.address || '';
            bloodGroup = meta.bloodGroup || '';
            dob = meta.dob || '';
          }
        } catch (sbErr) {
          console.warn("⚠️ Hydration from Supabase profile bypassed:", sbErr);
        }

        // Fallback to Firestore
        try {
          const docRef = doc(db, 'users', user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.name) name = data.name;
            if (data.phoneNumber) phoneNumber = data.phoneNumber;
            if (data.gender) currentGender = data.gender;
            if (data.role) currentRole = data.role;
            if (data.aadhar) aadhar = data.aadhar;
            if (data.safetyPin) safetyPin = data.safetyPin;
            if (data.protectorVetting) protectorVetting = data.protectorVetting;
            if (data.photoUrl) photoUrl = data.photoUrl;
            if (data.address) address = data.address;
            if (data.bloodGroup) bloodGroup = data.bloodGroup;
            if (data.dob) dob = data.dob;
          }
        } catch (e) { }

        if (name) setUserName(name);
        if (phoneNumber) setUserPhone(phoneNumber);
        if (currentGender) setGender(currentGender);
        if (currentRole) setRole(currentRole);
        if (aadhar) setAadhaar(aadhar);
        if (safetyPin) setLocalSafetyPin(safetyPin);
        if (protectorVetting) setProtectorData(protectorVetting);
        if (photoUrl) setPhotoUrl(photoUrl);
        if (address) setAddress(address);
        if (bloodGroup) setBloodGroup(bloodGroup);
        if (dob) setDob(dob);
      } catch (e) { }
    };
    hydrateState();
  }, [user?.uid]);

  const checkDuplicatePhone = async (phoneStr: string) => {
    try {
      const q = query(collection(db, 'users'), where('phoneNumber', '==', phoneStr));
      const snap = await getDocs(q);
      const duplicate = snap.docs.find(d => d.id !== user.uid);
      return !!duplicate;
    } catch (e) {
      return false;
    }
  };

  return {
    userName, setUserName,
    userPhone, setUserPhone,
    safetyPin, setLocalSafetyPin,
    step, setStep,
    isKeyboardOpen, setIsKeyboardOpen,
    roleSubStep, setRoleSubStep,
    isIdentityVerified, setIsIdentityVerified,
    perms, setPerms,
    overlayGranted, setOverlayGranted,
    fullScreenGranted, setFullScreenGranted,
    batteryExempt, setBatteryExempt,
    role, setRole,
    gender, setGender,
    aadhaar, setAadhaar,
    photoUrl, setPhotoUrl,
    address, setAddress,
    bloodGroup, setBloodGroup,
    dob, setDob,
    guardians, setGuardians,
    tosChecked, setTosChecked,
    isFinishing, setIsFinishing,
    protectorData, setProtectorData,
    handleShieldToggle,
    finishOnboarding,
    checkDuplicatePhone,
    nextStep,
    handleBack,
    getVisualStepInfo
  };
};
