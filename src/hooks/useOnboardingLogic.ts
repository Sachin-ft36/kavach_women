import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
  const [role, setRole] = useState<'citizen' | 'protector' | 'pcr_officer' | null>(null);
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
    thanaName: ''
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
        }
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
