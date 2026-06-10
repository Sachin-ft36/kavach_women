import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2, User, Camera, Image, Shield, Landmark, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { auth, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  const [phoneState, setPhoneState] = useState<'idle' | 'otp_sent' | 'verified'>(
    phone ? 'verified' : 'idle'
  );
  const [phoneOtp, setPhoneOtp] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [celebration, setCelebration] = useState('');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraActive, stream]);

  React.useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [stream]);

  // Only mandatory: photo + name + phone verified + gender
  React.useEffect(() => {
    const valid = !!(photoUrl && userName.trim() && phoneState === 'verified' && gender);
    setIsVerified(valid);
  }, [photoUrl, userName, phoneState, gender, setIsVerified]);

  const triggerCelebration = (msg: string) => {
    setCelebration(msg);
    setTimeout(() => setCelebration(''), 2000);
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const compressImage = (file: File): Promise<{ file: File; base64: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new globalThis.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 120;
          const MAX_HEIGHT = 120;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const base64 = canvas.toDataURL('image/jpeg', 0.5);
            
            canvas.toBlob((blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name || 'avatar.jpg', { type: 'image/jpeg' });
                resolve({ file: compressedFile, base64 });
              } else {
                resolve({ file, base64: event.target?.result as string });
              }
            }, 'image/jpeg', 0.5);
          } else {
            resolve({ file, base64: event.target?.result as string });
          }
        };
        img.onerror = () => {
          resolve({ file, base64: event.target?.result as string });
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        resolve({ file, base64: '' });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    triggerCelebration('📸 Photo Selected!');

    try {
      const { file: compressedFile, base64 } = await compressImage(file);
      setPhotoUrl(base64); // Set tiny base64 preview immediately

      const filePath = `avatars/${Math.random().toString(36).slice(2)}_${Date.now()}.jpeg`;
      let ok = false;
      try {
        const { error } = await supabase.storage.from('evidence').upload(filePath, compressedFile, { upsert: true });
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(filePath);
          setPhotoUrl(publicUrl); ok = true;
        }
      } catch { }
      if (!ok) {
        try {
          const uid = auth.currentUser?.uid || 'anon';
          const fileRef = ref(storage, `avatars/${uid}_${Date.now()}.jpg`);
          await uploadBytes(fileRef, compressedFile);
          setPhotoUrl(await getDownloadURL(fileRef)); ok = true;
        } catch { }
      }
    } catch (err) {
      console.error("Compression/Upload error:", err);
    }
    setIsUploading(false);
  };

  const startCamera = async () => {
    try {
      if (stream) stream.getTracks().forEach(t => t.stop());
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 400 }, height: { ideal: 400 } }, audio: false
      });
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch {
      toast.error("Camera access denied. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 120; canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, 120, 120);
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    setIsCameraActive(false);
    const base64 = canvas.toDataURL('image/jpeg', 0.5);
    setPhotoUrl(base64);
    triggerCelebration('📸 Identity Locked!');

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setIsUploading(true);
      const filePath = `avatars/${Math.random().toString(36).slice(2)}_${Date.now()}.jpeg`;
      const file = new File([blob], filePath, { type: 'image/jpeg' });
      let ok = false;
      try {
        const { error } = await supabase.storage.from('evidence').upload(filePath, file, { upsert: true });
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(filePath);
          setPhotoUrl(publicUrl); ok = true;
        }
      } catch { }
      if (!ok) {
        try {
          const uid = auth.currentUser?.uid || 'anon';
          const fileRef = ref(storage, `avatars/${uid}_${Date.now()}.jpg`);
          await uploadBytes(fileRef, blob);
          setPhotoUrl(await getDownloadURL(fileRef)); ok = true;
        } catch { }
      }
      setIsUploading(false);
    }, 'image/jpeg', 0.5);
  };

  const handleSendOTP = async () => {
    if (phone.length < 10) return;
    if (checkDuplicatePhone) {
      const dup = await checkDuplicatePhone(phone);
      if (dup) { toast.error("Phone already linked to another account."); return; }
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedOtp(otp);
    setPhoneOtp(otp);
    setPhoneState('otp_sent');
    toast.success(`OTP: ${otp}`, { duration: 15000 });
  };

  const handleVerifyOTP = () => {
    if (phoneOtp !== expectedOtp) { toast.error("Invalid OTP"); return; }
    setPhoneState('verified');
    triggerCelebration('🔒 Signal Secured!');
  };

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
              <div className="space-y-5">
                
                {/* Full Name Field */}
                <div className="space-y-1.5">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text" 
                      placeholder="ENTER FULL LEGAL NAME"
                      value={userName} 
                      onChange={e => setUserName(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2.5 rounded-sm text-xs font-bold uppercase outline-none border border-slate-300 focus:border-[#000080] focus:bg-blue-50/20 transition-all bg-white text-slate-900"
                    />
                    {userName.trim() && (
                      <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" strokeWidth={2.5} />
                    )}
                  </div>
                </div>

                {/* Mobile Number Field */}
                <div className="space-y-1.5">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                      Mobile Number <span className="text-red-600">*</span>
                    </label>
                  </div>
                  
                  <div className="space-y-3">
                    {phoneState === 'idle' && (
                      <>
                        <div className="flex items-center w-full rounded-sm border border-slate-300 bg-white overflow-hidden focus-within:border-[#000080] transition-all">
                          <div className="flex items-center justify-center h-[42px] px-3.5 text-xs font-black text-slate-700 border-r border-slate-300 bg-slate-50 shrink-0">
                            +91
                          </div>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="10-DIGIT NUMBER"
                            value={phone}
                            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 min-w-0 h-[42px] px-3 bg-transparent border-none outline-none text-xs text-left font-bold text-slate-900 placeholder:text-[10px] placeholder:font-semibold placeholder:text-slate-400 tracking-wide"
                          />
                        </div>
                        <button
                          type="button" onClick={handleSendOTP} disabled={phone.length < 10}
                          className={cn(
                            "w-full py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99] border",
                            phone.length === 10
                              ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
                              : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          )}
                        >
                          Request OTP Authentication
                        </button>
                      </>
                    )}

                    {phoneState === 'otp_sent' && (
                      <div className="bg-blue-50/50 p-3 rounded-sm border border-blue-100 space-y-3">
                        <p className="text-[10px] font-bold text-[#000080] text-center uppercase tracking-wide">
                          Enter OTP sent to +91 {phone}
                        </p>
                        <input
                          type="tel" maxLength={6} placeholder="------"
                          value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-white border border-blue-200 px-4 py-2.5 rounded-sm text-center font-mono font-black tracking-[12px] text-sm outline-none focus:border-[#000080]"
                        />
                        <button
                          type="button" onClick={handleVerifyOTP} disabled={phoneOtp.length < 6}
                          className={cn(
                            "w-full py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.99] border",
                            phoneOtp.length === 6
                              ? "bg-[#000080] border-[#000080] text-white hover:bg-blue-900"
                              : "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed"
                          )}
                        >
                          Verify OTP
                        </button>
                      </div>
                    )}

                    {phoneState === 'verified' && (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2.5 rounded-sm">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 size={16} className="text-emerald-600" strokeWidth={2.5} />
                          <span className="text-[11px] font-black text-slate-800 tracking-wide">+91 {phone}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setPhoneState('idle'); setPhoneOtp(''); }}
                          className="text-[9px] font-bold text-[#000080] hover:underline px-2 py-1 uppercase tracking-wider"
                        >
                          [ MODIFY ]
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gender Field */}
                <div className="space-y-1.5">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                      Gender <span className="text-red-600">*</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={cn(
                        "py-3 rounded-sm border flex items-center justify-center gap-2 transition-all",
                        gender === 'female' 
                          ? "bg-[#000080] border-[#000080] text-white shadow-sm" 
                          : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest">Female</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={cn(
                        "py-3 rounded-sm border flex items-center justify-center gap-2 transition-all",
                        gender === 'male' 
                          ? "bg-[#000080] border-[#000080] text-white shadow-sm" 
                          : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest">Male</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              // Verified Profile State - Photo Upload Section
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-5 py-1"
              >
                {/* Formal Verified Badge Row */}
                <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 flex justify-between items-center relative overflow-hidden">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-sm bg-emerald-100 flex items-center justify-center border border-emerald-200 shrink-0">
                      <Check size={16} className="text-emerald-700" strokeWidth={3} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Identity Verified</span>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide truncate max-w-[180px] sm:max-w-[200px]">{userName}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPhoneState('idle'); setPhoneOtp(''); }}
                    className="text-[9px] font-bold text-[#000080] px-2 py-1 uppercase border-b border-[#000080] relative z-10"
                  >
                    Edit
                  </button>
                  {/* Watermark */}
                  <Shield size={60} className="absolute -right-4 -bottom-4 text-slate-200 opacity-50" />
                </div>

                <div className="h-[1px] bg-slate-200 w-full" />

                {/* Photo Upload Section */}
                <div className="flex flex-col items-center w-full">
                  <div className="text-center mb-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#000080] block">
                      Applicant Photograph <span className="text-red-600">*</span>
                    </label>
                  </div>

                  <div className="flex flex-col items-center gap-4 w-full">
                    {/* Passport Size Photo Box */}
                    <div className="relative w-28 h-32 bg-slate-50 border-2 border-slate-300 border-dashed rounded-sm flex flex-col items-center justify-center p-1 shrink-0 overflow-hidden">
                      {isCameraActive ? (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                      ) : photoUrl ? (
                        <img 
                          src={photoUrl.startsWith('data:') || photoUrl.startsWith('http') || photoUrl.startsWith('blob:') ? photoUrl : `data:image/jpeg;base64,${photoUrl}`} 
                          alt="Applicant" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="text-center flex flex-col items-center opacity-40">
                          <User size={32} className="text-slate-500 mb-1" />
                          <span className="text-[7px] font-bold uppercase tracking-widest text-slate-600 leading-tight">Affix<br/>Photo</span>
                        </div>
                      )}
                      
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-20">
                          <Loader2 className="animate-spin text-[#000080] mb-2" size={20} />
                          <span className="text-[8px] font-bold text-[#000080] uppercase tracking-widest">Processing...</span>
                        </div>
                      )}
                    </div>

                    {/* Camera / Upload Controls */}
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                      {isCameraActive ? (
                        <button
                          type="button" onClick={capturePhoto}
                          className="w-full py-2.5 bg-emerald-600 text-white rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
                        >
                          <Camera size={14} /> CAPTURE
                        </button>
                      ) : (
                        <button
                          type="button" onClick={startCamera}
                          className="w-full py-2.5 bg-[#000080] text-white rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
                        >
                          <Camera size={14} /> OPEN CAMERA
                        </button>
                      )}

                      {!isCameraActive && (
                        <button
                          type="button" onClick={handleGalleryClick}
                          className="w-full py-2 bg-slate-100 text-slate-600 border border-slate-300 rounded-sm text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                        >
                          <Image size={12} /> UPLOAD STORED PHOTO
                        </button>
                      )}
                    </div>

                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </div>
                </div>
              </motion.div>
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