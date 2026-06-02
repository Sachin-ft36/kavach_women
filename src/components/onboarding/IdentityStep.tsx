import React, { useState } from 'react';
import { Smartphone, Fingerprint, CheckCircle2, ShieldCheck, Lock, AlertCircle, ShieldAlert, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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

interface IdentityStepProps {
  aadhaar: string;
  setAadhaar: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  userName: string;
  setUserName: (val: string) => void;
  setRole: (val: 'citizen' | 'protector') => void;
  setGender: (val: 'female' | 'male') => void;
  setIsVerified: (val: boolean) => void;
  onNext: () => void;
  checkDuplicatePhone?: (phone: string) => Promise<boolean>;
  checkDuplicateAadhaar?: (aadhaar: string) => Promise<boolean>;
}

export default function IdentityStep({
  aadhaar, setAadhaar, phone, setPhone, userName, setUserName, setRole, setGender, setIsVerified, onNext, checkDuplicatePhone, checkDuplicateAadhaar
}: IdentityStepProps) {
  // Phone Verification States
  const [phoneState, setPhoneState] = useState<'idle' | 'otp_sent' | 'verified'>('idle');
  const [phoneOtp, setPhoneOtp] = useState('');

  // Aadhaar Verification States
  const [aadhaarState, setAadhaarState] = useState<'idle' | 'otp_sent' | 'verifying' | 'verified'>('idle');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [fetchedGender, setFetchedGender] = useState('');
  const [fetchedName, setFetchedName] = useState('');

  const handleSendPhoneOTP = async () => {
    if (phone.length < 10) return;
    
    if (checkDuplicatePhone) {
      const isDup = await checkDuplicatePhone(phone);
      if (isDup) {
        toast.error("Phone number already linked to another account.");
        return;
      }
    }

    setPhoneState('otp_sent');
    setPhoneOtp('123456'); // Auto-fill for demo
    toast.success("OTP sent to mobile via SMS");
  };

  const handleVerifyPhoneOTP = () => {
    if (phoneOtp.length < 6) return;
    setPhoneState('verified');
    toast.success("Mobile Number Verified!");
  };

  const handleSendAadhaarOTP = async () => {
    if (aadhaar.length < 12) return;
    
    if (!validateAadhaar(aadhaar)) {
      toast.error("Invalid Aadhaar Number", { description: "Please enter a valid 12-digit UIDAI Aadhaar number." });
      return;
    }

    if (checkDuplicateAadhaar) {
      const isDup = await checkDuplicateAadhaar(aadhaar);
      if (isDup) {
        toast.error("Aadhaar already linked to another account.");
        return;
      }
    }

    setAadhaarState('otp_sent');
    toast.success("Aadhaar OTP sent to UIDAI registered mobile");
  };

  const handleVerifyAadhaarOTP = () => {
    if (aadhaarOtp.length < 6) return;
    setAadhaarState('verifying');

    // Smart Demo Routing based on OTP
    let mockGenderValue: 'female' | 'male' = 'female';
    let mockGenderLabel = 'FEMALE (F)';

    if (aadhaarOtp === '654321') {
      mockGenderValue = 'male';
      mockGenderLabel = 'MALE (M)';
    }

    // Simulate API Fetch from UIDAI DigiLocker
    setTimeout(() => {
      setAadhaarState('verified');
      // If user signed in with Google, they have a name. If not, fallback.
      const fetchedDisplayName = userName && userName.trim() !== '' ? userName : "Beta Tester";
      setFetchedName(fetchedDisplayName);
      setFetchedGender(mockGenderLabel);

      setUserName(fetchedDisplayName);
      setGender(mockGenderValue);
      setIsVerified(true);
      toast.success("Identity Fetched from National Grid!");
    }, 2500);
  };

  return (
    <div className="flex-1 flex flex-col space-y-5 pt-2 overflow-y-auto pb-10 px-1">
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Identity Verification</h2>
          <p className="text-blue-600 text-[10px] sm:text-xs font-bold leading-tight uppercase tracking-widest mt-0.5">National Security Grid • Level 1 Auth</p>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 shadow-sm">
          <ShieldAlert className="text-rose-600 shrink-0 mt-0.5" size={14} />
          <div>
            <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest leading-tight">Strict Legal Warning</p>
            <p className="text-[9px] font-bold text-rose-600/90 mt-0.5 leading-relaxed">
              Identity forgery or misrepresentation is a criminal offense under Section 419 IPC. All activities are monitored and IP tracked.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* ================= STEP 1: MOBILE VERIFICATION ================= */}
        <div className={cn(
          "bg-white border-2 rounded-3xl p-5 transition-all shadow-sm relative overflow-hidden",
          phoneState === 'verified' ? "border-green-500 bg-green-50/30" : "border-blue-100"
        )}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md",
                phoneState === 'verified' ? "bg-green-500" : "bg-blue-600"
              )}>
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 uppercase">Mobile Verification</h3>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Device Anchoring</p>
              </div>
            </div>
            {phoneState === 'verified' && (
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> <span className="text-[9px] font-black uppercase">Verified</span>
              </div>
            )}
          </div>

          {phoneState === 'idle' && (
            <div className="space-y-3">
              <input
                type="tel" maxLength={10} placeholder="Enter 10-digit mobile"
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 rounded-xl text-center font-bold tracking-[4px] text-lg outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSendPhoneOTP} disabled={phone.length < 10}
                className="w-full py-3.5 bg-gray-900 disabled:bg-gray-300 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Send SMS OTP
              </button>
            </div>
          )}

          {phoneState === 'otp_sent' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
              <p className="text-[9px] font-bold text-center text-blue-600">Enter OTP sent to +91 {phone}</p>
              <input
                type="tel" maxLength={6} placeholder="------"
                value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white border border-blue-200 px-4 py-3 rounded-xl text-center font-mono font-black tracking-[10px] text-xl outline-none focus:border-blue-500"
              />
              <button
                onClick={handleVerifyPhoneOTP} disabled={phoneOtp.length < 6}
                className="w-full py-3.5 bg-blue-600 disabled:bg-blue-300 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md"
              >
                Verify Mobile
              </button>
            </motion.div>
          )}

          {phoneState === 'verified' && (
            <div className="bg-white/80 p-3 rounded-xl border border-green-200 text-center">
              <p className="text-lg font-black text-gray-900 tracking-[3px]">+91 {phone}</p>
            </div>
          )}
        </div>

        {/* ================= STEP 2: AADHAAR VERIFICATION ================= */}
        <div className={cn(
          "bg-white border-2 rounded-3xl p-5 transition-all shadow-sm relative overflow-hidden",
          phoneState !== 'verified' ? "opacity-50 pointer-events-none border-gray-100" :
            aadhaarState === 'verified' ? "border-emerald-500 bg-emerald-50" : "border-indigo-100"
        )}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md",
                aadhaarState === 'verified' ? "bg-emerald-500" : "bg-indigo-600"
              )}>
                <Fingerprint size={20} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 uppercase">UIDAI KYC Fetch</h3>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Demographic Lock</p>
              </div>
            </div>
            {aadhaarState === 'verified' && (
              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck size={12} /> <span className="text-[9px] font-black uppercase">Locked</span>
              </div>
            )}
          </div>

          {aadhaarState === 'idle' && (
            <div className="space-y-3">
              <input
                type="tel" maxLength={12} placeholder="Enter 12-digit Aadhaar"
                value={aadhaar} onChange={e => setAadhaar(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 rounded-xl text-center font-bold tracking-[4px] text-lg outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSendAadhaarOTP} disabled={aadhaar.length < 12}
                className="w-full py-3.5 bg-indigo-600 disabled:bg-indigo-300 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-indigo-600/20"
              >
                Send Aadhaar OTP
              </button>
            </div>
          )}

          {aadhaarState === 'otp_sent' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
              <p className="text-[9px] font-bold text-center text-indigo-600">Enter OTP sent to Aadhaar registered mobile</p>
              <input
                type="tel" maxLength={6} placeholder="------"
                value={aadhaarOtp} onChange={e => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white border border-indigo-200 px-4 py-3 rounded-xl text-center font-mono font-black tracking-[10px] text-xl outline-none focus:border-indigo-500"
              />
              <div className="bg-indigo-50 p-2 rounded-lg text-center border border-indigo-100">
                <p className="text-[8px] font-black text-indigo-800 uppercase tracking-widest">Demo Mode Active</p>
                <p className="text-[9px] text-indigo-600 font-bold mt-0.5">Use <span className="font-mono bg-white px-1 rounded">123456</span> for Female | Use <span className="font-mono bg-white px-1 rounded">654321</span> for Male</p>
              </div>
              <button
                onClick={handleVerifyAadhaarOTP} disabled={aadhaarOtp.length < 6}
                className="w-full py-3.5 bg-indigo-600 disabled:bg-indigo-300 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md"
              >
                Fetch Demographics
              </button>
            </motion.div>
          )}

          {aadhaarState === 'verifying' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="animate-spin text-indigo-600" size={28} />
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-800 animate-pulse">Pulling Data from UIDAI...</p>
            </div>
          )}

          {aadhaarState === 'verified' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
              <div className="bg-white/80 p-4 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-3 border-b border-emerald-100 pb-2">
                  <User size={16} className="text-emerald-500" />
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Fetched Name</p>
                    <p className="text-sm font-black text-gray-900">{fetchedName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Official Gender</p>
                    <p className="text-emerald-700 font-black tracking-widest">{fetchedGender}</p>
                  </div>
                  <Lock size={16} className="text-emerald-500 opacity-50" />
                </div>
              </div>

              <button
                onClick={onNext}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all text-[11px] uppercase tracking-[3px]"
              >
                Proceed to Next Step
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 opacity-40 pt-4 pb-4">
        <ShieldCheck size={14} className="text-gray-500" />
        <span className="text-[8px] font-black uppercase tracking-[2px] text-gray-500">IP Tracked & Encrypted by Kavach Protocol</span>
      </div>
    </div>
  );
}
