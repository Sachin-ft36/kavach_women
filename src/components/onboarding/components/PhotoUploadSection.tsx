import React from 'react';
import { motion } from 'motion/react';
import { Check, Shield, User, Loader2, Camera, Image } from 'lucide-react';

interface PhotoUploadSectionProps {
  userName: string;
  photoUrl: string;
  isCameraActive: boolean;
  isUploading: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleGalleryClick: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  startCamera: () => void;
  capturePhoto: () => void;
  setPhoneState: (state: any) => void;
  setPhoneOtp: (otp: string) => void;
}

export function PhotoUploadSection({
  userName,
  photoUrl,
  isCameraActive,
  isUploading,
  videoRef,
  fileInputRef,
  handleGalleryClick,
  handleFileChange,
  startCamera,
  capturePhoto,
  setPhoneState,
  setPhoneOtp
}: PhotoUploadSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 py-1"
    >
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
        <Shield size={60} className="absolute -right-4 -bottom-4 text-slate-200 opacity-50" />
      </div>

      <div className="h-[1px] bg-slate-200 w-full" />

      <div className="flex flex-col items-center w-full">
        <div className="text-center mb-3">
          <label className="text-[11px] font-black uppercase tracking-widest text-[#000080] block">
            Applicant Photograph <span className="text-red-600">*</span>
          </label>
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
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
  );
}
