import { signInWithPopup, GoogleAuthProvider, signInWithRedirect, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

export const handleGoogleAuthMethod = async (
  handleLogin: () => Promise<void>,
  setLoading: (val: boolean) => void
) => {
  setLoading(true);
  sessionStorage.setItem('kavach_just_logged_in', 'true');

  if (Capacitor.isNativePlatform()) {
    try {
      await handleLogin();
    } catch (err: any) {
      console.error("Native Google sign-in failed:", err);
    } finally {
      setLoading(false);
    }
    return;
  }

  const provider = new GoogleAuthProvider();
  try {
    const userCred = await signInWithPopup(auth, provider);
    const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", userCred.user.uid)));
    if (!userDoc.empty && userDoc.docs[0].data().isPermanentlyBlocked) {
      await signOut(auth);
      toast.error("TERMINAL LOCKOUT: This identity is blacklisted.");
      setLoading(false);
      return;
    }

    toast.success("Login successful.");
    setLoading(false);
  } catch (popupErr: any) {
    console.warn("⚠️ Popup blocked or security policy conflict. Redirecting to Google Login page...", popupErr);
    try {
      sessionStorage.setItem('kavach_google_redirect_pending', 'true');
      await signInWithRedirect(auth, provider);
    } catch (redirectErr: any) {
      console.error("Redirect auth failed:", redirectErr);
      sessionStorage.removeItem('kavach_google_redirect_pending');
      toast.error("Google sign-in is unavailable. Check network or try email/password.");
      setLoading(false);
    }
  }
};
