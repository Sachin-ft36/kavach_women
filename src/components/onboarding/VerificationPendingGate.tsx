import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, RefreshCw, XCircle, AlertTriangle, ChevronRight, LogOut, CheckCircle2, Shield } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { supabase } from '../../lib/supabase';
import { useKavachStore } from '../../store/useKavachStore';
import { toast } from 'sonner';

interface VerificationPendingGateProps {
  user: any;
  profile: any;
}

export const VerificationPendingGate: React.FC<VerificationPendingGateProps> = ({ user, profile }) => {
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes default
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: "Basic Profile Validation", desc: "Verifying submitted profile credentials", status: "complete" },
    { title: "Contact Registry Sync", desc: "Associating mobile number with safety network", status: "complete" },
    { title: "Safety Grid Verification", desc: "Registering profile with local safety grids", status: "scanning" },
    { title: "Final Gate Approval", desc: "Generating secure system access tokens", status: "pending" }
  ];

  // Set up persistent countdown timer in localStorage
  useEffect(() => {
    const startKey = `kavach_verification_start_${user.uid}`;
    let startTime = localStorage.getItem(startKey);
    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(startKey, startTime);
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - parseInt(startTime!)) / 1000);
      const remaining = Math.max(0, 600 - elapsed);
      setTimeLeft(remaining);

      // Simple animation step updates based on countdown
      if (remaining > 500) setCurrentStep(1);
      else if (remaining > 300) setCurrentStep(2);
      else setCurrentStep(3);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user.uid]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.uid)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const meta = data.metadata || {};
        const isVerified = !!data.is_verified;
        useKavachStore.getState().setProfile({
          id: data.id,
          uid: data.id,
          email: data.email,
          role: data.role,
          isVerified,
          ...meta
        });
        useKavachStore.getState().setVerified(isVerified);
        
        if (isVerified) {
          toast.success("Verification Confirmed! Welcome to Kavach.");
        } else if (meta.verificationStatus === 'rejected') {
          toast.error("Verification Rejected by Command Center.");
        } else {
          toast.info("Verification still pending at the Command Center.");
        }
      } else {
        toast.error("No registration record found on the database. Resetting onboarding...");
        localStorage.removeItem(`kavach_verification_start_${user.uid}`);
        localStorage.setItem('kavach_is_registered', 'false');
        localStorage.setItem('kavach_hardware_synced', 'false');
        useKavachStore.getState().setRegistered(false);
        useKavachStore.getState().setIsHardwareSynced(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Network issue. Retrying sync...");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReOnboard = async () => {
    try {
      const cleanUpdates = {
        isRegistered: false,
        isHardwareSynced: false,
        verificationStatus: null,
        rejectionReason: null
      };

      // 1. Update Firestore (best effort)
      await updateDoc(doc(db, 'users', user.uid), cleanUpdates).catch(() => {});
      const genderColl = profile?.gender === 'male' ? 'male_users' : 'women_users';
      await updateDoc(doc(db, genderColl, user.uid), cleanUpdates).catch(() => {});

      // 2. Delete/Reset in Supabase
      await supabase.from('profiles').delete().eq('id', user.uid);

      // Clear local storage markers
      localStorage.removeItem(`kavach_verification_start_${user.uid}`);
      localStorage.setItem('kavach_is_registered', 'false');
      localStorage.setItem('kavach_hardware_synced', 'false');

      // Update local state store
      useKavachStore.getState().setRegistered(false);
      useKavachStore.getState().setIsHardwareSynced(false);

      toast.success("Profile Reset. You can now re-enter your details.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to reset profile. Try again.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isRejected = profile?.verificationStatus === 'rejected';

  const handleLogout = async () => {
    try {
      await auth.signOut();
      useKavachStore.getState().setUser(null);
      useKavachStore.getState().setProfile(null);
      localStorage.removeItem('kavach_user_uid');
      sessionStorage.setItem('kavach_dev_logout', 'true');
      toast.success("Logged out successfully");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="min-h-[100svh] w-full bg-[#F4F6F9] flex flex-col items-center justify-between p-4 sm:p-6 text-[#1E293B] font-sans relative overflow-hidden">
      {/* Tricolor top strip for official government aesthetic */}
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#128807] z-50 shadow-sm" />

      {/* Top Header */}
      <div className="w-full max-w-md flex justify-between items-center z-10 mt-2 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden border border-slate-100/80">
            <img src="/logo.jpeg" alt="KAVACH" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xs font-extrabold text-[#1B3A6B] tracking-wider leading-none">KAVACH</h1>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">WOMEN SAFETY NETWORK</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <LogOut size={12} className="text-slate-500" />
          Logout
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm my-auto space-y-6 z-10 relative">
        {isRejected ? (
          /* Rejected State */
          <div className="text-center space-y-4 relative z-10">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-sm">
              <XCircle size={28} />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-100">
                Verification Disapproved
              </span>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mt-2">Registration Incomplete</h2>
              <p className="text-xs text-slate-500">Your profile requires correction to activate safety services.</p>
            </div>
            
            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-left space-y-1.5 shadow-sm">
              <span className="text-[10px] text-rose-700 font-extrabold uppercase tracking-widest flex items-center gap-1">
                <AlertTriangle size={10} /> REJECTION REASON
              </span>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                {profile?.rejectionReason || "Uploaded photo is blurred or does not show face clearly. Please upload a clear passport-style selfie."}
              </p>
            </div>

            <button
              onClick={handleReOnboard}
              className="w-full py-4 rounded-md font-black text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all border-none bg-[#000080] text-white shadow-[0_4px_15px_rgba(0,0,128,0.2)] hover:bg-blue-900 cursor-pointer"
            >
              Update Profile Details
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          /* Pending Verification State */
          <div className="space-y-6 relative z-10">
            {/* Simple Official Badge */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-[#1B3A6B] shadow-sm">
                <Shield size={22} className="text-[#1B3A6B]" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-blue-50 text-[#1B3A6B] rounded-md border border-blue-100">
                  Verification in Progress
                </span>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Application Under Review</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Thank you for registering on Kavach. Your identity details are currently being verified against secure official registries.
                </p>
              </div>
            </div>

            {/* Simpler and Calmer Estimated Wait Display */}
            <div className="bg-[#F8FAFC] border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <Clock size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">Standard Processing Time</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase mr-1">Remaining:</span>
                <span className="text-sm font-black font-mono text-[#1B3A6B]">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Checklist progress steps - Calm version */}
            <div className="space-y-3 pt-1">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">
                Verification Steps
              </span>
              <div className="space-y-3.5 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                {steps.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isDone = idx < currentStep;

                  return (
                    <div 
                      key={idx} 
                      className={`flex gap-3 items-start transition-opacity duration-300 ${isDone || isActive ? 'opacity-100' : 'opacity-40'}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : isActive ? (
                          <div className="w-4 h-4 bg-blue-50 border border-[#2563EB] rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-ping" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 border border-slate-200 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className={`text-xs font-bold ${isActive ? 'text-[#1B3A6B] font-extrabold' : 'text-slate-700'}`}>
                          {step.title}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Refresh Sync Button */}
            <div className="pt-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full py-4 rounded-md font-black text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all border-none bg-[#000080] text-white shadow-[0_4px_15px_rgba(0,0,128,0.2)] hover:bg-blue-900 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-white' : 'text-white'} />
                Refresh Status
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer disclaimer */}
      <div className="text-center space-y-1 mt-4 mb-2 z-10 opacity-70">
        <p className="text-[9px] font-black tracking-[0.15em] uppercase text-slate-500">National Emergency Response Grid</p>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Government of India Initiative</p>
      </div>
    </div>
  );
};
