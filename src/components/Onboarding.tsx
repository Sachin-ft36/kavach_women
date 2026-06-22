import React from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../contexts/LanguageContext';
import { KavachNative } from '../services/KavachNative';

// Step Components
import ShieldsStep from './onboarding/ShieldsStep';
import RoleStep from './onboarding/RoleStep';
import IdentityStep from './onboarding/IdentityStep';
import GuardiansStep from './onboarding/GuardiansStep';
import SecurityPinStep from './onboarding/SecurityPinStep';
import ProtectorVerificationStep from './onboarding/ProtectorVerificationStep';
import ReviewStep from './onboarding/ReviewStep';

// Layout & Logic
import OnboardingHeader from './onboarding/OnboardingHeader';
import OnboardingFooter from './onboarding/OnboardingFooter';
import { useOnboardingLogic } from '../hooks/useOnboardingLogic';

interface OnboardingProps {
  user: any;
  onComplete: () => void;
  isReturningUser?: boolean;
}

export default function Onboarding({ user, onComplete, isReturningUser = false }: OnboardingProps) {
  const { setRole: setStoreRole, setGender: setStoreGender, isSentinelActive, setSentinelActive } = useKavachStore();
  const { t } = useLanguage();

  const {
    userName, setUserName,
    userPhone, setUserPhone,
    safetyPin, setLocalSafetyPin,
    step,
    isKeyboardOpen,
    roleSubStep,
    setIsIdentityVerified,
    perms,
    overlayGranted,
    fullScreenGranted,
    batteryExempt, setBatteryExempt,
    role, setRole,
    gender, setGender,
    aadhaar,
    photoUrl, setPhotoUrl,
    address,
    bloodGroup, setBloodGroup,
    dob, setDob,
    guardians, setGuardians,
    tosChecked, setTosChecked,
    isFinishing,
    protectorData, setProtectorData,
    handleShieldToggle,
    finishOnboarding,
    checkDuplicatePhone,
    nextStep,
    handleBack,
    getVisualStepInfo,
    isInviteLinked, setIsInviteLinked,
    inviteData, setInviteData
  } = useOnboardingLogic(user, onComplete, isReturningUser);

  const visualStepInfo = getVisualStepInfo();

  return (
    <div className="fixed inset-0 z-[2000] bg-[#F5F7FB] flex flex-col text-gray-900 font-sans overflow-hidden">
      
      <OnboardingHeader 
        step={step} 
        visualStepInfo={visualStepInfo} 
        onBack={handleBack} 
      />

      <div className="w-full max-w-md mx-auto flex-1 flex flex-col min-h-0 relative px-4 pt-4 pb-2">
        <div key={`step-${step}-${roleSubStep}`} className="flex-1 flex flex-col min-h-0">
          
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
              setGender={(g) => { setGender(g); setStoreGender(g); }}
              isGoogleLogin={!!user?.displayName}
              isKeyboardOpen={isKeyboardOpen}
              isInviteLinked={isInviteLinked}
              inviteData={inviteData}
              onInviteFound={(data) => {
                setIsInviteLinked(true);
                setInviteData(data);
                setRole('guardian');
                setGender('male');
                setStoreRole('guardian');
                setStoreGender('male');
              }}
            />
          )}

          {step === 2 && (
            roleSubStep === 'select' ? (
              <RoleStep
                role={role}
                setRole={(r) => { setRole(r); setStoreRole(r); }}
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
            <GuardiansStep 
              guardians={guardians} 
              setGuardians={setGuardians} 
              userPhone={userPhone} 
            />
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
              batteryExempt={batteryExempt} 
              overlayGranted={overlayGranted && fullScreenGranted} 
              perms={perms} 
              isReturningUser={isReturningUser}
              tosChecked={tosChecked} 
              setTosChecked={setTosChecked} 
              onActivate={nextStep} 
              authStatus={isFinishing ? 'saving' : 'idle'}
              tr={t} 
              onOpenBattery={() => handleShieldToggle('lifeline')} 
              onOpenOverlay={() => handleShieldToggle('evidence')}
              onRequestPerms={() => handleShieldToggle('guardian')}
              onOpenAppSettings={async () => { if (Capacitor.isNativePlatform()) await KavachNative.openAppSettings(); }}
              onOpenOEMSettings={async () => {
                if (Capacitor.isNativePlatform()) {
                  await KavachNative.requestLockScreenPermission();
                  // We optimistically set overlay granted since the OEM intent can't be awaited perfectly
                  // The polling logic in useOnboardingLogic will correct this if false.
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
              setGender={(g) => { setGender(g); setStoreGender(g); }}
              role={role}
              setRole={(r) => { setRole(r); setStoreRole(r); }}
              aadhaar={aadhaar}
              tosChecked={tosChecked}
              setTosChecked={setTosChecked}
              onSubmit={finishOnboarding}
              isSubmitting={isFinishing}
            />
          )}

          <OnboardingFooter 
            step={step}
            roleSubStep={roleSubStep}
            role={role}
            protectorData={protectorData}
            guardiansLength={guardians.length}
            isKeyboardOpen={isKeyboardOpen}
            onNext={nextStep}
          />
          
        </div>
      </div>
    </div>
  );
}
