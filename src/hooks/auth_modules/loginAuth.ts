import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { toast } from 'sonner';

export const handleUserLogin = async (
  targetEmail: string,
  loginPassword: string,
  setLoading: (val: boolean) => void,
  setNeedsVerification: (val: boolean) => void
) => {
  const userCred = await signInWithEmailAndPassword(auth, targetEmail, loginPassword);

  if (!userCred.user.emailVerified) {
    toast.warning("Verification Required: Please verify your email first.");
    setNeedsVerification(true);
    await signOut(auth);
    setLoading(false);
    return;
  }

  const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", userCred.user.uid)));
  if (!userDoc.empty && userDoc.docs[0].data().isPermanentlyBlocked) {
    await signOut(auth);
    toast.error("TERMINAL LOCKOUT: This identity is permanently blacklisted.");
    setLoading(false);
    return;
  }

  sessionStorage.setItem('kavach_just_logged_in', 'true');
  toast.success("Login successful.");
  setLoading(false);
};
