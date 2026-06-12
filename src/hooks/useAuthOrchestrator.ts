import { useEffect } from 'react';
import { onAuthStateChanged, signInWithCredential, GoogleAuthProvider, signInWithPopup, getRedirectResult, signInWithRedirect, signOut } from 'firebase/auth';
import { doc, collection, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { auth, googleProvider, db } from '../firebase';
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

    if (!Capacitor.isNativePlatform()) {
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

      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.setItem('kavach_user_uid', firebaseUser.uid);
        const docRef = doc(db, 'users', firebaseUser.uid);

        const userEmail = firebaseUser.email || '';
        const isAdminEmail = (useKavachStore.getState().user as any)?.role === 'admin' || (useKavachStore.getState().user as any)?.role === 'super_cell';
        if (isAdminEmail) {
          setRole('admin');
          setRegistered(true);
          setVerified(true);
          setIsHardwareSynced(true);

          await setDoc(docRef, {
            uid: firebaseUser.uid,
            email: userEmail,
            role: 'admin',
            isRegistered: true,
            isVerified: true
          }, { merge: true }).catch(err => console.error("Admin auto-provisioning failed:", err));
        }

        unsubProfile = onSnapshot(docRef, async (snap) => {
          if (snap.exists()) {
            const data = snap.data();

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

            let currentRole = data.role || 'citizen';

            if (data.gender === 'male' && currentRole === 'citizen') {
              currentRole = 'protector';
              await setDoc(docRef, { role: 'protector' }, { merge: true });
            }

            if (currentRole === 'protector') {
              if (data.badgeId && data.vehicleNo) {
                console.log("🚔 KAVACH: Restoring accidentally locked PCR Officer role...");
                currentRole = 'pcr_officer';
                await setDoc(docRef, { role: 'pcr_officer' }, { merge: true });
              } else if (data.role === 'admin') {
                console.log("🏛️ KAVACH: Restoring accidentally locked Admin role...");
                currentRole = 'admin';
                await setDoc(docRef, { role: 'admin' }, { merge: true });
              }
            }

            setRole(currentRole);
            setRegistered(data.isRegistered === true);
            setVerified(data.isVerified || data.verified || false);
            setGender(data.gender || 'female');
            setProfile(data as any);
            if (data.safetyPin) setSafetyPin(data.safetyPin);
          } else {
            localStorage.removeItem('kavach_sos_active');
            localStorage.removeItem('kavach_active_alert_id');
            setRegistered(false);
          }
          setLoading(false);
        }, (error) => {
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

        setLoading(false);
      } else {
        setUser(null);
        setRegistered(false);
        setLoading(false);
      }
    });

    return () => {
      try {
        unsubscribe();
        if (unsubProfile) unsubProfile();
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
          await signInWithRedirect(auth, googleProvider);
        } else {
          try {
            await signInWithPopup(auth, googleProvider);
          } catch (popupErr: any) {
            if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
              toast.info("Popup blocked. Redirecting to Google...");
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
