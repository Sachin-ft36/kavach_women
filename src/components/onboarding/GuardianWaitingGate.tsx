import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, RefreshCw, LogOut, Shield, ChevronRight, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
import { doc, updateDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { supabase } from '../../lib/supabase';
import { useKavachStore } from '../../store/useKavachStore';
import { toast } from 'sonner';

interface GuardianWaitingGateProps {
  user: any;
  profile: any;
}

export const GuardianWaitingGate: React.FC<GuardianWaitingGateProps> = ({ user, profile }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const rawPhone = profile?.phoneNumber || user?.phoneNumber || "";
  const cleanDigits = rawPhone.replace(/\D/g, '').slice(-10);
  const cleanPhone = cleanDigits ? `+91${cleanDigits}` : "";

  // 1. Listen for real-time guardian pending link assignment
  useEffect(() => {
    if (!cleanPhone) return;

    const unsub = onSnapshot(doc(db, 'guardian_pending_links', cleanPhone), async (snap) => {
      if (snap.exists()) {
        const claimData = snap.data();
        toast.success(`Guardian assignment detected from ${claimData.citizenName}! Connecting safety grid...`);
        
        try {
          const userUpdates = {
            isVerified: true,
            verificationStatus: 'approved',
            protectorVetting: {
              isGuardian: true,
              familyPhone: claimData.citizenPhone,
              linkedFamilyName: claimData.citizenName
            },
            state_flags: {
              is_citizen: false,
              is_guardian: true,
              is_protector: false
            }
          };

          // Update Firestore Users collection
          await updateDoc(doc(db, 'users', user.uid), {
            ...userUpdates,
            role: 'guardian'
          });

          // Update gender-specific collection
          const genderColl = profile?.gender === 'male' ? 'male_users' : 'women_users';
          await updateDoc(doc(db, genderColl, user.uid), {
            ...userUpdates,
            role: 'guardian'
          });

          // Delete the pending link
          await deleteDoc(doc(db, 'guardian_pending_links', cleanPhone)).catch(() => {});

          // Update Supabase
          try {
            await supabase.from('profiles').upsert({
              id: user.uid,
              role: 'guardian' as const,
              is_verified: true,
              metadata: {
                ...profile,
                ...userUpdates
              }
            });
          } catch (sbErr) {
            console.error("Supabase update error:", sbErr);
          }

          // Update local store state
          const store = useKavachStore.getState();
          store.setVerified(true);
          store.setRole('guardian');
          if (store.profile) {
            store.setProfile({
              ...store.profile,
              isVerified: true,
              verificationStatus: 'approved',
              protectorVetting: userUpdates.protectorVetting,
              state_flags: userUpdates.state_flags
            });
          }

          toast.success("Guardian network linked successfully!");
        } catch (err) {
          console.error("Failed to auto-resolve guardian link:", err);
          toast.error("Auto-sync encountered an issue. Please tap refresh.");
        }
      }
    });

    return () => unsub();
  }, [cleanPhone, user.uid, profile]);

  const handleRefresh = async () => {
    if (!cleanPhone) return;
    setIsRefreshing(true);
    try {
      const claimSnap = await getDoc(doc(db, 'guardian_pending_links', cleanPhone));
      if (claimSnap.exists()) {
        const claimData = claimSnap.data();
        toast.success(`Guardian assignment detected from ${claimData.citizenName}!`);
        
        const userUpdates = {
          isVerified: true,
          verificationStatus: 'approved',
          protectorVetting: {
            isGuardian: true,
            familyPhone: claimData.citizenPhone,
            linkedFamilyName: claimData.citizenName
          },
          state_flags: {
            is_citizen: false,
            is_guardian: true,
            is_protector: false
          }
        };

        await updateDoc(doc(db, 'users', user.uid), {
          ...userUpdates,
          role: 'guardian'
        });
        const genderColl = profile?.gender === 'male' ? 'male_users' : 'women_users';
        await updateDoc(doc(db, genderColl, user.uid), {
          ...userUpdates,
          role: 'guardian'
        });
        await deleteDoc(doc(db, 'guardian_pending_links', cleanPhone)).catch(() => {});

        try {
          await supabase.from('profiles').upsert({
            id: user.uid,
            role: 'guardian' as const,
            is_verified: true,
            metadata: { ...profile, ...userUpdates }
          });
        } catch {}

        const store = useKavachStore.getState();
        store.setVerified(true);
        store.setRole('guardian');
        if (store.profile) {
          store.setProfile({
            ...store.profile,
            isVerified: true,
            verificationStatus: 'approved',
            protectorVetting: userUpdates.protectorVetting,
            state_flags: userUpdates.state_flags
          });
        }
      } else {
        toast.info("No active assignment found yet. Please wait until a citizen lists your phone number.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network issue checking status.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSwitchToCitizen = async () => {
    setIsSwitching(true);
    try {
      const userUpdates = {
        isVerified: true,
        verificationStatus: 'approved',
        protectorVetting: null,
        state_flags: {
          is_citizen: true,
          is_guardian: false,
          is_protector: false
        }
      };

      // 1. Update Firestore Users
      await updateDoc(doc(db, 'users', user.uid), {
        ...userUpdates,
        role: 'citizen'
      });

      // 2. Update Firestore women_users (citizens are women in women_users)
      await updateDoc(doc(db, 'women_users', user.uid), {
        ...userUpdates,
        role: 'citizen'
      });
      
      // Setup citizen safety data node
      await updateDoc(doc(db, 'women_users', user.uid, 'safety_data', 'status'), {
        active: true,
        type: 'Citizen/Safety'
      }).catch(() => {});

      // 3. Update Supabase Profile
      try {
        await supabase.from('profiles').upsert({
          id: user.uid,
          role: 'citizen' as const,
          is_verified: true,
          metadata: { ...profile, ...userUpdates }
        });
      } catch {}

      // 4. Update local state
      const store = useKavachStore.getState();
      store.setRole('citizen');
      store.setVerified(true);
      if (store.profile) {
        store.setProfile({
          ...store.profile,
          ...userUpdates
        });
      }

      toast.success("Successfully registered as Citizen Safety Shield!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to switch role. Please try again.");
    } finally {
      setIsSwitching(false);
    }
  };

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

  const isFemale = profile?.gender === 'female';

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
        <div className="space-y-6 relative z-10">
          
          {/* Badge & Title */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-[#1B3A6B] shadow-sm relative">
              <Shield size={22} className="text-[#1B3A6B]" />
              <div className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
                <Clock size={10} className="text-white animate-spin" />
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-100">
                Guardian Authorization Pending
              </span>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Waiting for Linkage</h2>
              
              <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 mt-2 text-left">
                <p className="text-[11px] text-slate-700 font-bold leading-relaxed text-center">
                  Wait until anyone assigns you as a guardian
                </p>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed text-center mt-1">
                  कृपया तब तक प्रतीक्षा करें जब तक कोई आपको अभिभावक (Guardian) के रूप में नियुक्त न करे
                </p>
              </div>
            </div>
          </div>

          {/* Registered Identity Details */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Registered Name:</span>
              <span className="font-extrabold text-slate-800">{profile?.name || "User"}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Guardian Number:</span>
              <span className="font-mono font-extrabold text-slate-800">{cleanPhone || rawPhone}</span>
            </div>
            <div className="text-[10px] text-center text-slate-400 font-medium pt-1 border-t border-slate-200/60">
              Provide this exact number to the citizen adding you.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full py-4 rounded-md font-black text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all border-none bg-[#000080] text-white shadow-[0_4px_15px_rgba(0,0,128,0.2)] hover:bg-blue-900 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-white' : 'text-white'} />
              Refresh Assignment Status
            </button>

            {isFemale && (
              <div className="pt-2 border-t border-slate-200/80 mt-4 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                  Female User Option
                </p>
                <button
                  onClick={handleSwitchToCitizen}
                  disabled={isSwitching}
                  className="w-full py-3.5 rounded-md font-black text-[10px] tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition-all border border-[#000080]/30 bg-blue-50/50 text-[#000080] hover:bg-blue-100/50 cursor-pointer disabled:opacity-50"
                >
                  {isSwitching ? (
                    <RefreshCw size={12} className="animate-spin text-[#000080]" />
                  ) : (
                    <>
                      <Sparkles size={12} className="text-[#000080]" />
                      Register instead as a Citizen
                      <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="text-center space-y-1 mt-4 mb-2 z-10 opacity-70">
        <p className="text-[9px] font-black tracking-[0.15em] uppercase text-slate-500">National Emergency Response Grid</p>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Government of India Initiative</p>
      </div>
    </div>
  );
};
