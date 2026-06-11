import { StateCreator } from 'zustand';
import { KavachState } from './types';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { KavachSafe } from '../../services/KavachNative';

const savedIsRegistered = localStorage.getItem('kavach_is_registered') === 'true';
const savedIsVerified = localStorage.getItem('kavach_is_verified') === 'true';

export const createAuthSlice: StateCreator<KavachState, [], [], Pick<KavachState, 'user' | 'profile' | 'role' | 'gender' | 'isRegistered' | 'isVerified' | 'safetyPin' | 'setUser' | 'setProfile' | 'setRole' | 'setGender' | 'setRegistered' | 'setVerified' | 'setSafetyPin'>> = (set, get) => ({
  user: null,
  profile: null,
  role: (localStorage.getItem('kavach_user_role') as any) || 'citizen',
  gender: 'female',
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
        const syncString = JSON.stringify({
          n: firebaseData.name,
          r: firebaseData.role,
          v: firebaseData.isVerified || firebaseData.verified,
          xp: firebaseData.xp
        });

        if (syncString === lastSyncedData) return;
        lastSyncedData = syncString;

        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.uid,
            email: user.email,
            display_name: firebaseData.name || user.displayName || 'Kavach Citizen',
            role: firebaseData.role || 'citizen',
            gender: firebaseData.gender || 'female',
            is_verified: !!(firebaseData.isVerified || firebaseData.verified),
            xp: firebaseData.xp || 0
          });

        if (error) console.error("⚡ SUPABASE: Sync Error", error);
        else console.log("⚡ SUPABASE: Profile Synced & Migrated.");
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

          set({
            isSOSBlocked: !!data.isSOSBlocked,
            isPermanentlyBlocked: !!data.isPermanentlyBlocked,
            sosBlockedReason: data.sosBlockedReason || null,
            sosStrikeCount: data.sosStrikeCount || 0,
            hasPendingWarning: !!data.hasPendingWarning,
            warningMessage: data.warningMessage || null,
            profile: data as UserProfile,
            isVerified: !!(data.isVerified || data.verified)
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
            set((state) => ({
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
