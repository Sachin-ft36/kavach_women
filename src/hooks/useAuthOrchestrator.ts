import { useEffect } from 'react';
import { onAuthStateChanged, signInWithCredential, GoogleAuthProvider, signInWithPopup, getRedirectResult, signInWithRedirect, signOut } from 'firebase/auth';
import { doc, collection, getDocs, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { auth, googleProvider, db } from '../firebase';
import { supabase } from '../lib/supabase';
import { KavachNative } from '../services/KavachNative';
import { toast } from 'sonner';
import { useKavachStore } from '../store/useKavachStore';

export function useAuthOrchestrator() {
  const {
    user, setUser, setRole, setGender, setRegistered, setVerified,
    setProfile, setSafetyPin, setLoading, setGuardianCache, setIsHardwareSynced, loading
  } = useKavachStore();

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let userChannel: ReturnType<typeof supabase.channel> | null = null;
    let logoutDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    // 🔑 Only check redirect result if we actually initiated a Google redirect sign-in.
    // Calling getRedirectResult unconditionally causes a spurious identitytoolkit accounts:lookup
    // 400 error on every cold start, which floods the console and can block loading.
    if (!Capacitor.isNativePlatform() && sessionStorage.getItem('kavach_google_redirect_pending') === 'true') {
      sessionStorage.removeItem('kavach_google_redirect_pending');
      getRedirectResult(auth).then((result) => {
        if (result?.user) {
          console.log('✅ KAVACH: Redirect sign-in success:', result.user.email);
        }
      }).catch((err) => {
        if (err.code && err.code !== 'auth/web-storage-unsupported' && err.code !== 'auth/no-auth-event') {
          console.error('🚨 KAVACH Redirect Result Error:', err.code, err.message);
        }
      });
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      if (userChannel) {
        supabase.removeChannel(userChannel);
        userChannel = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.setItem('kavach_user_uid', firebaseUser.uid);
        const docRef = doc(db, 'users', firebaseUser.uid);

        const userEmail = firebaseUser.email || '';
        const isAdminEmail = 
          userEmail.toLowerCase() === 'admin@kavach.gov.in' || 
          userEmail.toLowerCase().includes('adminsachin') || 
          userEmail.toLowerCase() === 'singh.sachin16559@gmail.com' ||
          userEmail.toLowerCase().includes('supercell');
        if (isAdminEmail) {
          const finalRole = userEmail.toLowerCase().includes('supercell') ? 'super_cell' : 'admin';
          setRole(finalRole);
          setRegistered(true);
          setVerified(true);
          setIsHardwareSynced(true);

          await setDoc(docRef, {
            uid: firebaseUser.uid,
            email: userEmail,
            role: finalRole,
            isRegistered: true,
            isVerified: true
          }, { merge: true }).catch(err => console.error("Admin auto-provisioning failed:", err));
        }

        const syncSupabaseUser = async () => {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', firebaseUser.uid)
              .maybeSingle();

            if (data) {
              const meta = data.metadata || {};
              let currentRole = data.role || 'citizen';
              const userGender = data.gender || meta.gender || 'female';
              
              // 🔒 FORCED MALE RULE: Male accounts can never be citizens. Force role to protector.
              if (userGender === 'male' && currentRole === 'citizen') {
                currentRole = 'protector';
                updateDoc(docRef, { role: 'protector' }).catch(() => {});
                (async () => { try { await supabase.from('profiles').update({ role: 'protector' }).eq('id', firebaseUser.uid); } catch {} })();
              }
              
              setRole(currentRole);
              const registered = meta.isRegistered === true || currentRole === 'admin' || currentRole === 'super_cell';
              setRegistered(registered);
              if (registered) {
                setIsHardwareSynced(true);
                localStorage.setItem('kavach_hardware_synced', 'true');
                localStorage.setItem('kavach_is_registered', 'true');
              }
              const isVerifiedProfile = !!data.is_verified || localStorage.getItem('kavach_is_verified') === 'true';
              setVerified(isVerifiedProfile);
              localStorage.setItem('kavach_is_verified', isVerifiedProfile.toString());
              setGender(userGender);
              setProfile({
                id: data.id,
                uid: data.id,
                email: data.email,
                role: currentRole,
                isVerified: isVerifiedProfile,
                isGuardian: !!(data.is_guardian || meta.isGuardian || meta.protectorVetting?.isGuardian),
                ...meta
              });
              if (meta.safetyPin) setSafetyPin(meta.safetyPin);
            }
          } catch (err) {
            console.warn("⚠️ Supabase auth sync error:", err);
          }
        };

        // Real-time changes for Supabase profile
        userChannel = supabase
          .channel(`user-profile-${firebaseUser.uid}`)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'profiles',
            filter: `id=eq.${firebaseUser.uid}`
          }, () => {
            syncSupabaseUser();
          })
          .subscribe();

        unsubProfile = onSnapshot(docRef, async (snap) => {
          if (snap.exists()) {
            const data = snap.data();

            // Optimistically set role & verification from Firestore snapshot (loaded from cache instantly)
            if (data.role) {
              let snapRole = data.role;
              if (data.gender === 'male' && snapRole === 'citizen') {
                snapRole = 'protector';
              }
              setRole(snapRole);
            }
            if (data.isVerified || data.verified) {
              setVerified(true);
              localStorage.setItem('kavach_is_verified', 'true');
            }
            if (data.isRegistered) {
              setRegistered(true);
              setIsHardwareSynced(true);
              localStorage.setItem('kavach_is_registered', 'true');
              localStorage.setItem('kavach_hardware_synced', 'true');
            }

            if (data.isPermanentlyBlocked) {
              console.warn("🚨 KAVACH: Terminal lockout active. Session revoked.");
              await signOut(auth);
              toast.error("TERMINAL LOCKOUT: This identity is permanently blacklisted.", {
                className: "bg-rose-950 border-rose-500 text-white font-black"
              });
              setUser(null);
              setLoading(false);
              return;
            }

            // Auto-migrate to Supabase if registered in Firestore but missing/out-of-sync in Supabase
            if (data.isRegistered) {
              try {
                const sessionRes = await supabase.auth.getSession();
                if (sessionRes?.data?.session) {
                  const supabasePayload: any = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || data.email || "",
                    role: data.role || 'citizen',
                    is_verified: !!(data.isVerified || data.verified),
                    is_guardian: !!(data.isGuardian || data.protectorVetting?.isGuardian),
                    gender: data.gender || 'female',
                    xp: data.xp || 0,
                    metadata: data
                  };
                  if (data.lastLocation?.lat || data.lastLocation?.latitude) {
                    const lat = data.lastLocation.lat ?? data.lastLocation.latitude;
                    const lng = data.lastLocation.lng ?? data.lastLocation.longitude;
                    supabasePayload.last_location = `POINT(${lng} ${lat})`;
                  }
                  await supabase.from('profiles').upsert(supabasePayload);
                } else {
                  // Session is not active in Supabase (we are authenticated with Firebase), skip to avoid RLS error
                  console.log("ℹ️ [SUPABASE] Session inactive; skipping profiles auto-migration to avoid RLS policy block.");
                }
              } catch (supabaseErr) {
                console.warn("Auto-migration to Supabase failed:", supabaseErr);
              }
            }

            // Sync with Supabase as the source of truth for registration, verification, role, etc.
            await syncSupabaseUser();
          } else {
            await syncSupabaseUser();
          }
          setLoading(false);
        }, async (error) => {
          console.warn("⚠️ Firestore profile watch restricted. Active fallback to Supabase profiles.");
          await syncSupabaseUser();
          setLoading(false);
        });

        getDocs(collection(db, 'users', firebaseUser.uid, 'guardians'))
          .then((gSnap) => {
            const guardianList = gSnap.docs.map(d => ({ name: d.data().name, phone: d.data().phone }));
            setGuardianCache(guardianList);
            if (Capacitor.isNativePlatform() && guardianList.length > 0) {
              KavachNative.updateGuardianContacts({ contacts: JSON.stringify(guardianList) }).catch(() => { });
            }
          })
          .catch((err) => {
            console.warn("KAVACH Background Guardian Sync failed:", err);
          });
      } else {
        // 🛡️ DEBOUNCED LOGOUT: Firebase token refresh emits a transient null user
        // event via _onStorageEvent/_poll during auth token cycling. We debounce this
        // by 800ms — if the user re-authenticates within that window we skip logout.
        // This prevents the dashboard → login redirect loop on every token refresh.
        if (logoutDebounceTimer) clearTimeout(logoutDebounceTimer);
        logoutDebounceTimer = setTimeout(() => {
          // Double-check: if Firebase Auth now has a user (token refresh completed), skip
          if (auth.currentUser) {
            console.log('✅ KAVACH: Transient null auth event — user restored by token refresh. Skipping logout.');
            return;
          }
          setUser(null);
          setRegistered(false);
          if (localStorage.getItem('kavach_user_uid')) {
            console.warn('⚠️ KAVACH: Stale user UID in cache — session expired. Clearing and showing login.');
            localStorage.removeItem('kavach_user_uid');
            localStorage.removeItem('kavach_is_registered');
            localStorage.removeItem('kavach_hardware_synced');
            localStorage.removeItem('kavach_user_role');
            localStorage.removeItem('kavach_is_verified');
          }
          setLoading(false);
        }, 800);
      }
    });

    return () => {
      try {
        unsubscribe();
        if (logoutDebounceTimer) clearTimeout(logoutDebounceTimer);
        if (unsubProfile) unsubProfile();
        if (userChannel) supabase.removeChannel(userChannel);
      } catch (e) {
        console.warn("Auth Cleanup Interrupted:", e);
      }
    };
  }, []);

  const handleLogin = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await PushNotifications.requestPermissions();
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
        }
      } else {
        const isMobileBrowser = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
        if (isMobileBrowser) {
          // Set flag BEFORE redirect so getRedirectResult is called on return
          sessionStorage.setItem('kavach_google_redirect_pending', 'true');
          await signInWithRedirect(auth, googleProvider);
        } else {
          try {
            await signInWithPopup(auth, googleProvider);
          } catch (popupErr: any) {
            if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
              toast.info("Popup blocked. Redirecting to Google...");
              sessionStorage.setItem('kavach_google_redirect_pending', 'true');
              await signInWithRedirect(auth, googleProvider);
            } else {
              throw popupErr;
            }
          }
        }
      }
    } catch (e: any) {
      console.group('🚨 KAVACH LOGIN FAILED');
      console.error('Error Code:', e?.code);
      console.error('Error Message:', e?.message);
      console.error('Full Error Object:', e);
      console.groupEnd();

      const errCode = e?.code || '';
      const errMsg = e?.message || '';
      if (errCode === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user')) {
        toast.info("Google sign-in window was closed.");
      } else if (errCode === 'auth/cancelled-popup-request' || errMsg.includes('cancelled-popup-request')) {
      } else {
        toast.error(`Login Failed: ${errCode || errMsg || 'Unknown error'}`);
      }
    }
  };

  const handleOnboardingComplete = async () => {
    setIsHardwareSynced(true);
    localStorage.setItem('kavach_hardware_synced', 'true');
    setRegistered(true);
  };

  return { handleLogin, handleOnboardingComplete };
}
