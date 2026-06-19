import React from 'react';
import { motion } from 'motion/react';
import { Edit2, Shield, User, Phone, Calendar, Heart, CheckCircle2, AlertTriangle, ShieldCheck, Camera, Check, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useReviewLogic } from './hooks/useReviewLogic';
import { DetailedInfoGrid, ConsentSection } from './components/ReviewStepFields';

interface ReviewStepProps {
  photoUrl: string;
  setPhotoUrl: (url: string) => void;
  name: string;
  setName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  dob: string;
  setDob: (dob: string) => void;
  bloodGroup: string;
  setBloodGroup: (group: string) => void;
  gender: 'female' | 'male' | null;
  setGender: (gender: 'female' | 'male' | null) => void;
  role: 'citizen' | 'protector' | 'guardian' | null;
  setRole: (role: 'citizen' | 'protector' | 'guardian' | null) => void;
  aadhaar: string;
  tosChecked: { terms: boolean; permissions: boolean };
  setTosChecked: React.Dispatch<React.SetStateAction<{ terms: boolean; permissions: boolean }>>;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function ReviewStep({
  photoUrl,
  setPhotoUrl,
  name,
  setName,
  phone,
  setPhone,
  dob,
  setDob,
  bloodGroup,
  setBloodGroup,
  gender,
  setGender,
  role,
  setRole,
  aadhaar,
  tosChecked,
  setTosChecked,
  onSubmit,
  isSubmitting
}: ReviewStepProps) {
  const {
    isEditing,
    setIsEditing,
    handleGenderChange,
    handleCapturePhoto,
    getSafePhotoSrc,
    isFormValid
  } = useReviewLogic({ gender, setGender, role, setRole, name, phone, setPhotoUrl });

  const formattedAadhaar = aadhaar 
    ? `XXXX-XXXX-${aadhaar.slice(-4)}` 
    : "Not Provided";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 flex flex-col space-y-3 py-2 text-slate-800 min-h-0 w-full max-w-lg mx-auto overflow-y-auto"
    >
      {/* Premium Header - More Compact */}
      <div className="flex items-center justify-center gap-3 mt-1">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-[15px] opacity-20 rounded-full"></div>
          <div className="w-10 h-10 bg-gradient-to-b from-white to-slate-50 border border-slate-100/80 shadow-sm rounded-xl flex items-center justify-center relative z-10">
            <ShieldCheck className="text-blue-600" size={20} strokeWidth={2.5} />
          </div>
        </div>
        <div className="text-left space-y-0.5">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
            Verification Receipt
          </h1>
          <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest leading-tight">
            Kavach Safety Grid
          </p>
        </div>
      </div>

      {/* Main Glass/Premium Card - Tighter Padding */}
      <div className="bg-white rounded-[20px] p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 flex flex-col space-y-4">
        
        {/* Top Section: Photo & Quick Info - More Compact */}
        <div className="flex gap-4 items-center pb-4 border-b border-slate-100">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-xl bg-slate-50 border-2 border-slate-100 overflow-hidden flex items-center justify-center shadow-sm relative">
              {photoUrl ? (
                <img 
                  src={getSafePhotoSrc(photoUrl)} 
                  alt="User Profile" 
                  className="w-full h-full object-cover bg-white absolute inset-0" 
                  onError={(e) => {
                    // Agar image load hone me fail ho jaye toh fallback set ho jayega (Black box prevent karega)
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-slate-100');
                  }}
                />
              ) : (
                <User size={24} className="text-slate-300" />
              )}
            </div>
            <button
              onClick={handleCapturePhoto}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 border-2 border-white text-white bg-blue-600 z-10"
            >
              <Camera size={12} />
            </button>
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all mb-1"
                placeholder="Enter Full Name"
              />
            ) : (
              <h3 className="font-bold text-slate-900 text-base truncate tracking-tight">{name || "Not Provided"}</h3>
            )}
            
            <div className="flex items-center gap-1 mt-0.5">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Identity Verified</span>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border transition-all shrink-0",
              isEditing ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
            )}
          >
            {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
          </button>
        </div>

        {/* Detailed Info Grid - Reduced Spacing */}
        <DetailedInfoGrid 
          isEditing={isEditing}
          phone={phone}
          setPhone={setPhone}
          dob={dob}
          setDob={setDob}
          bloodGroup={bloodGroup}
          setBloodGroup={setBloodGroup}
          gender={gender}
          handleGenderChange={handleGenderChange}
          role={role}
          setRole={setRole}
        />

        {/* Warning Badge (Dynamic based on logic) */}
        {gender === 'male' && role === null && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
            <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-2.5 flex gap-2 items-start mt-1">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium text-amber-800 leading-snug">
                <strong className="block mb-0.5 uppercase tracking-wide text-[9px]">Action Required</strong>
                Citizen Safety Shield is reserved for Females. Please select <b>Civic Protector</b> or <b>Family Guardian</b>.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Consent Section (Cards style) - Compact */}
      <ConsentSection tosChecked={tosChecked} setTosChecked={setTosChecked} />

      {/* Primary Submit Button - Compact */}
      <div className="pt-1 pb-4">
        <button
          disabled={!isFormValid || !tosChecked.terms || !tosChecked.permissions || isSubmitting}
          onClick={onSubmit}
          className={cn(
            "w-full py-3.5 rounded-[16px] font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]",
            (isFormValid && tosChecked.terms && tosChecked.permissions && !isSubmitting)
              ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
              : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
          )}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
              <span>Initializing...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} className={isFormValid && tosChecked.terms && tosChecked.permissions ? "text-emerald-400" : "text-slate-300"} />
              <span>Activate Safety Protection</span>
            </>
          )}
        </button>
      </div>

    </motion.div>
  );
}