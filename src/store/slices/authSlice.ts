import { StateCreator } from 'zustand';
import { KavachState } from './types';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { KavachSafe } from '../../services/KavachNative';

const savedIsRegistered = localStorage.getItem('kavach_is_registered') === 'true';
const savedIsVerified = localStorage.getItem('kavach_is_verified') === 'true';
const savedGender = (localStorage.getItem('kavach_gender') as 'female' | 'male') || 'female';
const savedRoleRaw = localStorage.getItem('kavach_user_role') || localStorage.getItem('kavach_role') || 'citizen';
// 🔒 FORCED MALE RULE: Apply at store init so first render is already correct
const savedRole = (savedGender === 'male' && savedRoleRaw === 'citizen') ? 'protector' : savedRoleRaw;

export const createAuthSlice: StateCreator<KavachState, [], [], Pick<KavachState, 'user' | 'profile' | 'role' | 'gender' | 'isRegistered' | 'isVerified' | 'safetyPin' | 'setUser' | 'setProfile' | 'setRole' | 'setGender' | 'setRegistered' | 'setVerified' | 'setSafetyPin'>> = (set, get) => ({
  user: null,
  profile: null,
  role: savedRole as any,
  gender: savedGender,
  isRegistered: savedIsRegistered,
  isVerified: savedIsVerified,
  safetyPin: localStorage.getItem('kavach_safety_pin'),


  setUser: async (user) => {
    set({ user });
    if (user) {
      const { db } = await import('../../firebase');
      const { doc, onSnapshot } = await import('firebase/firestore');

      let lastSyncedData = "";
      const syncProfile = async (firebaseData: any) => {
        let finalRole = firebaseData.role || 'citizen';
        const finalGender = firebaseData.gender || 'female';
        
        // 🔒 FORCED MALE RULE: Male accounts can never be citizens. Force role to protector.
        if (finalGender === 'male' && finalRole === 'citizen') {
          finalRole = 'protector';
        }

        const syncString = JSON.stringify({
          n: firebaseData.name,
          r: finalRole,
          v: firebaseData.isVerified || firebaseData.verified,
          xp: firebaseData.xp
        });

        if (syncString === lastSyncedData) return;
        lastSyncedData = syncString;

        const sessionRes = await supabase.auth.getSession();
        if (sessionRes?.data?.session) {
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.uid,
              email: user.email,
              display_name: firebaseData.name || user.displayName || 'Kavach Citizen',
              role: finalRole,
              gender: finalGender,
              is_verified: !!(firebaseData.isVerified || firebaseData.verified),
              xp: firebaseData.xp || 0
            });

          if (error) console.error("⚡ SUPABASE: Sync Error", error);
          else console.log("⚡ SUPABASE: Profile Synced & Migrated.");
        } else {
          console.log("ℹ️ [SUPABASE] Session inactive; skipping profiles sync in authSlice to avoid RLS block.");
        }
      };

      onSnapshot(doc(db, 'users', user.uid), async (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          if (data.isPermanentlyBlocked) {
            console.warn("🚨 KAVACH STORE: Banned identity detected. Auto-evicting...");
            const { auth } = await import('../../firebase');
            const { signOut } = await import('firebase/auth');
            await signOut(auth);
            set({ user: null, profile: null, isPermanentlyBlocked: true });
            return;
          }

          let finalRole = data.role || 'citizen';
          const finalGender = data.gender || 'female';
          if (finalGender === 'male' && finalRole === 'citizen') {
            finalRole = 'protector';
          }
          localStorage.setItem('kavach_user_role', finalRole);
          localStorage.setItem('kavach_role', finalRole);
          localStorage.setItem('kavach_gender', finalGender); // 🔒 Cache gender for instant next-load

          // Sync verification state to localStorage to prevent refresh flicker
          const verified = !!(data.isVerified || data.verified) || localStorage.getItem('kavach_is_verified') === 'true';
          localStorage.setItem('kavach_is_verified', verified.toString());

          if (data.safetyPin) {
            localStorage.setItem('kavach_safety_pin', data.safetyPin);
          }

          set({
            isSOSBlocked: !!data.isSOSBlocked,
            isPermanentlyBlocked: !!data.isPermanentlyBlocked,
            sosBlockedReason: data.sosBlockedReason || null,
            sosStrikeCount: data.sosStrikeCount || 0,
            hasPendingWarning: !!data.hasPendingWarning,
            warningMessage: data.warningMessage || null,
            profile: { ...data, role: finalRole } as UserProfile,
            isVerified: verified,
            role: finalRole,
            gender: finalGender,
            safetyPin: data.safetyPin || null
          });

          syncProfile(data);
        }
      }, (error) => {
        console.warn("⚠️ KAVACH STORE: Profile snapshot subscription error:", error);
      });

      supabase
        .channel(`profile:${user.uid}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.uid}`
        }, (payload) => {
          console.log('⚡ SUPABASE: Real-time update', payload);
          if (payload.new) {
          const newData = payload.new as any;
            const verified = !!(newData?.is_verified || newData?.isVerified) || localStorage.getItem('kavach_is_verified') === 'true';
            localStorage.setItem('kavach_is_verified', verified.toString());
            set((state) => ({
              isVerified: verified,
              profile: { ...state.profile, ...payload.new as any }
            }));
          }
        })
        .subscribe();
    }
  },
  setProfile: (profile) => set({ profile }),
  setRole: (role) => {
    localStorage.setItem('kavach_user_role', role);
    localStorage.setItem('kavach_role', role);
    KavachSafe.setUserRole({ role });
    set({ role });
  },
  setGender: (gender) => set({ gender }),
  setRegistered: (isRegistered) => {
    localStorage.setItem('kavach_is_registered', isRegistered.toString());
    set({ isRegistered });
  },
  setVerified: (isVerified) => {
    localStorage.setItem('kavach_is_verified', isVerified.toString());
    set({ isVerified });
  },
  setSafetyPin: (safetyPin) => {
    if (safetyPin) localStorage.setItem('kavach_safety_pin', safetyPin);
    else localStorage.removeItem('kavach_safety_pin');
    set({ safetyPin });
  }
});
