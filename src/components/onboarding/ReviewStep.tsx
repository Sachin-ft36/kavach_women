import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Edit2, Shield, User, Phone, Calendar, Heart, CheckCircle2, AlertTriangle, ShieldCheck, Camera, Check, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Camera as CapCamera, CameraResultType } from '@capacitor/camera';

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
  role: 'citizen' | 'protector' | 'pcr_officer' | null;
  setRole: (role: 'citizen' | 'protector' | 'pcr_officer' | null) => void;
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
  const [isEditing, setIsEditing] = useState(false);

  const handleGenderChange = (newGender: 'female' | 'male') => {
    setGender(newGender);
    if (newGender === 'male' && role === 'citizen') {
      setRole(null);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 70,
        width: 200,
        height: 200,
        allowEditing: false,
        resultType: CameraResultType.DataUrl
      });
      if (image.dataUrl) {
        setPhotoUrl(image.dataUrl);
      }
    } catch (error) {
      console.warn("Camera capture cancelled/failed:", error);
    }
  };

  // 🐛 BUG FIX: Step 1 se aane wala data agar raw base64 hai, toh usko valid data URL me convert karna
  const getSafePhotoSrc = (url: string) => {
    if (!url) return '';
    // Agar URL pehle se theek format me hai (data:, http, blob:, capacitor://)
    if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:') || url.startsWith('capacitor:') || url.startsWith('ionic:')) {
      return url;
    }
    // Agar sirf raw base64 string pass hui hai (Black Box issue ka main reason)
    return `data:image/jpeg;base64,${url}`;
  };

  const formattedAadhaar = aadhaar 
    ? `XXXX-XXXX-${aadhaar.slice(-4)}` 
    : "Not Provided";

  const isRoleCompatible = (g: typeof gender, r: typeof role) => {
    if (g === 'male' && r === 'citizen') return false;
    return true;
  };

  const isFormValid = name.trim() !== '' && 
                      phone.length >= 10 && 
                      gender !== null && 
                      role !== null && 
                      isRoleCompatible(gender, role);

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
        <div className="space-y-3">
          
          {/* Row 1: Phone */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Phone size={12} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Mobile Number</span>
            </div>
            {isEditing ? (
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-left font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto text-sm"
                placeholder="10-digit number"
              />
            ) : (
              <span className="font-bold text-slate-900 text-sm w-full sm:w-auto text-left">{phone ? `+91 ${phone}` : "Not Provided"}</span>
            )}
          </div>

          {/* Row 2: DOB & Blood Group (Grid layout) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                <Calendar size={11} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Date of Birth</span>
              </div>
              {isEditing ? (
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 w-full"
                />
              ) : (
                <span className="font-bold text-slate-900 text-xs text-left w-full">{dob || "N/A"}</span>
              )}
            </div>

            <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                <Heart size={11} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Blood Group</span>
              </div>
              {isEditing ? (
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 w-full"
                >
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              ) : (
                <span className="font-bold text-red-600 text-xs text-left w-full">{bloodGroup || "N/A"}</span>
              )}
            </div>
          </div>

          {/* Row 3: Gender */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gender</span>
            {isEditing ? (
              <div className="flex gap-1.5 w-full sm:w-auto">
                {(['female', 'male'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => handleGenderChange(g)}
                    className={cn(
                      "flex-1 sm:flex-none px-3 py-1.5 rounded-md text-[10px] font-bold uppercase border transition-all",
                      gender === g 
                        ? "bg-slate-800 text-white border-slate-800 shadow-sm" 
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            ) : (
              <span className="font-bold text-slate-900 uppercase bg-slate-100 px-3 py-1.5 rounded-md text-xs w-full sm:w-auto text-left">
                {gender || "Not Specified"}
              </span>
            )}
          </div>

          {/* Row 4: Assigned Role */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Shield size={12} /> Safety Role
            </span>
            {isEditing ? (
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto justify-end sm:justify-end justify-start">
                {(['citizen', 'protector', 'pcr_officer'] as const).map(r => {
                  const allowed = r !== 'citizen' || gender === 'female';
                  return (
                    <button
                      key={r}
                      disabled={!allowed}
                      onClick={() => setRole(r)}
                      className={cn(
                        "px-2 py-1.5 rounded-md text-[9px] font-bold uppercase border transition-all",
                        role === r 
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                        !allowed && "opacity-40 cursor-not-allowed hover:bg-white"
                      )}
                    >
                      {r === 'citizen' ? "Citizen" : r === 'protector' ? "Rakshak" : "PCR Patrol"}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="font-bold text-blue-700 uppercase bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 text-xs tracking-tight w-full sm:w-auto text-left">
                {role === 'citizen' ? "Citizen (Women Shield)" : role === 'protector' ? "Civic Protector" : role === 'pcr_officer' ? "PCR Patrol" : "Not Selected"}
              </span>
            )}
          </div>

        </div>

        {/* Warning Badge (Dynamic based on logic) */}
        {gender === 'male' && role === null && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
            <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-2.5 flex gap-2 items-start mt-1">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium text-amber-800 leading-snug">
                <strong className="block mb-0.5 uppercase tracking-wide text-[9px]">Action Required</strong>
                Citizen Safety Shield is reserved for Females. Please select <b>Civic Protector</b> or <b>PCR Patrol</b>.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Consent Section (Cards style) - Compact */}
      <div className="space-y-2">
        <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-1">
          Final Authorization
        </h4>
        
        <div 
          onClick={() => setTosChecked(p => ({ ...p, terms: !p.terms }))}
          className={cn(
            "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
            tosChecked.terms ? "bg-blue-50/50 border-blue-500/40 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
            tosChecked.terms ? "bg-blue-600 border-blue-600" : "border-slate-300"
          )}>
            {tosChecked.terms && <Check size={12} className="text-white stroke-[2px]" />}
          </div>
          <p className={cn(
            "text-[11px] leading-tight transition-colors",
            tosChecked.terms ? "text-slate-800 font-medium" : "text-slate-500"
          )}>
            I authorize KAVACH to run persistent background services for safety monitoring.
          </p>
        </div>

        <div 
          onClick={() => setTosChecked(p => ({ ...p, permissions: !p.permissions }))}
          className={cn(
            "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
            tosChecked.permissions ? "bg-blue-50/50 border-blue-500/40 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
            tosChecked.permissions ? "bg-blue-600 border-blue-600" : "border-slate-300"
          )}>
            {tosChecked.permissions && <Check size={12} className="text-white stroke-[2px]" />}
          </div>
          <p className={cn(
            "text-[11px] leading-tight transition-colors",
            tosChecked.permissions ? "text-slate-800 font-medium" : "text-slate-500"
          )}>
            I consent to secure preservation of telemetry and evidence for law enforcement.
          </p>
        </div>
      </div>

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