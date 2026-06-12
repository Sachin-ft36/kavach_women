import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2, User, Camera, Image, Shield, Landmark, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useIdentityOnboarding } from './useIdentityOnboarding';
import { IdentityFields } from './components/IdentityFields';
import { PhotoUploadSection } from './components/PhotoUploadSection';

interface IdentityStepProps {
  phone: string;
  setPhone: (val: string) => void;
  userName: string;
  setUserName: (val: string) => void;
  setIsVerified: (val: boolean) => void;
  onNext: () => void;
  checkDuplicatePhone?: (phone: string) => Promise<boolean>;
  photoUrl: string;
  setPhotoUrl: (val: string) => void;
  gender: 'female' | 'male' | null;
  setGender: (val: 'female' | 'male' | null) => void;
  isGoogleLogin: boolean;
  isKeyboardOpen?: boolean;
}

export default function IdentityStep({
  phone, setPhone, userName, setUserName, setIsVerified, onNext, checkDuplicatePhone,
  photoUrl, setPhotoUrl, gender, setGender, isGoogleLogin, isKeyboardOpen
}: IdentityStepProps) {
  const {
    phoneState, setPhoneState, phoneOtp, setPhoneOtp, isUploading, isCameraActive, celebration,
    videoRef, fileInputRef, handleGalleryClick, handleFileChange, startCamera, capturePhoto, handleSendOTP, handleVerifyOTP
  } = useIdentityOnboarding({ phone, setPhotoUrl, checkDuplicatePhone });

  // Only mandatory: photo + name + phone verified + gender
  React.useEffect(() => {
    const valid = !!(photoUrl && userName.trim() && phoneState === 'verified' && gender);
    setIsVerified(valid);
  }, [photoUrl, userName, phoneState, gender, setIsVerified]);

  const isReady = !!(photoUrl && userName.trim() && phoneState === 'verified' && gender);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative font-sans w-full max-w-lg mx-auto">
      {/* 🎉 Formal System Toast */}
      <AnimatePresence>
        {celebration && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#000080] text-white px-6 py-2.5 rounded-sm font-black text-xs uppercase tracking-widest shadow-xl border border-blue-900 flex items-center gap-2"
          >
            <Shield size={14} className="text-emerald-400" />
            {celebration}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable form */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 px-1 custom-scrollbar pb-4 pt-1">

        {/* Official Header */}
        <div className="flex flex-col items-center space-y-2 mt-2 mb-2 text-center">
          <Landmark className="text-[#000080]" size={36} strokeWidth={1.5} />
          <div className="space-y-0.5">
            <h2 className="text-[18px] font-black tracking-widest text-[#000080] uppercase">
              Citizen Registration
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              National Safety Grid • Form 1A
            </p>
          </div>
        </div>

        {/* Official Form Container */}
        <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden relative">
          
          {/* Tricolor Top Band */}
          <div className="h-1.5 w-full flex">
            <div className="h-full flex-1 bg-[#FF9933]"></div>
            <div className="h-full flex-1 bg-white"></div>
            <div className="h-full flex-1 bg-[#138808]"></div>
          </div>

          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#000080]" />
              <span className="text-[10px] font-black text-[#000080] uppercase tracking-widest">
                Identity Details
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-500 uppercase">Step 1 of 2</span>
          </div>

          <div className="p-4 sm:p-5">
            {!(userName.trim() && phoneState === 'verified' && gender) ? (
              <IdentityFields
                userName={userName}
                setUserName={setUserName}
                phone={phone}
                setPhone={setPhone}
                phoneState={phoneState}
                setPhoneState={setPhoneState}
                phoneOtp={phoneOtp}
                setPhoneOtp={setPhoneOtp}
                gender={gender}
                setGender={setGender}
                handleSendOTP={handleSendOTP}
                handleVerifyOTP={handleVerifyOTP}
              />
            ) : (
              <PhotoUploadSection
                userName={userName}
                photoUrl={photoUrl}
                isCameraActive={isCameraActive}
                isUploading={isUploading}
                videoRef={videoRef}
                fileInputRef={fileInputRef}
                handleGalleryClick={handleGalleryClick}
                handleFileChange={handleFileChange}
                startCamera={startCamera}
                capturePhoto={capturePhoto}
                setPhoneState={setPhoneState}
                setPhoneOtp={setPhoneOtp}
              />
            )}
          </div>
        </div>

        {/* Bottom Three-Column Security Info Bar - Formal Style */}
        <div className="grid grid-cols-3 gap-0 py-3 bg-white rounded-md border border-slate-300 shadow-sm mt-4">
          <div className="flex flex-col items-center text-center px-1 border-r border-slate-200">
            <Shield className="w-4 h-4 text-[#000080] mb-1" strokeWidth={2} />
            <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest">Govt Verified</span>
          </div>

          <div className="flex flex-col items-center text-center px-1 border-r border-slate-200">
            <svg className="w-4 h-4 text-[#000080] mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest">256-Bit Encrypt</span>
          </div>

          <div className="flex flex-col items-center text-center px-1">
            <CheckCircle2 className="w-4 h-4 text-[#000080] mb-1" strokeWidth={2} />
            <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest">Active Audit</span>
          </div>
        </div>

        {/* GOI Footer */}
        {!isKeyboardOpen && (
          <div className="flex flex-col items-center gap-1.5 pt-4 pb-8">
            <div className="flex items-center justify-between w-full border-t border-slate-300 pt-3 px-1">
              <div className="flex items-center gap-2.5 text-left">
                <img src="/emblem-dark.png" alt="Emblem of India" className="h-10 w-auto object-contain shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest leading-none mb-1">
                    Govt. of India Initiative
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold leading-none uppercase tracking-wider">
                    Securing Citizens Digitally
                  </span>
                </div>
              </div>
              <img src="/Made-In-India-Lion-PNG-Cutout.png" alt="Made in India" className="h-9 w-auto object-contain opacity-80" />
            </div>
          </div>
        )}
      </div>

      {/* Sticky Proceed Button */}
      <div className="sticky bottom-0 left-0 right-0 bg-slate-50 border-t border-slate-300 p-3 z-20">
        <motion.button
          whileTap={isReady ? { scale: 0.98 } : undefined}
          disabled={!isReady}
          onClick={onNext}
          className={cn(
            "w-full py-4 rounded-md font-black text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all border-none",
            isReady
              ? "bg-[#000080] text-white shadow-[0_4px_15px_rgba(0,0,128,0.2)] cursor-pointer hover:bg-blue-900"
              : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
          )}
        >
          <span>Proceed To Security Setup</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}